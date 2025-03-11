import { FingerprintJsServerApiClient, Region } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { NextResponse } from 'next/server';

// Initialize the Fingerprint client (only once)
const client = new FingerprintJsServerApiClient({
  apiKey: process.env.FINGERPRINT_SECRET_API_KEY,
  region: Region.Global, // Change to your region if needed
});

// Debug your environment variable
console.log("API Key available in environment:", !!process.env.FINGERPRINT_SECRET_API_KEY);
console.log("API Key length:", process.env.FINGERPRINT_SECRET_API_KEY?.length);



export async function POST(request) {
  try {
    const { action, visitorId, requestId, filters } = await request.json();
    
    // Prevent API access without proper data
    if (!action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    let result;
    
    switch (action) {
      case 'getVisitorData':
        if (!visitorId) {
          return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
        }
        result = await client.getVisits(visitorId);
        break;
        
      case 'getEvent':
        if (!requestId) {
          return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }
        result = await client.getEvent(requestId);
        break;
        
      case 'searchEvents':
        result = await client.searchEvents(filters || {});
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fingerprint API error:', error);
    
    // Handle specific error types
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