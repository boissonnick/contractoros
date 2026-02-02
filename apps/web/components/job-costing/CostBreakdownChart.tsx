'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui';
import { CostCategory, COST_CATEGORY_LABELS } from '@/types';
import { formatCurrency, getCategoryColor } from '@/lib/hooks/useJobCosting';

interface CostBreakdownChartProps {
  costsByCategory: Record<CostCategory, number>;
  totalCosts: number;
  loading?: boolean;
  chartType?: 'pie' | 'bar' | 'horizontal-bar';
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * CostBreakdownChart - Visualizes cost breakdown by category
 */
export function CostBreakdownChart({
  costsByCategory,
  totalCosts,
  loading = false,
  chartType = 'pie',
  height = 300,
  showLegend = true,
  showLabels = false,
  title = 'Cost Breakdown',
  subtitle,
}: CostBreakdownChartProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    return (Object.entries(costsByCategory) as [CostCategory, number][])
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({
        name: COST_CATEGORY_LABELS[category]?.label || category,
        value: amount,
        category,
        color: getCategoryColor(category),
        percent: totalCosts > 0 ? (amount / totalCosts) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [costsByCategory, totalCosts]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          {subtitle && <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />}
          <div className={`bg-gray-100 rounded`} style={{ height }} />
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-gray-500">No cost data to display</p>
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string; percent: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-500">{data.payload.percent.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <PieChart>
      <Pie
        data={chartData}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={90}
        paddingAngle={2}
        dataKey="value"
        nameKey="name"
        label={showLabels ? ({ name, percent }: { name?: string; percent?: number }) => ((percent ?? 0) > 5 ? `${name} (${(percent ?? 0).toFixed(0)}%)` : '') : undefined}
        labelLine={showLabels}
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      {showLegend && (
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
        />
      )}
    </PieChart>
  );

  const renderBarChart = (horizontal: boolean) => (
    <BarChart
      data={chartData}
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 10, right: 10, left: horizontal ? 100 : 0, bottom: 0 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      {horizontal ? (
        <>
          <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
        </>
      ) : (
        <>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} angle={-45} textAnchor="end" height={80} />
          <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        </>
      )}
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  );

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'pie'
          ? renderPieChart()
          : renderBarChart(chartType === 'horizontal-bar')}
      </ResponsiveContainer>

      {/* Summary below chart */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Total Costs</span>
          <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalCosts)}</span>
        </div>
      </div>
    </Card>
  );
}

interface CostCategoryListProps {
  costsByCategory: Record<CostCategory, number>;
  totalCosts: number;
  loading?: boolean;
  maxItems?: number;
}

/**
 * CostCategoryList - Simple list view of cost categories
 */
export function CostCategoryList({
  costsByCategory,
  totalCosts,
  loading = false,
  maxItems = 10,
}: CostCategoryListProps) {
  const sortedCategories = useMemo(() => {
    return (Object.entries(costsByCategory) as [CostCategory, number][])
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxItems);
  }, [costsByCategory, maxItems]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">No cost data available</p>
    );
  }

  return (
    <div className="space-y-3">
      {sortedCategories.map(([category, amount]) => {
        const categoryInfo = COST_CATEGORY_LABELS[category];
        const percent = totalCosts > 0 ? (amount / totalCosts) * 100 : 0;
        const color = getCategoryColor(category);

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700">{categoryInfo.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
                <span className="text-xs text-gray-500 ml-2">({percent.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CostTrendChartProps {
  data: Array<{
    date: string;
    amount: number;
    cumulative: number;
    budget?: number;
  }>;
  loading?: boolean;
  height?: number;
  showBudgetLine?: boolean;
  title?: string;
}

/**
 * CostTrendChart - Shows cost accumulation over time
 */
export function CostTrendChart({
  data,
  loading = false,
  height = 250,
  showBudgetLine = true,
  title = 'Cost Trend',
}: CostTrendChartProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="bg-gray-100 rounded" style={{ height }} />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-gray-500">No trend data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {payload.map((entry, i) => (
                      <p key={i} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {formatCurrency(Number(entry.value))}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar dataKey="amount" name="Period Costs" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          {showBudgetLine && data[0]?.budget && (
            <Bar dataKey="budget" name="Budget" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default CostBreakdownChart;
