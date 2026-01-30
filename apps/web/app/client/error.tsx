"use client";

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function ClientPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client portal error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="h-7 w-7 text-orange-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Unable to Load Page
        </h2>

        <p className="text-gray-500 mb-6">
          We're having trouble loading this page. Please try again in a moment.
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
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Return Home
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          If this problem continues, please contact your contractor.
        </p>
      </div>
    </div>
  );
}
