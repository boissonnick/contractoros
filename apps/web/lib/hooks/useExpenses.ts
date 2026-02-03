'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
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
  approveExpense: (expenseId: string) => Promise<void>;
  rejectExpense: (expenseId: string, reason: string) => Promise<void>;
  markReimbursed: (expenseId: string, method?: string) => Promise<void>;

  // Summaries
  getSummary: (startDate: string, endDate: string, projectId?: string) => ExpenseSummary;

  // Refresh
  refresh: () => void;
}

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
      if (updates.reimbursedAt) {
        updateData.reimbursedAt = Timestamp.fromDate(updates.reimbursedAt);
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

  // Approve expense
  const approveExpense = useCallback(async (expenseId: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can approve expenses');

    try {
      await updateExpense(expenseId, {
        status: 'approved',
        approvedBy: currentUserId,
        approvedAt: new Date(),
      });
      toast.success('Expense approved');
    } catch (err) {
      console.error('Approve expense error:', err);
      toast.error('Failed to approve expense');
      throw err;
    }
  }, [orgId, currentUserId, isManager, updateExpense]);

  // Reject expense
  const rejectExpense = useCallback(async (expenseId: string, reason: string): Promise<void> => {
    if (!orgId || !currentUserId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can reject expenses');

    try {
      await updateExpense(expenseId, {
        status: 'rejected',
        approvedBy: currentUserId,
        rejectionReason: reason,
      });
      toast.success('Expense rejected');
    } catch (err) {
      console.error('Reject expense error:', err);
      toast.error('Failed to reject expense');
      throw err;
    }
  }, [orgId, currentUserId, isManager, updateExpense]);

  // Mark as reimbursed
  const markReimbursed = useCallback(async (expenseId: string, method?: string): Promise<void> => {
    if (!orgId) throw new Error('Not authenticated');
    if (!isManager) throw new Error('Only managers can mark as reimbursed');

    try {
      await updateExpense(expenseId, {
        status: 'reimbursed',
        reimbursedAt: new Date(),
        reimbursementMethod: method,
      });
      toast.success('Expense marked as reimbursed');
    } catch (err) {
      console.error('Mark reimbursed error:', err);
      toast.error('Failed to mark expense as reimbursed');
      throw err;
    }
  }, [orgId, isManager, updateExpense]);

  // Get summary
  const getSummary = useCallback((startDate: string, endDate: string, projectId?: string): ExpenseSummary => {
    const filteredExpenses = expenses.filter(exp => {
      if (exp.date < startDate || exp.date > endDate) return false;
      if (projectId && exp.projectId !== projectId) return false;
      return true;
    });

    // Calculate totals
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
    const totalApproved = filteredExpenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalReimbursed = filteredExpenses
      .filter(e => e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.amount, 0);

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
      totalApproved,
      totalReimbursed,
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
    approveExpense,
    rejectExpense,
    markReimbursed,
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
