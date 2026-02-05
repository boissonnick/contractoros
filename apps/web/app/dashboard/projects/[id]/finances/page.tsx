"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Button, Card, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { Invoice, Project, ExpenseCategory } from '@/types';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import {
  calculateProjectFinancials,
  formatBudgetCurrency,
  getBudgetBarColor,
} from '@/lib/budget-utils';
import { useProjectProfitability } from '@/lib/hooks/useJobCosting';
import { MarginMeter } from '@/components/finances/MarginMeter';

const categoryLabels: Record<ExpenseCategory, string> = {
  materials: 'Materials',
  tools: 'Tools',
  equipment_rental: 'Equipment Rental',
  fuel: 'Fuel',
  vehicle: 'Vehicle',
  subcontractor: 'Subcontractor',
  permits: 'Permits',
  labor: 'Labor',
  office: 'Office',
  travel: 'Travel',
  meals: 'Meals',
  insurance: 'Insurance',
  utilities: 'Utilities',
  marketing: 'Marketing',
  other: 'Other',
};

export default function ProjectFinancesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { profile } = useAuth();

  const { expenses, loading: expensesLoading } = useExpenses({ projectId });
  const { profitability, loading: profitLoading } = useProjectProfitability(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Load project and invoices
  useEffect(() => {
    async function loadData() {
      if (!profile?.orgId) return;
      try {
        // Get project
        const projDoc = await getDoc(doc(db, 'projects', projectId));
        if (projDoc.exists()) {
          setProject({ id: projDoc.id, ...projDoc.data() } as Project);
        }

        // Get invoices
        const invQuery = query(
          collection(db, 'invoices'),
          where('projectId', '==', projectId),
        );
        const invSnap = await getDocs(invQuery);
        setInvoices(invSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as Invoice[]);
      } catch (err) {
        console.error('Error loading finances:', err);
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId, profile?.orgId]);

  // Financial summary - using centralized utility for consistent calculations
  const financials = useMemo(() => {
    if (!project) return null;
    return calculateProjectFinancials(project, expenses, invoices);
  }, [project, expenses, invoices]);

  // Legacy summary format for backward compatibility with existing UI
  const summary = useMemo(() => {
    if (!financials) {
      return {
        budget: 0,
        contractValue: 0,
        totalExpenses: 0,
        approvedExpenses: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        budgetUsed: 0,
        budgetRemaining: 0,
        budgetStatus: 'healthy' as const,
        grossProfit: 0,
        profitMargin: 0,
        byCategory: {} as Record<string, number>,
      };
    }

    return {
      budget: financials.budget.totalBudget,
      contractValue: financials.revenue.contractValue,
      totalExpenses: financials.budget.totalSpent,
      approvedExpenses: financials.budget.approvedSpent,
      totalInvoiced: financials.revenue.totalInvoiced,
      totalPaid: financials.revenue.totalPaid,
      totalOutstanding: financials.revenue.totalOutstanding,
      budgetUsed: financials.budget.percentUsed,
      budgetRemaining: financials.budget.remaining,
      budgetStatus: financials.budget.budgetStatus,
      grossProfit: financials.profit.grossProfit,
      profitMargin: financials.profit.profitMargin,
      byCategory: financials.budget.byCategory,
    };
  }, [financials]);

  const formatCurrency = (amount: number) => formatBudgetCurrency(amount);

  if (loading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.budget)}</p>
              <p className="text-xs text-gray-500">Budget</p>
            </div>
          </div>
        </Card>

        {/* Expenses */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpenses)}</p>
              <p className="text-xs text-gray-500">Total Expenses</p>
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
              <p className="text-xs text-gray-500">Revenue Collected</p>
            </div>
          </div>
        </Card>

        {/* Profit */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              summary.grossProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            )}>
              <CurrencyDollarIcon className={cn(
                'h-5 w-5',
                summary.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
              )} />
            </div>
            <div>
              <p className={cn(
                'text-2xl font-bold',
                summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'
              )}>
                {formatCurrency(summary.grossProfit)}
              </p>
              <p className="text-xs text-gray-500">
                Profit ({summary.profitMargin.toFixed(1)}% margin)
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Margin Meter — from Cloud Function profitability data */}
      <MarginMeter profitability={profitability} loading={profitLoading} />

      {/* Budget Progress */}
      {summary.budget > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Budget Usage</h3>
            <span className={cn(
              'text-sm font-medium',
              summary.budgetUsed > 90 ? 'text-red-600' :
              summary.budgetUsed > 75 ? 'text-orange-600' : 'text-green-600'
            )}>
              {summary.budgetUsed.toFixed(1)}% used
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                getBudgetBarColor(summary.budgetStatus)
              )}
              style={{ width: `${Math.min(summary.budgetUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Spent: {formatCurrency(summary.totalExpenses)}</span>
            <span>Remaining: {formatCurrency(summary.budgetRemaining)}</span>
          </div>
          {summary.budgetUsed > 90 && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {summary.budgetUsed > 100
                  ? 'Budget exceeded! Consider reviewing expenses or adjusting budget.'
                  : 'Approaching budget limit. Review upcoming expenses.'}
              </p>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown by Category */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
          {Object.keys(summary.byCategory).length === 0 ? (
            <p className="text-sm text-gray-400 italic">No expenses recorded yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(summary.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => {
                  const pct = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">
                          {categoryLabels[cat as ExpenseCategory] || cat}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(amount)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* Payment Summary */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Contract Value</span>
              <span className="font-medium text-gray-900">{formatCurrency(summary.contractValue)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Invoiced</span>
              <span className="font-medium text-gray-900">{formatCurrency(summary.totalInvoiced)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Payments Received</span>
              <span className="font-medium text-green-700">{formatCurrency(summary.totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Outstanding</span>
              <span className={cn(
                'font-medium',
                summary.totalOutstanding > 0 ? 'text-orange-600' : 'text-gray-900'
              )}>
                {formatCurrency(summary.totalOutstanding)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Gross Profit</span>
              <span className={cn(
                'text-lg font-bold',
                summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'
              )}>
                {formatCurrency(summary.grossProfit)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/expenses/new')}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Expense
          </Button>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No expenses recorded for this project
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 10).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {categoryLabels[expense.category]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </p>
                  <Badge className={cn(
                    'text-xs mt-0.5',
                    expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                    expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    expense.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    expense.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                    expense.status === 'under_review' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    {expense.status === 'under_review' ? 'Under Review' : expense.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
