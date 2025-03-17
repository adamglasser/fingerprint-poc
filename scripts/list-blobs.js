#!/usr/bin/env node
import { list } from '@vercel/blob';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to load environment variables from .env.local first, then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment from .env.local');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading environment from .env');
  dotenv.config({ path: envPath });
} else {
  console.log('No .env or .env.local file found, using existing environment variables');
}

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is not set.');
  console.error('Please make sure you have this token in your .env or .env.local file or set in your environment.');
  process.exit(1);
}

// Process command line arguments
const args = process.argv.slice(2);
const prefix = args[0]; // Optional prefix

async function listBlobs() {
  try {
    // Collect all blobs
    let allBlobs = [];
    let cursor;
    
    console.log(`Fetching all blobs${prefix ? ` with prefix '${prefix}'` : ''}...`);
    
    do {
      const listResult = await list({
        token,
        prefix,
        cursor,
        limit: 1000,
      });
      
      if (listResult.blobs.length > 0) {
        allBlobs = [...allBlobs, ...listResult.blobs];
      }
      
      cursor = listResult.cursor;
    } while (cursor);
    
    console.log(`\nFound ${allBlobs.length} blobs${prefix ? ` with prefix '${prefix}'` : ''}`);
    
    if (allBlobs.length === 0) {
      return;
    }

    // Sort by uploadedAt (newest first)
    allBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    // Print table header
    console.log('\n%-40s %-20s %-30s %s', 'PATHNAME', 'SIZE', 'UPLOADED AT', 'URL');
    console.log('-'.repeat(120));
    
    // Print each blob
    allBlobs.forEach((blob, i) => {
      const sizeInKB = (blob.size / 1024).toFixed(2) + ' KB';
      const uploadDate = new Date(blob.uploadedAt).toLocaleString();
      console.log('%-40s %-20s %-30s %s', 
        blob.pathname.substring(0, 40), 
        sizeInKB,
        uploadDate,
        blob.url.substring(0, 50) + (blob.url.length > 50 ? '...' : '')
      );
    });
    
    // Print summary
    const totalSize = allBlobs.reduce((sum, blob) => sum + blob.size, 0);
    const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\nTotal size: ${totalSizeInMB} MB`);
    
  } catch (error) {
    console.error('Error listing blobs:', error);
  }
}

listBlobs().catch(console.error); 