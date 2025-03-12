import {
  FpjsProvider,
} from '@fingerprintjs/fingerprintjs-pro-react'
import VisitorInfo from './components/VisitorInfo'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <FpjsProvider
      loadOptions={{
        apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY,
        endpoint: process.env.NEXT_PUBLIC_ENDPOINT,
        scriptUrlPattern: process.env.NEXT_PUBLIC_SCRIPT_URL_PATTERN,
      }}
    >
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header with gradient underline */}
          <div className="text-center mb-16 relative">
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <Image 
                src='/FP_Orange.png'
                alt="Fingerprint"
                width={50}
                height={50}
                />
              </div>
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Fingerprint Visitor Demo
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Identify and track visitors across multiple sessions with confidence
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
          </div>


          {/* Main Content */}
          <div className="flex flex-col items-center justify-center mb-16">
            <div className="w-full  rounded-xl p-6 dark:border-gray-700 mb-8">
            <VisitorInfo />
            </div>
              

            
            {/* Call to action */}
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
    </FpjsProvider>
  );
}