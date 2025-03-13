// test-blob-upload.js
import { put, list } from '@vercel/blob';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testBlobUpload() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not found in environment variables');
    }
    
    console.log('Creating test blob...');
    const testData = Buffer.from('Test data: ' + new Date().toISOString());
    
    const result = await put(`test-${Date.now()}.txt`, testData, {
      access: 'public',
      token
    });
    
    console.log('Test blob created successfully:', result);
    
    // Now list all blobs to verify it's visible
    const listResult = await list({ token });
    console.log(`Found ${listResult.blobs.length} blobs after uploading test blob`);
    
    if (listResult.blobs.length > 0) {
      console.log('All blobs in the project:');
      listResult.blobs.forEach((blob, index) => {
        console.log(`${index + 1}: ${blob.pathname} (${blob.size} bytes)`);
      });
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testBlobUpload();