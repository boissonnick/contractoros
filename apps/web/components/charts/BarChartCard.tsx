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
import { Card } from '@/components/ui';
import { ChartConfig, CHART_DEFAULTS, DEFAULT_COLORS } from './types';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartData = Record<string, any>[];

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartData;
  dataKeys: string[];
  xAxisKey?: string;
  config?: ChartConfig;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  colorByValue?: boolean;
}

export function BarChartCard({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey = 'name',
  config = {},
  valueFormatter,
  loading = false,
  horizontal = false,
  stacked = false,
  colorByValue = false,
}: BarChartCardProps) {
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

  const ChartComponent = (
    <BarChart
      data={data}
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 10, right: 10, left: horizontal ? 80 : 0, bottom: 0 }}
    >
      {mergedConfig.showGrid && (
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      )}
      {horizontal ? (
        <>
          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={valueFormatter} />
          <YAxis
            type="category"
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
        </>
      ) : (
        <>
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
        </>
      )}
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
      {mergedConfig.showLegend && dataKeys.length > 1 && (
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
        <Bar
          key={key}
          dataKey={key}
          fill={colors[index % colors.length]}
          stackId={stacked ? 'stack' : undefined}
          radius={[4, 4, 0, 0]}
          isAnimationActive={mergedConfig.animate}
        >
          {colorByValue &&
            data.map((entry, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
        </Bar>
      ))}
    </BarChart>
  );

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={mergedConfig.height}>
        {ChartComponent}
      </ResponsiveContainer>
    </Card>
  );
}

export default BarChartCard;
