'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  UserPlus, 
  LogIn, 
  Home,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

export default function AccountTakeoverDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with gradient underline */}
        <div className="text-center mb-16 relative">
          <div className="inline-block mb-6">
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <Image 
                src="https://rrpdr8h3k6yjiur0.public.blob.vercel-storage.com/images/FP_Orange-hsEpV8Zz53PvsDFE9fx8lyPqFyJGcQ.png"
                alt="Fingerprint"
                width={60}
                height={60}
                priority
              />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Account Takeover Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            See how Fingerprint helps detect and prevent account takeover attacks
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Demo Description */}
        <div className="mb-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <div className="prose prose-blue max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300">
              This demo shows how Fingerprint can be used to enhance security by detecting account takeover attempts. 
              Follow these steps to see it in action:
            </p>
            <ol className="list-decimal pl-5 mt-4 space-y-2 text-gray-600 dark:text-gray-300">
              <li><strong>Register an account</strong> - Create a new account and we'll capture your device fingerprint</li>
              <li><strong>Try to login</strong> - Use your credentials to sign in from this same device</li>
              <li><strong>Try from a different device/browser</strong> - Attempt to login from elsewhere and trigger the MFA prompt</li>
            </ol>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              When you try to login from a different device or browser than the one you registered with, 
              the system will detect the fingerprint mismatch and trigger additional verification - 
              helping to prevent unauthorized access to accounts.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Register Button */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center transition-transform hover:scale-105">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mb-4">
              <UserPlus className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create New Account</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              Register a new account and capture your device fingerprint
            </p>
            <Link 
              href="/account-takeover-demo/register"
              className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm mt-auto"
            >
              Register Now
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Login Button */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center transition-transform hover:scale-105">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4 mb-4">
              <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              Login to your account with your credentials
            </p>
            <Link 
              href="/account-takeover-demo/login"
              className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm mt-auto"
            >
              Sign In
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Return to Main App Button */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center px-5 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Home className="mr-2 h-5 w-5" />
            Return to Main App
          </Link>
        </div>
      </div>
    </div>
  );
} 