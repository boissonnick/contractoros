'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui';
import { ChartConfig, CHART_DEFAULTS, DEFAULT_COLORS } from './types';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';

interface LineChartCardProps {
  title: string | React.ReactNode;
  subtitle?: string;
  data: Record<string, unknown>[];
  dataKeys: string[];
  xAxisKey?: string;
  config?: ChartConfig;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  showDots?: boolean;
  curved?: boolean;
}

export function LineChartCard({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey = 'name',
  config = {},
  valueFormatter,
  loading = false,
  showDots = true,
  curved = true,
}: LineChartCardProps) {
  const mergedConfig = { ...CHART_DEFAULTS, ...config };
  const colors = mergedConfig.colors || DEFAULT_COLORS;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          {subtitle && <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />}
          <div className="h-[300px] bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={mergedConfig.height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {mergedConfig.showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={valueFormatter}
          />
          {mergedConfig.showTooltip && (
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    name: String(p.name),
                    value: Number(p.value),
                    color: String(p.color),
                  }))}
                  label={String(label)}
                  formatter={valueFormatter ? (v) => valueFormatter(v) : undefined}
                />
              )}
            />
          )}
          {mergedConfig.showLegend && (
            <Legend
              content={({ payload }) => (
                <ChartLegend
                  payload={payload?.map((p) => ({
                    value: String(p.value),
                    color: String(p.color),
                  }))}
                />
              )}
            />
          )}
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type={curved ? 'monotone' : 'linear'}
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={showDots ? { r: 4, fill: colors[index % colors.length] } : false}
              activeDot={{ r: 6 }}
              isAnimationActive={mergedConfig.animate}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default LineChartCard;
