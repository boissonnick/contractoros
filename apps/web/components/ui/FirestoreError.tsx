"use client";

import React from 'react';

interface FirestoreErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function FirestoreError({
  message = 'Unable to load data. The server may be unreachable.',
  onRetry,
}: FirestoreErrorProps) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-md mx-auto">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:opacity-90 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
