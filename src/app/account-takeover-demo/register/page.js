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
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get the visitor's fingerprint
  const {
    isLoading: isFingerprintLoading,
    error: fingerprintError,
    data: visitorData,
  } = useVisitorData({ immediate: true });

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
    setMessage({ type: '', text: '' });
    
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
        setMessage({ type: 'success', text: 'Registration successful! Redirecting to login...' });
        // Try both router.push and window.location for redirection
        try {
          router.push('/account-takeover-demo/login');
        } catch (error) {
          console.error('Router redirection failed:', error);
          // Fallback to window.location if router fails
          window.location.href = '/account-takeover-demo/login';
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
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
          
          {/* Message display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              <div className="flex items-start">
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
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
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {/* Fingerprint Display */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center mb-3">
                <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Device Fingerprint
                </h3>
              </div>
              
              {isFingerprintLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Calculating fingerprint...
                  </span>
                </div>
              ) : fingerprintError ? (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  Error loading fingerprint: {fingerprintError.message}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 font-mono text-sm overflow-x-auto">
                  {visitorData?.visitorId || 'Fingerprint not available'}
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This unique identifier will be associated with your account for security purposes.
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading || isFingerprintLoading || !visitorData?.visitorId}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || isFingerprintLoading || !visitorData?.visitorId
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
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