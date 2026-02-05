import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockStartAfter = jest.fn();
const mockEndBefore = jest.fn();
const mockLimitToLast = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
  endBefore: (...args: unknown[]) => mockEndBefore(...args),
  limitToLast: (...args: unknown[]) => mockLimitToLast(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
  QueryConstraint: jest.fn(),
  DocumentSnapshot: jest.fn(),
  DocumentData: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({ db: {} }));

const mockProfile = {
  uid: 'user-1',
  orgId: 'org-1',
  displayName: 'Test User',
  role: 'OWNER' as const,
};
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'user-1', email: 'test@test.com' },
    profile: mockProfile,
  })),
}));

jest.mock('@/components/ui/Toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestamps: jest.fn((data) => data),
  convertTimestampsDeep: jest.fn((data) => data),
}));

// ── Imports (after mocks) ───────────────────────────────────────────────────

import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';

// ── Helpers ─────────────────────────────────────────────────────────────────

function simulateSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function, _onError?: Function) => {
    onNext({
      docs: docs.map(d => ({ id: d.id, data: () => d.data })),
    });
    return jest.fn(); // unsubscribe
  });
}

function makeSub(overrides: Record<string, unknown> = {}) {
  return {
    orgId: 'org-1',
    companyName: 'Acme Plumbing',
    contactName: 'John Smith',
    email: 'john@acme.com',
    phone: '555-1234',
    trade: 'plumbing',
    isActive: true,
    documents: [],
    metrics: { projectsCompleted: 5, onTimeRate: 0.9, avgRating: 4.5, totalPaid: 50000 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useSubcontractors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: onSnapshot returns empty and never fires
    mockOnSnapshot.mockImplementation(() => jest.fn());
    mockQuery.mockReturnValue('mock-query');
    mockCollection.mockReturnValue('mock-collection');
    mockWhere.mockReturnValue('mock-where');
    mockOrderBy.mockReturnValue('mock-orderBy');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockAddDoc.mockResolvedValue({ id: 'new-sub-1' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  // ── 1. Loading then data ──────────────────────────────────────────────

  it('returns loading=true initially, then subs after snapshot fires', async () => {
    const subData = makeSub();
    simulateSnapshot([{ id: 'sub-1', data: subData }]);

    const { result } = renderHook(() => useSubcontractors());

    // After snapshot fires synchronously during effect, should have data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.subs).toHaveLength(1);
    expect(result.current.subs[0].id).toBe('sub-1');
    expect(result.current.subs[0].companyName).toBe('Acme Plumbing');
    expect(result.current.error).toBeNull();
  });

  // ── 2. Empty when no orgId ────────────────────────────────────────────

  it('returns empty when profile.orgId is null', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile, orgId: null },
    });

    const { result } = renderHook(() => useSubcontractors());

    expect(result.current.subs).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();

    // Restore default
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: mockProfile,
    });
  });

  // ── 3. addSub calls addDoc with default metrics and timestamps ────────

  it('addSub calls addDoc with default metrics and timestamps', async () => {
    simulateSnapshot([]);
    const { result } = renderHook(() => useSubcontractors());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const newSub = {
      orgId: 'org-1',
      companyName: 'Beta Electric',
      contactName: 'Jane Doe',
      email: 'jane@beta.com',
      trade: 'electrical',
      isActive: true,
      documents: [],
    };

    await act(async () => {
      await result.current.addSub(newSub as Parameters<typeof result.current.addSub>[0]);
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const addDocArgs = mockAddDoc.mock.calls[0];
    // First arg is collection ref
    expect(mockCollection).toHaveBeenCalledWith({}, 'subcontractors');
    // Second arg is the data object with toFirestore applied
    const savedData = addDocArgs[1];
    expect(savedData.companyName).toBe('Beta Electric');
    expect(savedData.metrics).toEqual({
      projectsCompleted: 0,
      onTimeRate: 0,
      avgRating: 0,
      totalPaid: 0,
    });
    // timestamps should be present (converted via Timestamp.fromDate)
    expect(savedData.createdAt).toBeDefined();
    expect(savedData.updatedAt).toBeDefined();
  });

  // ── 4. addSub shows success toast ─────────────────────────────────────

  it('addSub shows success toast', async () => {
    simulateSnapshot([]);
    const { result } = renderHook(() => useSubcontractors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addSub({
        orgId: 'org-1',
        companyName: 'Test Co',
        contactName: 'Test',
        email: 'test@test.com',
        trade: 'general',
        isActive: true,
        documents: [],
      } as Parameters<typeof result.current.addSub>[0]);
    });

    expect(toast.success).toHaveBeenCalledWith('Subcontractor added');
  });

  // ── 5. addSub shows error toast on failure ────────────────────────────

  it('addSub shows error toast on failure', async () => {
    simulateSnapshot([]);
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore write failed'));

    const { result } = renderHook(() => useSubcontractors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.addSub({
          orgId: 'org-1',
          companyName: 'Fail Co',
          contactName: 'Fail',
          email: 'fail@test.com',
          trade: 'general',
          isActive: true,
          documents: [],
        } as Parameters<typeof result.current.addSub>[0]);
      })
    ).rejects.toThrow('Firestore write failed');

    expect(toast.error).toHaveBeenCalledWith('Failed to add subcontractor');
  });

  // ── 6. updateSub calls updateDoc with updatedAt ───────────────────────

  it('updateSub calls updateDoc with updatedAt', async () => {
    simulateSnapshot([{ id: 'sub-1', data: makeSub() }]);
    const { result } = renderHook(() => useSubcontractors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSub('sub-1', { companyName: 'Updated Plumbing' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith({}, 'subcontractors', 'sub-1');
    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.companyName).toBe('Updated Plumbing');
    expect(updateData.updatedAt).toBeDefined();
  });

  // ── 7. updateSub shows success toast ──────────────────────────────────

  it('updateSub shows success toast', async () => {
    simulateSnapshot([{ id: 'sub-1', data: makeSub() }]);
    const { result } = renderHook(() => useSubcontractors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSub('sub-1', { trade: 'electrical' });
    });

    expect(toast.success).toHaveBeenCalledWith('Subcontractor updated');
  });

  // ── 8. deleteSub calls deleteDoc ──────────────────────────────────────

  it('deleteSub calls deleteDoc', async () => {
    simulateSnapshot([{ id: 'sub-1', data: makeSub() }]);
    const { result } = renderHook(() => useSubcontractors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteSub('sub-1');
    });

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith({}, 'subcontractors', 'sub-1');
  });

  // ── 9. deleteSub shows success toast ──────────────────────────────────

  it('deleteSub shows success toast', async () => {
    simulateSnapshot([{ id: 'sub-1', data: makeSub() }]);
    const { result } = renderHook(() => useSubcontractors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteSub('sub-1');
    });

    expect(toast.success).toHaveBeenCalledWith('Subcontractor deleted');
  });

  // ── 10. Error handling: sets error on snapshot error ──────────────────

  it('sets error on snapshot error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError: Function) => {
      onError(new Error('Permission denied'));
      return jest.fn();
    });

    const { result } = renderHook(() => useSubcontractors());

    await waitFor(() => {
      expect(result.current.error).toBe('Permission denied');
    });
    expect(result.current.loading).toBe(false);
  });

  // ── 11. Unsubscribes on unmount ───────────────────────────────────────

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockOnSnapshot.mockImplementation(() => unsubscribe);

    const { unmount } = renderHook(() => useSubcontractors());

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  // ── 12. Firestore query construction ──────────────────────────────────

  it('uses correct collection, where clause, and orderBy', () => {
    simulateSnapshot([]);
    renderHook(() => useSubcontractors());

    expect(mockCollection).toHaveBeenCalledWith({}, 'subcontractors');
    expect(mockWhere).toHaveBeenCalledWith('orgId', '==', 'org-1');
    expect(mockOrderBy).toHaveBeenCalledWith('companyName', 'asc');
    expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-where', 'mock-orderBy');
  });
});
