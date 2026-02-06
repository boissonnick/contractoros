'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { ExpenseCard } from './ExpenseCard';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { useAuth } from '@/lib/auth';
import {
  ExpenseCategory,
  ExpenseStatus,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  Project,
} from '@/types';
import { formatCurrency } from '@/lib/date-utils';
import { logger } from '@/lib/utils/logger';

export interface ExpenseDetailsFilter {
  category?: ExpenseCategory;
  projectId?: string;
  userId?: string;
  status?: ExpenseStatus;
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
}

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter?: ExpenseDetailsFilter;
  title?: string;
}

const ITEMS_PER_PAGE = 10;

export function ExpenseDetailsModal({
  isOpen,
  onClose,
  filter: initialFilter,
  title = 'Expense Details',
}: ExpenseDetailsModalProps) {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();

  // Local filter state (can be modified within modal)
  const [localFilter, setLocalFilter] = useState<ExpenseDetailsFilter>(initialFilter || {});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [rejectModalExpenseId, setRejectModalExpenseId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Determine if user is a manager
  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Build hook options from filter
  const hookOptions = useMemo(() => {
    const options: {
      projectId?: string;
      userId?: string;
      category?: ExpenseCategory;
      status?: ExpenseStatus;
      startDate?: string;
      endDate?: string;
    } = {};

    if (localFilter.projectId) options.projectId = localFilter.projectId;
    if (localFilter.userId) options.userId = localFilter.userId;
    if (localFilter.category) options.category = localFilter.category;
    if (localFilter.status) options.status = localFilter.status;
    if (localFilter.dateRange?.start) {
      options.startDate = localFilter.dateRange.start.toISOString().split('T')[0];
    }
    if (localFilter.dateRange?.end) {
      options.endDate = localFilter.dateRange.end.toISOString().split('T')[0];
    }

    return options;
  }, [localFilter]);

  const {
    expenses,
    loading,
    error,
    approveExpense,
    rejectExpense,
    startReview,
    markPaid,
  } = useExpenses(hookOptions);

  // Reset local filter when modal opens with new filter
  React.useEffect(() => {
    if (isOpen && initialFilter) {
      setLocalFilter(initialFilter);
      setCurrentPage(1);
      setSelectedExpenses(new Set());
      setSearchQuery('');
    }
  }, [isOpen, initialFilter]);

  // Apply search filter locally
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;

    const query = searchQuery.toLowerCase();
    return expenses.filter(exp =>
      exp.description.toLowerCase().includes(query) ||
      exp.vendorName?.toLowerCase().includes(query) ||
      exp.userName.toLowerCase().includes(query) ||
      exp.projectName?.toLowerCase().includes(query) ||
      exp.category.toLowerCase().includes(query)
    );
  }, [expenses, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingCount = filteredExpenses.filter(e => e.status === 'pending').length;
    const pendingAmount = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
    const approvedCount = filteredExpenses.filter(e => e.status === 'approved').length;
    const approvedAmount = filteredExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

    return { total, pendingCount, pendingAmount, approvedCount, approvedAmount, count: filteredExpenses.length };
  }, [filteredExpenses]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Date',
      'Description',
      'Category',
      'Amount',
      'Status',
      'Project',
      'User',
      'Vendor',
      'Reimbursable',
      'Billable',
    ];

    const rows = filteredExpenses.map(exp => [
      exp.date,
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.category,
      exp.amount.toFixed(2),
      exp.status,
      exp.projectName || '',
      exp.userName,
      exp.vendorName || '',
      exp.reimbursable ? 'Yes' : 'No',
      exp.billable ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredExpenses]);

  // Bulk actions
  const handleBulkApprove = useCallback(async () => {
    if (!isManager || selectedExpenses.size === 0) return;

    const expensesToApprove = filteredExpenses.filter(
      e => selectedExpenses.has(e.id) && (e.status === 'pending' || e.status === 'under_review')
    );

    for (const expense of expensesToApprove) {
      try {
        await approveExpense(expense.id);
      } catch (err) {
        logger.error('Failed to approve expense ${expense.id}', { error: err, component: 'ExpenseDetailsModal' });
      }
    }
    setSelectedExpenses(new Set());
  }, [isManager, selectedExpenses, filteredExpenses, approveExpense]);

  const handleBulkReject = useCallback(async (reason: string) => {
    if (!isManager || selectedExpenses.size === 0) return;

    const expensesToReject = filteredExpenses.filter(
      e => selectedExpenses.has(e.id) && (e.status === 'pending' || e.status === 'under_review')
    );

    for (const expense of expensesToReject) {
      try {
        await rejectExpense(expense.id, reason);
      } catch (err) {
        logger.error('Failed to reject expense ${expense.id}', { error: err, component: 'ExpenseDetailsModal' });
      }
    }
    setSelectedExpenses(new Set());
    setRejectModalExpenseId(null);
    setRejectReason('');
  }, [isManager, selectedExpenses, filteredExpenses, rejectExpense]);

  // Toggle selection
  const toggleSelection = useCallback((expenseId: string) => {
    setSelectedExpenses(prev => {
      const next = new Set(prev);
      if (next.has(expenseId)) {
        next.delete(expenseId);
      } else {
        next.add(expenseId);
      }
      return next;
    });
  }, []);

  // Select all on current page
  const selectAllOnPage = useCallback(() => {
    const pageIds = paginatedExpenses.map(e => e.id);
    const allSelected = pageIds.every(id => selectedExpenses.has(id));

    if (allSelected) {
      // Deselect all on page
      setSelectedExpenses(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all on page
      setSelectedExpenses(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [paginatedExpenses, selectedExpenses]);

  // Clear filter
  const clearFilter = useCallback((key: keyof ExpenseDetailsFilter) => {
    setLocalFilter(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCurrentPage(1);
  }, []);

  // Check if all on page are selected
  const allPageSelected = paginatedExpenses.length > 0 &&
    paginatedExpenses.every(e => selectedExpenses.has(e.id));

  // Count selectable expenses for bulk actions (pending or under_review)
  const selectableForApproval = useMemo(() => {
    return Array.from(selectedExpenses).filter(id => {
      const exp = filteredExpenses.find(e => e.id === id);
      return exp && (exp.status === 'pending' || exp.status === 'under_review');
    }).length;
  }, [selectedExpenses, filteredExpenses]);

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(summary.total)}</p>
            <p className="text-xs text-gray-400">{summary.count} expenses</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ClockIcon className="h-3 w-3" /> Pending
            </p>
            <p className="text-lg font-semibold text-amber-700">{formatCurrency(summary.pendingAmount)}</p>
            <p className="text-xs text-amber-600">{summary.pendingCount} items</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CheckIcon className="h-3 w-3" /> Approved
            </p>
            <p className="text-lg font-semibold text-green-700">{formatCurrency(summary.approvedAmount)}</p>
            <p className="text-xs text-green-600">{summary.approvedCount} items</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <BanknotesIcon className="h-3 w-3" /> Reimbursable
            </p>
            <p className="text-lg font-semibold text-blue-700">
              {formatCurrency(filteredExpenses.filter(e => e.reimbursable).reduce((s, e) => s + e.amount, 0))}
            </p>
            <p className="text-xs text-blue-600">
              {filteredExpenses.filter(e => e.reimbursable).length} items
            </p>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(localFilter.category || localFilter.status || localFilter.projectId || localFilter.userId) && (
          <div className="flex flex-wrap gap-2">
            {localFilter.category && (
              <Badge variant="info" size="sm" className="gap-1">
                Category: {EXPENSE_CATEGORIES.find(c => c.value === localFilter.category)?.label}
                <button onClick={() => clearFilter('category')} className="ml-1 hover:text-blue-800">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilter.status && (
              <Badge variant="info" size="sm" className="gap-1">
                Status: {EXPENSE_STATUSES.find(s => s.value === localFilter.status)?.label}
                <button onClick={() => clearFilter('status')} className="ml-1 hover:text-blue-800">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilter.projectId && (
              <Badge variant="info" size="sm" className="gap-1">
                Project: {(projects as Project[]).find(p => p.id === localFilter.projectId)?.name || 'Selected'}
                <button onClick={() => clearFilter('projectId')} className="ml-1 hover:text-blue-800">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={localFilter.category || ''}
                  onChange={(e) => {
                    setLocalFilter(prev => ({
                      ...prev,
                      category: e.target.value ? e.target.value as ExpenseCategory : undefined,
                    }));
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 text-sm"
                >
                  <option value="">All categories</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={localFilter.status || ''}
                  onChange={(e) => {
                    setLocalFilter(prev => ({
                      ...prev,
                      status: e.target.value ? e.target.value as ExpenseStatus : undefined,
                    }));
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 text-sm"
                >
                  <option value="">All statuses</option>
                  {EXPENSE_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={localFilter.projectId || ''}
                  onChange={(e) => {
                    setLocalFilter(prev => ({
                      ...prev,
                      projectId: e.target.value || undefined,
                    }));
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 text-sm"
                >
                  <option value="">All projects</option>
                  {(projects as Project[]).map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions (for managers) */}
        {isManager && selectedExpenses.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedExpenses.size} expense{selectedExpenses.size !== 1 ? 's' : ''} selected
              {selectableForApproval > 0 && ` (${selectableForApproval} actionable)`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedExpenses(new Set())}
              >
                Clear Selection
              </Button>
              {selectableForApproval > 0 && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBulkApprove}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Approve ({selectableForApproval})
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRejectModalExpenseId('bulk')}
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Reject ({selectableForApproval})
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Expense List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <ReceiptPercentIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No expenses found</p>
            {(localFilter.category || localFilter.status || localFilter.projectId || searchQuery) && (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All Checkbox (for managers) */}
            {isManager && paginatedExpenses.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={selectAllOnPage}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-gray-600">
                  Select all on this page
                </span>
              </div>
            )}

            {paginatedExpenses.map(expense => (
              <div key={expense.id} className="flex items-start gap-3">
                {isManager && (
                  <input
                    type="checkbox"
                    checked={selectedExpenses.has(expense.id)}
                    onChange={() => toggleSelection(expense.id)}
                    className="mt-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                  />
                )}
                <div className="flex-1">
                  <ExpenseCard
                    expense={expense}
                    showUser={isManager}
                    showProject
                    canApprove={isManager}
                    canMarkPaid={isManager}
                    canEdit={expense.userId === profile?.uid}
                    canDelete={expense.userId === profile?.uid}
                    isOwner={expense.userId === profile?.uid}
                    onApprove={(id) => approveExpense(id)}
                    onReject={(id, reason) => rejectExpense(id, reason)}
                    onStartReview={(id) => startReview(id)}
                    onMarkPaid={(id, method) => markPaid(id, method)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} of {filteredExpenses.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Reject Modal */}
      {rejectModalExpenseId === 'bulk' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Reject Selected Expenses</h4>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting {selectableForApproval} expense{selectableForApproval !== 1 ? 's' : ''}.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20 mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectModalExpenseId(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleBulkReject(rejectReason)}
                disabled={!rejectReason.trim()}
              >
                Reject Expenses
              </Button>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

export default ExpenseDetailsModal;
