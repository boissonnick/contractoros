"use client";

import React from 'react';
import { Subcontractor } from '@/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface SubPerformanceMetricsProps {
  sub: Subcontractor;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function SubPerformanceMetrics({ sub }: SubPerformanceMetricsProps) {
  const m = sub.metrics;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Performance</h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{m.projectsCompleted}</p>
          <p className="text-xs text-gray-500">Projects Completed</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className={cn('text-2xl font-bold', m.onTimeRate >= 80 ? 'text-green-600' : m.onTimeRate >= 60 ? 'text-yellow-600' : 'text-red-600')}>
            {m.onTimeRate}%
          </p>
          <p className="text-xs text-gray-500">On-Time Rate</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-2xl font-bold text-gray-900">{m.avgRating > 0 ? m.avgRating.toFixed(1) : '—'}</span>
          </div>
          <p className="text-xs text-gray-500">Avg Rating</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{fmt(m.totalPaid)}</p>
          <p className="text-xs text-gray-500">Total Paid</p>
        </div>
      </div>
    </div>
  );
}
