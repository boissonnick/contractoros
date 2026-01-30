'use client';

import React from 'react';
import { ParsedRow } from '@/lib/import/types';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface DataPreviewProps {
  headers: string[];
  rows: ParsedRow[];
  maxRowsToShow?: number;
  totalRows: number;
}

export function DataPreview({
  headers,
  rows,
  maxRowsToShow = 10,
  totalRows,
}: DataPreviewProps) {
  const displayRows = rows.slice(0, maxRowsToShow);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Showing {displayRows.length} of {totalRows} rows
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            {rows.filter(r => r.isValid).length} valid
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {rows.filter(r => !r.isValid).length} with errors
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                Status
              </th>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={row.isValid ? '' : 'bg-red-50'}
              >
                <td className="px-3 py-2 text-xs text-gray-500">
                  {row.rowNumber}
                </td>
                <td className="px-3 py-2">
                  {row.isValid ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="relative group">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                      {/* Tooltip with errors */}
                      <div className="absolute left-0 top-6 z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg p-2 w-64 shadow-lg">
                        <ul className="space-y-1">
                          {row.errors.map((error, i) => (
                            <li key={i}>
                              {error.column ? `${error.column}: ` : ''}{error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </td>
                {headers.map((header, colIndex) => {
                  const value = row.data[header] ?? '';
                  const hasError = row.errors.some(e => e.column === header);

                  return (
                    <td
                      key={colIndex}
                      className={`px-3 py-2 text-sm ${hasError ? 'text-red-600 font-medium' : 'text-gray-900'}`}
                    >
                      <span className="truncate block max-w-[200px]" title={value}>
                        {value || <span className="text-gray-300">—</span>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Additional rows indicator */}
      {totalRows > maxRowsToShow && (
        <p className="text-sm text-gray-500 text-center">
          ... and {totalRows - maxRowsToShow} more rows
        </p>
      )}
    </div>
  );
}

export default DataPreview;
