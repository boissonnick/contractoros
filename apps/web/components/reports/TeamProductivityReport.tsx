"use client";

import React, { useState, useEffect } from 'react';
import { ProductivityData } from '@/lib/hooks/useReports';
import { CompactPagination } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TeamProductivityReportProps {
  data: ProductivityData[];
}

const ITEMS_PER_PAGE = 10;

export default function TeamProductivityReport({ data }: TeamProductivityReportProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when data changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is necessary for this pattern
    setCurrentPage(1);
  }, [data.length]);

  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No productivity data available.</p>;

  // Pagination calculations
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);
  const showPagination = data.length > ITEMS_PER_PAGE;

  return (
    <div>
      {showPagination && (
        <div className="mb-3 text-xs text-gray-500 text-right">
          Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} team members
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Team Member</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Tasks</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Completed</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Hours</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Rate</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(row => (
              <tr key={row.userId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{row.userName}</td>
                <td className="py-2 px-3 text-right text-gray-600">{row.tasksTotal}</td>
                <td className="py-2 px-3 text-right text-gray-900">{row.tasksCompleted}</td>
                <td className="py-2 px-3 text-right text-gray-600">{row.totalHours.toFixed(1)}h</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', row.completionRate >= 75 ? 'bg-green-500' : row.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${Math.min(100, row.completionRate)}%` }} />
                    </div>
                    <span className="text-xs text-gray-600">{row.completionRate.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <CompactPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={currentPage < totalPages}
            hasPreviousPage={currentPage > 1}
            onNextPage={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            onPreviousPage={() => setCurrentPage(p => Math.max(p - 1, 1))}
          />
        </div>
      )}
    </div>
  );
}
