import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(request) {
  let db = null;
  try {
    console.log('Webhook events API called - starting process');
    const url = new URL(request.url);
    const visitorId = url.searchParams.get('visitorId');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    console.log(`Opening database - visitorId: ${visitorId}, limit: ${limit}, offset: ${offset}`);
    db = await openDb();
    console.log('Database opened successfully');
    
    let events = [];
    let total = 0;
    
    if (visitorId) {
      // Get events for a specific visitor - using direct parameter substitution
      const query = `
        SELECT * FROM events 
        WHERE visitor_id = '${visitorId}' 
        ORDER BY timestamp DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      console.log(`Executing query: ${query}`);
      events = await db.all(query);
      console.log(`Query returned ${events.length} events`);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM events WHERE visitor_id = '${visitorId}'`;
      console.log(`Executing count query: ${countQuery}`);
      const totalResult = await db.get(countQuery);
      total = totalResult.total;
    } else {
      // Get all events - using direct parameter substitution
      const query = `
        SELECT e.*, v.first_seen, v.last_seen, v.visit_count 
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.visitor_id
        ORDER BY e.timestamp DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      console.log(`Executing query: ${query}`);
      events = await db.all(query);
      console.log(`Query returned ${events.length} events`);
      
      // Get total count
      const countQuery = 'SELECT COUNT(*) as total FROM events';
      console.log(`Executing count query: ${countQuery}`);
      const totalResult = await db.get(countQuery);
      total = totalResult.total;
    }
    
    console.log(`Total events count: ${total}`);
    
    // Parse raw_data JSON for each event
    events.forEach(event => {
      if (event.raw_data) {
        try {
          event.data = JSON.parse(event.raw_data);
          delete event.raw_data; // Remove raw JSON to reduce payload size
        } catch (e) {
          console.error('Error parsing event data:', e);
        }
      }
    });
    
    // Check if tables exist and have data
    try {
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      console.log(`Database tables: ${tables.map(t => t.name).join(', ')}`);
      
      // Check if events table has any rows
      const eventCount = await db.get('SELECT COUNT(*) as count FROM events');
      console.log(`Total rows in events table: ${eventCount.count}`);
      
      // Check if visitors table has any rows
      const visitorCount = await db.get('SELECT COUNT(*) as count FROM visitors');
      console.log(`Total rows in visitors table: ${visitorCount.count}`);
    } catch (e) {
      console.error('Error checking database tables:', e);
    }
    
    return NextResponse.json({ 
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + events.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: 'Error fetching webhook events', details: error.message }, 
      { status: 500 }
    );
  } finally {
    // Ensure database is closed to trigger upload to Blob storage
    if (db) {
      console.log('Closing database connection');
      await db.close();
      console.log('Database connection closed');
    }
  }
} 