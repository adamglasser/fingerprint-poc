'use client';

import { useState, useEffect } from 'react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';
import { 
  ChevronRight, 
  Calendar, 
  Search, 
  Clock, 
  Shield, 
  Globe, 
  Monitor, 
  UserCheck, 
  Wifi, 
  AlertTriangle, 
  Eye, 
  ChevronDown,
  Info,
  ChevronLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function VisitorInfo() {
  const {
    isLoading,
    error,
    data: visitorData,
  } = useVisitorData({immediate: true});

  const [sealedResult, setSealedResult] = useState(null);
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
  const [expandedJSON, setExpandedJSON] = useState(false);

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
      setServerData(data);
    } catch (err) {
      setServerError(err.message);
      console.error(`Error in ${action}:`, err);
    } finally {
      setServerLoading(false);
    }
  };

  // Decrypt the sealed result
  const sendSealedResult = async (sealedResult) => {
    if (!sealedResult) return;
    
    setServerLoading(true);
    setServerError(null);
    
    try {
      const response = await fetch('/api/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unsealResult',
          sealedResult: sealedResult
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unseal result');
      }
      
      const data = await response.json();
      
      setServerData(data);
      
    } catch (err) {
      setServerError(err.message);
      console.error('Error unsealing result:', err);
    } finally {
      setServerLoading(false);
    }
  };

  useEffect(() => {
    if (visitorData) {
      // If we have a sealed result, send it to be unsealed
      if (visitorData.sealedResult) {
        sendSealedResult(visitorData.sealedResult);
      } 
      // Otherwise fall back to the regular visitor data flow
      else if (visitorData.visitorId) {
        fetchServerData(visitorData.visitorId);
      }
    }
  }, [visitorData]);

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

  // Format date to readable string
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate a confidence badge color based on score
  const getConfidenceBadgeColor = (score) => {
    if (score >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 0.7) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    if (serverLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading data...</p>
        </div>
      );
    }
    
    if (serverError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-500 font-medium text-lg mb-2">Error Occurred</p>
          <p className="text-gray-600 dark:text-gray-400 text-center">{serverError}</p>
          <button 
            onClick={() => visitorData?.visitorId && fetchServerData(visitorData.visitorId)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </button>
        </div>
      );
    }
    
    if (!serverData) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Info className="w-10 h-10 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <UserCheck className="w-5 h-5 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Visitor Overview</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-28">Visit Count:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{serverData.visitCount || 0}</span>
                  </div>
                  {serverData.firstSeen && (
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 w-28">First Seen:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{formatDate(serverData.firstSeen)}</span>
                    </div>
                  )}
                  {serverData.lastSeen && (
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 w-28">Last Seen:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{formatDate(serverData.lastSeen)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {(serverData.latestEventDetails || serverData.recentVisits?.[0]) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    <Clock className="w-5 h-5 text-blue-500 mr-2" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Latest Event</h4>
                  </div>
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
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <span className="text-gray-500 dark:text-gray-400 w-28">Request ID:</span>
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded text-gray-800 dark:text-gray-200 overflow-auto  max-w-xs">{requestId || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-gray-500 dark:text-gray-400 w-28">Time:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{formatDate(timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-gray-500 dark:text-gray-400 w-28">IP:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{ip || 'N/A'}</span>
                        </div>
                        
                        {/* Browser info if available */}
                        {browserName && (
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 w-28">Browser:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{browserName} {browserVersion}</span>
                          </div>
                        )}
                        
                        {os && (
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 w-28">OS:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{os} {osVersion}</span>
                          </div>
                        )}
                        
                        {/* Location if available */}
                        {(city || country) && (
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 w-28">Location:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{[city, country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        
                        {/* Security indicators */}
                        {(incognito || isBot || isVpn || devTools) && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-wrap gap-2">
                              {incognito && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  Incognito
                                </span>
                              )}
                              {isBot && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Bot
                                </span>
                              )}
                              {isVpn && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  VPN
                                </span>
                              )}
                              {devTools && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  DevTools
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {serverData.recentVisits && serverData.recentVisits.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Recent Visits</h4>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-auto border border-gray-100 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr className="bg-gray-850 dark:bg-gray-750">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {serverData.recentVisits.map((visit, idx) => {
                          // Extract requestId
                          let requestId = visit.requestId;
                          
                          return (
                            <tr 
                              key={idx} 
                              className="hover:bg-gray-850 dark:hover:bg-gray-750 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {formatDate(visit.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded text-gray-800 dark:text-gray-200">
                                  {requestId ? requestId : 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                {visit.ip || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button 
                                  onClick={() => {
                                    if (requestId) {
                                      setManualEventLoading(true);
                                      fetchServerData(null, 'getEvent', { requestId: requestId });
                                      setActiveTab('eventDetails');
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors duration-150 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                  disabled={!requestId}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleTabChange('visits')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-150 shadow-sm hover:shadow-md"
                  >
                    View All Visits
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'visits':
        return (
          <div>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-blue-500 mr-2" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Visitor History</h4>
            </div>
            
            {serverData.visits && serverData.visits.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-auto border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr className="bg-gray-850 dark:bg-gray-750">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {serverData.visits.map((visit, idx) => {
                        // Extract requestId
                        let requestId = visit.requestId;
                        
                        return (
                          <tr 
                            key={idx} 
                            className="hover:bg-gray-850 dark:hover:bg-gray-750 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(visit.timestamp)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded text-gray-800 dark:text-gray-200">
                                {requestId ? requestId : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                              {visit.ip || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button 
                                onClick={() => {
                                  if (requestId) {
                                    setManualEventLoading(true);
                                    fetchServerData(null, 'getEvent', { requestId: requestId });
                                    setActiveTab('eventDetails');
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors duration-150 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                disabled={!requestId}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {serverData.hasMoreVisits && (
                  <div className="px-6 py-4 bg-gray-850 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => fetchServerData(visitorData.visitorId, 'getVisitorData', { 
                        filters: { limit: 50, before: serverData.visits[serverData.visits.length - 1].timestamp } 
                      })}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 shadow-sm hover:shadow"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Load More
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700">
                <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No visit history available for this visitor</p>
              </div>
            )}
          </div>
        );
      
      case 'search':
        return (
          <div>
            <div className="flex items-center mb-4">
              <Search className="w-5 h-5 text-blue-500 mr-2" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Search Events</h4>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visitor ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="visitorId"
                      value={searchFilters.visitorId || ''}
                      onChange={handleFilterChange}
                      placeholder="Enter visitor ID"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCheck className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Linked ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="linkedId"
                      value={searchFilters.linkedId || ''}
                      onChange={handleFilterChange}
                      placeholder="Enter linked ID"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCheck className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="ipAddress"
                      value={searchFilters.ipAddress || ''}
                      onChange={handleFilterChange}
                      placeholder="Enter IP address"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Detection</label>
                  <div className="relative">
                    <select
                      name="bot"
                      value={searchFilters.bot || ''}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none transition-all duration-200"
                    >
                      <option value="">Any</option>
                      <option value="all">All Bots</option>
                      <option value="good">Good Bots</option>
                      <option value="bad">Bad Bots</option>
                      <option value="none">No Bots</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Suspect</label>
                  <div className="relative">
                    <select
                      name="suspect"
                      value={searchFilters.suspect || ''}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none transition-all duration-200"
                    >
                      <option value="">Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Limit</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="limit"
                      value={searchFilters.limit || 10}
                      onChange={handleFilterChange}
                      min="1"
                      max="100"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">#</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order</label>
                  <div className="relative">
                    <select
                      name="reverse"
                      value={searchFilters.reverse || ''}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none transition-all duration-200"
                    >
                      <option value="">Newest First</option>
                      <option value="true">Oldest First</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSearchEvents}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-150 shadow-sm hover:shadow-md"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Events
                </button>
              </div>
            </div>
            
            {serverData && serverData.events && (
              <div>
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Search Results</h4>
                </div>
                
                {serverData.events.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-auto border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr className="bg-gray-850 dark:bg-gray-750">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visitor ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {serverData.events.map((event, idx) => {
                            // Extract common properties from the event structure
                            const timestamp = event.products?.identification?.data?.timestamp || event.timestamp;
                            const visitorId = event.products?.identification?.data?.visitorId || event.visitorId;
                            
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
                            
                            return (
                              <tr 
                                key={idx} 
                                className="hover:bg-gray-850 dark:hover:bg-gray-750 transition-colors duration-150"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                  {formatDate(timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded text-gray-800 dark:text-gray-200">
                                    {visitorId ? visitorId : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded text-gray-800 dark:text-gray-200">
                                    {requestId ? requestId : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                  {ip || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button 
                                    onClick={() => {
                                      if (requestId) {
                                        setManualEventLoading(true);
                                        fetchServerData(null, 'getEvent', { requestId: requestId });
                                        setActiveTab('eventDetails');
                                      }
                                    }}
                                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors duration-150 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                                    disabled={!requestId}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Commenting out for now */}
                    {/* {serverData.paginationKey && (
                      <div className="px-6 py-4 bg-gray-850 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
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
                            
                            fetchServerData(null, 'searchEvents', { filters: paginatedFilters });
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 shadow-sm hover:shadow"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Load More Results
                        </button>
                      </div>
                    )} */}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700">
                    <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No results found matching your search criteria</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'eventDetails':
        return (
          <div>
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveTab('summary')}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mr-4 transition-colors duration-150"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
              <Eye className="w-5 h-5 text-blue-500 mr-2" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Event Details</h4>
            </div>
            
            {/* Check if we have either a direct requestId or one in the nested products structure */}
            {(serverData.requestId || serverData.products?.identification?.data?.requestId) ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <Info className="w-5 h-5 text-blue-500 mr-2" />
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200">Basic Information</h5>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Request ID</span>
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 mt-1 rounded text-gray-800 dark:text-gray-200 overflow-auto ">
                          {serverData.requestId || serverData.products?.identification?.data?.requestId || serverData.products?.botd?.data?.requestId}
                        </span>
                      </div>
                      
                      {/* Try multiple possible locations for timestamp */}
                      {(serverData.timestamp || serverData.products?.identification?.data?.timestamp) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {formatDate(serverData.timestamp || serverData.products?.identification?.data?.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      {/* Try multiple possible locations for URL */}
                      {(serverData.url || serverData.products?.identification?.data?.url) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">URL</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 ">
                            {serverData.url || serverData.products?.identification?.data?.url}
                          </span>
                        </div>
                      )}
                      
                      {/* Try multiple possible locations for visitorId */}
                      {(serverData.visitorId || serverData.products?.identification?.data?.visitorId) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Visitor ID</span>
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 mt-1 rounded text-gray-800 dark:text-gray-200 overflow-auto ">
                            {serverData.visitorId || serverData.products?.identification?.data?.visitorId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <Monitor className="w-5 h-5 text-blue-500 mr-2" />
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200">Browser & Device</h5>
                    </div>
                    <div className="space-y-3">
                      {/* Browser info - try multiple possible locations */}
                      {(serverData.browserDetails?.browserName || serverData.products?.identification?.data?.browserDetails?.browserName) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Browser</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {serverData.browserDetails?.browserName || serverData.products?.identification?.data?.browserDetails?.browserName}{' '}
                            {serverData.browserDetails?.browserFullVersion || serverData.products?.identification?.data?.browserDetails?.browserFullVersion}
                          </span>
                        </div>
                      )}
                      
                      {/* OS info - try multiple possible locations */}
                      {(serverData.browserDetails?.os || serverData.products?.identification?.data?.browserDetails?.os) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Operating System</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {serverData.browserDetails?.os || serverData.products?.identification?.data?.browserDetails?.os}{' '}
                            {serverData.browserDetails?.osVersion || serverData.products?.identification?.data?.browserDetails?.osVersion}
                          </span>
                        </div>
                      )}
                      
                      {/* Device info - try multiple possible locations */}
                      {(serverData.browserDetails?.device || serverData.products?.identification?.data?.browserDetails?.device) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Device</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {serverData.browserDetails?.device || serverData.products?.identification?.data?.browserDetails?.device}
                          </span>
                        </div>
                      )}
                      
                      {/* Incognito - try multiple possible locations */}
                      {(serverData.incognito !== undefined || serverData.products?.identification?.data?.incognito !== undefined) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Incognito Mode</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {(serverData.incognito || serverData.products?.identification?.data?.incognito || 
                             serverData.products?.incognito?.data?.result) ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <Globe className="w-5 h-5 text-blue-500 mr-2" />
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200">IP Information</h5>
                    </div>
                    <div className="space-y-3">
                      {/* IP - try multiple possible locations */}
                      {(serverData.ip || serverData.products?.identification?.data?.ip || serverData.products?.ipInfo?.data?.v4?.address) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">IP Address</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {serverData.ip || serverData.products?.identification?.data?.ip || serverData.products?.ipInfo?.data?.v4?.address}
                          </span>
                        </div>
                      )}
                      
                      {/* Country info */}
                      {(serverData.products?.ipInfo?.data?.v4?.geolocation?.country?.name) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Country</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {serverData.products.ipInfo.data.v4.geolocation.country.name}
                          </span>
                        </div>
                      )}
                      
                      {/* City info */}
                      {(serverData.products?.ipInfo?.data?.v4?.geolocation?.city?.name) && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">City</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {serverData.products.ipInfo.data.v4.geolocation.city.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <Shield className="w-5 h-5 text-blue-500 mr-2" />
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200">Security Signals</h5>
                    </div>
                    <div className="space-y-3">
                      {/* Bot detection */}
                      {serverData.products?.botd?.data?.bot?.result && (
                        <div className="flex items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            serverData.products.botd.data.bot.result === 'notDetected'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {serverData.products.botd.data.bot.result === 'notDetected' ? 'Human' : 'Bot Detected'}
                          </span>
                        </div>
                      )}
                      
                      {/* VPN detection */}
                      {serverData.products?.vpn?.data?.result !== undefined && (
                        <div className="flex items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            serverData.products.vpn.data.result
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {serverData.products.vpn.data.result ? 'VPN Detected' : 'No VPN'}
                          </span>
                        </div>
                      )}
                      
                      {/* Tampering detection */}
                      {serverData.products?.tampering?.data?.result !== undefined && (
                        <div className="flex items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            serverData.products.tampering.data.result
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {serverData.products.tampering.data.result ? 'Tampering Detected' : 'No Tampering'}
                          </span>
                        </div>
                      )}
                      
                      {/* Developer tools detection */}
                      {serverData.products?.developerTools?.data?.result !== undefined && (
                        <div className="flex items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            serverData.products.developerTools.data.result
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {serverData.products.developerTools.data.result ? 'DevTools Open' : 'DevTools Closed'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Info className="w-5 h-5 text-blue-500 mr-2" />
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200">Full Event Data</h5>
                    </div>
                    <button 
                      onClick={() => setExpandedJSON(!expandedJSON)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {expandedJSON ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                  <div className={`overflow-auto ${expandedJSON ? 'max-h-screen' : 'max-h-96'} bg-gray-850 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700`}>
                    <pre className="p-4 text-sm text-gray-800 dark:text-gray-200">
                      {JSON.stringify(serverData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700">
                <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No event details available</p>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-auto max-h-screen border border-gray-100 dark:border-gray-700">
            <pre className="text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(serverData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-850 dark:bg-gray-850 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
      {/* Loading State */}
      {isLoading && (
        <div className="p-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading visitor data...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="p-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-red-500 font-medium text-lg mb-2">Failed to Load Data</p>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{error.message}</p>
          </div>
        </div>
      )}
      
      {/* Visitor Data Display */}
      {visitorData && !isLoading && !error && (
        <div>
          {/* Visitor ID Header */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <UserCheck className="w-5 h-5 text-blue-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Visitor Profile</h2>
                </div>
                <p className="font-mono text-sm text-gray-500 dark:text-gray-400  bg-gray-850 dark:bg-gray-700 p-2 rounded-md">
                  {visitorData.visitorId}
                </p>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getConfidenceBadgeColor(visitorData.confidence.score)}`}>
                  Confidence: {Math.round(visitorData.confidence.score * 100)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="px-6 pt-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <nav className="flex space-x-2" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('summary')}
                className={`px-4 py-3 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <Info className="w-4 h-4 mr-2" />
                Summary
              </button>
              <button
                onClick={() => handleTabChange('visits')}
                className={`px-4 py-3 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                  activeTab === 'visits'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Visits
              </button>
              <button
                onClick={() => handleTabChange('search')}
                className={`px-4 py-3 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
              {visitorData.requestId && (
                <button
                  onClick={() => handleTabChange('eventDetails')}
                  className={`px-4 py-3 flex items-center text-sm font-medium transition-colors duration-150 border-b-2 ${
                    activeTab === 'eventDetails'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Current Event
                </button>
              )}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6 bg-dark ">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
}