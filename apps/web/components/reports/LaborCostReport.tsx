"use client";

import React from 'react';
import { LaborCostData } from '@/lib/hooks/useReports';

interface LaborCostReportProps {
  data: LaborCostData[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function LaborCostReport({ data }: LaborCostReportProps) {
  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No labor data for this period.</p>;

  const totalCost = data.reduce((s, d) => s + d.totalCost, 0);
  const totalHours = data.reduce((s, d) => s + d.totalMinutes / 60, 0);

  return (
    <div>
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div><span className="text-gray-500">Total Hours:</span> <span className="font-semibold">{totalHours.toFixed(1)}h</span></div>
        <div><span className="text-gray-500">Total Cost:</span> <span className="font-semibold">{fmt(totalCost)}</span></div>
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
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 px-3 font-medium text-gray-900">{row.userName}</td>
                <td className="py-2 px-3 text-gray-600">{row.projectName}</td>
                <td className="py-2 px-3 text-right text-gray-900">{(row.totalMinutes / 60).toFixed(1)}h</td>
                <td className="py-2 px-3 text-right text-gray-900">{fmt(row.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
