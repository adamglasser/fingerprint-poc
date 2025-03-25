import { FingerprintJsServerApiClient, Region, unsealEventsResponse } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { NextResponse } from 'next/server';

// Function to initialize the Fingerprint client
function getFingerPrintClient() {
  return new FingerprintJsServerApiClient({
    apiKey: process.env.FINGERPRINT_SECRET_API_KEY,
    region: Region.Global,
  });
}

async function buildSummary(visitorId, client){
  console.log('the visitorId is', visitorId)
  console.log('the client is', client)
   if (!visitorId || !client) {
     throw new Error('Missing required parameters: visitorId and client');
   }

   // Get a limited set of visits
   const visits = await client.getVisits(visitorId, { limit: 50 });
   
   // Initialize result as null
   let result = null;
   
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
   }
   
   return result;
}

export async function POST(request) {
  
  
  // App api operations
  try {
    const { 
      action, 
      sealedResult,
      visitorId, 
      requestId, 
      filters,
      eventDetails,
      linkedId,
      tag,
      suspect 
    } = await request.json();
    
    if (!action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Initialize the client only when a request is made
    const client = getFingerPrintClient();
    
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
        
        //console.log('Searching with filters:', searchFilters);
        //console.log('Raw filters received:', filters);
        result = await client.searchEvents(searchFilters);
        break;
        
      // Summary information - extra functionality
      case 'getVisitorSummary':
        if (!visitorId) {
          return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 });
        }
        
        result = await buildSummary(visitorId, client)
        break;
      
      
      //handle sealed client result
      case 'unsealResult':
        if (!sealedResult) {
          return NextResponse.json({ error: 'Missing sealedResult' }, { status: 400 });
        }
        
        try {
          // Get the decryption key from environment variables
          const decryptionKey = process.env.FP_ENCRYPTION_KEY;
          
          if (!decryptionKey) {
            return NextResponse.json({ error: 'Decryption key not configured' }, { status: 500 });
          }
          
          // Unseal the result
          let unsealedResult = await unsealEventsResponse(
            Buffer.from(sealedResult, 'base64'), 
            [
              {
                key: Buffer.from(decryptionKey, 'base64'),
                algorithm: 'aes-256-gcm',
              }
            ]
          );
          if (unsealedResult.products.identification.data.visitorId) {
            result = await buildSummary(unsealedResult.products.identification.data.visitorId, client)
            console.log('the result is', result)
          } else {
            throw new Error('Missing visitorId from unsealed result')
          }
        } catch (unsealError) {
          console.error('Error unsealing result:', unsealError);
          return NextResponse.json(
            { error: 'Failed to unseal result', details: unsealError.message },
            { status: 400 }
          );
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