// scripts/fingerprint-cli.js
import { openDb } from './cli-db.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = {
  async listVisitors() {
    const db = await openDb();
    try {
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
      
      console.log(`Found ${visitors.length} visitors:`);
      visitors.forEach(visitor => {
        console.log(`- ${visitor.visitor_id}: ${visitor.event_count} events, last seen ${visitor.last_seen}`);
      });
      
      return visitors;
    } finally {
      await db.close();
    }
  },
  
  async getVisitorEvents(visitorId) {
    const db = await openDb();
    try {
      const visitor = await db.get(
        'SELECT * FROM visitors WHERE visitor_id = ?',
        visitorId
      );
      
      if (!visitor) {
        console.log(`No visitor found with ID: ${visitorId}`);
        return;
      }
      
      const events = await db.all(
        'SELECT * FROM events WHERE visitor_id = ? ORDER BY timestamp DESC LIMIT 5',
        visitorId
      );
      
      console.log(`Visitor ${visitorId}:`);
      console.log(`- First seen: ${visitor.first_seen}`);
      console.log(`- Last seen: ${visitor.last_seen}`);
      console.log(`- Visit count: ${visitor.visit_count}`);
      console.log(`- Recent events: ${events.length}`);
      
      events.forEach((event, i) => {
        const data = JSON.parse(event.raw_data);
        console.log(`\nEvent ${i+1} (${event.request_id}):`);
        console.log(`- Time: ${event.event_time}`);
        console.log(`- IP: ${event.ip}`);
        console.log(`- URL: ${event.url}`);
        console.log(`- Incognito: ${event.incognito ? 'Yes' : 'No'}`);
        
        // Display additional data if available
        if (data.browserDetails) {
          console.log(`- Browser: ${data.browserDetails.browserName} ${data.browserDetails.browserMajorVersion}`);
          console.log(`- OS: ${data.browserDetails.os} ${data.browserDetails.osVersion}`);
        }
      });
    } finally {
      await db.close();
    }
  },
  
  async deleteVisitor(visitorId) {
    const db = await openDb();
    
    try {
      await db.exec('BEGIN TRANSACTION');
      
      try {
        // First delete events for this visitor
        const deleteResult = await db.run(
          'DELETE FROM events WHERE visitor_id = ?',
          visitorId
        );
        
        const eventsDeleted = deleteResult.changes;
        
        // Then delete the visitor
        const visitorResult = await db.run(
          'DELETE FROM visitors WHERE visitor_id = ?',
          visitorId
        );
        
        const visitorDeleted = visitorResult.changes;
        
        await db.exec('COMMIT');
        
        if (visitorDeleted === 0) {
          console.log(`No visitor found with ID: ${visitorId}`);
        } else {
          console.log(`Deleted visitor ${visitorId} and ${eventsDeleted} events`);
        }
      } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error deleting visitor:', error);
      }
    } finally {
      await db.close();
    }
  }
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || !commands[command]) {
    console.log('Available commands:');
    console.log('  listVisitors');
    console.log('  getVisitorEvents <visitorId>');
    console.log('  deleteVisitor <visitorId>');
    process.exit(1);
  }
  
  try {
    await commands[command](...args.slice(1));
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);