'use client';

import React, { useMemo } from 'react';
import {
  TableCellsIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  CustomReportConfig,
  ReportField,
  formatFieldValue,
} from '@/lib/reports/report-builder';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { PieChartCard } from '@/components/charts/PieChartCard';
import { cn } from '@/lib/utils';

interface ReportPreviewProps {
  config: CustomReportConfig;
  data: Record<string, unknown>[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export function ReportPreview({
  config,
  data,
  loading = false,
  error = null,
  onRefresh,
}: ReportPreviewProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // For charts, we need to extract the label field (first string field or groupBy)
    const labelField = config.groupBy || config.fields.find((f) => f.type === 'string')?.id;
    const valueFields = config.fields.filter((f) =>
      ['number', 'currency'].includes(f.type)
    );

    return data.map((row) => {
      const chartRow: Record<string, unknown> = {
        name: labelField ? String(row[labelField] || 'Unknown') : 'Item',
      };

      for (const field of valueFields) {
        chartRow[field.label] = Number(row[field.id] || 0);
      }

      return chartRow;
    });
  }, [data, config]);

  const valueFieldLabels = useMemo(() => {
    return config.fields
      .filter((f) => ['number', 'currency'].includes(f.type))
      .map((f) => f.label);
  }, [config.fields]);

  // Format currency for charts
  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
        <p className="mt-2 text-sm text-gray-500">Loading report data...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-lg border border-red-200">
        <ExclamationCircleIcon className="h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Render empty state
  if (config.fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <TableCellsIcon className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          Select fields to see a preview of your report
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <TableCellsIcon className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          No data found. Try adjusting your filters.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-sm text-brand-primary hover:underline"
          >
            Refresh Data
          </button>
        )}
      </div>
    );
  }

  // Render visualization based on type
  switch (config.visualization) {
    case 'bar':
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <BarChartCard
            title={config.name}
            subtitle={`${data.length} records`}
            data={chartData}
            dataKeys={valueFieldLabels}
            xAxisKey="name"
            valueFormatter={currencyFormatter}
            config={{ height: 300 }}
          />
        </div>
      );

    case 'line':
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <LineChartCard
            title={config.name}
            subtitle={`${data.length} records`}
            data={chartData}
            dataKeys={valueFieldLabels}
            xAxisKey="name"
            valueFormatter={currencyFormatter}
            config={{ height: 300 }}
          />
        </div>
      );

    case 'pie':
      const pieData = chartData.map((row) => ({
        name: String(row.name),
        value: Number(row[valueFieldLabels[0]] || 0),
      }));
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <PieChartCard
            title={config.name}
            subtitle={`${data.length} records`}
            data={pieData}
            valueFormatter={currencyFormatter}
            config={{ height: 300 }}
            donut
          />
        </div>
      );

    case 'table':
    default:
      return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">{config.name}</h3>
            <p className="text-xs text-gray-500">{data.length} records</p>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {config.fields.map((field) => (
                    <th
                      key={field.id}
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {field.label}
                      {field.aggregation && field.aggregation !== 'none' && (
                        <span className="ml-1 text-gray-400">
                          ({field.aggregation})
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(0, 100).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {config.fields.map((field) => (
                      <td
                        key={field.id}
                        className={cn(
                          'px-4 py-2 text-sm whitespace-nowrap',
                          ['number', 'currency'].includes(field.type)
                            ? 'text-right font-mono'
                            : 'text-left'
                        )}
                      >
                        {formatFieldValue(row[field.id], field.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 100 && (
              <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
                Showing 100 of {data.length} records
              </div>
            )}
          </div>
        </div>
      );
  }
}

export default ReportPreview;
