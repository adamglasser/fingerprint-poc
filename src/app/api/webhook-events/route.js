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
    const debug = url.searchParams.get('debug') === 'true';
    
    console.log(`Opening database - visitorId: ${visitorId}, limit: ${limit}, offset: ${offset}, debug: ${debug}`);
    db = await openDb();
    console.log('Database opened successfully');
    
    // If debug mode is enabled, insert a test event
    if (debug) {
      console.log('Debug mode enabled, inserting test event');
      try {
        // Begin transaction
        await db.exec('BEGIN TRANSACTION');
        
        // Insert a test visitor
        const testVisitorId = 'test-visitor-' + Date.now();
        const testTimestamp = Date.now();
        
        console.log(`Inserting test visitor: ${testVisitorId}`);
        await db.run(
          'INSERT INTO visitors (visitor_id, first_seen, last_seen, visit_count) VALUES (?, ?, ?, ?)',
          testVisitorId,
          new Date().toISOString(),
          new Date().toISOString(),
          1
        );
        
        console.log('Inserting test event');
        await db.run(
          `INSERT INTO events
           (visitor_id, request_id, timestamp, event_time, ip, incognito, url, raw_data)
           VALUES (?, ?, to_timestamp((?::BIGINT)/1000), ?, ?, ?, ?, ?)
           ON CONFLICT (request_id) DO NOTHING`,
          testVisitorId,
          'test-request-' + testTimestamp,
          testTimestamp,
          new Date().toISOString(),
          '127.0.0.1',
          false,
          'https://example.com',
          JSON.stringify({ test: true, timestamp: testTimestamp, message: 'This is a test event' })
        );
        
        // Commit transaction
        await db.exec('COMMIT');
        console.log('Test event inserted successfully');
        
        // Verify tables and counts
        const tables = await db.all("SELECT tablename as name FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log(`Database tables after test insert: ${tables.map(t => t.name).join(', ')}`);
        
        const eventCount = await db.get('SELECT COUNT(*) as count FROM events');
        console.log(`Total events after test insert: ${eventCount.count}`);
        
        const visitorCount = await db.get('SELECT COUNT(*) as count FROM visitors');
        console.log(`Total visitors after test insert: ${visitorCount.count}`);
      } catch (error) {
        console.error('Error inserting test event:', error);
        await db.exec('ROLLBACK');
      }
    }
    
    let events = [];
    let total = 0;
    
    // First, check if the events table exists and has data
    try {
      console.log('Checking database structure');
      const tables = await db.all("SELECT tablename as name FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
      console.log(`Database tables: ${tables.map(t => t.name).join(', ')}`);
      
      const hasEventsTable = tables.some(table => table.name === 'events');
      const hasVisitorsTable = tables.some(table => table.name === 'visitors');
      
      if (!hasEventsTable) {
        console.log('WARNING: events table does not exist in the database!');
        return NextResponse.json({ 
          events: [],
          pagination: { total: 0, limit, offset, hasMore: false },
          debug: { error: 'events table does not exist' }
        });
      }
      
      // Check if events table has any rows
      const eventCount = await db.get('SELECT COUNT(*) as count FROM events');
      console.log(`Total rows in events table: ${eventCount.count}`);
      
      if (eventCount.count === 0) {
        console.log('No events found in the database');
        return NextResponse.json({ 
          events: [],
          pagination: { total: 0, limit, offset, hasMore: false },
          debug: { error: 'no events in database' }
        });
      }
      
      // Now we know we have data, proceed with the query
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
        let query;
        
        if (hasVisitorsTable) {
          // If visitors table exists, use the join query
          query = `
            SELECT e.*, v.first_seen, v.last_seen, v.visit_count 
            FROM events e
            LEFT JOIN visitors v ON e.visitor_id = v.visitor_id
            ORDER BY e.timestamp DESC 
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else {
          // If no visitors table, just query events
          query = `
            SELECT * FROM events
            ORDER BY timestamp DESC 
            LIMIT ${limit} OFFSET ${offset}
          `;
        }
        
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
      
      // For debug mode, include additional information
      const response = { 
        events,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + events.length < total
        }
      };
      
      if (debug) {
        response.debug = {
          tables,
          eventCount: eventCount.count,
          hasEventsTable,
          hasVisitorsTable
        };
      }
      
      return NextResponse.json(response);
      
    } catch (e) {
      console.error('Error checking database or executing query:', e);
      return NextResponse.json({ 
        events: [],
        pagination: { total: 0, limit, offset, hasMore: false },
        error: e.message
      });
    }
    
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