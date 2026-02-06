"use client";

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

export default function FieldPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Field portal error', { error: error, page: 'field-error' });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-14 h-14 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-400" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Something Went Wrong
        </h2>

        <p className="text-gray-400 mb-6">
          We couldn&apos;t load this page. Check your connection and try again.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Try Again
          </button>
          <a
            href="/field"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            Field Dashboard
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 text-left">
            <pre className="text-xs bg-gray-900 rounded-lg p-3 overflow-auto max-h-24 text-red-400">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
