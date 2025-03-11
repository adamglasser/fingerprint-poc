'use client';

import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react'

export default function VisitorInfo() {


  const { isLoading, error, data, getData } = useVisitorData(
    { extendedResult: true },
    { immediate: true }
  )

  //   <div>

  //   <p>Full visitor data:</p>
  //   <pre>{error ? error.message : JSON.stringify(data, null, 2)}</pre>
  // </div>

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800 transition-all">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Visitor Information</h2>

      <button onClick={() => getData({ ignoreCache: true })}>
        Reload data
      </button>
      <p>VisitorId: {isLoading ? 'Loading...' : data?.visitorId}</p>

      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">
            Error: {error.message}
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Visitor ID</p>
            <p className="font-mono text-lg font-medium text-gray-800 dark:text-gray-200 break-all">
              {data.visitorId}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">First seen</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {new Date(data.firstSeenAt).toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last seen</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {new Date(data.lastSeenAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 