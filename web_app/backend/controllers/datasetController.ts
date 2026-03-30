import { Request, Response } from 'express';
import db from '../db/database';
import fs from 'fs';
import path from 'path';
import { registerDatasetToAi } from '../services/aiService';

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
