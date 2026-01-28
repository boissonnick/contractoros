"use client";

import React from 'react';
import { ProjectPnLData } from '@/lib/hooks/useReports';
import { cn } from '@/lib/utils';

interface ProjectPnLReportProps {
  data: ProjectPnLData[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ProjectPnLReport({ data }: ProjectPnLReportProps) {
  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No project data available.</p>;

  return (
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
          {data.map(row => (
            <tr key={row.projectId} className="border-b border-gray-100">
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
  );
}
