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
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui';
import { ChartConfig, CHART_DEFAULTS } from './types';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';

export interface BudgetData {
  category: string;
  budget: number;
  actual: number;
  variance: number; // positive = under budget, negative = over
}

interface BudgetComparisonChartProps {
  data: BudgetData[];
  title?: string;
  subtitle?: string;
  showVariance?: boolean;
  height?: number;
  config?: ChartConfig;
  className?: string;
  loading?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export function BudgetComparisonChart({
  data,
  title = 'Budget vs Actual',
  subtitle,
  showVariance = true,
  height,
  config = {},
  className = '',
  loading = false,
}: BudgetComparisonChartProps) {
  const mergedConfig = { ...CHART_DEFAULTS, ...config };
  const chartHeight = height || mergedConfig.height || 300;

  // Calculate totals for summary
  const totals = data.reduce(
    (acc, item) => ({
      budget: acc.budget + item.budget,
      actual: acc.actual + item.actual,
      variance: acc.variance + item.variance,
    }),
    { budget: 0, actual: 0, variance: 0 }
  );

  const variancePercent = totals.budget > 0
    ? ((totals.budget - totals.actual) / totals.budget) * 100
    : 0;

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          {subtitle && <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />}
          <div className="h-[300px] bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
          No budget data available
        </div>
      </Card>
    );
  }

  const ChartComponent = (
    <BarChart
      data={data}
      layout="horizontal"
      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
    >
      {mergedConfig.showGrid && (
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      )}
      <XAxis
        dataKey="category"
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={{ stroke: '#E5E7EB' }}
      />
      <YAxis
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => formatCurrency(value)}
      />
      <ReferenceLine y={0} stroke="#E5E7EB" />
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
              formatter={(value) => formatCurrency(value)}
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
      <Bar
        dataKey="budget"
        fill="#3B82F6"
        name="Budget"
        radius={[4, 4, 0, 0]}
        isAnimationActive={mergedConfig.animate}
      />
      <Bar
        dataKey="actual"
        name="Actual"
        radius={[4, 4, 0, 0]}
        isAnimationActive={mergedConfig.animate}
      >
        {data.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={entry.variance < 0 ? '#EF4444' : '#10B981'}
          />
        ))}
      </Bar>
    </BarChart>
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {showVariance && (
            <div className="text-right">
              <div className={`text-sm font-semibold ${variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(variancePercent)}
              </div>
              <div className="text-xs text-gray-500">
                {variancePercent >= 0 ? 'Under Budget' : 'Over Budget'}
              </div>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        {ChartComponent}
      </ResponsiveContainer>

      {showVariance && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Total Budget</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(totals.budget)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Actual</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(totals.actual)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Variance</div>
              <div className={`text-sm font-semibold ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totals.variance)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default BudgetComparisonChart;
