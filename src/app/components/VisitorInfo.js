'use client';

import { useState, useEffect } from 'react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';

export default function VisitorInfo() {
  const {
    isLoading,
    error,
    data: visitorData,
  } = useVisitorData();

  const [serverData, setServerData] = useState(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Function to call your server API
  const fetchServerData = async (visitorId) => {
    if (!visitorId) return;
    
    setServerLoading(true);
    setServerError(null);
    
    try {
      const response = await fetch('/api/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getVisitorData',
          visitorId: visitorId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data from server');
      }
      
      const data = await response.json();
      setServerData(data);
    } catch (err) {
      setServerError(err.message);
      console.error('Error fetching server data:', err);
    } finally {
      setServerLoading(false);
    }
  };

  // When we get visitorId from the client-side library, fetch server data
  useEffect(() => {
    if (visitorData?.visitorId) {
      fetchServerData(visitorData.visitorId);
    }
  }, [visitorData?.visitorId]);

  // You likely already have UI for the client-side visitorData
  // Now add UI for the server data as well

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        Visitor Information
      </h2>
      
      {/* Client-side data section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          Client-side Data
        </h3>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading visitor data...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : visitorData ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <p className="mb-1"><span className="font-medium">Visitor ID:</span> {visitorData.visitorId}</p>
            <p className="mb-1"><span className="font-medium">Request ID:</span> {visitorData.requestId}</p>
            <p className="mb-1"><span className="font-medium">Browser:</span> {visitorData.browserName}</p>
            {/* Add more client-side data fields as needed */}
            
            <button
              onClick={() => fetchServerData(visitorData.visitorId)}
              className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Refresh Server Data
            </button>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No visitor data available</p>
        )}
      </div>
      
      {/* Server-side data section */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          Server-side Data
        </h3>
        {serverLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading server data...</p>
        ) : serverError ? (
          <p className="text-red-500">Error: {serverError}</p>
        ) : serverData ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(serverData, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            {visitorData?.visitorId ? 'Loading server data...' : 'Identify visitor to load server data'}
          </p>
        )}
      </div>
      
      {/* Additional actions */}
      {visitorData?.visitorId && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Operations
          </h3>
          <button
            onClick={() => fetchEventSearch()}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm mr-2"
          >
            Search Recent Events
          </button>
        </div>
      )}
    </div>
  );

  // Additional function to search events
  async function fetchEventSearch() {
    setServerLoading(true);
    setServerError(null);
    
    try {
      console.log('Fetching event search');
      const response = await fetch('/api/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'searchEvents',
          filters: {
            limit: 10,
            // Add any other filters you need
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search events');
      }
      
      const data = await response.json();
      setServerData(data);
    } catch (err) {
      setServerError(err.message);
      console.error('Error searching events:', err);
    } finally {
      setServerLoading(false);
    }
  }
}