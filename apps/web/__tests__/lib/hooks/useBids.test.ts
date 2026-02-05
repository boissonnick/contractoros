/**
 * @fileoverview Tests for useBids hook
 *
 * Tests the bid management hook including:
 * - useBids: List bids and solicitations for a project
 * - createSolicitation: Create a new bid solicitation
 * - closeSolicitation: Close a solicitation
 * - updateBidStatus: Accept/reject/respond to a bid
 * - Error handling for index and permission errors
 * - Cleanup on unmount
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ---- Mock functions ----
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
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
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date(),
      seconds: 1704067200,
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
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

// Import hook after mocks
import { useBids } from '@/lib/hooks/useBids';
import { useAuth } from '@/lib/auth';

// ---- Mock data ----
const mockBidData = {
  projectId: 'project-1',
  subId: 'sub-1',
  amount: 15000,
  laborCost: 10000,
  materialCost: 5000,
  status: 'submitted',
  description: 'Plumbing work',
  createdAt: { toDate: () => new Date('2024-01-15'), seconds: 1705276800, nanoseconds: 0 },
  updatedAt: { toDate: () => new Date('2024-01-16'), seconds: 1705363200, nanoseconds: 0 },
};

const mockSolicitationData = {
  projectId: 'project-1',
  orgId: 'org-1',
  title: 'Plumbing RFB',
  description: 'Need plumbing bids',
  scopeItemIds: ['scope-1'],
  phaseIds: ['phase-1'],
  trade: 'plumbing',
  invitedSubIds: ['sub-1', 'sub-2'],
  deadline: { toDate: () => new Date('2024-02-01'), seconds: 1706745600, nanoseconds: 0 },
  status: 'open',
  createdBy: 'user-1',
  createdAt: { toDate: () => new Date('2024-01-10'), seconds: 1704844800, nanoseconds: 0 },
};

const bidDocs = [
  { id: 'bid-1', data: mockBidData },
  { id: 'bid-2', data: { ...mockBidData, subId: 'sub-2', amount: 18000, status: 'accepted' } },
];

const solicitationDocs = [
  { id: 'sol-1', data: mockSolicitationData },
  { id: 'sol-2', data: { ...mockSolicitationData, title: 'Electrical RFB', trade: 'electrical', status: 'closed' } },
];

/**
 * Helper: simulate two onSnapshot calls (bids, then solicitations)
 */
function simulateDualSnapshot(
  bDocs: Array<{ id: string; data: Record<string, unknown> }>,
  sDocs: Array<{ id: string; data: Record<string, unknown> }>,
) {
  let snapshotCallCount = 0;
  mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function, _onError?: Function) => {
    snapshotCallCount++;
    if (snapshotCallCount === 1) {
      // First call: bids
      onNext({ docs: bDocs.map(d => ({ id: d.id, data: () => d.data })) });
    } else {
      // Second call: solicitations
      onNext({ docs: sDocs.map(d => ({ id: d.id, data: () => d.data })) });
    }
    return jest.fn(); // unsubscribe
  });
}

// ---- Tests ----

describe('useBids', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('doc-ref');

    // Reset useAuth to default
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: mockProfile,
    });
  });

  // ---- Test 1: Loading then data ----
  it('returns loading=true initially, then bids and solicitations after snapshots', async () => {
    simulateDualSnapshot(bidDocs, solicitationDocs);

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bids).toHaveLength(2);
    expect(result.current.bids[0].id).toBe('bid-1');
    expect(result.current.bids[0].amount).toBe(15000);
    expect(result.current.bids[1].id).toBe('bid-2');
    expect(result.current.bids[1].status).toBe('accepted');

    expect(result.current.solicitations).toHaveLength(2);
    expect(result.current.solicitations[0].id).toBe('sol-1');
    expect(result.current.solicitations[0].title).toBe('Plumbing RFB');
    expect(result.current.solicitations[1].status).toBe('closed');

    expect(result.current.error).toBeNull();
  });

  // ---- Test 2: Empty projectId ----
  it('returns empty arrays when projectId is empty string', async () => {
    const { result } = renderHook(() => useBids(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bids).toEqual([]);
    expect(result.current.solicitations).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  // ---- Test 3: No orgId ----
  it('returns empty arrays when profile.orgId is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile, orgId: null },
    });

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bids).toEqual([]);
    expect(result.current.solicitations).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  // ---- Test 4: createSolicitation ----
  it('createSolicitation calls addDoc with orgId and createdBy', async () => {
    simulateDualSnapshot([], []);

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createSolicitation({
        projectId: 'project-1',
        title: 'New Solicitation',
        description: 'Need bids for framing',
        scopeItemIds: ['scope-2'],
        phaseIds: ['phase-2'],
        trade: 'framing',
        invitedSubIds: ['sub-3'],
        deadline: new Date('2024-03-01'),
        status: 'open',
      });
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const addDocArgs = mockAddDoc.mock.calls[0];
    // Second arg is the data passed to addDoc
    const savedData = addDocArgs[1];
    expect(savedData.orgId).toBe('org-1');
    expect(savedData.createdBy).toBe('user-1');
    expect(savedData.status).toBe('open');
    expect(savedData.title).toBe('New Solicitation');
  });

  // ---- Test 5: createSolicitation does nothing when user is null ----
  it('createSolicitation does nothing when user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
    });

    // Must not set up snapshot since profile is null (early return in useEffect)
    const { result } = renderHook(() => useBids('project-1'));

    await act(async () => {
      await result.current.createSolicitation({
        projectId: 'project-1',
        title: 'Test',
        scopeItemIds: [],
        phaseIds: [],
        invitedSubIds: [],
        deadline: new Date(),
        status: 'open',
      });
    });

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // ---- Test 6: closeSolicitation ----
  it('closeSolicitation calls updateDoc with status closed', async () => {
    simulateDualSnapshot([], solicitationDocs);

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.closeSolicitation('sol-1');
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'bidSolicitations', 'sol-1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.status).toBe('closed');
    expect(updateData.updatedAt).toBeDefined();
  });

  // ---- Test 7: updateBidStatus ----
  it('updateBidStatus calls updateDoc with status, respondedAt, and respondedBy', async () => {
    simulateDualSnapshot(bidDocs, []);

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateBidStatus('bid-1', 'accepted', 'Great price');
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'bids', 'bid-1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.status).toBe('accepted');
    expect(updateData.respondedAt).toBeDefined();
    expect(updateData.updatedAt).toBeDefined();
    expect(updateData.respondedBy).toBe('user-1');
    expect(updateData.responseNotes).toBe('Great price');
  });

  // ---- Test 8: Error — index required ----
  it('sets error when snapshot receives index-required error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError?: Function) => {
      if (onError) {
        onError({ message: 'The query requires an index. Create it here: https://...' });
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database index required. Please deploy indexes.');
    expect(result.current.bids).toEqual([]);
  });

  // ---- Test 9: Error — permission-denied ----
  it('sets error when snapshot receives permission-denied error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError?: Function) => {
      if (onError) {
        onError({ message: 'Missing or insufficient permissions (permission-denied)' });
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Permission denied. Check Firestore rules.');
    expect(result.current.bids).toEqual([]);
  });

  // ---- Test 10: Unsubscribe on unmount ----
  it('unsubscribes from both snapshots on unmount', async () => {
    const unsubBids = jest.fn();
    const unsubSolicitations = jest.fn();
    let callCount = 0;

    mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function, _onError?: Function) => {
      callCount++;
      onNext({ docs: [] });
      return callCount === 1 ? unsubBids : unsubSolicitations;
    });

    const { unmount } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
    });

    unmount();

    expect(unsubBids).toHaveBeenCalledTimes(1);
    expect(unsubSolicitations).toHaveBeenCalledTimes(1);
  });

  // ---- Additional: updateBidStatus without notes ----
  it('updateBidStatus omits responseNotes when not provided', async () => {
    simulateDualSnapshot(bidDocs, []);

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateBidStatus('bid-1', 'rejected');
    });

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.status).toBe('rejected');
    expect(updateData.responseNotes).toBeUndefined();
  });

  // ---- Additional: Firestore query construction ----
  it('constructs Firestore queries with correct collection names and filters', async () => {
    simulateDualSnapshot([], []);

    renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
    });

    // Verify collection calls for 'bids' and 'bidSolicitations'
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'bids');
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'bidSolicitations');

    // Verify where clauses
    expect(mockWhere).toHaveBeenCalledWith('orgId', '==', 'org-1');
    expect(mockWhere).toHaveBeenCalledWith('projectId', '==', 'project-1');

    // Verify ordering
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');

    // Verify limits
    expect(mockLimit).toHaveBeenCalledWith(100); // bids limit
    expect(mockLimit).toHaveBeenCalledWith(50);  // solicitations limit
  });

  // ---- Additional: bidFromFirestore converts Timestamps ----
  it('converts Firestore Timestamps to Dates in bid data', async () => {
    const bidWithTimestamps = {
      id: 'bid-ts',
      data: {
        ...mockBidData,
        submittedAt: { toDate: () => new Date('2024-01-14'), seconds: 1705190400, nanoseconds: 0 },
        expiresAt: { toDate: () => new Date('2024-03-01'), seconds: 1709251200, nanoseconds: 0 },
        respondedAt: { toDate: () => new Date('2024-01-17'), seconds: 1705449600, nanoseconds: 0 },
        respondedBy: 'user-2',
        proposedStartDate: { toDate: () => new Date('2024-02-01'), seconds: 1706745600, nanoseconds: 0 },
        proposedEndDate: { toDate: () => new Date('2024-04-01'), seconds: 1711929600, nanoseconds: 0 },
      },
    };

    simulateDualSnapshot([bidWithTimestamps], []);

    const { result } = renderHook(() => useBids('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const bid = result.current.bids[0];
    expect(bid.submittedAt).toBeInstanceOf(Date);
    expect(bid.expiresAt).toBeInstanceOf(Date);
    expect(bid.respondedAt).toBeInstanceOf(Date);
    expect(bid.proposedStartDate).toBeInstanceOf(Date);
    expect(bid.proposedEndDate).toBeInstanceOf(Date);
    expect(bid.respondedBy).toBe('user-2');
  });
});
