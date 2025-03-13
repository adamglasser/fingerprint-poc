import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(request) {
  let db = null;
  try {
    const url = new URL(request.url);
    const visitorId = url.searchParams.get('visitorId');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    db = await openDb();
    
    let query, params;
    
    if (visitorId) {
      // Get events for a specific visitor
      query = `
        SELECT * FROM events 
        WHERE visitor_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `;
      params = [visitorId, limit, offset];
    } else {
      // Get all events
      query = `
        SELECT e.*, v.first_seen, v.last_seen, v.visit_count 
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.visitor_id
        ORDER BY e.timestamp DESC 
        LIMIT ? OFFSET ?
      `;
      params = [limit, offset];
    }
    
    const events = await db.all(query, ...params);
    
    // Get total count for pagination
    let countQuery, countParams;
    if (visitorId) {
      countQuery = 'SELECT COUNT(*) as total FROM events WHERE visitor_id = ?';
      countParams = [visitorId];
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM events';
      countParams = [];
    }
    
    const { total } = await db.get(countQuery, ...countParams);
    
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
      { error: 'Error fetching webhook events' }, 
      { status: 500 }
    );
  } finally {
    // Ensure database is closed to trigger upload to Blob storage
    if (db) {
      await db.close();
    }
  }
} 