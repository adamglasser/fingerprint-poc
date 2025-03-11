import { FingerprintJsServerApiClient, Region } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { NextResponse } from 'next/server';

// Initialize the Fingerprint client (only once)
const client = new FingerprintJsServerApiClient({
  apiKey: process.env.FINGERPRINT_SECRET_API_KEY,
  region: Region.Global, // Change to your region if needed
});

// Debug your environment variable
// console.log("API Key available in environment:", !!process.env.FINGERPRINT_SECRET_API_KEY);
// console.log("API Key length:", process.env.FINGERPRINT_SECRET_API_KEY?.length);

export async function POST(request) {
  try {
    const { 
      action, 
      visitorId, 
      requestId, 
      filters,
      eventDetails,
      linkedId,
      tag,
      suspect 
    } = await request.json();
    
    // Prevent API access without proper data
    if (!action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    let result;
    
    switch (action) {
      // Visitor operations
      case 'getVisitorData':
        if (!visitorId) {
          return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
        }
        
        // Support for pagination and limiting
        const visitOptions = {
          limit: filters?.limit || 20,
          before: filters?.before || undefined,
        };
        
        result = await client.getVisits(visitorId, visitOptions);
        break;
        
        
      // Event operations
      case 'getEvent':
        if (!requestId) {
          return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }
        result = await client.getEvent(requestId);
        break;
        
        
      // Search operations
      case 'searchEvents':
        const searchFilters = {
          visitorId: filters?.visitorId,
          linkedId: filters?.linkedId,
          limit: filters?.limit || 10,
          paginationKey: filters?.paginationKey,
          // Security filters
          suspect: filters?.suspect,
          bot: filters?.bot,
          // Time-based filters
          start: filters?.start ? filters.start : undefined,
          end: filters?.end ? filters.end : undefined,
          //misc
          reverse: filters?.reverse,
        };
        
        // Remove undefined values and empty strings
        Object.keys(searchFilters).forEach(key => 
          (searchFilters[key] === undefined || searchFilters[key] === '') && delete searchFilters[key]
        );
        
        console.log('Searching with filters:', searchFilters);
        console.log('Raw filters received:', filters);
        result = await client.searchEvents(searchFilters);
        break;
        
      // Summary information - extra functionality
      case 'getVisitorSummary':
        if (!visitorId) {
          return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
        }
        
        // Get a limited set of visits
        const visits = await client.getVisits(visitorId, { limit: 50 });
        
        // If we have visits, fetch the most recent event details
        if (visits.visits && visits.visits.length > 0) {
          const latestVisit = visits.visits[0];
          const eventDetails = await client.getEvent(latestVisit.requestId);
          
          result = {
            visitorId,
            visitCount: visits.visits.length,
            firstSeen: visits.visits[visits.visits.length - 1].timestamp,
            lastSeen: latestVisit.timestamp,
            latestEventDetails: eventDetails,
            recentVisits: visits.visits.slice(0, 5), // Include 5 most recent visits
          };
        } else {
          result = { visitorId, visitCount: 0 };
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fingerprint API error:', error);
    
    // Handle other error types
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message, statusCode: error.statusCode },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}