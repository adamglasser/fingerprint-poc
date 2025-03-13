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
const BLOB_KEY = 'fingerprint-database';

// Helper function to download the database from Blob storage
async function downloadDbFromBlob() {
  try {
    console.log(`Starting downloadDbFromBlob, environment: ${isDevelopment ? 'development' : 'production'}, CLI mode: ${isCliMode}`);
    
    // In development mode or CLI mode, just use the local file
    if (isDevelopment || isCliMode) {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
      
      // Check if the file exists, if not, it will be created when the DB is opened
      try {
        await fs.access(LOCAL_DB_PATH);
        console.log(`Local database file exists at: ${LOCAL_DB_PATH}`);
      } catch (error) {
        // File doesn't exist, which is fine for a new database
        console.log('Creating new local database file');
      }
      
      return true;
    }
    
    // Production mode - use Vercel Blob
    console.log('Production mode: attempting to download database from Vercel Blob');
    
    // Check if the local file already exists and remove it
    try {      
      await fs.access(LOCAL_DB_PATH);
      await fs.unlink(LOCAL_DB_PATH);
      console.log(`Removed existing temporary database file at: ${LOCAL_DB_PATH}`);
    } catch (error) {
      // File doesn't exist, which is fine
      console.log(`No existing temporary database file at: ${LOCAL_DB_PATH}`);
    }

    // Ensure the directory exists
    await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
    console.log(`Ensured directory exists for: ${LOCAL_DB_PATH}`);

    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
      return false;
    }
    console.log('BLOB_READ_WRITE_TOKEN found in environment variables');

    // List all blobs without filtering by prefix
    console.log('Listing all blobs');
    const { blobs } = await list({ token });
    console.log(`Found ${blobs.length} total blobs`);
    
    // Find all blobs that start with fingerprint-database
    const dbBlobs = blobs.filter(blob => 
      blob.pathname.startsWith('fingerprint-database')
    );
    console.log(`Found ${dbBlobs.length} database blobs`);
    
    if (dbBlobs.length > 0) {
      // Sort by creation time (newest first)
      dbBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      
      // Use the most recently created blob
      const dbBlob = dbBlobs[0];
      
      console.log(`Selected newest database blob: ${dbBlob.pathname}, size: ${dbBlob.size} bytes, uploaded: ${dbBlob.uploadedAt}`);
      
      // Get the blob URL
      const blobUrl = dbBlob.url;
      console.log(`Blob URL: ${blobUrl}`);
      
      // Download the blob content
      console.log('Downloading blob content...');
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to download blob: ${response.statusText}`);
      }
      
      // Get the blob data as an array buffer
      const blobData = await response.arrayBuffer();
      console.log(`Downloaded blob data, size: ${blobData.byteLength} bytes`);
      
      // Create a readable stream from the blob
      const blobStream = Readable.from(Buffer.from(blobData));
      
      // Create a writable stream to the local file
      const fileStream = fsSync.createWriteStream(LOCAL_DB_PATH);
      
      // Pipe the blob data to the local file
      console.log(`Writing blob data to: ${LOCAL_DB_PATH}`);
      await pipeline(blobStream, fileStream);
      console.log(`Successfully downloaded database from Blob storage: ${dbBlob.pathname}`);
      
      // Verify the file was created
      try {
        const stats = await fs.stat(LOCAL_DB_PATH);
        console.log(`Verified database file: ${LOCAL_DB_PATH}, size: ${stats.size} bytes`);
      } catch (statError) {
        console.error(`Error verifying database file: ${statError.message}`);
      }
    } else {
      console.log('No database blobs found');
      console.log('Available blobs:');
      blobs.forEach((blob, index) => {
        console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
      });
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
    console.log('Production mode: uploading database to Vercel Blob');
    
    // Read the database file
    const fileBuffer = await fs.readFile(LOCAL_DB_PATH);
    console.log(`Read database file, size: ${fileBuffer.length} bytes`);
    
    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
      return false;
    }
    
    // First, list all existing blobs to find and potentially delete old ones
    console.log('Listing existing blobs before upload');
    const { blobs } = await list({ token });
    
    // Find all fingerprint-database blobs
    const dbBlobs = blobs.filter(blob => 
      blob.pathname.startsWith('fingerprint-database')
    );
    
    console.log(`Found ${dbBlobs.length} existing database blobs`);
    
    // If there are too many blobs, delete some of the older ones
    if (dbBlobs.length > 10) {
      console.log('Too many database blobs, cleaning up older ones');
      
      // Sort by creation time (oldest first)
      dbBlobs.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
      
      // Keep the 5 newest blobs, delete the rest
      const blobsToDelete = dbBlobs.slice(0, dbBlobs.length - 5);
      
      for (const blob of blobsToDelete) {
        try {
          console.log(`Deleting old blob: ${blob.pathname}`);
          await del(blob.pathname, { token });
        } catch (deleteError) {
          console.error(`Error deleting blob ${blob.pathname}:`, deleteError);
        }
      }
    }
    
    // Upload to Blob storage with the simple name
    console.log(`Uploading database to Blob storage with key: fingerprint-database`);
    const result = await put('fingerprint-database', fileBuffer, {
      access: 'public',
      token
    });
    
    console.log(`Successfully uploaded database to Blob storage: ${result.pathname}, size: ${result.size} bytes, URL: ${result.url}`);
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