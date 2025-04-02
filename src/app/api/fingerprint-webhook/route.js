import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function POST(request) {
  let db = null;
  try {
    // Check if request has content before trying to parse JSON
    const contentType = request.headers.get('content-type');
    let webhookData;
    
    // Only try to parse JSON if the content-type is application/json and request has a body
    if (contentType && contentType.includes('application/json')) {
      try {
        const text = await request.text();
        if (text && text.trim()) {
          webhookData = JSON.parse(text);
        } else {
          webhookData = {}; // Default to empty object for empty requests
        }
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    } else {
      webhookData = {}; // Default to empty object for non-JSON requests
    }
    
    // Validate required fields
    if (!webhookData.visitorId) {
      return NextResponse.json({ error: 'Missing required field: visitorId' }, { status: 400 });
    }
    
    db = await openDb();
    
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    try {
      // Check if visitor exists
      const existingVisitor = await db.get(
        'SELECT * FROM visitors WHERE visitor_id = ?',
        webhookData.visitorId
      );
      
      if (existingVisitor) {
        // Update existing visitor
        await db.run(
          'UPDATE visitors SET last_seen = ?, visit_count = visit_count + 1 WHERE visitor_id = ?',
          new Date().toISOString(),
          webhookData.visitorId
        );
      } else {
        // Insert new visitor
        await db.run(
          'INSERT INTO visitors (visitor_id, first_seen, last_seen, visit_count) VALUES (?, ?, ?, ?)',
          webhookData.visitorId,
          new Date().toISOString(),
          new Date().toISOString(),
          1 // Initial visit count
        );
      }
      
      // Insert event data
      await db.run(
        `INSERT INTO events
         (visitor_id, request_id, timestamp, event_time, ip, incognito, url, raw_data)
         VALUES (?, ?, to_timestamp((?::BIGINT)/1000), ?, ?, ?, ?, ?)
         ON CONFLICT (request_id) DO NOTHING`,
        webhookData.visitorId,
        webhookData.requestId || null,
        webhookData.timestamp || new Date().getTime(),
        webhookData.time || new Date().toISOString(),
        webhookData.ip || null,
        webhookData.incognito || false,
        webhookData.url || null,
        JSON.stringify(webhookData)
      );
      
      // Commit transaction
      await db.exec('COMMIT');
      console.log(`Stored webhook event for visitor: ${webhookData.visitorId}`);
      return NextResponse.json({ message: 'Webhook received and stored' });
    } catch (error) {
      // Rollback on error
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  } finally {
    // Ensure database is closed to trigger upload to Blob storage
    if (db) {
      await db.close();
    }
  }
}