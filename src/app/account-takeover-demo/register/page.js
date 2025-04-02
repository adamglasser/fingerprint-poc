'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  UserPlus,
  Fingerprint,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';

export default function Register() {
  // console.log('Register component rendering');
  
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sealedResult, setSealedResult] = useState(null);
  const [visitorData, setVisitorData] = useState(null);

  // Get the visitor's fingerprint
  // console.log('About to initialize useVisitorData hook');
  const {
    isLoading: isFingerprintLoading,
    error: fingerprintError,
    data: initialVisitorData,
  } = useVisitorData({ immediate: true });
  // console.log('useVisitorData hook initialized');

  // Update visitorData when initialVisitorData changes
  useEffect(() => {
    setVisitorData(initialVisitorData);
  }, [initialVisitorData]);

  // Decrypt the sealed result
  const sendSealedResult = async (sealedResult) => {
    if (!sealedResult) return;
    
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
      
      // Set the server data and mark that we've processed the sealed result
      setSealedResult(sealedResult); // Mark this sealed result as processed

      // If the unsealed data contains visitor information, update the visitorData
      if (data.visitorId) {
        // Create a new visitorData object with the unsealed information
        const updatedVisitorData = {
          ...visitorData, // Keep existing visitorData
          ...data, // Spread the unsealed data 
          visitorId: data.visitorId, // Ensure these specific fields are set correctly
          confidence: data.confidence || visitorData.confidence,
          requestId: data.requestId || visitorData.requestId,
        };
        setVisitorData(updatedVisitorData);
      }
      
    } catch (err) {
      // console.error('Error unsealing result:', err);
    }
  };

  useEffect(() => {
    if (visitorData) {
      // If we have a sealed result and haven't processed it yet
      if (visitorData.sealedResult && visitorData.sealedResult !== sealedResult) {
        sendSealedResult(visitorData.sealedResult);
      }
    }
  }, [visitorData, sealedResult]);

  useEffect(() => {
    // console.log('Register component mounted');
    // console.log('Fingerprint Pro Debug:');
    // console.log('- Loading state:', isFingerprintLoading);
    // console.log('- Error:', fingerprintError);
    // console.log('- Visitor data:', visitorData);
  }, [isFingerprintLoading, fingerprintError, visitorData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setMessage({ type: 'error', text: 'Username and password are required' });
      return;
    }
    
    if (!visitorData?.visitorId) {
      setMessage({ type: 'error', text: 'Fingerprint data is not available. Please try again.' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ type: 'info', text: 'Creating your account...' });
    
    try {
      const response = await fetch('/api/account-takeover-demo/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password,
          fingerprint: visitorData.visitorId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Registration successful! Signing you in...' });
        
        // Store username in sessionStorage
        sessionStorage.setItem('loggedInUser', username);
        
        // Automatically log in the user after successful registration
        try {
          setMessage({ type: 'success', text: 'Account created! Signing you in...' });
          
          const loginResponse = await fetch('/api/account-takeover-demo/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: username,
              password: password,
              fingerprint: visitorData.visitorId
            })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            setMessage({ type: 'success', text: 'Success! Redirecting to dashboard...' });
            // Redirect to dashboard after successful login
            setTimeout(() => {
              router.push('/account-takeover-demo/dashboard');
            }, 1000);
          } else {
            // If automatic login fails, redirect to login page
            // console.error('Automatic login failed:', loginData.error);
            setMessage({ type: 'warning', text: 'Account created, but automatic login failed. Redirecting to login page...' });
            setTimeout(() => {
              router.push('/account-takeover-demo/login');
            }, 1500);
          }
        } catch (error) {
          // console.error('Automatic login error:', error);
          // Fallback to login page if automatic login fails
          setMessage({ type: 'warning', text: 'Account created, but we encountered an error. Redirecting to login page...' });
          setTimeout(() => {
            window.location.href = '/account-takeover-demo/login';
          }, 1500);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      // console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'An error occurred during registration. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
        
        {/* Registration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Register a new account for the account takeover demo
            </p>
          </div>
          
          {/* Fingerprint Loading State */}
          {isFingerprintLoading && (
            <div className="mb-6 p-4 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Loading device fingerprint...</span>
              </div>
            </div>
          )}
          
          {/* Fingerprint Error State */}
          {fingerprintError && (
            <div className="mb-6 p-4 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Error loading fingerprint: Please refresh the page and try again.</span>
              </div>
            </div>
          )}
          
          {/* Fingerprint Success State */}
          {visitorData?.visitorId && !isFingerprintLoading && !fingerprintError && (
            <div className="mb-6 p-4 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <div className="flex items-start">
                <Fingerprint className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Device fingerprint loaded successfully!</span>
              </div>
            </div>
          )}
          
          {/* Message display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : message.type === 'warning'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              <div className="flex items-start">
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : message.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : message.type === 'info' ? (
                  <Loader2 className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}
          
          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {/* Fingerprint Information Display */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Device Fingerprint
                </span>
                {isFingerprintLoading ? (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Loading...
                  </span>
                ) : visitorData?.visitorId ? (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Available
                  </span>
                )}
              </div>
              <div className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 truncate">
                {visitorData?.visitorId || 'Waiting for fingerprint...'}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This uniquely identifies your device and helps prevent account takeover.
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading || isFingerprintLoading || !visitorData?.visitorId}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  isLoading || isFingerprintLoading || !visitorData?.visitorId
                    ? 'bg-green-400 cursor-not-allowed opacity-70'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : isFingerprintLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Fingerprint...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/account-takeover-demo/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 