import { Request, Response } from 'express';
import db from '../db/database';
import { generateMockDashboard } from '../services/mockAiService';

export const generateDashboard = (req: Request, res: Response) => {
  const { dataset_id } = req.body;

  const mockDashboard = generateMockDashboard();

  db.run(
    'INSERT INTO dashboards (dataset_id, config_json) VALUES (?, ?)',
    [dataset_id || null, JSON.stringify(mockDashboard)],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        data: {
          id: this.lastID,
          ...mockDashboard
        }
      });
    }
  );
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
        dataset_id: row.dataset_id,
        ...JSON.parse(row.config_json)
      }
    });
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
        dataset_id: row.dataset_id,
        ...JSON.parse(row.config_json)
      }
    });
  });
};
