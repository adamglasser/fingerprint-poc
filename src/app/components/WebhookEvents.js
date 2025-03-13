'use client';

import { useState, useEffect } from 'react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';
import { 
  Loader2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Calendar, 
  Globe, 
  Clock, 
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

export default function WebhookEvents({ visitorId }) {
  // Only use the hook if we need the client-side visitor ID
  const needsClientSideId = visitorId === '__CLIENT_SIDE__';
  
  // Use a conditional hook pattern
  const visitorDataHook = needsClientSideId ? useVisitorData() : { 
    isLoading: false, 
    error: null, 
    data: null 
  };
  
  const {
    isLoading: fpjsLoading,
    error: fpjsError,
    data: visitorData,
  } = visitorDataHook;
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Determine the actual visitor ID to use
  const effectiveVisitorId = needsClientSideId 
    ? visitorData?.visitorId 
    : visitorId;

  // Fetch webhook events
  const fetchEvents = async (offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: offset
      });
      
      if (effectiveVisitorId) {
        params.append('visitorId', effectiveVisitorId);
      }
      
      const response = await fetch(`/api/webhook-events?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch webhook events');
      }
      
      const data = await response.json();
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching webhook events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount or when visitorId changes
  useEffect(() => {
    // If we're waiting for client-side visitor ID, don't fetch yet
    if (needsClientSideId && !visitorData?.visitorId) {
      if (!fpjsLoading) return; // Only show loading if we're actually loading the visitor ID
      return;
    }
    
    // If we have a visitor ID (either direct or from client), fetch events
    fetchEvents(0);
  }, [effectiveVisitorId, fpjsLoading, needsClientSideId]);

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.hasMore) {
      const newOffset = pagination.offset + pagination.limit;
      fetchEvents(newOffset);
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      const newOffset = Math.max(0, pagination.offset - pagination.limit);
      fetchEvents(newOffset);
    }
  };

  // Format date to readable string
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(parseInt(timestamp)).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Toggle expanded event
  const toggleEventExpand = (eventId) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  // Show loading when waiting for client-side visitor ID
  if (needsClientSideId && fpjsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">Identifying visitor...</p>
      </div>
    );
  }

  // Show error if there was an error getting the visitor ID
  if (needsClientSideId && fpjsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 font-medium text-lg mb-2">Error Identifying Visitor</p>
        <p className="text-gray-600 dark:text-gray-400 text-center">{fpjsError.message}</p>
      </div>
    );
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading webhook events...</p>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 font-medium text-lg mb-2">Error Occurred</p>
        <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
        <button 
          onClick={() => fetchEvents(0)}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Info className="w-10 h-10 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No webhook events found</p>
        {effectiveVisitorId && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            No events have been received for this visitor ID yet
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Webhook Events {pagination.total > 0 && `(${pagination.total})`}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchEvents(0)}
            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Refresh events"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Visitor ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <span className="truncate max-w-[120px]" title={event.visitor_id}>
                        {event.visitor_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(event.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate max-w-[200px]" title={event.url || 'N/A'}>
                        {event.url || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {event.ip || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleEventExpand(event.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                      {expandedEvent === event.id ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          View
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Expanded event details */}
        {events.map((event) => (
          expandedEvent === event.id && (
            <div key={`details-${event.id}`} className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Event Details
              </h4>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(event.data || {}, null, 2)}
                </pre>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Pagination controls */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {pagination.offset + 1}-{Math.min(pagination.offset + events.length, pagination.total)} of {pagination.total}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className={`p-2 rounded-md ${
                pagination.offset === 0
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
              className={`p-2 rounded-md ${
                !pagination.hasMore
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 