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

// Configuration
const dbPrefix = 'fingerprint-database';
const imagePrefix = 'images';
const keepRecentDatabaseCount = 0;

async function cleanupAllBlobs() {
  try {
    console.log('Fetching all blobs...');
    
    // Collect all blobs
    let allBlobs = [];
    let cursor;
    
    do {
      const listResult = await list({
        token,
        cursor,
        limit: 1000,
      });
      
      if (listResult.blobs.length > 0) {
        allBlobs = [...allBlobs, ...listResult.blobs];
      }
      
      cursor = listResult.cursor;
    } while (cursor);
    
    console.log(`Found ${allBlobs.length} blobs total`);
    
    if (allBlobs.length === 0) {
      console.log('No blobs to clean up.');
      return;
    }
    
    // Separate blobs by type
    const databaseBlobs = allBlobs.filter(blob => blob.pathname.startsWith(dbPrefix));
    const imageBlobs = allBlobs.filter(blob => blob.pathname.startsWith(imagePrefix));
    const otherBlobs = allBlobs.filter(blob => 
      !blob.pathname.startsWith(dbPrefix) && 
      !blob.pathname.startsWith(imagePrefix)
    );
    
    console.log(`Found ${databaseBlobs.length} database blobs`);
    console.log(`Found ${imageBlobs.length} image blobs`);
    console.log(`Found ${otherBlobs.length} other blobs`);
    
    // Sort database blobs by upload date (newest first)
    databaseBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    // Keep the most recent database blobs, mark the rest for deletion
    const databaseBlobsToDelete = databaseBlobs;
    
    console.log(`Deleting ALL database blobs (${databaseBlobs.length} total)`);
    console.log(`Identified ${otherBlobs.length} other blobs for deletion`);
    
    // Combine blobs to delete
    const blobsToDelete = [...databaseBlobsToDelete, ...otherBlobs];
    
    if (blobsToDelete.length === 0) {
      console.log('No blobs to delete.');
      return;
    }
    
    console.log(`Will delete ${blobsToDelete.length} blobs in total`);
    console.log('Deleting blobs...');
    
    // Create an array of promises for deletion
    const deletePromises = blobsToDelete.map(async (blob, index) => {
      try {
        await del(blob.url, { token });
        console.log(`Deleted [${index + 1}/${blobsToDelete.length}]: ${blob.pathname}`);
        return { success: true, pathname: blob.pathname };
      } catch (error) {
        console.error(`Error deleting ${blob.pathname}:`, error.message);
        return { success: false, pathname: blob.pathname, error: error.message };
      }
    });
    
    // Wait for all deletions to complete
    const results = await Promise.all(deletePromises);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`\nCleanup complete!`);
    console.log(`Successfully deleted ${successCount} blobs`);
    if (failCount > 0) {
      console.log(`Failed to delete ${failCount} blobs`);
    }
    
    // Calculate saved space
    const deletedSize = blobsToDelete.reduce((total, blob) => total + blob.size, 0);
    const deletedSizeMB = (deletedSize / (1024 * 1024)).toFixed(2);
    
    console.log(`Freed up approximately ${deletedSizeMB} MB of storage`);
    
    // Report remaining blobs
    const keptDatabaseBlobs = [];
    const remainingBlobCount = imageBlobs.length;
    const remainingSize = [...imageBlobs].reduce((total, blob) => total + blob.size, 0);
    const remainingSizeMB = (remainingSize / (1024 * 1024)).toFixed(2);
    
    console.log(`\nRemaining storage:`);
    console.log(`- 0 database blobs (all deleted)`);
    console.log(`- ${imageBlobs.length} image blobs`);
    console.log(`- ${remainingBlobCount} blobs total`);
    console.log(`- ${remainingSizeMB} MB total size`);
    
  } catch (error) {
    console.error('Error cleaning up blobs:', error);
  }
}

cleanupAllBlobs().catch(console.error); 