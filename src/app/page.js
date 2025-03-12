import {
  FpjsProvider,
} from '@fingerprintjs/fingerprintjs-pro-react'
import VisitorInfo from './components/VisitorInfo'

export default function Home() {

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY,
      }}
    >
      <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--foreground)] dark:text-[var(--foreground)] mb-4">
              Fingerprint Visitor Demo
            </h1>
            <p className="text-lg text-[var(--gray-6)] dark:text-[var(--gray-4)]">
              Identifying and tracking visitors across sessions
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center">
            <VisitorInfo />
            
            {/* Additional Info */}
            <div className="mt-12 text-center">
              <p className="text-sm text-[var(--gray-5)] dark:text-[var(--gray-5)]">
                Powered by{' '}
                <a 
                  href="https://fingerprint.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:text-[var(--primary-hover)] dark:text-[var(--primary)] dark:hover:text-[var(--primary-hover)]"
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
