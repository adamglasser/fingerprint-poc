'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  LogIn,
  Fingerprint,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMfaPrompt, setShowMfaPrompt] = useState(false);
  const [sealedResult, setSealedResult] = useState(null);
  const [visitorData, setVisitorData] = useState(null);

  // Get the visitor's fingerprint
  const {
    isLoading: isFingerprintLoading,
    error: fingerprintError,
    data: initialVisitorData,
  } = useVisitorData({ immediate: true });

  // Update visitorData when initialVisitorData changes
  useEffect(() => {
    if (initialVisitorData) {
      setVisitorData(initialVisitorData);
    }
  }, [initialVisitorData]);

  // Decrypt the sealed result
  const sendSealedResult = async (sealedResult) => {
    if (!sealedResult) {
      return;
    }
    
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
      setSealedResult(sealedResult);

      // If the unsealed data contains visitor information, update the visitorData
      if (data.visitorId) {
        const updatedVisitorData = {
          ...visitorData,
          ...data,
          visitorId: data.visitorId,
          confidence: data.confidence || visitorData.confidence,
          requestId: data.requestId || visitorData.requestId,
        };
        setVisitorData(updatedVisitorData);
      }
      
    } catch (err) {
      // Error handling without console logging
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
    setMessage({ type: 'info', text: 'Signing in...' });
    
    try {
      const response = await fetch('/api/account-takeover-demo/login', {
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
        // Check if login was successful
        if (data.success) {
          // Check for fingerprint match status
          if (data.fingerprintMatch === false) {
            // Show MFA prompt for fingerprint mismatch
            setShowMfaPrompt(true);
            setMessage({ 
              type: 'warning', 
              text: 'New device detected. Please verify your identity.'
            });
          } else {
            // Normal login success with matching fingerprint
            // Store user info in session
            sessionStorage.setItem('loggedInUser', username);
            sessionStorage.setItem('fingerprintVerified', 'true');
            
            setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
            // Redirect after a short delay
            setTimeout(() => {
              router.push('/account-takeover-demo/dashboard');
            }, 1500);
          }
        } else {
          // Server returned success: false
          setMessage({ type: 'error', text: data.error || 'Login failed. Please try again.' });
        }
      } else {
        // HTTP error response
        setMessage({ type: 'error', text: data.error || 'Login failed. Please check your credentials.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during login. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    setIsLoading(true);
    setMessage({ type: 'info', text: 'Verifying device...' });
    
    try {
      const response = await fetch('/api/account-takeover-demo/add-fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          newFingerprint: visitorData.visitorId
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Fingerprint added successfully
        
        // Update session
        sessionStorage.setItem('loggedInUser', username);
        sessionStorage.setItem('fingerprintVerified', 'true');
        
        // Hide MFA prompt
        setShowMfaPrompt(false);
        
        // Show success message and redirect
        setMessage({ 
          type: 'success', 
          text: 'Device verified successfully! Redirecting to dashboard...' 
        });
        
        setTimeout(() => {
          router.push('/account-takeover-demo/dashboard');
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to verify device. Please try again.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An error occurred while verifying your device. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Prompt Component
  const MfaPrompt = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Additional Verification Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            We've detected you're signing in from a different device or browser.
          </p>
        </div>
        
        {/* Message display in MFA prompt */}
        {message.text && message.type !== 'warning' && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            <div className="flex items-start">
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : message.type === 'info' ? (
                <Loader2 className="w-4 h-4 mr-2 flex-shrink-0 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}
        
        <div className="p-4 mb-4 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md">
          <p className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            For your security, we need to verify it's really you.
          </p>
        </div>
        
        <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-md">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Current device fingerprint:</div>
          <div className="font-mono text-sm overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
            {visitorData?.visitorId || 'Fingerprint not available'}
          </div>
        </div>
        
        <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md">
          <p className="flex items-start">
            <Fingerprint className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            By verifying your identity, this device's fingerprint will be saved as trusted for your account.
          </p>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setShowMfaPrompt(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleMfaVerify}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>Verify this device</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

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
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sign In
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Log in to your account for the account takeover demo
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
          
          {/* Fingerprint Success State - Only show if no other messages */}
          {visitorData?.visitorId && !isFingerprintLoading && !fingerprintError && !message.text && (
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
                  <ShieldAlert className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : message.type === 'info' ? (
                  <Loader2 className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}
          
          {/* Login Form */}
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
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading || showMfaPrompt}
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || showMfaPrompt}
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
                This uniquely identifies your device and helps verify your identity.
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading || isFingerprintLoading || !visitorData?.visitorId || showMfaPrompt}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  isLoading || isFingerprintLoading || !visitorData?.visitorId || showMfaPrompt
                    ? 'bg-blue-400 cursor-not-allowed opacity-70'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : isFingerprintLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Fingerprint...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
          
          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link 
                href="/account-takeover-demo/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* MFA Verification Overlay */}
      {showMfaPrompt && <MfaPrompt />}
    </div>
  );
} 