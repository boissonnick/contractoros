'use client';

import React, { useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Widget } from '@/lib/dashboard-widgets/types';
import { usePayments } from '@/lib/hooks/usePayments';

interface RevenueWidgetProps {
  widget: Widget;
}

export function RevenueWidget({ widget }: RevenueWidgetProps) {
  const { payments, loading } = usePayments();

  // Calculate revenue stats
  const stats = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        thisMonth: 0,
        lastMonth: 0,
        change: 0,
        changePercent: 0,
        monthlyData: [],
      };
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter completed payments
    const completedPayments = payments.filter(
      (p) => p.status === 'completed'
    );

    // This month's revenue
    const thisMonth = completedPayments
      .filter((p) => {
        const date = p.completedAt || p.createdAt;
        return date && date >= thisMonthStart;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Last month's revenue
    const lastMonth = completedPayments
      .filter((p) => {
        const date = p.completedAt || p.createdAt;
        return date && date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate change
    const change = thisMonth - lastMonth;
    const changePercent = lastMonth > 0 ? (change / lastMonth) * 100 : 0;

    // Generate last 6 months data for chart
    const monthlyData: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleString('default', { month: 'short' });

      const monthTotal = completedPayments
        .filter((p) => {
          const date = p.completedAt || p.createdAt;
          return date && date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      monthlyData.push({ month: monthName, amount: monthTotal });
    }

    return {
      thisMonth,
      lastMonth,
      change,
      changePercent,
      monthlyData,
    };
  }, [payments]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate bar heights for mini chart
  const maxAmount = Math.max(...stats.monthlyData.map((d) => d.amount), 1);
  const getBarHeight = (amount: number) => {
    return Math.max((amount / maxAmount) * 100, 4); // Min 4% height for visibility
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="flex items-end gap-1 h-16">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-1 bg-gray-200 rounded" style={{ height: `${20 + i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const isPositiveChange = stats.change >= 0;

  return (
    <div className="space-y-4">
      {/* Main stat */}
      <div>
        <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">
          {formatCurrency(stats.thisMonth)}
        </p>
        <p className="text-sm text-gray-500">Revenue this month</p>
      </div>

      {/* Comparison */}
      {widget.config.showComparison !== false && (
        <div className="flex items-center gap-2">
          <span
            className={`
              inline-flex items-center gap-0.5 text-sm font-medium
              ${isPositiveChange ? 'text-green-600' : 'text-red-600'}
            `}
          >
            {isPositiveChange ? (
              <ArrowUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownIcon className="h-3.5 w-3.5" />
            )}
            {Math.abs(stats.changePercent).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">
            vs last month ({formatCurrency(stats.lastMonth)})
          </span>
        </div>
      )}

      {/* Mini bar chart */}
      {widget.config.showChart !== false && (
        <div className="pt-2">
          <div className="flex items-end gap-1 h-16">
            {stats.monthlyData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`
                    w-full rounded-t transition-all
                    ${index === stats.monthlyData.length - 1 ? 'bg-blue-500' : 'bg-gray-200'}
                  `}
                  style={{ height: `${getBarHeight(data.amount)}%` }}
                  title={`${data.month}: ${formatCurrency(data.amount)}`}
                />
                <span className="text-[10px] text-gray-400">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenueWidget;
