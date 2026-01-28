"use client";

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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Expense, ExpenseStatus, ExpenseCategory } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): Expense {
  return {
    id,
    orgId: data.orgId as string,
    userId: data.userId as string,
    projectId: data.projectId as string,
    category: data.category as ExpenseCategory,
    amount: data.amount as number,
    description: data.description as string,
    vendor: data.vendor as string | undefined,
    receiptURL: data.receiptURL as string | undefined,
    date: data.date ? (data.date as Timestamp).toDate() : new Date(),
    status: data.status as ExpenseStatus,
    submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
    approvedBy: data.approvedBy as string | undefined,
    approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate() : undefined,
    reimbursedAt: data.reimbursedAt ? (data.reimbursedAt as Timestamp).toDate() : undefined,
    notes: data.notes as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(expense: Partial<Expense>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...expense };
  delete data.id;

  if (expense.date) data.date = Timestamp.fromDate(new Date(expense.date));
  if (expense.submittedAt) data.submittedAt = Timestamp.fromDate(new Date(expense.submittedAt));
  if (expense.approvedAt) data.approvedAt = Timestamp.fromDate(new Date(expense.approvedAt));
  if (expense.reimbursedAt) data.reimbursedAt = Timestamp.fromDate(new Date(expense.reimbursedAt));
  if (expense.createdAt) data.createdAt = Timestamp.fromDate(new Date(expense.createdAt));
  data.updatedAt = Timestamp.now();

  Object.keys(data).forEach((k) => {
    if (data[k] === undefined) delete data[k];
  });

  return data;
}

export interface NewExpenseInput {
  projectId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  vendor?: string;
  receiptURL?: string;
  date: Date;
  notes?: string;
}

export interface UseExpensesOptions {
  projectId?: string;   // Filter by project
  orgWide?: boolean;     // Fetch all org expenses
}

export interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (input: NewExpenseInput) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  submitExpense: (id: string) => Promise<void>;
  approveExpense: (id: string) => Promise<void>;
  rejectExpense: (id: string) => Promise<void>;
  markReimbursed: (id: string) => Promise<void>;
}

export function useExpenses({ projectId, orgWide }: UseExpensesOptions = {}): UseExpensesReturn {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const constraints = [
      where('orgId', '==', profile.orgId),
      orderBy('date', 'desc'),
    ];

    if (projectId && !orgWide) {
      constraints.unshift(where('projectId', '==', projectId));
    }

    const q = query(collection(db, 'expenses'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: Expense[] = [];
        snapshot.forEach((docSnap) => {
          result.push(fromFirestore(docSnap.id, docSnap.data()));
        });
        setExpenses(result);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Expenses listener error:', err);
        if (err.message?.includes('requires an index')) {
          setError('Database index required. Please deploy indexes with: firebase deploy --only firestore:indexes');
        } else if (err.message?.includes('permission-denied')) {
          setError('Permission denied. Please check Firestore security rules.');
        } else {
          setError(err.message || 'Failed to load expenses');
        }
        setExpenses([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.orgId, projectId, orgWide]);

  const addExpense = useCallback(
    async (input: NewExpenseInput): Promise<string> => {
      if (!profile?.orgId || !user) throw new Error('No organization');

      const expenseData = toFirestore({
        userId: user.uid,
        orgId: profile.orgId,
        projectId: input.projectId,
        category: input.category,
        amount: input.amount,
        description: input.description,
        vendor: input.vendor,
        receiptURL: input.receiptURL,
        date: input.date,
        status: 'draft' as ExpenseStatus,
        notes: input.notes,
        createdAt: new Date(),
      });

      const docRef = await addDoc(collection(db, 'expenses'), expenseData);
      return docRef.id;
    },
    [profile, user]
  );

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const data = toFirestore(updates);
    await updateDoc(doc(db, 'expenses', id), data);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  }, []);

  const submitExpense = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'expenses', id), {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, []);

  const approveExpense = useCallback(async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'expenses', id), {
      status: 'approved',
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, [user]);

  const rejectExpense = useCallback(async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'expenses', id), {
      status: 'rejected',
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, [user]);

  const markReimbursed = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'expenses', id), {
      status: 'reimbursed',
      reimbursedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, []);

  return {
    expenses, loading, error,
    addExpense, updateExpense, deleteExpense,
    submitExpense, approveExpense, rejectExpense, markReimbursed,
  };
}
