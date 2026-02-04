"use client";

import React, { useState, useEffect } from 'react';
import { ProjectPnLData } from '@/lib/hooks/useReports';
import { CompactPagination } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ProjectPnLReportProps {
  data: ProjectPnLData[];
}

const ITEMS_PER_PAGE = 10;

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ProjectPnLReport({ data }: ProjectPnLReportProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No project data available.</p>;

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
          Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} projects
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Project</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Budget</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Actual</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Labor</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Variance</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(row => (
              <tr key={row.projectId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{row.projectName}</td>
                <td className="py-2 px-3 text-right text-gray-600">{fmt(row.budget)}</td>
                <td className="py-2 px-3 text-right text-gray-900">{fmt(row.actualSpend)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{fmt(row.laborCost)}</td>
                <td className={cn('py-2 px-3 text-right font-semibold', row.variance >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {row.variance >= 0 ? '+' : ''}{fmt(row.variance)}
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
