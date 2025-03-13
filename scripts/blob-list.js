// blob-list.js with more detailed logging
import { list } from '@vercel/blob';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function listAndDownloadBlobs() {
  try {
    // Get the token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not found in environment variables');
    }
    
    console.log('Starting to list blobs...');
    
    // List all blobs in the project
    const result = await list({ token });
    
    console.log('API Response:', JSON.stringify(result, null, 2));
    console.log(`Found ${result.blobs.length} blobs`);
    
    if (result.blobs.length > 0) {
      console.log('All blobs in the project:');
      result.blobs.forEach((blob, index) => {
        console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
      });
    } else {
      console.log('No blobs found in this project/environment.');
    }
  } catch (error) {
    console.error('Error accessing blob storage:', error);
    if (error.response) {
      console.error('Response details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        body: await error.response.text()
      });
    }
  }
}

listAndDownloadBlobs();