'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface RevenueDataItem {
  label: string;
  revenue: number;
  paid?: number;
  pending?: number;
}

interface RevenueChartProps {
  data: RevenueDataItem[];
  title?: string;
  showBreakdown?: boolean;
  height?: number;
  className?: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {formatTooltipValue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  title,
  showBreakdown = false,
  height = 300,
  className,
}: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'bg-white rounded-2xl border border-gray-200 p-4',
          className
        )}
      >
        {title && (
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div
          className="flex items-center justify-center text-gray-500"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.map((item) => ({
    name: item.label,
    revenue: item.revenue,
    paid: item.paid || 0,
    pending: item.pending || 0,
  }));

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-200 p-4',
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {showBreakdown ? (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              iconType="circle"
            />
            <Bar
              dataKey="paid"
              name="Paid"
              stackId="a"
              fill="#10B981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              stackId="a"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === chartData.length - 1 ? '#3B82F6' : '#93C5FD'}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// Simple CSS-based bar chart fallback (no recharts dependency)
interface SimpleBarChartProps {
  data: RevenueDataItem[];
  title?: string;
  maxBars?: number;
  className?: string;
}

export function SimpleRevenueChart({
  data,
  title,
  maxBars = 12,
  className,
}: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'bg-white rounded-2xl border border-gray-200 p-4',
          className
        )}
      >
        {title && (
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const displayData = data.slice(-maxBars);
  const maxValue = Math.max(...displayData.map((d) => d.revenue), 1);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-200 p-4',
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      {/* Chart area */}
      <div className="h-48 flex items-end gap-1">
        {displayData.map((item, index) => {
          const heightPercent = (item.revenue / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              {/* Bar */}
              <div className="w-full relative group">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {formatTooltipValue(item.revenue)}
                  </div>
                </div>
                {/* Bar element */}
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  style={{
                    height: `${Math.max(heightPercent, item.revenue > 0 ? 2 : 0)}%`,
                    minHeight: item.revenue > 0 ? '4px' : '0',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 mt-2 border-t border-gray-100 pt-2">
        {displayData.map((item, index) => (
          <div
            key={index}
            className="flex-1 text-center text-xs text-gray-500 truncate"
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RevenueChart;
