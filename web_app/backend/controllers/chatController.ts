import { Request, Response } from 'express';
import db from '../db/database';
import { askAiQuestion } from '../services/aiService';

export const askChat = async (req: Request, res: Response) => {
  const { dataset_id, room_id, message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  if (!room_id) {
    return res.status(400).json({ success: false, error: 'Room ID is required' });
  }

  try {
    const aiResponse = await askAiQuestion(dataset_id ? dataset_id.toString() : "default", message);

    db.run(
      'INSERT INTO chat_history (dataset_id, room_id, question, answer, chart_json, table_json) VALUES (?, ?, ?, ?, ?, ?)',
      [
        dataset_id || null,
        room_id,
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
  const { room_id } = req.query;
  
  if (!room_id) {
    return res.status(400).json({ success: false, error: 'Room ID is required' });
  }

  db.all('SELECT * FROM chat_history WHERE room_id = ? ORDER BY created_at ASC', [room_id], (err, rows) => {
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

export const deleteChatHistory = (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM chat_history WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Chat history deleted' });
  });
};

// Chat Room Management
export const createChatRoom = (req: Request, res: Response) => {
  const { name, dataset_id } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  db.run('INSERT INTO chat_rooms (name, dataset_id) VALUES (?, ?)', [name, dataset_id || null], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: { id: this.lastID, name, dataset_id } });
  });
};

export const getChatRooms = (req: Request, res: Response) => {
  db.all('SELECT * FROM chat_rooms ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
};

export const deleteChatRoom = (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM chat_rooms WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Chat room deleted' });
  });
};

export const updateChatRoom = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  db.run('UPDATE chat_rooms SET name = ? WHERE id = ?', [name, id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Chat room updated' });
  });
};
