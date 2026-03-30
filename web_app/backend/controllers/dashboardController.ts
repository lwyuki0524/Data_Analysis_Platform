import { Request, Response } from 'express';
import db from '../db/database';
import { generateMockDashboard } from '../services/mockAiService';

export const createDashboard = (req: Request, res: Response) => {
  const { name, dataset_id } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  const mockDashboard = generateMockDashboard();

  db.run(
    'INSERT INTO dashboards (name, dataset_id, config_json) VALUES (?, ?, ?)',
    [name, dataset_id || null, JSON.stringify(mockDashboard)],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        data: {
          id: this.lastID,
          name,
          dataset_id: dataset_id || null,
          ...mockDashboard
        }
      });
    }
  );
};

export const getDashboards = (req: Request, res: Response) => {
  db.all('SELECT id, name, dataset_id, created_at FROM dashboards ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
};

export const getDashboard = (req: Request, res: Response) => {
  const { id } = req.params;
  db.get('SELECT * FROM dashboards WHERE id = ?', [id], (err, row: any) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, error: 'Dashboard not found' });

    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        dataset_id: row.dataset_id,
        ...JSON.parse(row.config_json)
      }
    });
  });
};

export const updateDashboard = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  db.run('UPDATE dashboards SET name = ? WHERE id = ?', [name, id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Dashboard updated' });
  });
};

export const deleteDashboard = (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM dashboards WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Dashboard deleted' });
  });
};

export const getLatestDashboard = (req: Request, res: Response) => {
  db.get('SELECT * FROM dashboards ORDER BY created_at DESC LIMIT 1', (err, row: any) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        dataset_id: row.dataset_id,
        ...JSON.parse(row.config_json)
      }
    });
  });
};
