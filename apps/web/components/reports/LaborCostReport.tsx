"use client";

import React, { useState, useMemo } from 'react';
import { LaborCostData } from '@/lib/hooks/useReports';
import { CompactPagination } from '@/components/ui';

interface LaborCostReportProps {
  data: LaborCostData[];
}

const ITEMS_PER_PAGE = 10;

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function LaborCostReport({ data }: LaborCostReportProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No labor data for this period.</p>;

  const totalCost = data.reduce((s, d) => s + d.totalCost, 0);
  const totalHours = data.reduce((s, d) => s + d.totalMinutes / 60, 0);

  // Pagination calculations
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);
  const showPagination = data.length > ITEMS_PER_PAGE;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 text-sm">
        <div className="flex items-center gap-6">
          <div><span className="text-gray-500">Total Hours:</span> <span className="font-semibold">{totalHours.toFixed(1)}h</span></div>
          <div><span className="text-gray-500">Total Cost:</span> <span className="font-semibold">{fmt(totalCost)}</span></div>
        </div>
        {showPagination && (
          <div className="text-xs text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} entries
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Employee</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Project</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Hours</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Cost</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{row.userName}</td>
                <td className="py-2 px-3 text-gray-600">{row.projectName}</td>
                <td className="py-2 px-3 text-right text-gray-900">{(row.totalMinutes / 60).toFixed(1)}h</td>
                <td className="py-2 px-3 text-right text-gray-900">{fmt(row.totalCost)}</td>
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
