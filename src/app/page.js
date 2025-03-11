import Image from "next/image";
import {
  FpjsProvider,
  FingerprintJSPro,
} from '@fingerprintjs/fingerprintjs-pro-react'
import VisitorInfo from './components/VisitorInfo'

export default function Home() {
  return (
    <FpjsProvider
      loadOptions={{
        apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY,
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fingerprint Visitor Demo
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Identifying and tracking visitors across sessions
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center">
            <VisitorInfo />
            
            {/* Additional Info */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by{' '}
                <a 
                  href="https://fingerprint.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Fingerprint
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </FpjsProvider>
  );
}
