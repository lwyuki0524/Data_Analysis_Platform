import { Request, Response } from 'express';
import db from '../db/database';
import { createAiDashboard } from '../services/aiService';

export const createDashboard = async (req: Request, res: Response) => {
  const { name, dataset_id, focus_fields } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
  if (!dataset_id) return res.status(400).json({ success: false, error: 'Dataset ID is required' });

  try {
    const aiDashboardResponse = await createAiDashboard(dataset_id, focus_fields);
    const config_json = aiDashboardResponse.dashboard_config;

    db.run(
      'INSERT INTO dashboards (name, dataset_id, focus_fields, config_json) VALUES (?, ?, ?, ?)',
      [name, dataset_id, focus_fields ? JSON.stringify(focus_fields) : null, JSON.stringify(config_json)],
      function (err) {
        if (err) {
          console.error("Database insert error:", err.message);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({
          success: true,
          data: {
            id: this.lastID,
            name,
            dataset_id,
            focus_fields: focus_fields || null,
            ...config_json // Spread the config directly into the data
          }
        });
      }
    );
  } catch (error: any) {
    console.error('Error creating AI dashboard:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Failed to create AI dashboard' });
  }
};

export const getDashboards = (req: Request, res: Response) => {
  db.all('SELECT id, name, dataset_id, focus_fields, created_at FROM dashboards ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const formattedRows = rows.map((row: any) => ({
      ...row,
      focus_fields: row.focus_fields ? JSON.parse(row.focus_fields) : null
    }));
    res.json({ success: true, data: formattedRows });
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
        focus_fields: row.focus_fields ? JSON.parse(row.focus_fields) : null,
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
