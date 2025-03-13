// check-prod-blobs.js - Script to check production blobs
import { list } from '@vercel/blob';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function checkProdBlobs() {
  try {
    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not found in environment variables');
    }
    
    console.log('Listing all blobs in production...');
    
    // List all blobs in the project
    const result = await list({ token });
    
    console.log(`Found ${result.blobs.length} blobs in production:`);
    
    // Display all blobs with details
    result.blobs.forEach((blob, index) => {
      console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
    });
    
    // Look for database blobs
    const possibleDbBlobs = result.blobs.filter(blob => 
      blob.pathname.includes('fingerprint') || 
      blob.pathname.includes('database') || 
      blob.pathname.includes('.db')
    );
    
    if (possibleDbBlobs.length > 0) {
      console.log('\nPossible database blobs:');
      possibleDbBlobs.forEach((blob, index) => {
        console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
      });
    } else {
      console.log('\nNo database-related blobs found.');
    }
    
  } catch (error) {
    console.error('Error accessing blob storage:', error);
  }
}

checkProdBlobs(); 