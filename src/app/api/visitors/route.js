// app/api/visitors/route.js
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(request) {
  let db = null;
  try {
    const url = new URL(request.url);
    const visitorId = url.searchParams.get('visitorId');
    db = await openDb();
    
    if (visitorId) {
      // Get a specific visitor with their events
      const visitor = await db.get(
        'SELECT * FROM visitors WHERE visitor_id = ?',
        visitorId
      );
      
      if (!visitor) {
        return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
      }
      
      const events = await db.all(
        'SELECT * FROM events WHERE visitor_id = ? ORDER BY timestamp DESC LIMIT 50',
        visitorId
      );
      
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
      
      return NextResponse.json({ visitor, events });
    } else {
      // Get all visitors with counts
      const visitors = await db.all(`
        SELECT 
          v.*, 
          COUNT(e.id) as event_count 
        FROM 
          visitors v 
        LEFT JOIN 
          events e ON v.visitor_id = e.visitor_id 
        GROUP BY 
          v.visitor_id 
        ORDER BY 
          v.last_seen DESC
      `);
      
      return NextResponse.json({ 
        visitorCount: visitors.length, 
        visitors 
      });
    }
  } catch (error) {
    console.error('Error fetching visitor data:', error);
    return NextResponse.json(
      { error: 'Error fetching visitor data' }, 
      { status: 500 }
    );
  } finally {
    // Ensure database is closed to trigger upload to Blob storage
    if (db) {
      await db.close();
    }
  }
}