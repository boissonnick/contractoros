'use client';

import React from 'react';

interface LegendItem {
  value: string;
  color: string;
}

interface ChartLegendProps {
  payload?: LegendItem[];
}

export function ChartLegend({ payload }: ChartLegendProps) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default ChartLegend;
