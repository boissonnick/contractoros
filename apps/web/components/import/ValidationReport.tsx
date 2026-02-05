'use client';

import React, { useState } from 'react';
import { ImportValidationError } from '@/lib/import/types';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface ValidationReportProps {
  errors: ImportValidationError[];
  totalRows: number;
  validRows: number;
}

export function ValidationReport({
  errors,
  totalRows,
  validRows,
}: ValidationReportProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const _invalidRowCount = totalRows - validRows;

  // Group errors by type
  const errorsByType = errors.reduce((acc, error) => {
    const key = error.error;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(error);
    return acc;
  }, {} as Record<string, ImportValidationError[]>);

  const showAll = errors.length <= 10;
  const displayErrors = showAll ? errors : errors.slice(0, 10);

  if (errors.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              All {totalRows} rows are valid
            </p>
            <p className="text-sm text-green-700">
              Ready to import
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`rounded-lg p-4 ${errorCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {errorCount > 0 ? (
            <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${errorCount > 0 ? 'text-red-800' : 'text-amber-800'}`}>
              Validation found issues in your data
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span className="text-green-700">
                {validRows} valid rows
              </span>
              {errorCount > 0 && (
                <span className="text-red-700">
                  {errorCount} errors (will be skipped)
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-amber-700">
                  {warningCount} warnings
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error summary by type */}
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg"
        >
          <span className="text-sm font-medium text-gray-700">
            Error Details ({Object.keys(errorsByType).length} issue types)
          </span>
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Error type summary */}
            <div className="space-y-2">
              {Object.entries(errorsByType).map(([errorType, errorList]) => (
                <div
                  key={errorType}
                  className="flex items-start gap-2 text-sm"
                >
                  {errorList[0].severity === 'error' ? (
                    <ExclamationCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={errorList[0].severity === 'error' ? 'text-red-700' : 'text-amber-700'}>
                      {errorType}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ({errorList.length} occurrence{errorList.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed error list */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 mb-2">
                {showAll ? 'All errors:' : `First ${displayErrors.length} of ${errors.length} errors:`}
              </p>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="py-1 pr-4">Row</th>
                      <th className="py-1 pr-4">Column</th>
                      <th className="py-1 pr-4">Value</th>
                      <th className="py-1">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayErrors.map((error, index) => (
                      <tr key={index}>
                        <td className="py-1 pr-4 text-gray-600">{error.row}</td>
                        <td className="py-1 pr-4 text-gray-600">{error.column || '—'}</td>
                        <td className="py-1 pr-4 text-gray-600 max-w-[150px] truncate">
                          {error.value || <span className="text-gray-300 italic">empty</span>}
                        </td>
                        <td className={`py-1 ${error.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                          {error.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!showAll && (
                <p className="text-xs text-gray-500 mt-2">
                  ... and {errors.length - 10} more errors
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidationReport;
