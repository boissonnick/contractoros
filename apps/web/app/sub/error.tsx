"use client";

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function SubcontractorPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Subcontractor portal error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="h-7 w-7 text-amber-600" />
        </div>

        <h2 className="text-xl font-bold font-heading tracking-tight text-gray-900 mb-2">
          Page Error
        </h2>

        <p className="text-gray-500 mb-6">
          There was a problem loading this page. Please try again.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try Again
          </button>
          <a
            href="/sub"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Sub Dashboard
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 text-left">
            <pre className="text-xs bg-gray-100 rounded-lg p-3 overflow-auto max-h-24 text-red-600">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
