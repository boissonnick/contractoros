"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  SparklesIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  revenue: { current: number; previous: number; change: number };
  expenses: { current: number; previous: number; change: number };
  profit: { current: number; previous: number; change: number };
  projects: { active: number; pipeline: number; backlog: number };
  invoices: { outstanding: number; overdue: number };
  tasks: { overdue: number; dueThisWeek: number };
}

export default function IntelligencePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (!profile?.orgId) return;

      try {
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // Load invoices
        const invSnap = await getDocs(
          query(collection(db, 'invoices'), where('orgId', '==', profile.orgId))
        );
        const invoices = invSnap.docs.map((d) => d.data());

        // Load expenses
        const expSnap = await getDocs(
          query(collection(db, 'expenses'), where('orgId', '==', profile.orgId))
        );
        const expenses = expSnap.docs.map((d) => d.data());

        // Load projects
        const projSnap = await getDocs(
          query(collection(db, 'projects'), where('orgId', '==', profile.orgId))
        );
        const projects = projSnap.docs.map((d) => d.data());

        // Load estimates
        const estSnap = await getDocs(
          query(collection(db, 'estimates'), where('orgId', '==', profile.orgId))
        );
        const estimates = estSnap.docs.map((d) => d.data());

        // Calculate revenue (paid invoices)
        const thisMonthRevenue = invoices
          .filter((inv) => {
            const date = inv.createdAt ? (inv.createdAt as Timestamp).toDate() : new Date();
            return date >= thisMonthStart && date <= thisMonthEnd;
          })
          .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        const lastMonthRevenue = invoices
          .filter((inv) => {
            const date = inv.createdAt ? (inv.createdAt as Timestamp).toDate() : new Date();
            return date >= lastMonthStart && date <= lastMonthEnd;
          })
          .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

        // Calculate expenses
        const thisMonthExpenses = expenses
          .filter((exp) => {
            const date = exp.date ? (exp.date as Timestamp).toDate() : new Date();
            return date >= thisMonthStart && date <= thisMonthEnd && exp.status !== 'rejected';
          })
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);

        const lastMonthExpenses = expenses
          .filter((exp) => {
            const date = exp.date ? (exp.date as Timestamp).toDate() : new Date();
            return date >= lastMonthStart && date <= lastMonthEnd && exp.status !== 'rejected';
          })
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Outstanding and overdue invoices
        const outstanding = invoices
          .filter((inv) => ['sent', 'viewed', 'partial'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
        const overdue = invoices
          .filter((inv) => inv.status === 'overdue')
          .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

        // Projects
        const activeProjects = projects.filter((p) => p.status === 'active').length;
        const pipeline = estimates
          .filter((e) => ['sent', 'viewed'].includes(e.status))
          .reduce((sum, e) => sum + (e.total || 0), 0);

        setStats({
          revenue: {
            current: thisMonthRevenue,
            previous: lastMonthRevenue,
            change: lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
          },
          expenses: {
            current: thisMonthExpenses,
            previous: lastMonthExpenses,
            change: lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0,
          },
          profit: {
            current: thisMonthRevenue - thisMonthExpenses,
            previous: lastMonthRevenue - lastMonthExpenses,
            change: (lastMonthRevenue - lastMonthExpenses) !== 0
              ? (((thisMonthRevenue - thisMonthExpenses) - (lastMonthRevenue - lastMonthExpenses)) / Math.abs(lastMonthRevenue - lastMonthExpenses)) * 100
              : 0,
          },
          projects: {
            active: activeProjects,
            pipeline: pipeline,
            backlog: projects.filter((p) => p.status === 'planning').length,
          },
          invoices: { outstanding, overdue },
          tasks: { overdue: 0, dueThisWeek: 0 },
        });
      } catch (err) {
        console.error('Error loading intelligence stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [profile?.orgId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-500 mt-1">Executive overview and AI-powered insights</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">
          <SparklesIcon className="h-3 w-3 mr-1" />
          AI Beta
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Revenue (This Month)</p>
            {stats && stats.revenue.change !== 0 && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                stats.revenue.change > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {stats.revenue.change > 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                {Math.abs(stats.revenue.change).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.revenue.current || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">vs. {formatCurrency(stats?.revenue.previous || 0)} last month</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Expenses (This Month)</p>
            {stats && stats.expenses.change !== 0 && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                stats.expenses.change < 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {stats.expenses.change < 0 ? <ArrowTrendingDownIcon className="h-3 w-3" /> : <ArrowTrendingUpIcon className="h-3 w-3" />}
                {Math.abs(stats.expenses.change).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.expenses.current || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">vs. {formatCurrency(stats?.expenses.previous || 0)} last month</p>
        </Card>

        <Card className={cn('p-5', stats && stats.profit.current >= 0 ? 'ring-1 ring-green-200' : 'ring-1 ring-red-200')}>
          <p className="text-sm text-gray-500 mb-2">Net Profit</p>
          <p className={cn(
            'text-3xl font-bold',
            stats && stats.profit.current >= 0 ? 'text-green-700' : 'text-red-700'
          )}>
            {formatCurrency(stats?.profit.current || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Margin: {stats && stats.revenue.current > 0 ? ((stats.profit.current / stats.revenue.current) * 100).toFixed(1) : 0}%
          </p>
        </Card>
      </div>

      {/* Pipeline & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            Project Pipeline
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Projects</span>
              <span className="text-lg font-bold text-gray-900">{stats?.projects.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimates Pipeline</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(stats?.projects.pipeline || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Planning / Backlog</span>
              <span className="text-lg font-bold text-gray-900">{stats?.projects.backlog || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
            Attention Needed
          </h3>
          <div className="space-y-3">
            {stats && stats.invoices.overdue > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-700">Overdue Invoices</span>
                <span className="text-lg font-bold text-red-700">{formatCurrency(stats.invoices.overdue)}</span>
              </div>
            )}
            {stats && stats.invoices.outstanding > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-700">Outstanding Balance</span>
                <span className="text-lg font-bold text-orange-700">{formatCurrency(stats.invoices.outstanding)}</span>
              </div>
            )}
            {(!stats || (stats.invoices.overdue === 0 && stats.invoices.outstanding === 0)) && (
              <p className="text-sm text-gray-400 text-center py-4">All clear!</p>
            )}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-yellow-500" />
          AI Insights
          <Badge className="bg-purple-100 text-purple-700 text-xs">Coming Soon</Badge>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <SparklesIcon className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Smart Scheduling</p>
            <p className="text-xs text-gray-500 mt-1">AI-optimized crew assignments based on skills and availability</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Cost Prediction</p>
            <p className="text-xs text-gray-500 mt-1">Predict project costs from historical data and material trends</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <CalendarIcon className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Weather Impact</p>
            <p className="text-xs text-gray-500 mt-1">Automatic schedule adjustments for weather delays</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
