"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Expense, ExpenseStatus, ExpenseCategory } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ReceiptPercentIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: <ClockIcon className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
  reimbursed: { label: 'Reimbursed', color: 'bg-purple-100 text-purple-700', icon: <BanknotesIcon className="h-4 w-4" /> },
};

const categoryLabels: Record<ExpenseCategory, string> = {
  materials: 'Materials',
  tools: 'Tools',
  equipment_rental: 'Equipment Rental',
  permits: 'Permits',
  travel: 'Travel',
  meals: 'Meals',
  other: 'Other',
};

export default function ExpensesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { expenses, loading, submitExpense, approveExpense, rejectExpense, markReimbursed, deleteExpense } = useExpenses({ orgWide: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [expenses, searchQuery, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const pending = expenses.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.amount, 0);
    const approved = expenses.filter(e => e.status === 'approved' || e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0);
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    return { total, pending, approved, thisMonth };
  }, [expenses]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const handleAction = async (expense: Expense, action: 'submit' | 'approve' | 'reject' | 'reimburse' | 'delete') => {
    try {
      switch (action) {
        case 'submit':
          await submitExpense(expense.id);
          toast.success('Expense submitted for approval');
          break;
        case 'approve':
          await approveExpense(expense.id);
          toast.success('Expense approved');
          break;
        case 'reject':
          await rejectExpense(expense.id);
          toast.success('Expense rejected');
          break;
        case 'reimburse':
          await markReimbursed(expense.id);
          toast.success('Expense marked as reimbursed');
          break;
        case 'delete':
          if (!confirm('Delete this expense?')) return;
          await deleteExpense(expense.id);
          toast.success('Expense deleted');
          break;
      }
    } catch {
      toast.error(`Failed to ${action} expense`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Track project expenses, receipts, and reimbursements</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/dashboard/expenses/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
              <p className="text-xs text-gray-500">Total Expenses</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p>
              <p className="text-xs text-gray-500">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.approved)}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ReceiptPercentIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisMonth)}</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reimbursed">Reimbursed</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptPercentIcon className="h-full w-full" />}
          title={expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
          description={expenses.length === 0
            ? 'Start tracking project expenses and receipts.'
            : 'Try adjusting your search or filter criteria.'
          }
          action={expenses.length === 0 ? {
            label: 'New Expense',
            onClick: () => router.push('/dashboard/expenses/new'),
          } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <Card
              key={expense.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusConfig[expense.status].color}>
                      {statusConfig[expense.status].icon}
                      <span className="ml-1">{statusConfig[expense.status].label}</span>
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-600">
                      {categoryLabels[expense.category]}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-gray-900">{expense.description}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {expense.vendor && <span>{expense.vendor}</span>}
                    <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                    {expense.receiptURL && (
                      <span className="text-blue-600">Receipt attached</span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </p>
                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    {expense.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleAction(expense, 'submit')}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => handleAction(expense, 'delete')}
                          className="text-xs px-2 py-1 text-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {expense.status === 'submitted' && (profile?.role === 'OWNER' || profile?.role === 'PM') && (
                      <>
                        <button
                          onClick={() => handleAction(expense, 'approve')}
                          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(expense, 'reject')}
                          className="text-xs px-2 py-1 text-red-600 rounded hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {expense.status === 'approved' && (
                      <button
                        onClick={() => handleAction(expense, 'reimburse')}
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                      >
                        Mark Reimbursed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
