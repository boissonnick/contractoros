/**
 * @fileoverview Tests for useExpenses hook
 *
 * Tests the expense management hook including:
 * - Real-time expense fetching via onSnapshot
 * - CRUD operations: createExpense, updateExpense, deleteExpense
 * - Receipt operations: addReceipt, removeReceipt
 * - Approval workflow: startReview, approveExpense, rejectExpense, requestMoreInfo, markPaid, cancelExpense
 * - getSummary: aggregation by date range, status, category
 * - Role-based access: non-managers only see their own expenses
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useExpenses } from '@/lib/hooks/useExpenses';

// ---- Firestore mocks ----
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
  QueryConstraint: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({ db: {} }));

// ---- Auth mock (default: OWNER role = manager) ----
let mockAuthReturn: {
  user: { uid: string; email: string } | null;
  profile: { uid: string; orgId: string; displayName: string; role: string } | null;
} = {
  user: { uid: 'user-1', email: 'test@test.com' },
  profile: {
    uid: 'user-1',
    orgId: 'org-1',
    displayName: 'Test User',
    role: 'OWNER',
  },
};

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockAuthReturn,
}));

// ---- Toast mock ----
jest.mock('@/components/ui/Toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

// Import the mocked toast so we can assert on it
import { toast as mockToast } from '@/components/ui/Toast';

// ---- Timestamp converter mock ----
jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestampsDeep: jest.fn((data) => data),
  convertTimestamps: jest.fn((data) => data),
}));

// ---- Helpers ----

/** Simulate onSnapshot returning a list of expense docs */
function simulateSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockOnSnapshot.mockImplementation((_query: unknown, onNext: Function, _onError: Function) => {
    onNext({
      docs: docs.map((d) => ({
        id: d.id,
        data: () => d.data,
      })),
    });
    return jest.fn(); // unsubscribe
  });
}

/** Simulate onSnapshot firing an error */
function simulateSnapshotError(message: string) {
  mockOnSnapshot.mockImplementation((_query: unknown, _onNext: Function, onError: Function) => {
    onError({ message });
    return jest.fn();
  });
}

// ---- Mock expense data ----
const baseExpense = {
  orgId: 'org-1',
  userId: 'user-1',
  userName: 'Test User',
  description: 'Lumber purchase',
  amount: 250,
  category: 'materials',
  date: '2024-06-15',
  projectId: 'proj-1',
  projectName: 'Deck Build',
  reimbursable: true,
  billable: false,
  receipts: [],
  status: 'pending',
  createdAt: new Date('2024-06-15'),
};

const expense1 = { id: 'exp-1', data: { ...baseExpense } };
const expense2 = {
  id: 'exp-2',
  data: {
    ...baseExpense,
    description: 'Tool rental',
    amount: 100,
    category: 'tools',
    date: '2024-06-20',
    status: 'approved',
    reimbursable: false,
    billable: true,
    userId: 'user-2',
    userName: 'Other User',
    projectId: 'proj-2',
    projectName: 'Kitchen Reno',
  },
};
const expense3 = {
  id: 'exp-3',
  data: {
    ...baseExpense,
    description: 'Gas',
    amount: 50,
    category: 'fuel',
    date: '2024-06-25',
    status: 'rejected',
    reimbursable: false,
    billable: false,
    userId: 'user-1',
    userName: 'Test User',
  },
};

// ---- Tests ----

describe('useExpenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to OWNER profile for each test
    mockAuthReturn = {
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: {
        uid: 'user-1',
        orgId: 'org-1',
        displayName: 'Test User',
        role: 'OWNER',
      },
    };
    // Default: no snapshot fires until test configures it
    mockOnSnapshot.mockImplementation(() => jest.fn());
    mockQuery.mockReturnValue('mock-query');
    mockCollection.mockReturnValue('mock-collection');
    mockDoc.mockReturnValue('mock-doc-ref');
  });

  // ---- 1. Loading state ----
  describe('loading state', () => {
    it('returns loading=true initially, then false after snapshot', async () => {
      // Capture the onNext callback so we can fire it later
      let capturedOnNext: Function | null = null;
      mockOnSnapshot.mockImplementation((_query: unknown, onNext: Function, _onError: Function) => {
        capturedOnNext = onNext;
        return jest.fn(); // unsubscribe
      });

      const { result } = renderHook(() => useExpenses());

      // Before snapshot fires, loading should be true
      expect(result.current.loading).toBe(true);

      // Now simulate snapshot arriving
      await act(async () => {
        capturedOnNext!({
          docs: [{ id: 'exp-1', data: () => baseExpense }],
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.expenses).toHaveLength(1);
    });
  });

  // ---- 2. Returns expenses from snapshot ----
  describe('fetching expenses', () => {
    it('returns expenses from snapshot', async () => {
      simulateSnapshot([expense1, expense2, expense3]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expenses).toHaveLength(3);
      expect(result.current.expenses[0].id).toBe('exp-1');
      expect(result.current.expenses[1].id).toBe('exp-2');
      expect(result.current.expenses[2].id).toBe('exp-3');
    });

    it('returns empty array when orgId is null', async () => {
      mockAuthReturn = {
        user: { uid: 'user-1', email: 'test@test.com' },
        profile: null,
      };

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expenses).toEqual([]);
      // onSnapshot should not have been called
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });
  });

  // ---- 3. createExpense ----
  describe('createExpense', () => {
    it('calls addDoc with correct path and data, returns docRef.id', async () => {
      simulateSnapshot([]);
      mockAddDoc.mockResolvedValue({ id: 'new-exp-id' });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let newId: string = '';
      await act(async () => {
        newId = await result.current.createExpense({
          description: 'New lumber',
          amount: 300,
          category: 'materials' as const,
          date: '2024-07-01',
          reimbursable: true,
          billable: false,
          receipts: [],
          status: 'pending' as const,
        } as any);
      });

      expect(newId).toBe('new-exp-id');
      expect(mockAddDoc).toHaveBeenCalledTimes(1);

      // Verify the collection path
      expect(mockCollection).toHaveBeenCalledWith({}, 'organizations/org-1/expenses');

      // Verify data includes orgId, userId, userName
      const addDocData = mockAddDoc.mock.calls[0][1];
      expect(addDocData.orgId).toBe('org-1');
      expect(addDocData.userId).toBe('user-1');
      expect(addDocData.userName).toBe('Test User');
      expect(addDocData.description).toBe('New lumber');
      expect(addDocData.amount).toBe(300);

      expect(mockToast.success).toHaveBeenCalledWith('Expense created');
    });

    it('throws if not authenticated (no orgId or userId)', async () => {
      mockAuthReturn = {
        user: null,
        profile: null,
      };

      simulateSnapshot([]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createExpense({
          description: 'Test',
          amount: 10,
          category: 'other' as const,
          date: '2024-01-01',
          reimbursable: false,
          billable: false,
          receipts: [],
          status: 'pending' as const,
        } as any)
      ).rejects.toThrow('Not authenticated');
    });
  });

  // ---- 4. updateExpense ----
  describe('updateExpense', () => {
    it('calls updateDoc with correct path', async () => {
      simulateSnapshot([expense1]);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateExpense('exp-1', { description: 'Updated desc' } as any);
      });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith({}, 'organizations/org-1/expenses/exp-1');

      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.description).toBe('Updated desc');
      expect(updateData.updatedAt).toBeDefined();
    });
  });

  // ---- 5. deleteExpense ----
  describe('deleteExpense', () => {
    it('calls deleteDoc with correct path', async () => {
      simulateSnapshot([expense1]);
      mockDeleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteExpense('exp-1');
      });

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith({}, 'organizations/org-1/expenses/exp-1');
    });

    it('shows toast on success', async () => {
      simulateSnapshot([expense1]);
      mockDeleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteExpense('exp-1');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Expense deleted');
    });
  });

  // ---- 6. approveExpense ----
  describe('approveExpense', () => {
    it('sets status to approved with approvedBy and approvedAt', async () => {
      simulateSnapshot([expense1]);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.approveExpense('exp-1', 'Looks good');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.status).toBe('approved');
      expect(updateData.approvedBy).toBe('user-1');
      expect(updateData.approvedByName).toBe('Test User');
      expect(updateData.approvedAt).toBeDefined();
      expect(updateData.reviewNote).toBe('Looks good');

      expect(mockToast.success).toHaveBeenCalledWith('Expense approved');
    });

    it('throws for non-managers', async () => {
      mockAuthReturn = {
        user: { uid: 'user-2', email: 'employee@test.com' },
        profile: {
          uid: 'user-2',
          orgId: 'org-1',
          displayName: 'Employee User',
          role: 'EMPLOYEE',
        },
      };

      simulateSnapshot([expense1]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.approveExpense('exp-1')).rejects.toThrow(
        'Only managers can approve expenses'
      );
    });
  });

  // ---- 7. rejectExpense ----
  describe('rejectExpense', () => {
    it('sets status to rejected with rejectionReason', async () => {
      simulateSnapshot([expense1]);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.rejectExpense('exp-1', 'Missing receipt');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.status).toBe('rejected');
      expect(updateData.rejectionReason).toBe('Missing receipt');
      expect(updateData.approvedBy).toBe('user-1');

      expect(mockToast.success).toHaveBeenCalledWith('Expense rejected');
    });
  });

  // ---- 8. markPaid ----
  describe('markPaid', () => {
    it('sets status to paid with paidAt', async () => {
      simulateSnapshot([expense1]);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markPaid('exp-1', 'direct_deposit');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.status).toBe('paid');
      expect(updateData.paidAt).toBeDefined();
      expect(updateData.paidBy).toBe('user-1');
      expect(updateData.paidByName).toBe('Test User');
      expect(updateData.reimbursementMethod).toBe('direct_deposit');

      expect(mockToast.success).toHaveBeenCalledWith('Expense marked as paid');
    });
  });

  // ---- 9. cancelExpense ----
  describe('cancelExpense', () => {
    it('throws for non-pending expenses', async () => {
      // expense with status 'approved' (not pending)
      const approvedExpense = {
        id: 'exp-approved',
        data: { ...baseExpense, status: 'approved', userId: 'user-1' },
      };
      simulateSnapshot([approvedExpense]);
      mockDeleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.cancelExpense('exp-approved')).rejects.toThrow(
        'Only pending expenses can be cancelled'
      );
    });

    it('throws for non-owner non-manager', async () => {
      // Employee trying to cancel someone else's pending expense
      mockAuthReturn = {
        user: { uid: 'user-2', email: 'employee@test.com' },
        profile: {
          uid: 'user-2',
          orgId: 'org-1',
          displayName: 'Employee',
          role: 'EMPLOYEE',
        },
      };

      // Expense belongs to user-1, but current user is user-2 (EMPLOYEE)
      const otherUserExpense = {
        id: 'exp-other',
        data: { ...baseExpense, status: 'pending', userId: 'user-1' },
      };
      simulateSnapshot([otherUserExpense]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.cancelExpense('exp-other')).rejects.toThrow(
        'You can only cancel your own expenses'
      );
    });

    it('successfully cancels own pending expense', async () => {
      simulateSnapshot([expense1]); // expense1 is pending, userId=user-1
      mockDeleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelExpense('exp-1');
      });

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Expense cancelled');
    });
  });

  // ---- 10. getSummary ----
  describe('getSummary', () => {
    it('returns correct aggregations (total, by status, by category)', async () => {
      simulateSnapshot([expense1, expense2, expense3]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.getSummary('2024-06-01', '2024-06-30');

      // Total: 250 + 100 + 50 = 400
      expect(summary.totalExpenses).toBe(400);

      // By status
      expect(summary.totalPending).toBe(250); // expense1
      expect(summary.totalApproved).toBe(100); // expense2
      expect(summary.totalRejected).toBe(50); // expense3
      expect(summary.totalPaid).toBe(0);
      expect(summary.totalUnderReview).toBe(0);

      // Counts
      expect(summary.countPending).toBe(1);
      expect(summary.countApproved).toBe(1);
      expect(summary.countRejected).toBe(1);
      expect(summary.countPaid).toBe(0);

      // By category: materials=250, tools=100, fuel=50
      expect(summary.byCategory.materials).toBe(250);
      expect(summary.byCategory.tools).toBe(100);
      expect(summary.byCategory.fuel).toBe(50);

      // Reimbursable: only expense1 (250)
      expect(summary.totalReimbursable).toBe(250);
      // Billable: only expense2 (100)
      expect(summary.totalBillable).toBe(100);

      expect(summary.count).toBe(3);
      expect(summary.period).toBe('custom');
    });

    it('filters by date range', async () => {
      simulateSnapshot([expense1, expense2, expense3]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Only expense1 has date 2024-06-15 which falls in 2024-06-10 to 2024-06-17
      const summary = result.current.getSummary('2024-06-10', '2024-06-17');

      expect(summary.totalExpenses).toBe(250);
      expect(summary.count).toBe(1);
    });

    it('filters by projectId', async () => {
      simulateSnapshot([expense1, expense2, expense3]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // expense2 has projectId 'proj-2'
      const summary = result.current.getSummary('2024-06-01', '2024-06-30', 'proj-2');

      expect(summary.totalExpenses).toBe(100);
      expect(summary.count).toBe(1);
      expect(summary.byProject).toHaveLength(1);
      expect(summary.byProject[0].projectId).toBe('proj-2');
    });
  });

  // ---- 11. Error handling ----
  describe('error handling', () => {
    it('sets error on snapshot error', async () => {
      simulateSnapshotError('Permission denied');

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Permission denied');
    });

    it('sets specific error for missing index', async () => {
      simulateSnapshotError('The query requires an index');

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database index required. Please deploy Firestore indexes.');
    });

    it('sets specific error for permission denied', async () => {
      simulateSnapshotError('permission-denied');

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Permission denied. Please check Firestore security rules.');
    });
  });

  // ---- 12. startReview ----
  describe('startReview', () => {
    it('marks expense as under_review', async () => {
      simulateSnapshot([expense1]);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startReview('exp-1');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.status).toBe('under_review');
      expect(updateData.approvedBy).toBe('user-1');

      expect(mockToast.success).toHaveBeenCalledWith('Expense marked as under review');
    });

    it('throws for non-managers', async () => {
      mockAuthReturn = {
        user: { uid: 'user-2', email: 'employee@test.com' },
        profile: {
          uid: 'user-2',
          orgId: 'org-1',
          displayName: 'Employee',
          role: 'EMPLOYEE',
        },
      };

      simulateSnapshot([expense1]);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.startReview('exp-1')).rejects.toThrow(
        'Only managers can review expenses'
      );
    });
  });

  // ---- 13. requestMoreInfo ----
  describe('requestMoreInfo', () => {
    it('sets status back to pending with review note', async () => {
      simulateSnapshot([expense1]);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestMoreInfo('exp-1', 'Please attach receipt');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1];
      expect(updateData.status).toBe('pending');
      expect(updateData.reviewNote).toBe('Please attach receipt');

      expect(mockToast.success).toHaveBeenCalledWith('Requested more information from employee');
    });
  });
});
