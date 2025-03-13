import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';

// Local path for the database file
const LOCAL_DB_PATH = path.resolve('./data/fingerprint.db');

// Initialize database connection
export async function openDb() {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
  
  // Open the database connection
  const db = await open({
    filename: LOCAL_DB_PATH,
    driver: sqlite3.Database
  });
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      visitor_id TEXT PRIMARY KEY,
      first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      visit_count INTEGER DEFAULT 1
    );
    
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT,
      request_id TEXT UNIQUE,
      timestamp TIMESTAMP,
      event_time TEXT,
      ip TEXT,
      incognito BOOLEAN,
      url TEXT,
      raw_data TEXT,
      FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
    );
  `);
  
  return db;
} 