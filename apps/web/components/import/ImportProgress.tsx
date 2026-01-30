'use client';

import React from 'react';
import { ImportStatus, IMPORT_STATUS_INFO } from '@/lib/import/types';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface ImportProgressProps {
  status: ImportStatus;
  progress: number; // 0-100
  importedCount: number;
  totalCount: number;
  errors?: number;
}

export function ImportProgress({
  status,
  progress,
  importedCount,
  totalCount,
  errors = 0,
}: ImportProgressProps) {
  const statusInfo = IMPORT_STATUS_INFO[status];

  const isComplete = status === 'completed' || status === 'failed' || status === 'rolled_back';
  const isProcessing = status === 'importing' || status === 'validating';

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {isComplete ? (
          status === 'completed' ? (
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          ) : (
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          )
        ) : (
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
        )}
        <div>
          <p className="text-lg font-medium text-gray-900">
            {statusInfo.label}
          </p>
          <p className="text-sm text-gray-500">
            {isProcessing && `Processing ${importedCount} of ${totalCount} records...`}
            {status === 'completed' && `Successfully imported ${importedCount} records`}
            {status === 'failed' && `Import failed with ${errors} errors`}
            {status === 'rolled_back' && 'Import was rolled back'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{progress.toFixed(0)}% complete</span>
            <span>{importedCount} / {totalCount}</span>
          </div>
        </div>
      )}

      {/* Result summary */}
      {isComplete && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
            <p className="text-sm text-gray-500">Total Rows</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-green-600">{importedCount}</p>
            <p className="text-sm text-gray-500">Imported</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${errors > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-2xl font-semibold ${errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {totalCount - importedCount}
            </p>
            <p className="text-sm text-gray-500">Skipped</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportProgress;
