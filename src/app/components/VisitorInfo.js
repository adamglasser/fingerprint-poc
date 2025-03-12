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
  const [activeTab, setActiveTab] = useState('summary');
  const [searchFilters, setSearchFilters] = useState({
    limit: 10,
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [manualEventLoading, setManualEventLoading] = useState(false);

  // Function to call the server API
  const fetchServerData = async (visitorId, action = 'getVisitorSummary', additionalParams = {}) => {
    if (!visitorId && action !== 'searchEvents' && !additionalParams.requestId) return;
    
    setServerLoading(true);
    setServerError(null);
    
    try {
      const params = {
        action,
        ...(visitorId && { visitorId }),
        ...additionalParams,
      };
      
      //console.log(`Fetching ${action} with params:`, params);
      
      const response = await fetch('/api/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data from server');
      }
      
      const data = await response.json();
      //console.log(`Received ${action} response:`, data);
      

      
      setServerData(data);
    } catch (err) {
      setServerError(err.message);
      console.error(`Error in ${action}:`, err);
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

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'eventDetails' && manualEventLoading) {
      setManualEventLoading(false);
      return;
    }
    
    if (visitorData?.visitorId) {
      switch (tab) {
        case 'summary':
          fetchServerData(visitorData.visitorId, 'getVisitorSummary');
          break;
        case 'visits':
          fetchServerData(visitorData.visitorId, 'getVisitorData');
          break;
        case 'search':
          // Initialize search with default filters
          const defaultFilters = { limit: 10 };
          if (visitorData.visitorId) {
            defaultFilters.visitorId = visitorData.visitorId;
          }
          //console.log('Initial search with filters:', defaultFilters);
          fetchServerData(null, 'searchEvents', { filters: defaultFilters });
          break;
        case 'eventDetails':
          if (visitorData.requestId) {
            fetchServerData(null, 'getEvent', { requestId: visitorData.requestId });
          }
          break;
      }
    }
  };



  // Search events with filters
  const handleSearchEvents = () => {
    const filters = { ...searchFilters };
    
    if (filters.visitorId) {
      filters.visitor_id = filters.visitorId;
      delete filters.visitorId;
    }
    
    if (filters.linkedId) {
      filters.linked_id = filters.linkedId;
      delete filters.linkedId;
    }
    
    if (filters.ipAddress) {
      filters.ip_address = filters.ipAddress;
      delete filters.ipAddress;
    }
    
    // Add date range if provided - convert to Unix timestamp in milliseconds
    if (dateRange.startDate) {
      // Ensure the date string is valid
      const startDate = new Date(dateRange.startDate);
      if (!isNaN(startDate.getTime())) {
        filters.start = startDate.getTime();
      }
    }
    
    if (dateRange.endDate) {
      // Ensure the date string is valid
      const endDate = new Date(dateRange.endDate);
      if (!isNaN(endDate.getTime())) {
        filters.end = endDate.getTime();
      }
    }
    
    console.log('Searching with filters:', filters);
    fetchServerData(null, 'searchEvents', { filters });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    if (serverLoading) {
      return <p className="text-gray-500 dark:text-gray-400">Loading data...</p>;
    }
    
    if (serverError) {
      return <p className="text-red-500">Error: {serverError}</p>;
    }
    
    if (!serverData) {
      return <p className="text-gray-500 dark:text-gray-400">No data available</p>;
    }
    
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Visitor Overview</h4>
                <p><span className="font-medium">Visit Count:</span> {serverData.visitCount || 0}</p>
                {serverData.firstSeen && <p><span className="font-medium">First Seen:</span> {new Date(serverData.firstSeen).toLocaleString()}</p>}
                {serverData.lastSeen && <p><span className="font-medium">Last Seen:</span> {new Date(serverData.lastSeen).toLocaleString()}</p>}
              </div>
              
              {(serverData.latestEventDetails || serverData.recentVisits?.[0]) && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Latest Event</h4>
                  {(() => {
                    // Get event data from either source
                    const rawEvent = serverData.latestEventDetails || serverData.recentVisits?.[0] || {};
                    
                    const identData = rawEvent.products?.identification?.data;
                    
                    // Extract main fields
                    const requestId = identData?.requestId || rawEvent.products?.botd?.data?.requestId || rawEvent.requestId;
                    const timestamp = identData?.timestamp || rawEvent.timestamp;
                    const ip = identData?.ip || rawEvent.products?.ipInfo?.data?.v4?.address || rawEvent.ip;
                    
                    // Browser details
                    const browserName = identData?.browserDetails?.browserName;
                    const browserVersion = identData?.browserDetails?.browserFullVersion;
                    const os = identData?.browserDetails?.os;
                    const osVersion = identData?.browserDetails?.osVersion;
                    
                    // Get location info if available
                    const city = rawEvent.products?.ipInfo?.data?.v4?.geolocation?.city?.name;
                    const country = rawEvent.products?.ipInfo?.data?.v4?.geolocation?.country?.name;
                    
                    // Security signals
                    const incognito = identData?.incognito || rawEvent.products?.incognito?.data?.result;
                    const isBot = rawEvent.products?.botd?.data?.bot?.result !== "notDetected";
                    const isVpn = rawEvent.products?.vpn?.data?.result;
                    const devTools = rawEvent.products?.developerTools?.data?.result;
                    
                    //console.log("Latest event data structure:", rawEvent);
                    
                    return (
                      <>
                        <p><span className="font-medium">Request ID:</span> {requestId || 'N/A'}</p>
                        <p><span className="font-medium">Time:</span> {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}</p>
                        <p><span className="font-medium">IP:</span> {ip || 'N/A'}</p>
                        
                        {/* Browser info if available */}
                        {browserName && (
                          <p><span className="font-medium">Browser:</span> {browserName} {browserVersion}</p>
                        )}
                        
                        {os && (
                          <p><span className="font-medium">OS:</span> {os} {osVersion}</p>
                        )}
                        
                        {/* Location if available */}
                        {(city || country) && (
                          <p><span className="font-medium">Location:</span> {[city, country].filter(Boolean).join(', ')}</p>
                        )}
                        
                        {/* Security indicators */}
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          {incognito && <p><span className="font-medium">Incognito:</span> Yes</p>}
                          {isBot && <p><span className="font-medium">Bot:</span> Yes</p>}
                          {isVpn && <p><span className="font-medium">VPN:</span> Yes</p>}
                          {devTools && <p><span className="font-medium">Developer Tools:</span> Open</p>}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {serverData.recentVisits && serverData.recentVisits.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Visits</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {serverData.recentVisits.map((visit, idx) => {
                        // Extract requestId and log the visit data
                        let requestId = visit.requestId;
                        //console.log('Recent visit data:', visit);
                        
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {visit.timestamp ? new Date(visit.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {requestId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {visit.ip || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              <button 
                                onClick={() => {
                                  if (requestId) {
                                    //console.log('Viewing details for request:', requestId);
                                    setManualEventLoading(true);
                                    fetchServerData(null, 'getEvent', { requestId: requestId });
                                    setActiveTab('eventDetails');
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-700 mr-2"
                                disabled={!requestId}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <button
                  onClick={() => handleTabChange('visits')}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  View All Visits
                </button>
              </div>
            )}
          </div>
        );
      
      case 'visits':
        return (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Visitor History</h4>
            {serverData.visits && serverData.visits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {serverData.visits.map((visit, idx) => {
                      // Extract requestId using the same approach as in search results
                      let requestId = visit.requestId;
                      //console.log('Visit data:', visit);
                      
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {visit.timestamp ? new Date(visit.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {requestId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {visit.ip || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            <button 
                              onClick={() => {
                                if (requestId) {
                                  //console.log('Viewing details for request:', requestId);
                                  setManualEventLoading(true);
                                  fetchServerData(null, 'getEvent', { requestId: requestId });
                                  setActiveTab('eventDetails');
                                }
                              }}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                              disabled={!requestId}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No visit history available</p>
            )}
            
            {serverData.hasMoreVisits && (
              <button
                onClick={() => fetchServerData(visitorData.visitorId, 'getVisitorData', { 
                  filters: { limit: 50, before: serverData.visits[serverData.visits.length - 1].timestamp } 
                })}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Load More
              </button>
            )}
          </div>
        );
      
      case 'search':
        return (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Search Events</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visitor ID</label>
                <input
                  type="text"
                  name="visitorId"
                  value={searchFilters.visitorId || ''}
                  onChange={handleFilterChange}
                  placeholder="Enter visitor ID"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Linked ID</label>
                <input
                  type="text"
                  name="linkedId"
                  value={searchFilters.linkedId || ''}
                  onChange={handleFilterChange}
                  placeholder="Enter linked ID"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={searchFilters.ipAddress || ''}
                  onChange={handleFilterChange}
                  placeholder="Enter IP address (CIDR notation)"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bot Detection</label>
                <select
                  name="bot"
                  value={searchFilters.bot || ''}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Any</option>
                  <option value="all">All Bots</option>
                  <option value="good">Good Bots</option>
                  <option value="bad">Bad Bots</option>
                  <option value="none">No Bots</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suspect</label>
                <select
                  name="suspect"
                  value={searchFilters.suspect || ''}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limit</label>
                <input
                  type="number"
                  name="limit"
                  value={searchFilters.limit || 10}
                  onChange={handleFilterChange}
                  min="1"
                  max="100"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reverse Order</label>
                <select
                  name="reverse"
                  value={searchFilters.reverse || ''}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Default Order</option>
                  <option value="true">Reverse Order</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleSearchEvents}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Search Events
            </button>
            
            {serverData && serverData.events && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Search Results</h4>
                {serverData.events.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Visitor ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {serverData.events.map((event, idx) => {
                          // Console log the event to see its structure
                          //console.log('Raw event:', event);
                          
                          // Extract common properties from the event structure
                          const timestamp = event.products?.identification?.data?.timestamp;
                          const visitorId = event.products?.identification?.data?.visitorId;
                          
                          // Extract requestId from the appropriate location
                          let requestId;
                          if (event.products?.identification?.data?.requestId) {
                            requestId = event.products.identification.data.requestId;
                          } else if (event.products?.botd?.data?.requestId) {
                            requestId = event.products.botd.data.requestId;
                          } else {
                            requestId = event.requestId;
                          }
                          
                          // Get IP from the correct location in nested data
                          let ip;
                          if (event.products?.identification?.data?.ip) {
                            ip = event.products.identification.data.ip;
                          } else if (event.products?.ipInfo?.data?.v4?.address) {
                            ip = event.products.ipInfo.data.v4.address;
                          } else {
                            ip = event.ip;
                          }
                          
                          // Debug info
                          //console.log('Extracted data:', { timestamp, visitorId, requestId, ip });
                          
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {visitorId || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {requestId || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {ip || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                <button 
                                  onClick={() => {
                                    if (requestId) {
                                      //console.log('Viewing details for request:', requestId);
                                      setManualEventLoading(true);
                                      fetchServerData(null, 'getEvent', { requestId: requestId });
                                      setActiveTab('eventDetails');
                                    }
                                  }}
                                  className="text-blue-500 hover:text-blue-700 mr-2"
                                  disabled={!requestId}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No results found</p>
                )}
                
                {serverData.paginationKey && (
                  <button
                    onClick={() => {
                      // Create a new filters object with the current filters
                      const paginatedFilters = { ...searchFilters };
                      
                      // Add pagination key
                      paginatedFilters.pagination_key = serverData.paginationKey;
                      
                      // Convert parameter names to match the API's expected format
                      if (paginatedFilters.visitorId) {
                        paginatedFilters.visitor_id = paginatedFilters.visitorId;
                        delete paginatedFilters.visitorId;
                      }
                      
                      if (paginatedFilters.linkedId) {
                        paginatedFilters.linked_id = paginatedFilters.linkedId;
                        delete paginatedFilters.linkedId;
                      }
                      
                      if (paginatedFilters.ipAddress) {
                        paginatedFilters.ip_address = paginatedFilters.ipAddress;
                        delete paginatedFilters.ipAddress;
                      }
                      
                      // Add date range if provided - convert to Unix timestamp in milliseconds
                      if (dateRange.startDate) {
                        // Ensure the date string is valid
                        const startDate = new Date(dateRange.startDate);
                        if (!isNaN(startDate.getTime())) {
                          paginatedFilters.start = startDate.getTime();
                        }
                      }
                      
                      if (dateRange.endDate) {
                        // Ensure the date string is valid
                        const endDate = new Date(dateRange.endDate);
                        if (!isNaN(endDate.getTime())) {
                          paginatedFilters.end = endDate.getTime();
                        }
                      }
                      
                      //console.log('Loading more results with filters:', paginatedFilters);
                      fetchServerData(null, 'searchEvents', { filters: paginatedFilters });
                    }}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Load More Results
                  </button>
                )}
              </div>
            )}
          </div>
        );
      
      case 'eventDetails':
        return (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Event Details</h4>
            
            {/* Check if we have either a direct requestId or one in the nested products structure */}
            {(serverData.requestId || serverData.products?.identification?.data?.requestId) ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Basic Information</h5>
                    <p><span className="font-medium">Request ID:</span> {serverData.requestId || serverData.products?.identification?.data?.requestId || serverData.products?.botd?.data?.requestId}</p>
                    
                    {/* Try multiple possible locations for timestamp */}
                    {(serverData.timestamp || serverData.products?.identification?.data?.timestamp) && (
                      <p><span className="font-medium">Time:</span> {new Date(serverData.timestamp || serverData.products?.identification?.data?.timestamp).toLocaleString()}</p>
                    )}
                    
                    {/* Try multiple possible locations for URL */}
                    {(serverData.url || serverData.products?.identification?.data?.url) && (
                      <p><span className="font-medium">URL:</span> {serverData.url || serverData.products?.identification?.data?.url}</p>
                    )}
                    
                    {/* Try multiple possible locations for visitorId */}
                    {(serverData.visitorId || serverData.products?.identification?.data?.visitorId) && (
                      <p><span className="font-medium">Visitor ID:</span> {serverData.visitorId || serverData.products?.identification?.data?.visitorId}</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Browser & Device</h5>
                    {/* Browser info - try multiple possible locations */}
                    {(serverData.browserDetails?.browserName || serverData.products?.identification?.data?.browserDetails?.browserName) && (
                      <p><span className="font-medium">Browser:</span> {
                        serverData.browserDetails?.browserName || serverData.products?.identification?.data?.browserDetails?.browserName
                      } {
                        serverData.browserDetails?.browserFullVersion || serverData.products?.identification?.data?.browserDetails?.browserFullVersion
                      }</p>
                    )}
                    
                    {/* OS info - try multiple possible locations */}
                    {(serverData.browserDetails?.os || serverData.products?.identification?.data?.browserDetails?.os) && (
                      <p><span className="font-medium">OS:</span> {
                        serverData.browserDetails?.os || serverData.products?.identification?.data?.browserDetails?.os
                      } {
                        serverData.browserDetails?.osVersion || serverData.products?.identification?.data?.browserDetails?.osVersion
                      }</p>
                    )}
                    
                    {/* Device info - try multiple possible locations */}
                    {(serverData.browserDetails?.device || serverData.products?.identification?.data?.browserDetails?.device) && (
                      <p><span className="font-medium">Device:</span> {
                        serverData.browserDetails?.device || serverData.products?.identification?.data?.browserDetails?.device
                      }</p>
                    )}
                    
                    {/* Incognito - try multiple possible locations */}
                    {(serverData.incognito !== undefined || serverData.products?.identification?.data?.incognito !== undefined) && (
                      <p><span className="font-medium">Incognito:</span> {
                        (serverData.incognito || serverData.products?.identification?.data?.incognito || 
                         serverData.products?.incognito?.data?.result) ? 'Yes' : 'No'
                      }</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">IP Information</h5>
                    {/* IP - try multiple possible locations */}
                    {(serverData.ip || serverData.products?.identification?.data?.ip || serverData.products?.ipInfo?.data?.v4?.address) && (
                      <p><span className="font-medium">IP Address:</span> {
                        serverData.ip || serverData.products?.identification?.data?.ip || serverData.products?.ipInfo?.data?.v4?.address
                      }</p>
                    )}
                    
                    {/* Country info */}
                    {(serverData.products?.ipInfo?.data?.v4?.geolocation?.country?.name) && (
                      <p><span className="font-medium">Country:</span> {serverData.products.ipInfo.data.v4.geolocation.country.name}</p>
                    )}
                    
                    {/* City info */}
                    {(serverData.products?.ipInfo?.data?.v4?.geolocation?.city?.name) && (
                      <p><span className="font-medium">City:</span> {serverData.products.ipInfo.data.v4.geolocation.city.name}</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Security Signals</h5>
                    {/* Bot detection */}
                    {serverData.products?.botd?.data?.bot?.result && (
                      <p><span className="font-medium">Bot:</span> {serverData.products.botd.data.bot.result}</p>
                    )}
                    
                    {/* VPN detection */}
                    {serverData.products?.vpn?.data?.result !== undefined && (
                      <p><span className="font-medium">VPN:</span> {serverData.products.vpn.data.result ? 'Yes' : 'No'}</p>
                    )}
                    
                    {/* Tampering detection */}
                    {serverData.products?.tampering?.data?.result !== undefined && (
                      <p><span className="font-medium">Tampering:</span> {serverData.products.tampering.data.result ? 'Yes' : 'No'}</p>
                    )}
                    
                    {/* Developer tools detection */}
                    {serverData.products?.developerTools?.data?.result !== undefined && (
                      <p><span className="font-medium">Developer Tools:</span> {serverData.products.developerTools.data.result ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Full Event Data</h5>
                  <div className="overflow-auto max-h-96">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
                      {JSON.stringify(serverData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No event details available</p>
            )}
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(serverData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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
            <p className="mb-1"><span className="font-medium">visitorFound:</span> {visitorData.visitorFound.toString().toUpperCase()}</p>
            <p className="mb-1"><span className="font-medium">confidence:</span> {visitorData.confidence.score}</p>
            {/* Add more client-side data fields as needed */}
            {/* {console.log(visitorData)} */}
            
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => fetchServerData(visitorData.visitorId)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Refresh Server Data
              </button>
              
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No visitor data available</p>
        )}
      </div>
      
      {/* Tab navigation */}
      {visitorData?.visitorId && (
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('summary')}
                className={`${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Summary
              </button>
              
              <button
                onClick={() => handleTabChange('visits')}
                className={`${
                  activeTab === 'visits'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Visit History
              </button>
              
              <button
                onClick={() => handleTabChange('search')}
                className={`${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Search Events
              </button>
              
              <button
                onClick={() => handleTabChange('eventDetails')}
                className={`${
                  activeTab === 'eventDetails'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Current Event Details
              </button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Server-side data section */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
          Server-side Data
        </h3>
        {renderTabContent()}
      </div>
    </div>
  );
}