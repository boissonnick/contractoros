'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { differenceInDays } from 'date-fns';
import {
  BanknotesIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { Card, StatusBadge } from '@/components/ui';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { cn } from '@/lib/utils';
import type { StatusType } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CashFlowRunwayDashboardProps {
  className?: string;
}

interface InvoiceRecord {
  id: string;
  status: string;
  total: number;
  amountDue: number;
  amountPaid: number;
  dueDate: Date | null;
  createdAt: Date | null;
  clientName: string;
}

type AgingBucket = 'current' | '31-60' | '61-90' | '90+';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OUTSTANDING_STATUSES = new Set(['sent', 'viewed', 'partial', 'overdue']);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'object' && 'toDate' in (val as Record<string, unknown>)) {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

function getAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 30) return 'current';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CashFlowRunwayDashboard({ className }: CashFlowRunwayDashboardProps) {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ------ Data Fetching ------
  useEffect(() => {
    async function loadInvoices() {
      if (!profile?.orgId) return;

      try {
        const snap = await getDocs(
          query(
            collection(db, 'invoices'),
            where('orgId', '==', profile.orgId),
            limit(500),
          ),
        );

        const records: InvoiceRecord[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            status: d.status ?? 'draft',
            total: d.total ?? 0,
            amountDue: d.amountDue ?? 0,
            amountPaid: d.amountPaid ?? 0,
            dueDate: toDate(d.dueDate),
            createdAt: toDate(d.createdAt),
            clientName: d.clientName ?? 'Unknown Client',
          };
        });

        setInvoices(records);
      } catch (err) {
        console.error('CashFlowRunwayDashboard: failed to load invoices', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [profile?.orgId]);

  // ------ Computed Data ------
  const outstandingInvoices = useMemo(
    () => invoices.filter((inv) => OUTSTANDING_STATUSES.has(inv.status)),
    [invoices],
  );

  const agingSummary = useMemo(() => {
    const now = new Date();
    const buckets: Record<AgingBucket, number> = {
      current: 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    for (const inv of outstandingInvoices) {
      const daysOverdue = inv.dueDate ? Math.max(0, differenceInDays(now, inv.dueDate)) : 0;
      const bucket = getAgingBucket(daysOverdue);
      buckets[bucket] += inv.amountDue;
    }

    return buckets;
  }, [outstandingInvoices]);

  const totalAR = useMemo(
    () => outstandingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0),
    [outstandingInvoices],
  );

  const agingChartData = useMemo(
    () => [
      { name: '0-30 days', amount: agingSummary.current },
      { name: '31-60 days', amount: agingSummary['31-60'] },
      { name: '61-90 days', amount: agingSummary['61-90'] },
      { name: '90+ days', amount: agingSummary['90+'] },
    ],
    [agingSummary],
  );

  const topInvoices = useMemo(() => {
    return [...outstandingInvoices]
      .sort((a, b) => b.amountDue - a.amountDue)
      .slice(0, 5)
      .map((inv) => ({
        ...inv,
        daysOverdue: inv.dueDate ? Math.max(0, differenceInDays(new Date(), inv.dueDate)) : 0,
      }));
  }, [outstandingInvoices]);

  const insights = useMemo(() => {
    const now = new Date();

    // Weighted average days outstanding
    let totalWeightedDays = 0;
    let totalWeight = 0;
    for (const inv of outstandingInvoices) {
      if (inv.dueDate) {
        const days = Math.max(0, differenceInDays(now, inv.dueDate));
        totalWeightedDays += days * inv.amountDue;
        totalWeight += inv.amountDue;
      }
    }
    const weightedAvgDays = totalWeight > 0 ? Math.round(totalWeightedDays / totalWeight) : 0;

    // Collection rate: total paid / total invoiced across all invoices (not just outstanding)
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return { weightedAvgDays, collectionRate, totalInvoiced, totalPaid };
  }, [outstandingInvoices, invoices]);

  // ------ Loading State ------
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-24 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
        <Card className="p-4 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-[300px] bg-gray-100 rounded" />
        </Card>
      </div>
    );
  }

  // ------ Render ------
  return (
    <div className={cn('space-y-6', className)}>
      {/* ---- AR Aging Summary KPIs ---- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          label="Total AR"
          value={formatCurrency(totalAR)}
          icon={<BanknotesIcon className="h-5 w-5 text-blue-500" />}
          accent="blue"
        />
        <KPICard
          label="Current (0-30d)"
          value={formatCurrency(agingSummary.current)}
          icon={<ClockIcon className="h-5 w-5 text-emerald-500" />}
          accent="emerald"
        />
        <KPICard
          label="31-60 Days"
          value={formatCurrency(agingSummary['31-60'])}
          icon={<ClockIcon className="h-5 w-5 text-amber-500" />}
          accent="amber"
        />
        <KPICard
          label="61-90 Days"
          value={formatCurrency(agingSummary['61-90'])}
          icon={<ExclamationCircleIcon className="h-5 w-5 text-orange-500" />}
          accent="orange"
        />
        <KPICard
          label="90+ Days"
          value={formatCurrency(agingSummary['90+'])}
          icon={<ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
          accent="red"
        />
      </div>

      {/* ---- Two-column layout: Chart + Top Invoices ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AR Aging Bar Chart */}
        <BarChartCard
          title="AR Aging Distribution"
          subtitle="Outstanding receivables by aging bucket"
          data={agingChartData}
          dataKeys={['amount']}
          xAxisKey="name"
          colorByValue
          config={{
            colors: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
            height: 280,
          }}
          valueFormatter={(v) => formatCurrency(v)}
          loading={false}
        />

        {/* Top Outstanding Invoices */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Outstanding Invoices</h3>
          <p className="text-xs text-gray-500 mb-4">Largest receivables by amount due</p>

          {topInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <BanknotesIcon className="h-8 w-8 mb-2" />
              <p className="text-sm">No outstanding invoices</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {inv.clientName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inv.daysOverdue > 0
                        ? `${inv.daysOverdue} day${inv.daysOverdue !== 1 ? 's' : ''} overdue`
                        : 'Due today or future'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge
                      status={inv.status as StatusType}
                      size="sm"
                    />
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(inv.amountDue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ---- Cash Flow Insight Card ---- */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Cash Flow Insights</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weighted Average Days Outstanding */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Weighted Avg Days Outstanding
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {insights.weightedAvgDays}
              <span className="text-sm font-normal text-gray-500 ml-1">days</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Across {outstandingInvoices.length} outstanding invoice{outstandingInvoices.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Collection Rate */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Collection Rate</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {insights.collectionRate.toFixed(1)}
              <span className="text-sm font-normal text-gray-500 ml-0.5">%</span>
            </p>
            <CollectionRateBar rate={insights.collectionRate} />
          </div>

          {/* Total Invoiced */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Invoiced</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(insights.totalInvoiced)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Total Collected */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(insights.totalPaid)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(totalAR)} still outstanding
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const accentStyles: Record<string, { bg: string; iconBg: string }> = {
  blue: { bg: 'border-blue-100', iconBg: 'bg-blue-50' },
  emerald: { bg: 'border-emerald-100', iconBg: 'bg-emerald-50' },
  amber: { bg: 'border-amber-100', iconBg: 'bg-amber-50' },
  orange: { bg: 'border-orange-100', iconBg: 'bg-orange-50' },
  red: { bg: 'border-red-100', iconBg: 'bg-red-50' },
};

function KPICard({
  label,
  value,
  icon,
  accent = 'blue',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  const style = accentStyles[accent] ?? accentStyles.blue;

  return (
    <Card className={cn('p-4 border', style.bg)}>
      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg p-2 flex-shrink-0', style.iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900 truncate mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function CollectionRateBar({ rate }: { rate: number }) {
  const clampedRate = Math.min(100, Math.max(0, rate));
  const barColor =
    clampedRate >= 80
      ? 'bg-emerald-500'
      : clampedRate >= 60
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="mt-2">
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clampedRate}%` }}
        />
      </div>
    </div>
  );
}
