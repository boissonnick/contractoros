'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui';
import { ChartConfig, CHART_DEFAULTS, DEFAULT_COLORS } from './types';
import { ChartTooltip } from './ChartTooltip';

type PieChartData = Array<{ name: string; value: number; color?: string; [key: string]: any }>;

interface PieChartCardProps {
  title: string | React.ReactNode;
  subtitle?: string;
  data: PieChartData;
  dataKey?: string;
  nameKey?: string;
  config?: ChartConfig;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  donut?: boolean;
  showLabels?: boolean;
}

export function PieChartCard({
  title,
  subtitle,
  data,
  dataKey = 'value',
  nameKey = 'name',
  config = {},
  valueFormatter,
  loading = false,
  donut = false,
  showLabels = false,
}: PieChartCardProps) {
  const mergedConfig = { ...CHART_DEFAULTS, ...config };
  const colors = mergedConfig.colors || DEFAULT_COLORS;

  // Normalize data to ensure name/value structure
  const normalizedData = data.map((item, idx) => ({
    name: String(item[nameKey] || item.name || `Item ${idx + 1}`),
    value: Number(item[dataKey] || item.value || 0),
    color: item.color,
  }));

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          {subtitle && <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />}
          <div className="h-[300px] bg-gray-100 rounded-full mx-auto w-[200px]" />
        </div>
      </Card>
    );
  }

  const total = normalizedData.reduce((sum, item) => sum + item.value, 0);

  // Use a simplified label approach that's compatible with Recharts typing
  const RADIAN = Math.PI / 180;
  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
    index?: number;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, index = 0 } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const name = normalizedData[index]?.name || '';

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#6B7280"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={mergedConfig.height}>
        <PieChart>
          <Pie
            data={normalizedData}
            cx="50%"
            cy="50%"
            innerRadius={donut ? 60 : 0}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            isAnimationActive={mergedConfig.animate}
            label={showLabels ? renderCustomLabel : undefined}
            labelLine={showLabels}
          >
            {normalizedData.map((item, index) => (
              <Cell key={index} fill={item.color || colors[index % colors.length]} />
            ))}
          </Pie>
          {mergedConfig.showTooltip && (
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    name: String(p.name),
                    value: Number(p.value),
                    color: String(p.payload?.fill),
                  }))}
                  formatter={(value, _name) => {
                    const pct = ((value / total) * 100).toFixed(1);
                    const formatted = valueFormatter ? valueFormatter(value) : value.toLocaleString();
                    return `${formatted} (${pct}%)`;
                  }}
                />
              )}
            />
          )}
          {mergedConfig.showLegend && (
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              formatter={(value) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {donut && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {valueFormatter ? valueFormatter(total) : total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default PieChartCard;
