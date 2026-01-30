"use client";

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Dashboard Error
        </h2>

        <p className="text-gray-500 mb-6">
          Something went wrong loading this page. Please try again or navigate to a different section.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">Error Details:</p>
            <pre className="text-xs bg-gray-100 rounded-lg p-3 overflow-auto max-h-32 text-red-600 whitespace-pre-wrap">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-gray-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="inline-flex items-center justify-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => window.history.back()} className="inline-flex items-center justify-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Go Back
          </Button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
