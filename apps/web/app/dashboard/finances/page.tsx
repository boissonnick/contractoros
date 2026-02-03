"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Invoice, Estimate, Project } from '@/types';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

export default function FinancesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { expenses, loading: expensesLoading } = useExpenses({});

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFinancials() {
      if (!profile?.orgId) return;
      setError(null);
      try {
        const [invSnap, estSnap, projSnap] = await Promise.all([
          getDocs(query(collection(db, 'invoices'), where('orgId', '==', profile.orgId))),
          getDocs(query(collection(db, 'estimates'), where('orgId', '==', profile.orgId))),
          getDocs(query(collection(db, 'projects'), where('orgId', '==', profile.orgId))),
        ]);
        setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
        setEstimates(estSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Estimate[]);
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
      } catch (err: unknown) {
        console.error('Error loading financials:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('permission-denied')) {
          setError('Permission denied. Please check Firestore security rules.');
        } else if (errorMessage.includes('requires an index')) {
          setError('Database index required. Please deploy Firestore indexes.');
        } else {
          setError('Failed to load financial data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadFinancials();
  }, [profile?.orgId]);

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const outstandingAmount = invoices
      .filter(inv => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

    const totalExpenses = expenses
      .filter(e => e.status !== 'rejected')
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = expenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    const estimatePipeline = estimates
      .filter(e => e.status === 'sent' || e.status === 'viewed')
      .reduce((sum, e) => sum + (e.total || 0), 0);
    const wonDeals = estimates
      .filter(e => e.status === 'accepted')
      .reduce((sum, e) => sum + (e.total || 0), 0);

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    const grossProfit = totalRevenue - totalExpenses;
    // Use totalInvoiced as basis if no payments yet received (more accurate for active projects)
    const revenueBase = totalRevenue > 0 ? totalRevenue : totalInvoiced;
    // Calculate profit margin - handle edge cases:
    // - If we have revenue/invoiced, calculate normally (can be negative)
    // - If no revenue but have expenses, show as -100% (complete loss)
    // - If neither, show 0%
    const profitMargin = revenueBase > 0
      ? (grossProfit / revenueBase) * 100
      : (totalExpenses > 0 ? -100 : 0);

    return {
      totalRevenue, totalInvoiced, outstandingAmount, overdueAmount,
      totalExpenses, pendingExpenses,
      estimatePipeline, wonDeals,
      totalBudget, grossProfit, profitMargin,
    };
  }, [invoices, expenses, estimates, projects]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (loading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Financial Data</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-gray-500 mt-1">Track revenue, expenses, and profitability across all projects</p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Total Invoiced</span>
              <span>{formatCurrency(stats.totalInvoiced)}</span>
            </div>
            <div className="flex justify-between text-orange-600">
              <span>Outstanding</span>
              <span>{formatCurrency(stats.outstandingAmount)}</span>
            </div>
            {stats.overdueAmount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Overdue</span>
                <span>{formatCurrency(stats.overdueAmount)}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expenses</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.totalExpenses)}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Budget Total</span>
              <span>{formatCurrency(stats.totalBudget)}</span>
            </div>
            {stats.pendingExpenses > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Pending Approval</span>
                <span>{formatCurrency(stats.pendingExpenses)}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={cn('p-5', stats.grossProfit >= 0 ? 'ring-1 ring-green-200' : 'ring-1 ring-red-200')}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('p-2 rounded-lg', stats.grossProfit >= 0 ? 'bg-green-100' : 'bg-red-100')}>
              <CurrencyDollarIcon className={cn('h-5 w-5', stats.grossProfit >= 0 ? 'text-green-600' : 'text-red-600')} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Profit</p>
              <p className={cn('text-xl sm:text-2xl md:text-3xl font-bold tabular-nums', stats.grossProfit >= 0 ? 'text-green-700' : 'text-red-700')}>
                {formatCurrency(stats.grossProfit)}
              </p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Profit Margin</span>
              <span className={cn('font-medium', stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600')}>
                {stats.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Estimates Pipeline</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.estimatePipeline)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Won Deals</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-green-700 tabular-nums">{formatCurrency(stats.wonDeals)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Active Projects</p>
            <p className="text-xl font-bold text-blue-700">
              {projects.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-purple-700">{expenses.length}</p>
          </div>
        </div>
      </Card>

      {/* Project profitability */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Project Profitability</h3>
        {projects.filter(p => p.status === 'active' || p.status === 'completed').length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">No active or completed projects</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Project</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Budget</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Spent</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Used</th>
                  <th className="text-right py-2 pl-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects
                  .filter(p => p.status === 'active' || p.status === 'completed')
                  .slice(0, 15)
                  .map((proj) => {
                    const projExpenses = expenses
                      .filter(e => e.projectId === proj.id && e.status !== 'rejected')
                      .reduce((sum, e) => sum + e.amount, 0);
                    const budget = proj.budget || 0;
                    const pctUsed = budget > 0 ? (projExpenses / budget) * 100 : 0;

                    return (
                      <tr
                        key={proj.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/projects/${proj.id}/finances`)}
                      >
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{proj.name}</td>
                        <td className="text-right py-2.5 px-2 text-gray-600">
                          {budget > 0 ? formatCurrency(budget) : '--'}
                        </td>
                        <td className="text-right py-2.5 px-2 font-medium text-gray-900">
                          {formatCurrency(projExpenses)}
                        </td>
                        <td className="text-right py-2.5 px-2">
                          {budget > 0 ? (
                            <span className={cn(
                              'font-medium',
                              pctUsed > 100 ? 'text-red-600' :
                              pctUsed > 90 ? 'text-orange-600' : 'text-green-600'
                            )}>
                              {pctUsed.toFixed(0)}%
                            </span>
                          ) : '--'}
                        </td>
                        <td className="text-right py-2.5 pl-2">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            proj.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {proj.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
