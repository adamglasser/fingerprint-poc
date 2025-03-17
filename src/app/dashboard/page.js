import VisitorInfo from '../components/VisitorInfo'
import WebhookEvents from '../components/WebhookEvents'
import { ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Warning Banner */}
        <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm dark:bg-amber-900/30 dark:border-amber-600">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-800 dark:text-amber-200 font-medium text-lg">Public Data Warning</h3>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                This demo publicly displays all visitor data and webhook events. In a production environment, 
                you should implement proper authentication and authorization to protect sensitive information.
              </p>
            </div>
          </div>
        </div>

        {/* Header with gradient underline */}
        <div className="text-center mb-16 relative">
          <div className="inline-block mb-6">
            <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-full shadow-md">
            <Image 
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/FP_Orange.png`}
              alt="Fingerprint"
              width={50}
              height={50}
              />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Fingerprint Visitor Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Identify and track visitors across multiple sessions with confidence
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center mb-16">
          <div className="w-full rounded-xl p-6 dark:border-gray-700 mb-8">
            <VisitorInfo />
          </div>
          
          {/* Webhook Events Section */}
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Webhook Events
              </h2>
              <Link 
                href="/webhooks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                View All Events
                <ExternalLink className="ml-2 w-4 h-4" />
              </Link>
            </div>
            
            {/* This component will show webhook events for the current visitor */}
            <WebhookEvents visitorId="__CLIENT_SIDE__" />
          </div>
          
          {/* Return to Home Link */}
          <div className="flex space-x-4">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Return to Home
            </Link>
            
            <a 
              href="https://github.com/adamglasser/fingerprint-poc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              View on GitHub
              <ChevronRight className="ml-2 w-5 h-5" />
            </a>
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