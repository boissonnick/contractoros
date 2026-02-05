/**
 * @fileoverview Tests for useChangeOrders hook
 *
 * Tests the change order management hook including:
 * - useChangeOrders: List change orders for a project
 * - createChangeOrder: Create new change order with auto-numbering
 * - updateChangeOrder: Update change order fields
 * - submitForApproval: Transition to approval workflow
 * - approveChangeOrder: Advance through approval chain
 * - rejectChangeOrder: Reject a change order
 * - Error handling for index and permission errors
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

jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Import hook and mocks after jest.mock declarations
import { useChangeOrders } from '@/lib/hooks/useChangeOrders';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

// ---- Mock data ----
const baseChangeOrderData = {
  projectId: 'project-1',
  orgId: 'org-1',
  number: 'CO-001',
  title: 'Add extra bathroom outlet',
  description: 'Client requests additional electrical outlet in bathroom',
  reason: 'Client request',
  scopeChanges: [
    {
      id: 'sc-1',
      type: 'addition',
      description: 'Install GFCI outlet',
      affectedArea: 'Bathroom',
    },
  ],
  impact: {
    costChange: 500,
    scheduleChange: 1,
    affectedPhaseIds: ['phase-1'],
    affectedTaskIds: ['task-1'],
  },
  photos: [],
  documents: [],
  status: 'draft',
  approvals: [],
  history: [
    {
      id: '1704067200000',
      action: 'Created',
      userId: 'user-1',
      userName: 'Test User',
      timestamp: { toDate: () => new Date('2024-01-01'), seconds: 1704067200, nanoseconds: 0 },
    },
  ],
  createdBy: 'user-1',
  createdAt: { toDate: () => new Date('2024-01-01'), seconds: 1704067200, nanoseconds: 0 },
  updatedAt: { toDate: () => new Date('2024-01-02'), seconds: 1704153600, nanoseconds: 0 },
};

const pendingPmChangeOrderData = {
  ...baseChangeOrderData,
  number: 'CO-002',
  title: 'Upgrade countertops',
  status: 'pending_pm',
  approvals: [
    { role: 'pm', userId: '', userName: '', status: 'pending' },
    { role: 'owner', userId: '', userName: '', status: 'pending' },
    { role: 'client', userId: '', userName: '', status: 'pending' },
  ],
};

const pendingClientChangeOrderData = {
  ...baseChangeOrderData,
  number: 'CO-003',
  title: 'Change paint color',
  status: 'pending_client',
  approvals: [
    { role: 'pm', userId: 'user-2', userName: 'PM User', status: 'approved', decidedAt: { toDate: () => new Date() } },
    { role: 'owner', userId: 'user-3', userName: 'Owner User', status: 'approved', decidedAt: { toDate: () => new Date() } },
    { role: 'client', userId: '', userName: '', status: 'pending' },
  ],
};

/**
 * Helper: simulate a single onSnapshot call with change order documents.
 */
function simulateSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockOnSnapshot.mockImplementation((_query: unknown, onNext: Function, _onError?: Function) => {
    onNext({
      docs: docs.map(d => ({ id: d.id, data: () => d.data })),
    });
    return jest.fn(); // unsubscribe
  });
}

// ---- Tests ----

describe('useChangeOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-co-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('doc-ref');

    // Reset useAuth to default
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: mockProfile,
    });
  });

  // ---- Test 1: Loading then data ----
  it('returns loading=true initially, then change orders after snapshot', async () => {
    simulateSnapshot([
      { id: 'co-1', data: baseChangeOrderData },
      { id: 'co-2', data: pendingPmChangeOrderData },
    ]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.changeOrders).toHaveLength(2);
    expect(result.current.changeOrders[0].id).toBe('co-1');
    expect(result.current.changeOrders[0].title).toBe('Add extra bathroom outlet');
    expect(result.current.changeOrders[0].status).toBe('draft');
    expect(result.current.changeOrders[1].id).toBe('co-2');
    expect(result.current.changeOrders[1].status).toBe('pending_pm');

    expect(result.current.error).toBeNull();
  });

  // ---- Test 2: Empty projectId ----
  it('returns empty when projectId is missing', () => {
    const { result } = renderHook(() => useChangeOrders({ projectId: '' }));

    // When projectId is empty, the hook does not call onSnapshot
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.changeOrders).toEqual([]);
  });

  // ---- Test 3: createChangeOrder ----
  it('createChangeOrder calls addDoc with correct data and auto-number CO-001', async () => {
    // Start with no existing change orders so nextNumber = 1
    simulateSnapshot([]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createChangeOrder({
        title: 'New Change Order',
        description: 'Add new window',
        reason: 'Client request',
        scopeChanges: [{ id: 'sc-new', type: 'addition', description: 'New window', affectedArea: 'Living room' }],
        impact: { costChange: 2000, scheduleChange: 3, affectedPhaseIds: ['phase-2'], affectedTaskIds: [] },
        photos: ['photo-1.jpg'],
      });
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const savedData = mockAddDoc.mock.calls[0][1];

    expect(savedData.number).toBe('CO-001');
    expect(savedData.status).toBe('draft');
    expect(savedData.orgId).toBe('org-1');
    expect(savedData.projectId).toBe('project-1');
    expect(savedData.createdBy).toBe('user-1');
    expect(savedData.title).toBe('New Change Order');
    expect(savedData.approvals).toEqual([]);
    expect(savedData.photos).toEqual(['photo-1.jpg']);

    // history should have 1 entry with action 'Created'
    expect(savedData.history).toHaveLength(1);
    expect(savedData.history[0].action).toBe('Created');
    expect(savedData.history[0].userId).toBe('user-1');
    expect(savedData.history[0].userName).toBe('Test User');

    expect(toast.success).toHaveBeenCalledWith('Change order created');
  });

  // ---- Test 4: createChangeOrder does nothing when user is null ----
  it('createChangeOrder does nothing when user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
    });

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await act(async () => {
      await result.current.createChangeOrder({
        title: 'Test',
        description: 'Test',
        reason: 'Test',
        scopeChanges: [],
        impact: { costChange: 0, scheduleChange: 0, affectedPhaseIds: [], affectedTaskIds: [] },
      });
    });

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // ---- Test 5: updateChangeOrder ----
  it('updateChangeOrder calls updateDoc and shows toast', async () => {
    simulateSnapshot([{ id: 'co-1', data: baseChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateChangeOrder('co-1', {
        title: 'Updated Title',
        description: 'Updated description',
      });
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'change_orders', 'co-1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.title).toBe('Updated Title');
    expect(updateData.description).toBe('Updated description');

    expect(toast.success).toHaveBeenCalledWith('Change order updated');
  });

  // ---- Test 6: submitForApproval changes status to pending_pm ----
  it('submitForApproval changes status to pending_pm', async () => {
    simulateSnapshot([{ id: 'co-1', data: baseChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.submitForApproval('co-1');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.status).toBe('pending_pm');

    expect(toast.success).toHaveBeenCalledWith('Change order submitted for approval');
  });

  // ---- Test 7: submitForApproval creates 3 approval stubs ----
  it('submitForApproval creates 3 approval stubs (pm, owner, client)', async () => {
    simulateSnapshot([{ id: 'co-1', data: baseChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.submitForApproval('co-1');
    });

    const updateData = mockUpdateDoc.mock.calls[0][1];

    expect(updateData.approvals).toHaveLength(3);
    expect(updateData.approvals[0].role).toBe('pm');
    expect(updateData.approvals[0].status).toBe('pending');
    expect(updateData.approvals[1].role).toBe('owner');
    expect(updateData.approvals[1].status).toBe('pending');
    expect(updateData.approvals[2].role).toBe('client');
    expect(updateData.approvals[2].status).toBe('pending');

    // History should include the submit entry
    expect(updateData.history).toBeDefined();
    const lastHistoryEntry = updateData.history[updateData.history.length - 1];
    expect(lastHistoryEntry.action).toBe('Submitted for approval');
    expect(lastHistoryEntry.userId).toBe('user-1');
  });

  // ---- Test 8: approveChangeOrder pending_pm -> pending_owner ----
  it('approveChangeOrder advances status from pending_pm to pending_owner', async () => {
    simulateSnapshot([{ id: 'co-2', data: pendingPmChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.approveChangeOrder('co-2', 'pm', 'Looks good');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const updateData = mockUpdateDoc.mock.calls[0][1];

    expect(updateData.status).toBe('pending_owner');

    // PM approval should be updated
    const pmApproval = updateData.approvals.find((a: Record<string, unknown>) => a.role === 'pm');
    expect(pmApproval.status).toBe('approved');
    expect(pmApproval.userId).toBe('user-1');
    expect(pmApproval.userName).toBe('Test User');
    expect(pmApproval.comments).toBe('Looks good');

    // History should have the approval entry
    const lastHistoryEntry = updateData.history[updateData.history.length - 1];
    expect(lastHistoryEntry.action).toBe('Approved by PM');

    expect(toast.success).toHaveBeenCalledWith('Change order approved');
  });

  // ---- Test 9: approveChangeOrder pending_client -> approved ----
  it('approveChangeOrder advances status from pending_client to approved', async () => {
    simulateSnapshot([{ id: 'co-3', data: pendingClientChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.approveChangeOrder('co-3', 'client');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const updateData = mockUpdateDoc.mock.calls[0][1];

    expect(updateData.status).toBe('approved');

    const clientApproval = updateData.approvals.find((a: Record<string, unknown>) => a.role === 'client');
    expect(clientApproval.status).toBe('approved');
    expect(clientApproval.userId).toBe('user-1');

    expect(toast.success).toHaveBeenCalledWith('Change order approved');
  });

  // ---- Test 10: rejectChangeOrder ----
  it('rejectChangeOrder sets status to rejected', async () => {
    simulateSnapshot([{ id: 'co-2', data: pendingPmChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.rejectChangeOrder('co-2', 'pm', 'Too expensive');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const updateData = mockUpdateDoc.mock.calls[0][1];

    expect(updateData.status).toBe('rejected');

    const pmApproval = updateData.approvals.find((a: Record<string, unknown>) => a.role === 'pm');
    expect(pmApproval.status).toBe('rejected');
    expect(pmApproval.comments).toBe('Too expensive');
    expect(pmApproval.userId).toBe('user-1');

    // History should include rejection entry
    const lastHistoryEntry = updateData.history[updateData.history.length - 1];
    expect(lastHistoryEntry.action).toBe('Rejected by PM');
    expect(lastHistoryEntry.details).toBe('Too expensive');

    expect(toast.info).toHaveBeenCalledWith('Change order rejected');
  });

  // ---- Test 11: Error — index required ----
  it('sets error when snapshot receives index-required error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError?: Function) => {
      if (onError) {
        onError({ message: 'The query requires an index. Create it here: https://console.firebase.google.com/...' });
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      'Database index required. Please deploy indexes with: firebase deploy --only firestore:indexes'
    );
    expect(result.current.changeOrders).toEqual([]);
  });

  // ---- Test 12: Error — permission-denied ----
  it('sets error when snapshot receives permission-denied error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError?: Function) => {
      if (onError) {
        onError({ message: 'Missing or insufficient permissions (permission-denied)' });
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Permission denied. Please check Firestore security rules.');
    expect(result.current.changeOrders).toEqual([]);
  });

  // ---- Additional: createChangeOrder auto-numbers based on existing count ----
  it('auto-numbers based on existing change orders count (CO-003 when 2 exist)', async () => {
    simulateSnapshot([
      { id: 'co-1', data: baseChangeOrderData },
      { id: 'co-2', data: pendingPmChangeOrderData },
    ]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.changeOrders).toHaveLength(2);
    });

    await act(async () => {
      await result.current.createChangeOrder({
        title: 'Third CO',
        description: 'Third change',
        reason: 'Client request',
        scopeChanges: [],
        impact: { costChange: 0, scheduleChange: 0, affectedPhaseIds: [], affectedTaskIds: [] },
      });
    });

    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.number).toBe('CO-003');
  });

  // ---- Additional: createChangeOrder error shows toast.error ----
  it('createChangeOrder shows toast.error on failure', async () => {
    simulateSnapshot([]);
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore write failed'));

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.createChangeOrder({
          title: 'Failing CO',
          description: 'Will fail',
          reason: 'Test',
          scopeChanges: [],
          impact: { costChange: 0, scheduleChange: 0, affectedPhaseIds: [], affectedTaskIds: [] },
        });
      })
    ).rejects.toThrow('Firestore write failed');

    expect(toast.error).toHaveBeenCalledWith('Failed to create change order');
  });

  // ---- Additional: updateChangeOrder error shows toast.error ----
  it('updateChangeOrder shows toast.error on failure', async () => {
    simulateSnapshot([{ id: 'co-1', data: baseChangeOrderData }]);
    mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.updateChangeOrder('co-1', { title: 'Will fail' });
      })
    ).rejects.toThrow('Update failed');

    expect(toast.error).toHaveBeenCalledWith('Failed to update change order');
  });

  // ---- Additional: unsubscribes on unmount ----
  it('unsubscribes from snapshot on unmount', async () => {
    const unsubFn = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function) => {
      onNext({ docs: [] });
      return unsubFn;
    });

    const { unmount } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(unsubFn).toHaveBeenCalledTimes(1);
  });

  // ---- Additional: Firestore query construction ----
  it('constructs Firestore query with correct collection and filters', async () => {
    simulateSnapshot([]);

    renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    });

    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'change_orders');
    expect(mockWhere).toHaveBeenCalledWith('orgId', '==', 'org-1');
    expect(mockWhere).toHaveBeenCalledWith('projectId', '==', 'project-1');
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(100);
  });

  // ---- Additional: submitForApproval does nothing when CO not found ----
  it('submitForApproval does nothing when change order is not found', async () => {
    simulateSnapshot([{ id: 'co-1', data: baseChangeOrderData }]);

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.submitForApproval('nonexistent-co');
    });

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  // ---- Additional: approveChangeOrder does nothing when user is null ----
  it('approveChangeOrder does nothing when user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
    });

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await act(async () => {
      await result.current.approveChangeOrder('co-1', 'pm');
    });

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  // ---- Additional: rejectChangeOrder does nothing when user is null ----
  it('rejectChangeOrder does nothing when user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
    });

    const { result } = renderHook(() => useChangeOrders({ projectId: 'project-1' }));

    await act(async () => {
      await result.current.rejectChangeOrder('co-1', 'pm', 'No');
    });

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
