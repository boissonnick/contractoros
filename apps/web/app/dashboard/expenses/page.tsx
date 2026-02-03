'use client';

import { useState, useMemo } from 'react';
import {
  BanknotesIcon,
  PlusIcon,
  FunnelIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { ExpenseCard, ExpenseFormModal } from '@/components/expenses';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { useAuth } from '@/lib/auth';
import { Expense, ExpenseCategory, ExpenseStatus, EXPENSE_CATEGORIES, EXPENSE_STATUSES, Project } from '@/types';
import { formatCurrency } from '@/lib/date-utils';

// Quick filter tabs for reimbursement workflow
type QuickFilter = 'all' | 'pending' | 'under_review' | 'approved' | 'paid' | 'rejected';

const QUICK_FILTERS: { value: QuickFilter; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { value: 'all', label: 'All', icon: BanknotesIcon, color: 'gray' },
  { value: 'pending', label: 'Pending', icon: ClockIcon, color: 'yellow' },
  { value: 'under_review', label: 'Under Review', icon: EyeIcon, color: 'purple' },
  { value: 'approved', label: 'Approved', icon: CheckIcon, color: 'green' },
  { value: 'paid', label: 'Paid', icon: CurrencyDollarIcon, color: 'blue' },
  { value: 'rejected', label: 'Rejected', icon: XMarkIcon, color: 'red' },
];

export default function ExpensesPage() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | ''>('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Calculate date range for current month
  const dateRange = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [currentMonth]);

  // Determine status filter based on quick filter
  const statusFilter = quickFilter === 'all' ? undefined : quickFilter as ExpenseStatus;

  // Fetch expenses
  const {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    startReview,
    approveExpense,
    rejectExpense,
    requestMoreInfo,
    markPaid,
    cancelExpense,
    getSummary,
  } = useExpenses({
    projectId: filterProjectId || undefined,
    category: filterCategory || undefined,
    status: statusFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Get summary for current period (without status filter for counts)
  const summary = useMemo(() => {
    return getSummary(dateRange.startDate, dateRange.endDate, filterProjectId || undefined);
  }, [getSummary, dateRange.startDate, dateRange.endDate, filterProjectId]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newDate);
  };

  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Handle create
  const handleCreate = async (expenseData: Omit<Expense, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => {
    await createExpense(expenseData);
    setShowAddModal(false);
  };

  // Handle edit
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  // Handle update
  const handleUpdate = async (expenseData: Omit<Expense, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseData);
      setEditingExpense(null);
      setShowAddModal(false);
    }
  };

  // Handle delete
  const handleDelete = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expenseId);
    }
  };

  // Handle start review
  const handleStartReview = async (expenseId: string) => {
    await startReview(expenseId);
  };

  // Handle approve
  const handleApprove = async (expenseId: string) => {
    await approveExpense(expenseId);
  };

  // Handle reject
  const handleReject = async (expenseId: string, reason: string) => {
    await rejectExpense(expenseId, reason);
  };

  // Handle request more info
  const handleRequestMoreInfo = async (expenseId: string, note: string) => {
    await requestMoreInfo(expenseId, note);
  };

  // Handle mark paid
  const handleMarkPaid = async (expenseId: string, method?: string) => {
    await markPaid(expenseId, method);
  };

  // Handle cancel
  const handleCancel = async (expenseId: string) => {
    if (confirm('Are you sure you want to cancel this expense?')) {
      await cancelExpense(expenseId);
    }
  };

  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Get filter count for a status
  const getFilterCount = (status: QuickFilter): number => {
    switch (status) {
      case 'all':
        return summary.count;
      case 'pending':
        return summary.countPending;
      case 'under_review':
        return summary.countUnderReview;
      case 'approved':
        return summary.countApproved;
      case 'paid':
        return summary.countPaid;
      case 'rejected':
        return summary.countRejected;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses & Reimbursements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track expenses, submit reimbursement requests, and manage approvals
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {summary.count} expense{summary.count !== 1 ? 's' : ''}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {formatCurrency(summary.totalPending + summary.totalUnderReview)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {summary.countPending + summary.countUnderReview} item{(summary.countPending + summary.countUnderReview) !== 1 ? 's' : ''}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Ready for Payment</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(summary.totalApproved)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {summary.countApproved} approved
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(summary.totalPaid)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {summary.countPaid} reimbursed
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Reimbursable Total</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {formatCurrency(summary.totalReimbursable)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            marked for reimbursement
          </div>
        </Card>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const count = getFilterCount(filter.value);
          const isActive = quickFilter === filter.value;
          const Icon = filter.icon;

          return (
            <button
              key={filter.value}
              onClick={() => setQuickFilter(filter.value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{filter.label}</span>
              {count > 0 && (
                <Badge
                  variant={isActive ? 'primary' : 'default'}
                  size="sm"
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Additional Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />

          {/* Project Filter */}
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {(projects as Project[])
              .filter((p: Project) => p.status === 'active')
              .map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | '')}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Month Navigation */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium min-w-[140px] text-center">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              This Month
            </Button>
          </div>
        </div>
      </Card>

      {/* Expense List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : expenses.length === 0 && quickFilter === 'all' && !filterProjectId && !filterCategory ? (
        <EmptyState
          icon={<BanknotesIcon className="h-12 w-12" />}
          title="No expenses yet"
          description="Start tracking your project expenses and receipts."
          action={{
            label: 'Add First Expense',
            onClick: () => setShowAddModal(true),
          }}
        />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<BanknotesIcon className="h-12 w-12" />}
          title="No expenses found"
          description={`No ${quickFilter !== 'all' ? quickFilter.replace('_', ' ') + ' ' : ''}expenses match your current filters.`}
        />
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              showProject={!filterProjectId}
              showUser={isManager}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStartReview={handleStartReview}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestMoreInfo={handleRequestMoreInfo}
              onMarkPaid={handleMarkPaid}
              onCancel={handleCancel}
              canEdit={expense.userId === profile?.uid || isManager}
              canDelete={expense.userId === profile?.uid || isManager}
              canApprove={isManager}
              canMarkPaid={isManager}
              isOwner={expense.userId === profile?.uid}
            />
          ))}
        </div>
      )}

      {/* Category Breakdown (if expenses exist) */}
      {expenses.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Expenses by Category</h3>
          <div className="space-y-2">
            {EXPENSE_CATEGORIES
              .filter(cat => summary.byCategory[cat.value] > 0)
              .sort((a, b) => (summary.byCategory[b.value] || 0) - (summary.byCategory[a.value] || 0))
              .map(cat => {
                const amount = summary.byCategory[cat.value] || 0;
                const percentage = summary.totalExpenses > 0
                  ? (amount / summary.totalExpenses) * 100
                  : 0;
                return (
                  <div key={cat.value} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{cat.label}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <div className="w-24 text-sm text-gray-900 text-right">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <ExpenseFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingExpense(null);
        }}
        onSubmit={editingExpense ? handleUpdate : handleCreate}
        expense={editingExpense || undefined}
        defaultProjectId={filterProjectId}
        mode={editingExpense ? 'edit' : 'create'}
      />
    </div>
  );
}
