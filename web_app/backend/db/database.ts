import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');

// Ensure database directory exists if needed (in this case it's root)
const db = new sqlite3.Database(dbPath);

export const initDb = () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Datasets table
      db.run(`
        CREATE TABLE IF NOT EXISTS datasets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          source_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Chat rooms table
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          dataset_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dataset_id) REFERENCES datasets(id)
        )
      `);

      // Chat history table
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dataset_id INTEGER,
          room_id INTEGER,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          chart_json TEXT,
          table_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dataset_id) REFERENCES datasets(id),
          FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
        )
      `);

      // Dashboards table
      db.run(`
        CREATE TABLE IF NOT EXISTS dashboards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dataset_id INTEGER,
          config_json TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dataset_id) REFERENCES datasets(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

export default db;
