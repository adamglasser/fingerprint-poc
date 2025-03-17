'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  CheckCircle,
  Shield,
  LogOut,
  Fingerprint,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';

export default function Dashboard() {
  const [username, setUsername] = useState('');
  const [userFingerprints, setUserFingerprints] = useState([]);
  const [isLoadingFingerprints, setIsLoadingFingerprints] = useState(false);
  const [fingerprintError, setFingerprintError] = useState(null);
  
  // Get the visitor's fingerprint for display
  const {
    isLoading: isFingerprintLoading,
    error: visitorFingerprintError,
    data: visitorData,
  } = useVisitorData({ immediate: true });

  // Get the current logged in username from sessionStorage
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('loggedInUser');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Fetch all fingerprints associated with the user
  useEffect(() => {
    if (username) {
      fetchUserFingerprints();
    }
  }, [username]);

  const fetchUserFingerprints = async () => {
    if (!username) return;
    
    setIsLoadingFingerprints(true);
    setFingerprintError(null);
    
    try {
      const response = await fetch('/api/account-takeover-demo/get-user-fingerprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserFingerprints(data.fingerprints || []);
      } else {
        setFingerprintError(data.error || 'Failed to fetch fingerprints');
        console.error('Error fetching user fingerprints:', data.error);
      }
    } catch (error) {
      setFingerprintError('An error occurred while retrieving fingerprints');
      console.error('Error fetching user fingerprints:', error);
    } finally {
      setIsLoadingFingerprints(false);
    }
  };

  // Check if current fingerprint is trusted
  const isCurrentFingerprintTrusted = () => {
    if (!visitorData?.visitorId || userFingerprints.length === 0) return false;
    return userFingerprints.includes(visitorData.visitorId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <Link 
            href="/account-takeover-demo"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Demo Home
          </Link>
        </div>
        
        {/* Success Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              You Are Logged In
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Authentication successful! You have securely accessed your account.
            </p>
            {username && (
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                Welcome, {username}!
              </p>
            )}
          </div>
          
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Account Security Information
            </h2>
            
            <div className="space-y-4">
              {/* Current Device Fingerprint */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Device Fingerprint
                </h3>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm overflow-x-auto">
                  {isFingerprintLoading ? 
                    'Loading...' : 
                    (visitorFingerprintError ? 
                      'Error loading fingerprint' : 
                      (visitorData?.visitorId || 'Not available')
                    )
                  }
                </div>
                {!isFingerprintLoading && visitorData?.visitorId && (
                  <div className={`mt-2 flex items-center text-sm ${
                    isCurrentFingerprintTrusted() 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isCurrentFingerprintTrusted() ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        This is a trusted device for your account
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        This device is not yet trusted for your account
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Trusted Fingerprints */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Fingerprint className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                  Trusted Device Fingerprints
                </h3>
                {isLoadingFingerprints ? (
                  <div className="flex items-center p-3">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">Loading trusted fingerprints...</span>
                  </div>
                ) : fingerprintError ? (
                  <div className="p-3 text-red-600 dark:text-red-400">
                    {fingerprintError}
                  </div>
                ) : userFingerprints.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {userFingerprints.map((fingerprint, index) => (
                      <div 
                        key={index} 
                        className={`font-mono text-sm p-3 overflow-x-auto ${
                          index !== userFingerprints.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                        } ${
                          visitorData?.visitorId === fingerprint ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                      >
                        {fingerprint}
                        {visitorData?.visitorId === fingerprint && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Current Device
                          </span>
                        )}
                        {index === 0 && fingerprint !== visitorData?.visitorId && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Registration Device
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    No trusted fingerprints found
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  These are the device fingerprints that are authorized to access your account without additional verification.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Login
                </h3>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
              <p className="text-blue-800 dark:text-blue-300">
                In a real application, this is where your account dashboard would be displayed.
                For this demo, we're showing this simple success page instead.
              </p>
            </div>
            
            <Link 
              href="/account-takeover-demo/login"
              className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => sessionStorage.removeItem('loggedInUser')}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 