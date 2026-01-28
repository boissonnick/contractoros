"use client";

import React from 'react';
import { ProductivityData } from '@/lib/hooks/useReports';
import { cn } from '@/lib/utils';

interface TeamProductivityReportProps {
  data: ProductivityData[];
}

export default function TeamProductivityReport({ data }: TeamProductivityReportProps) {
  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No productivity data available.</p>;

  return (
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
          {data.map(row => (
            <tr key={row.userId} className="border-b border-gray-100">
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
  );
}
