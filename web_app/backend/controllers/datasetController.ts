import { Request, Response } from 'express';
import db from '../db/database';
import fs from 'fs';
import path from 'path';
import { registerDatasetToAi } from '../services/aiService';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';

export const uploadDataset = async (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const { originalname, path: tempPath } = file;
  const sourceType = path.extname(originalname).substring(1);
  const absolutePath = path.resolve(tempPath);

  db.run(
    'INSERT INTO datasets (name, file_path, source_type) VALUES (?, ?, ?)',
    [originalname, absolutePath, sourceType],
    async function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      const datasetId = this.lastID.toString();

      try {
        // Register to AI Service
        await registerDatasetToAi(datasetId);

        res.json({
          success: true,
          data: {
            id: this.lastID,
            name: originalname,
            source_type: sourceType
          }
        });
      } catch (aiErr: any) {
        console.error('AI registration failed:', aiErr.message);
        // We still keep the record in DB, but notify user or log it
        res.json({
          success: true,
          warning: 'Dataset saved but AI indexing failed. Please try again later.',
          data: {
            id: this.lastID,
            name: originalname,
            source_type: sourceType
          }
        });
      }
    }
  );
};

export const getDatasets = (req: Request, res: Response) => {
  db.all('SELECT * FROM datasets ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: rows });
  });
};

export const getDatasetById = (req: Request, res: Response) => {
  const { id } = req.params;
  db.get('SELECT * FROM datasets WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }
    res.json({ success: true, data: row });
  });
};

export const getDatasetPreview = async (req: Request, res: Response) => {
  const { id } = req.params;
  db.get('SELECT * FROM datasets WHERE id = ?', [id], async (err, row: any) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, error: 'Dataset not found' });

    if (!fs.existsSync(row.file_path)) {
      return res.status(404).json({ success: false, error: 'File not found on disk' });
    }

    try {
      let data: any[] = [];
      const ext = row.source_type.toLowerCase();

      if (ext === 'csv') {
        const fileContent = fs.readFileSync(row.file_path, 'utf-8');
        data = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          to: 10 // Preview first 10 rows
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(row.file_path);
        const worksheet = workbook.getWorksheet(1);
        
        if (worksheet) {
          const headerRow = worksheet.getRow(1);
          const headers: string[] = [];
          headerRow.eachCell((cell) => {
            headers.push(cell.text);
          });

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber <= 11) {
              const rowData: any = {};
              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  rowData[header] = cell.text;
                }
              });
              data.push(rowData);
            }
          });
        }
      } else if (ext === 'json') {
        const fileContent = fs.readFileSync(row.file_path, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        data = Array.isArray(jsonData) ? jsonData.slice(0, 10) : [jsonData];
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error reading file for preview:', error);
      res.status(500).json({ success: false, error: 'Failed to parse file for preview' });
    }
  });
};

export const getDatasetColumns = async (req: Request, res: Response) => {
  const { id } = req.params;
  db.get('SELECT * FROM datasets WHERE id = ?', [id], async (err, row: any) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, error: 'Dataset not found' });

    if (!fs.existsSync(row.file_path)) {
      return res.status(404).json({ success: false, error: 'File not found on disk' });
    }

    try {
      let columns: string[] = [];
      const ext = row.source_type.toLowerCase();

      if (ext === 'csv') {
        const fileContent = fs.readFileSync(row.file_path, 'utf-8');
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          to: 1
        });
        if (records.length > 0) {
          columns = Object.keys(records[0]);
        }
      } else if (ext === 'xlsx' || ext === 'xls') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(row.file_path);
        const worksheet = workbook.getWorksheet(1);
        if (worksheet) {
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell) => {
            columns.push(cell.text);
          });
        }
      } else if (ext === 'json') {
        const fileContent = fs.readFileSync(row.file_path, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        const firstItem = Array.isArray(jsonData) ? jsonData[0] : jsonData;
        if (firstItem) {
          columns = Object.keys(firstItem);
        }
      }

      res.json({ success: true, data: columns });
    } catch (error: any) {
      console.error('Error reading columns:', error);
      res.status(500).json({ success: false, error: 'Failed to extract columns' });
    }
  });
};

export const deleteDataset = (req: Request, res: Response) => {
  const { id } = req.params;
  
  db.get('SELECT file_path FROM datasets WHERE id = ?', [id], (err, row: any) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, error: 'Dataset not found' });

    // Delete file
    if (fs.existsSync(row.file_path)) {
      fs.unlinkSync(row.file_path);
    }

    // Delete from DB
    db.run('DELETE FROM datasets WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Dataset deleted' });
    });
  });
};
