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
     console.log('the latestEventDetails are', latestVisit)
     result = {
       visitorId,
       confidence: latestVisit.confidence,
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

          // Log the received sealed result
          console.log('Server received sealed result:', {
            length: sealedResult.length,
            firstChars: sealedResult.substring(0, 50),
            lastChars: sealedResult.substring(sealedResult.length - 50),
            containsWhitespace: /\s/.test(sealedResult),
            containsInvalidChars: /[^A-Za-z0-9+/=]/.test(sealedResult)
          });

          // Validate base64 format
          if (!/^[A-Za-z0-9+/=]+$/.test(sealedResult)) {
            console.error('Invalid base64 format detected');
            return NextResponse.json(
              { error: 'Invalid base64 format in sealed result' },
              { status: 400 }
            );
          }

          // Try to decode the base64 string first
          try {
            const decoded = Buffer.from(sealedResult, 'base64');
            console.log('Base64 decode successful:', {
              decodedLength: decoded.length,
              isBuffer: Buffer.isBuffer(decoded)
            });
          } catch (decodeError) {
            console.error('Base64 decode error:', decodeError);
            return NextResponse.json(
              { error: 'Failed to decode base64 string' },
              { status: 400 }
            );
          }

          // Log the decryption key (first few chars only for security)
          console.log('Decryption key:', {
            length: decryptionKey.length,
            firstChars: decryptionKey.substring(0, 10) + '...'
          });

          try {
            // Try to create the buffer first to catch any encoding issues
            const sealedBuffer = Buffer.from(sealedResult, 'base64');
            console.log('Successfully created sealed buffer:', {
              length: sealedBuffer.length,
              type: sealedBuffer.constructor.name
            });

            const keyBuffer = Buffer.from(decryptionKey, 'base64');
            console.log('Successfully created key buffer:', {
              length: keyBuffer.length,
              type: keyBuffer.constructor.name
            });

            // Unseal the result
            let unsealedResult = await unsealEventsResponse(
              sealedBuffer,
              [
                {
                  key: keyBuffer,
                  algorithm: 'aes-256-gcm',
                }
              ]
            );

            console.log('Successfully unsealed result:', {
              hasVisitorId: !!unsealedResult.products.identification.data.visitorId,
              visitorId: unsealedResult.products.identification.data.visitorId
            });

            if (unsealedResult.products.identification.data.visitorId) {
              result = await buildSummary(unsealedResult.products.identification.data.visitorId, client)
            } else {
              throw new Error('Missing visitorId from unsealed result')
            }
          } catch (bufferError) {
            console.error('Buffer creation error:', {
              name: bufferError.name,
              message: bufferError.message,
              stack: bufferError.stack
            });
            throw bufferError;
          }
        } catch (unsealError) {
          console.error('Error unsealing result:', {
            name: unsealError.name,
            message: unsealError.message,
            stack: unsealError.stack
          });
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