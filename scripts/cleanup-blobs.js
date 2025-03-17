#!/usr/bin/env node
import { list, del } from '@vercel/blob';
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

// Main function to delete blobs
async function cleanupBlobs() {
  const prefix = 'fingerprint-database';
  const keepCount = 5; // Number of recent blobs to keep
  
  console.log(`Cleaning up blobs with prefix '${prefix}', keeping ${keepCount} most recent...`);
  
  // Gather all matching blobs
  let allBlobs = [];
  let cursor;
  
  do {
    console.log(`Fetching batch of blobs${cursor ? ' (with cursor)' : ''}...`);
    const listResult = await list({
      token,
      prefix,
      cursor,
      limit: 1000, // Maximum allowed by Vercel Blob API
    });
    
    if (listResult.blobs.length > 0) {
      allBlobs = [...allBlobs, ...listResult.blobs];
      console.log(`Found ${listResult.blobs.length} blobs in this batch`);
    }
    
    cursor = listResult.cursor;
  } while (cursor);
  
  console.log(`Total blobs found: ${allBlobs.length}`);
  
  if (allBlobs.length <= keepCount) {
    console.log(`Only ${allBlobs.length} blobs exist, which is less than or equal to the keep count (${keepCount}). No deletion needed.`);
    return;
  }
  
  // Sort by uploadedAt (newest first)
  allBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  
  // Keep the most recent N blobs
  const blobsToKeep = allBlobs.slice(0, keepCount);
  const blobsToDelete = allBlobs.slice(keepCount);
  
  console.log(`\nKeeping ${blobsToKeep.length} most recent blobs:`);
  blobsToKeep.forEach((blob, i) => {
    console.log(`${i+1}. ${blob.pathname} (${new Date(blob.uploadedAt).toLocaleString()})`);
  });
  
  console.log(`\nDeleting ${blobsToDelete.length} older blobs...`);
  
  // Extract URLs of blobs to delete for batch deletion
  const urlsToDelete = blobsToDelete.map(blob => blob.url);
  
  // Delete in smaller batches to avoid timeouts
  const BATCH_SIZE = 50;
  let successCount = 0;
  
  for (let i = 0; i < urlsToDelete.length; i += BATCH_SIZE) {
    const batch = urlsToDelete.slice(i, i + BATCH_SIZE);
    console.log(`Deleting batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(urlsToDelete.length/BATCH_SIZE)} (${batch.length} blobs)...`);
    
    try {
      await del(batch, { token });
      successCount += batch.length;
      console.log(`Successfully deleted batch ${Math.floor(i/BATCH_SIZE) + 1}`);
    } catch (error) {
      console.error(`Error deleting batch: ${error.message}`);
      console.log('Will continue with next batch...');
    }
  }
  
  console.log(`\nDeletion complete. Deleted ${successCount}/${blobsToDelete.length} blobs.`);
  
  // Verify deletion
  console.log('\nVerifying deletion...');
  const { blobs: remainingBlobs } = await list({ token, prefix });
  console.log(`Number of blobs remaining: ${remainingBlobs.length}`);
  
  if (remainingBlobs.length > keepCount) {
    console.log('Warning: There are still more blobs than expected.');
    console.log('It may take some time for deletions to propagate, or some deletions may have failed.');
  } else {
    console.log('Success! The correct number of blobs remain.');
  }
}

// Run the script
cleanupBlobs().catch(error => {
  console.error('An error occurred during cleanup:', error);
}); 