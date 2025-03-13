import WebhookEvents from '../components/WebhookEvents';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Webhook Events - Fingerprint Visitor Demo',
  description: 'View all webhook events received from Fingerprint',
};

export default function WebhooksPage() {
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
                This page publicly displays all webhook events from all visitors. In a production environment, 
                you should implement proper authentication and authorization to protect sensitive information.
              </p>
            </div>
          </div>
        </div>

        {/* Header with gradient underline */}
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Webhook Events
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            View all webhook events received from Fingerprint
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <WebhookEvents />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 