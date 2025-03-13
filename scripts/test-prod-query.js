// test-prod-query.js - Script to test queries against the production database
import { list } from '@vercel/blob';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Constants
const BLOB_KEY = 'fingerprint-database.db';
const LOCAL_DB_PATH = path.resolve('./downloads/prod-fingerprint.db');

async function testProdQuery() {
  try {
    console.log('Starting test of production database query...');
    
    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not found in environment variables');
    }
    
    // Create downloads directory if it doesn't exist
    await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
    
    // Remove existing file if it exists
    try {
      await fs.access(LOCAL_DB_PATH);
      await fs.unlink(LOCAL_DB_PATH);
      console.log('Removed existing database file');
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    // List all blobs first
    console.log('Listing all blobs:');
    const allBlobsResult = await list({ token });
    console.log(`Found ${allBlobsResult.blobs.length} total blobs`);
    
    // Display all blobs
    allBlobsResult.blobs.forEach((blob, index) => {
      console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
    });
    
    // Now try to find our database blob
    console.log(`\nLooking for database blob with exact pathname: ${BLOB_KEY}`);
    let selectedBlob = allBlobsResult.blobs.find(blob => blob.pathname === BLOB_KEY);
    
    if (!selectedBlob) {
      console.log('Database blob not found with exact pathname match.');
      console.log('Looking for blobs containing "fingerprint" or "database":');
      
      const possibleDbBlobs = allBlobsResult.blobs.filter(blob => 
        blob.pathname.includes('fingerprint') || 
        blob.pathname.includes('database') || 
        blob.pathname.includes('.db')
      );
      
      if (possibleDbBlobs.length === 0) {
        throw new Error('No database-related blobs found');
      }
      
      console.log(`Found ${possibleDbBlobs.length} possible database blobs:`);
      possibleDbBlobs.forEach((blob, index) => {
        console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
      });
      
      // Use the first possible database blob
      console.log('Using the first possible database blob for testing');
      selectedBlob = possibleDbBlobs[0];
    }
    
    console.log(`Selected blob: ${selectedBlob.pathname}, size: ${selectedBlob.size} bytes`);
    
    // Download the blob content
    console.log('Downloading blob content...');
    const response = await fetch(selectedBlob.url);
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
    console.log(`Successfully downloaded database to: ${LOCAL_DB_PATH}`);
    
    // Open the database
    console.log('Opening database connection...');
    const db = await open({
      filename: LOCAL_DB_PATH,
      driver: sqlite3.Database
    });
    
    try {
      // Check database structure
      console.log('Checking database structure...');
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('Tables in database:');
      tables.forEach(table => {
        console.log(`- ${table.name}`);
      });
      
      // Check if events table exists
      if (!tables.some(table => table.name === 'events')) {
        console.log('WARNING: events table does not exist in the database!');
      } else {
        // Check events table structure
        console.log('Checking events table structure...');
        const columns = await db.all("PRAGMA table_info(events)");
        console.log('Columns in events table:');
        columns.forEach(column => {
          console.log(`- ${column.name} (${column.type})`);
        });
        
        // Count events
        const { count } = await db.get('SELECT COUNT(*) as count FROM events');
        console.log(`Total events in database: ${count}`);
        
        if (count > 0) {
          // Run the same query used in the webhook events API
          console.log('Running the webhook events query...');
          const limit = 10;
          const offset = 0;
          
          // Query for all events
          const query = `
            SELECT e.*, v.first_seen, v.last_seen, v.visit_count 
            FROM events e
            LEFT JOIN visitors v ON e.visitor_id = v.visitor_id
            ORDER BY e.timestamp DESC 
            LIMIT ? OFFSET ?
          `;
          
          const events = await db.all(query, limit, offset);
          console.log(`Query returned ${events.length} events`);
          
          if (events.length > 0) {
            console.log('First event:');
            console.log(events[0]);
          } else {
            console.log('No events returned by the query.');
          }
          
          // Get total count for pagination
          const countQuery = 'SELECT COUNT(*) as total FROM events';
          const { total } = await db.get(countQuery);
          console.log(`Total events count from count query: ${total}`);
        } else {
          console.log('No events found in the database.');
        }
      }
      
      // Check visitors table
      if (!tables.some(table => table.name === 'visitors')) {
        console.log('WARNING: visitors table does not exist in the database!');
      } else {
        const { count } = await db.get('SELECT COUNT(*) as count FROM visitors');
        console.log(`Total visitors in database: ${count}`);
        
        if (count > 0) {
          const visitors = await db.all('SELECT * FROM visitors LIMIT 5');
          console.log('Sample visitors:');
          visitors.forEach(visitor => {
            console.log(visitor);
          });
        }
      }
    } finally {
      // Close the database connection
      await db.close();
      console.log('Database connection closed');
    }
    
  } catch (error) {
    console.error('Error testing production database:', error);
  }
}

testProdQuery(); 