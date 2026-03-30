import { Request, Response } from 'express';
import db from '../db/database';
import { askAiQuestion } from '../services/aiService';

export const askChat = async (req: Request, res: Response) => {
  const { dataset_id, message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  try {
    const aiResponse = await askAiQuestion(dataset_id ? dataset_id.toString() : "default", message);

    db.run(
      'INSERT INTO chat_history (dataset_id, question, answer, chart_json, table_json) VALUES (?, ?, ?, ?, ?)',
      [
        dataset_id || null,
        message,
        aiResponse.answer,
        aiResponse.chart ? JSON.stringify(aiResponse.chart) : null,
        aiResponse.table ? JSON.stringify(aiResponse.table) : null
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({
          success: true,
          data: {
            id: this.lastID,
            ...aiResponse
          }
        });
      }
    );
  } catch (error: any) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'AI service communication failed. Please ensure the AI engine is running.' 
    });
  }
};

export const getChatHistory = (req: Request, res: Response) => {
  const { dataset_id } = req.query;
  let query = 'SELECT * FROM chat_history';
  let params: any[] = [];

  if (dataset_id) {
    query += ' WHERE dataset_id = ?';
    params.push(dataset_id);
  }
  
  query += ' ORDER BY created_at ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    const formattedRows = rows.map((row: any) => ({
      ...row,
      chart: row.chart_json ? JSON.parse(row.chart_json) : null,
      table: row.table_json ? JSON.parse(row.table_json) : null
    }));
    
    res.json({ success: true, data: formattedRows });
  });
};
