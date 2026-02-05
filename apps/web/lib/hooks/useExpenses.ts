'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { convertTimestampsDeep } from '@/lib/firebase/timestamp-converter';
import { toast } from '@/components/ui/Toast';
import {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseSummary,
  ExpenseReceipt,
} from '@/types';

interface UseExpensesOptions {
  projectId?: string;
  userId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  reimbursableOnly?: boolean;
  billableOnly?: boolean;
}

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createExpense: (expense: Omit<Expense, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  // Receipt operations
  addReceipt: (expenseId: string, receipt: Omit<ExpenseReceipt, 'id' | 'uploadedAt'>) => Promise<void>;
  removeReceipt: (expenseId: string, receiptId: string) => Promise<void>;

  // Approval operations
  startReview: (expenseId: string) => Promise<void>;
  approveExpense: (expenseId: string, note?: string) => Promise<void>;
  rejectExpense: (expenseId: string, reason: string) => Promise<void>;
  requestMoreInfo: (expenseId: string, note: string) => Promise<void>;
  markPaid: (expenseId: string, method?: string) => Promise<void>;
  cancelExpense: (expenseId: string) => Promise<void>;

  // Summaries
  getSummary: (startDate: string, endDate: string, projectId?: string) => ExpenseSummary;

  // Refresh
  refresh: () => void;
}

/**
 * Hook for managing expenses with real-time updates and approval workflows.
 *
 * Provides comprehensive expense management including CRUD operations,
 * receipt attachments, and a complete approval workflow (pending -> under_review ->
 * approved/rejected -> paid). Non-managers only see their own expenses by default.
 *
 * @param {UseExpensesOptions} [options={}] - Filter options
 * @param {string} [options.projectId] - Filter by project ID
 * @param {string} [options.userId] - Filter by user who created the expense
 * @param {ExpenseCategory} [options.category] - Filter by expense category
 * @param {ExpenseStatus} [options.status] - Filter by status
 * @param {string} [options.startDate] - ISO date string for date range start
 * @param {string} [options.endDate] - ISO date string for date range end
 * @param {boolean} [options.reimbursableOnly] - Only show reimbursable expenses
 * @param {boolean} [options.billableOnly] - Only show billable expenses
 *
 * @returns {UseExpensesReturn} Expense data and operations
 * @returns {Expense[]} expenses - Array of expenses matching filters
 * @returns {boolean} loading - True while initial fetch is in progress
 * @returns {string|null} error - Error message if the subscription failed
 * @returns {Function} createExpense - Create a new expense
 * @returns {Function} updateExpense - Update an expense by ID
 * @returns {Function} deleteExpense - Delete an expense by ID
 * @returns {Function} addReceipt - Add a receipt to an expense
 * @returns {Function} removeReceipt - Remove a receipt from an expense
 * @returns {Function} startReview - Mark expense as under review (managers)
 * @returns {Function} approveExpense - Approve an expense (managers)
 * @returns {Function} rejectExpense - Reject an expense with reason (managers)
 * @returns {Function} requestMoreInfo - Send back for more information (managers)
 * @returns {Function} markPaid - Mark approved expense as paid (managers)
 * @returns {Function} cancelExpense - Cancel a pending expense (owner only)
 * @returns {Function} getSummary - Get expense summary for a date range
 * @returns {Function} refresh - Manually refresh the expense list
 *
 * @example
 * // View all expenses (managers) or own expenses (employees)
 * const { expenses, loading, createExpense } = useExpenses();
 *
 * if (loading) return <Spinner />;
 *
 * return expenses.map(exp => <ExpenseRow key={exp.id} expense={exp} />);
 *
 * @example
 * // Filter by project and status
 * const { expenses } = useExpenses({
 *   projectId: 'project123',
 *   status: 'pending',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * @example
 * // Create a new expense
 * const { createExpense } = useExpenses();
 *
 * const expenseId = await createExpense({
 *   date: '2024-01-15',
 *   amount: 125.50,
 *   category: 'materials',
 *   description: 'Lumber for deck project',
 *   projectId: 'project123',
 *   reimbursable: true,
 *   receipts: []
 * });
 *
 * @example
 * // Approval workflow (managers)
 * const { approveExpense, rejectExpense, markPaid } = useExpenses();
 *
 * await approveExpense(expenseId, 'Looks good');
 * // or
 * await rejectExpense(expenseId, 'Missing receipt');
 * // After approval
 * await markPaid(expenseId, 'direct_deposit');
 *
 * @example
 * // Get expense summary
 * const { getSummary } = useExpenses();
 * const summary = getSummary('2024-01-01', '2024-01-31');
 * console.log(summary.totalExpenses, summary.totalPending);
 */
export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;
  const currentUserId = profile?.uid;
  const currentUserName = profile?.displayName || user?.email || 'Unknown';
  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Fetch expenses with real-time updates
  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is necessary for this pattern
      setLoading(false);
      return;
    }

    // Wait for user profile to determine if they're a manager
    if (!isManager && !currentUserId) {
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];

    // Filter by project
    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }

    // Filter by user (non-managers only see their own by default)
    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    } else if (!isManager) {
      constraints.push(where('userId', '==', currentUserId));
    }

    // Filter by category
    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }

    // Filter by status
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    // Filter by reimbursable
    if (options.reimbursableOnly) {
      constraints.push(where('reimbursable', '==', true));
    }

    // Filter by billable
    if (options.billableOnly) {
      constraints.push(where('billable', '==', true));
    }

    // Date range filters
    if (options.startDate) {
      constraints.push(where('date', '>=', options.startDate));
    }
    if (options.endDate) {
      constraints.push(where('date', '<=', options.endDate));
    }

    // Order by date descending
    constraints.push(orderBy('date', 'desc'));
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(500));

    const q = query(
      collection(db, `organizations/${orgId}/expenses`),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expensesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestampsDeep(doc.data()),
        })) as Expense[];

        setExpenses(expensesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        if (err.message?.includes('requires an index')) {
          setError('Database index required. Please deploy Firestore indexes.');
        } else if (err.message?.includes('permission-denied')) {
          setError('Permission denied. Please check Firestore security rules.');
        } else {
          setError(err.message || 'Failed to load expenses');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, currentUserId, isManager, options.projectId, options.userId, options.category, options.status, options.startDate, options.endDate, options.reimbursableOnly, options.billableOnly, refreshTrigger]);

  // Create expense
  const createExpense = useCallback(async (
    expenseData: Omit<Expense, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!orgId || !currentUserId) {
      throw new Error('Not authenticated');
    }

    try {
      const now = new Date();
      const docRef = await addDoc(
        collection(db, `organizations/${orgId}/expenses`),
        {
          ...expenseData,
          orgId,
          userId: currentUserId,
          userName: currentUserName,
          receipts: expenseData.receipts?.map(r => ({
            ...r,
            uploadedAt: Timestamp.fromDate(new Date(r.uploadedAt)),
          })) || [],
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        }
      );
      toast.success('Expense created');
      return docRef.id;
    } catch (err) {
      console.error('Create expense error:', err);
      toast.error('Failed to create expense');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName]);

  // Update expense
  const updateExpense = useCallback(async (expenseId: string, updates: Partial<Expense>): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    try {
      const now = new Date();
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.fromDate(now),
      };

      // Convert dates
      if (updates.approvedAt) {
        updateData.approvedAt = Timestamp.fromDate(updates.approvedAt);
      }
      if (updates.paidAt) {
        updateData.paidAt = Timestamp.fromDate(updates.paidAt);
      }

      // Convert receipts
      if (updates.receipts) {
        updateData.receipts = updates.receipts.map(r => ({
          ...r,
          uploadedAt: Timestamp.fromDate(new Date(r.uploadedAt)),
        }));
      }

      await updateDoc(doc(db, `organizations/${orgId}/expenses/${expenseId}`), updateData);
    } catch (err) {
      console.error('Update expense error:', err);
      toast.error('Failed to update expense');
      throw err;
    }
  }, [orgId]);

  // Delete expense
  const deleteExpense = useCallback(async (expenseId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');
    try {
      await deleteDoc(doc(db, `organizations/${orgId}/expenses/${expenseId}`));
      toast.success('Expense deleted');
    } catch (err) {
      console.error('Delete expense error:', err);
      toast.error('Failed to delete expense');
      throw err;
    }
  }, [orgId]);

  // Add receipt to expense
  const addReceipt = useCallback(async (
    expenseId: string,
    receipt: Omit<ExpenseReceipt, 'id' | 'uploadedAt'>
  ): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) throw new Error('Expense not found');

    try {
      const newReceipt: ExpenseReceipt = {
        ...receipt,
        id: `receipt_${Date.now()}`,
        uploadedAt: new Date(),
      };

      await updateExpense(expenseId, {
        receipts: [...expense.receipts, newReceipt],
      });
      toast.success('Receipt added');
    } catch (err) {
      console.error('Add receipt error:', err);
      toast.error('Failed to add receipt');
      throw err;
    }
  }, [orgId, expenses, updateExpense]);

  // Remove receipt from expense
  const removeReceipt = useCallback(async (expenseId: string, receiptId: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) throw new Error('Expense not found');

    try {
      await updateExpense(expenseId, {
        receipts: expense.receipts.filter(r => r.id !== receiptId),
      });
      toast.success('Receipt removed');
    } catch (err) {
      console.error('Remove receipt error:', err);
      toast.error('Failed to remove receipt');
      throw err;
    }
  }, [orgId, expenses, updateExpense]);

  // Start review (manager begins reviewing)
  const startReview = useCallback(async (expenseId: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can review expenses');

    try {
      await updateExpense(expenseId, {
        status: 'under_review',
        approvedBy: currentUserId,
        approvedByName: currentUserName,
      });
      toast.success('Expense marked as under review');
    } catch (err) {
      console.error('Start review error:', err);
      toast.error('Failed to start review');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, isManager, updateExpense]);

  // Approve expense
  const approveExpense = useCallback(async (expenseId: string, note?: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can approve expenses');

    try {
      await updateExpense(expenseId, {
        status: 'approved',
        approvedBy: currentUserId,
        approvedByName: currentUserName,
        approvedAt: new Date(),
        reviewNote: note,
      });
      toast.success('Expense approved');
    } catch (err) {
      console.error('Approve expense error:', err);
      toast.error('Failed to approve expense');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, isManager, updateExpense]);

  // Reject expense
  const rejectExpense = useCallback(async (expenseId: string, reason: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can reject expenses');

    try {
      await updateExpense(expenseId, {
        status: 'rejected',
        approvedBy: currentUserId,
        approvedByName: currentUserName,
        rejectionReason: reason,
      });
      toast.success('Expense rejected');
    } catch (err) {
      console.error('Reject expense error:', err);
      toast.error('Failed to reject expense');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, isManager, updateExpense]);

  // Request more info (sends back to pending with a note)
  const requestMoreInfo = useCallback(async (expenseId: string, note: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can request more info');

    try {
      await updateExpense(expenseId, {
        status: 'pending',
        reviewNote: note,
        approvedBy: currentUserId,
        approvedByName: currentUserName,
      });
      toast.success('Requested more information from employee');
    } catch (err) {
      console.error('Request more info error:', err);
      toast.error('Failed to request more info');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, isManager, updateExpense]);

  // Mark as paid (finance role)
  const markPaid = useCallback(async (expenseId: string, method?: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can mark as paid');

    try {
      await updateExpense(expenseId, {
        status: 'paid',
        paidAt: new Date(),
        paidBy: currentUserId,
        paidByName: currentUserName,
        reimbursementMethod: method,
      });
      toast.success('Expense marked as paid');
    } catch (err) {
      console.error('Mark paid error:', err);
      toast.error('Failed to mark expense as paid');
      throw err;
    }
  }, [orgId, currentUserId, currentUserName, isManager, updateExpense]);

  // Cancel expense (employee can cancel their pending expenses)
  const cancelExpense = useCallback(async (expenseId: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) throw new Error('Expense not found');

    // Only allow canceling pending expenses by the owner
    if (expense.userId !== currentUserId && !isManager) {
      throw new Error('You can only cancel your own expenses');
    }
    if (expense.status !== 'pending') {
      throw new Error('Only pending expenses can be cancelled');
    }

    try {
      await deleteExpense(expenseId);
      toast.success('Expense cancelled');
    } catch (err) {
      console.error('Cancel expense error:', err);
      toast.error('Failed to cancel expense');
      throw err;
    }
  }, [orgId, currentUserId, isManager, expenses, deleteExpense]);

  // Get summary
  const getSummary = useCallback((startDate: string, endDate: string, projectId?: string): ExpenseSummary => {
    const filteredExpenses = expenses.filter(exp => {
      if (exp.date < startDate || exp.date > endDate) return false;
      if (projectId && exp.projectId !== projectId) return false;
      return true;
    });

    // Calculate totals by amount
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalReimbursable = filteredExpenses
      .filter(e => e.reimbursable)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalBillable = filteredExpenses
      .filter(e => e.billable)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalPending = filteredExpenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalUnderReview = filteredExpenses
      .filter(e => e.status === 'under_review')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalApproved = filteredExpenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalRejected = filteredExpenses
      .filter(e => e.status === 'rejected')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = filteredExpenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate counts
    const countPending = filteredExpenses.filter(e => e.status === 'pending').length;
    const countUnderReview = filteredExpenses.filter(e => e.status === 'under_review').length;
    const countApproved = filteredExpenses.filter(e => e.status === 'approved').length;
    const countRejected = filteredExpenses.filter(e => e.status === 'rejected').length;
    const countPaid = filteredExpenses.filter(e => e.status === 'paid').length;

    // Group by category
    const byCategory = {} as Record<ExpenseCategory, number>;
    for (const exp of filteredExpenses) {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    }

    // Group by project
    const projectMap = new Map<string, { projectId: string; projectName: string; amount: number }>();
    for (const exp of filteredExpenses) {
      if (exp.projectId) {
        const existing = projectMap.get(exp.projectId);
        if (existing) {
          existing.amount += exp.amount;
        } else {
          projectMap.set(exp.projectId, {
            projectId: exp.projectId,
            projectName: exp.projectName || 'Unknown',
            amount: exp.amount,
          });
        }
      }
    }
    const byProject = Array.from(projectMap.values()).sort((a, b) => b.amount - a.amount);

    // Group by user
    const userMap = new Map<string, { userId: string; userName: string; amount: number }>();
    for (const exp of filteredExpenses) {
      const existing = userMap.get(exp.userId);
      if (existing) {
        existing.amount += exp.amount;
      } else {
        userMap.set(exp.userId, {
          userId: exp.userId,
          userName: exp.userName,
          amount: exp.amount,
        });
      }
    }
    const byUser = Array.from(userMap.values()).sort((a, b) => b.amount - a.amount);

    return {
      period: 'custom',
      startDate,
      endDate,
      totalExpenses,
      totalReimbursable,
      totalBillable,
      totalPending,
      totalUnderReview,
      totalApproved,
      totalRejected,
      totalPaid,
      countPending,
      countUnderReview,
      countApproved,
      countRejected,
      countPaid,
      byCategory,
      byProject,
      byUser,
      count: filteredExpenses.length,
    };
  }, [expenses]);

  // Refresh function
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    addReceipt,
    removeReceipt,
    startReview,
    approveExpense,
    rejectExpense,
    requestMoreInfo,
    markPaid,
    cancelExpense,
    getSummary,
    refresh,
  };
}

// Hook for project-specific expenses
export function useProjectExpenses(projectId: string, options: Omit<UseExpensesOptions, 'projectId'> = {}) {
  return useExpenses({ ...options, projectId });
}

// Hook for current user's expenses
export function useMyExpenses(options: Omit<UseExpensesOptions, 'userId'> = {}) {
  const { profile } = useAuth();
  return useExpenses({ ...options, userId: profile?.uid });
}

// Hook for pending expenses (for managers)
export function usePendingExpenses() {
  return useExpenses({ status: 'pending' });
}
