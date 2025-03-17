import { 
  ShieldAlert, 
  ChevronRight, 
  LogIn,
  BarChart
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
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
            Fingerprint Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore Fingerprint's capabilities for security and visitor identification
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Demo Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Account Takeover Demo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-transform hover:scale-105">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4 inline-flex mb-6">
              <ShieldAlert className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Account Takeover Demo
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              See how Fingerprint can detect and prevent account takeover attempts by identifying device changes. Register, log in, and test security features.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    1
                  </span>
                </div>
                <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">Register an account and capture your device fingerprint</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    2
                  </span>
                </div>
                <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">Login from the same device for seamless authentication</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    3
                  </span>
                </div>
                <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">Try logging in from a different device/browser to trigger MFA</p>
              </div>
            </div>
            <div className="mt-8">
              <Link 
                href="/account-takeover-demo"
                className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                Try Account Takeover Demo
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Main App Dashboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-transform hover:scale-105">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 inline-flex mb-6">
              <BarChart className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Visitor Tracking Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Explore the full Fingerprint visitor tracking dashboard to see detailed visitor information, webhook events, and more features for identifying users across sessions.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs font-medium">
                    1
                  </span>
                </div>
                <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">View your visitor ID and detailed fingerprint information</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs font-medium">
                    2
                  </span>
                </div>
                <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">See webhook events and server-side visitor data</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs font-medium">
                    3
                  </span>
                </div>
                <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">Access comprehensive visitor tracking and analytics</p>
              </div>
            </div>
            <div className="mt-8">
              <Link 
                href="/dashboard"
                className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                <LogIn className="mr-2 w-5 h-5" />
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by{' '}
            <a 
              href="https://fingerprint.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Fingerprint
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}