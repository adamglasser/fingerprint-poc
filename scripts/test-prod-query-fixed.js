// test-prod-query-fixed.js - Script to test different query approaches against the production database
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
    console.log('Starting test of production database query with alternative approaches...');
    
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
    
    // Find database blobs
    const dbBlobs = allBlobsResult.blobs.filter(blob => 
      blob.pathname === BLOB_KEY
    );
    
    if (dbBlobs.length === 0) {
      throw new Error('No database blobs found');
    }
    
    console.log(`Found ${dbBlobs.length} database blobs`);
    
    // Sort blobs by size (larger might have more data)
    dbBlobs.sort((a, b) => b.size - a.size);
    
    // Use the largest blob
    const selectedBlob = dbBlobs[0];
    console.log(`Selected largest blob: ${selectedBlob.pathname}, size: ${selectedBlob.size} bytes`);
    
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
      
      // Try different query approaches
      console.log('\n=== TESTING DIFFERENT QUERY APPROACHES ===');
      
      // Approach 1: Original query
      console.log('\nApproach 1: Original query');
      try {
        const query1 = `
          SELECT e.*, v.first_seen, v.last_seen, v.visit_count 
          FROM events e
          LEFT JOIN visitors v ON e.visitor_id = v.visitor_id
          ORDER BY e.timestamp DESC 
          LIMIT ? OFFSET ?
        `;
        
        const events1 = await db.all(query1, 10, 0);
        console.log(`Query returned ${events1.length} events`);
      } catch (error) {
        console.error('Error with approach 1:', error.message);
      }
      
      // Approach 2: Simplified query without join
      console.log('\nApproach 2: Simplified query without join');
      try {
        const query2 = `
          SELECT * FROM events
          ORDER BY timestamp DESC 
          LIMIT ? OFFSET ?
        `;
        
        const events2 = await db.all(query2, 10, 0);
        console.log(`Query returned ${events2.length} events`);
      } catch (error) {
        console.error('Error with approach 2:', error.message);
      }
      
      // Approach 3: Using explicit column names
      console.log('\nApproach 3: Using explicit column names');
      try {
        const query3 = `
          SELECT e.id, e.visitor_id, e.request_id, e.timestamp, e.event_time, e.ip, e.incognito, e.url, e.raw_data
          FROM events e
          ORDER BY e.timestamp DESC 
          LIMIT ? OFFSET ?
        `;
        
        const events3 = await db.all(query3, 10, 0);
        console.log(`Query returned ${events3.length} events`);
      } catch (error) {
        console.error('Error with approach 3:', error.message);
      }
      
      // Approach 4: Using string concatenation for limit/offset
      console.log('\nApproach 4: Using string concatenation for limit/offset');
      try {
        const limit = 10;
        const offset = 0;
        const query4 = `
          SELECT * FROM events
          ORDER BY timestamp DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;
        
        const events4 = await db.all(query4);
        console.log(`Query returned ${events4.length} events`);
      } catch (error) {
        console.error('Error with approach 4:', error.message);
      }
      
      // Approach 5: Direct count query
      console.log('\nApproach 5: Direct count query');
      try {
        const countResult = await db.get('SELECT COUNT(*) as count FROM events');
        console.log(`Total events in database: ${countResult.count}`);
      } catch (error) {
        console.error('Error with approach 5:', error.message);
      }
      
      // Approach 6: Check for any data in the events table
      console.log('\nApproach 6: Check for any data in the events table');
      try {
        const anyEvents = await db.get('SELECT * FROM events LIMIT 1');
        if (anyEvents) {
          console.log('Found at least one event:', anyEvents);
        } else {
          console.log('No events found in the database');
        }
      } catch (error) {
        console.error('Error with approach 6:', error.message);
      }
      
      // Approach 7: Insert a test event and verify
      console.log('\nApproach 7: Insert a test event and verify');
      try {
        // Begin transaction
        await db.exec('BEGIN TRANSACTION');
        
        // Insert a test event
        const testVisitorId = 'test-visitor-' + Date.now();
        const testTimestamp = Date.now();
        
        await db.run(
          'INSERT INTO visitors (visitor_id, first_seen, last_seen, visit_count) VALUES (?, ?, ?, ?)',
          testVisitorId,
          new Date().toISOString(),
          new Date().toISOString(),
          1
        );
        
        await db.run(
          `INSERT INTO events
           (visitor_id, request_id, timestamp, event_time, ip, incognito, url, raw_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          testVisitorId,
          'test-request-' + testTimestamp,
          testTimestamp,
          new Date().toISOString(),
          '127.0.0.1',
          false,
          'https://example.com',
          JSON.stringify({ test: true, timestamp: testTimestamp })
        );
        
        // Commit transaction
        await db.exec('COMMIT');
        
        console.log('Inserted test event, now querying to verify');
        
        // Query to verify
        const verifyQuery = `
          SELECT e.*, v.first_seen, v.last_seen, v.visit_count 
          FROM events e
          LEFT JOIN visitors v ON e.visitor_id = v.visitor_id
          WHERE e.visitor_id = ?
        `;
        
        const verifyEvents = await db.all(verifyQuery, testVisitorId);
        console.log(`Verification query returned ${verifyEvents.length} events`);
        
        if (verifyEvents.length > 0) {
          console.log('Test event was successfully inserted and retrieved');
        }
      } catch (error) {
        console.error('Error with approach 7:', error.message);
        try {
          await db.exec('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError.message);
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