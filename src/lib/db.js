// lib/db.js
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { put, list, del, getDownloadUrl } from '@vercel/blob';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

// Check if we're in development mode or CLI mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isCliMode = process.env.CLI_MODE === 'true';
console.log(`Database running in ${isDevelopment ? 'development' : 'production'} mode, CLI mode: ${isCliMode ? 'yes' : 'no'}`);

// Local path for temporary storage during request processing
const LOCAL_DB_PATH = isDevelopment || isCliMode
  ? path.resolve('./data/fingerprint.db') 
  : path.resolve('/tmp/fingerprint.db');

// Blob storage key for the database file
const BLOB_KEY = 'fingerprint-database.db';

// Helper function to download the database from Blob storage
async function downloadDbFromBlob() {
  try {
    // In development mode or CLI mode, just use the local file
    if (isDevelopment || isCliMode) {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
      
      // Check if the file exists, if not, it will be created when the DB is opened
      try {
        await fs.access(LOCAL_DB_PATH);
      } catch (error) {
        // File doesn't exist, which is fine for a new database
        console.log('Creating new local database file');
      }
      
      return true;
    }
    
    // Production mode - use Vercel Blob
    // Check if the local file already exists and remove it
    try {      
      await fs.access(LOCAL_DB_PATH);
      await fs.unlink(LOCAL_DB_PATH);
    } catch (error) {
      // File doesn't exist, which is fine
    }

    // Ensure the directory exists
    await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });

    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
      return false;
    }

    // List blobs to find our database file
    const { blobs } = await list({ prefix: BLOB_KEY, token });
    const dbBlob = blobs.find(blob => blob.pathname === BLOB_KEY);
    
    if (dbBlob) {
      // Get the blob URL
      const blobUrl = dbBlob.url;
      
      // Download the blob content
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to download blob: ${response.statusText}`);
      }
      
      // Get the blob data as an array buffer
      const blobData = await response.arrayBuffer();
      
      // Create a readable stream from the blob
      const blobStream = Readable.from(Buffer.from(blobData));
      
      // Create a writable stream to the local file
      const fileStream = fsSync.createWriteStream(LOCAL_DB_PATH);
      
      // Pipe the blob data to the local file
      await pipeline(blobStream, fileStream);
      console.log(`Successfully downloaded database from Blob storage with key: ${BLOB_KEY}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error downloading database from Blob storage:', error);
    // If download fails, we'll create a new database
    return false;
  }
}

// Helper function to upload the database to Blob storage
async function uploadDbToBlob() {
  try {
    // In development mode or CLI mode, do nothing - we're using the local file directly
    if (isDevelopment || isCliMode) {
      return true;
    }
    
    // Production mode - upload to Vercel Blob
    // Read the database file
    const fileBuffer = await fs.readFile(LOCAL_DB_PATH);
    
    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
      return false;
    }
    
    // Upload to Blob storage
    await put(BLOB_KEY, fileBuffer, {
      access: 'public',
      token
    });
    
    console.log(`Successfully uploaded database to Blob storage with key: ${BLOB_KEY}`);
    return true;
  } catch (error) {
    console.error('Error uploading database to Blob storage:', error);
    return false;
  }
}

// Initialize database connection
export async function openDb() {
  // Try to download the database from Blob storage
  await downloadDbFromBlob();
  
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
  
  // Wrap the close method to upload to Blob storage before closing
  const originalClose = db.close.bind(db);
  db.close = async () => {
    await originalClose();
    await uploadDbToBlob();
  };
  
  return db;
}