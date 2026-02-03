"use client";

import React from 'react';

export function ProcessingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg font-medium text-gray-900">Processing offboarding...</p>
      <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
    </div>
  );
}
