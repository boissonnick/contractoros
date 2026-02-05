/**
 * @fileoverview Tests for useTasks hook
 *
 * Tests the task management hook including:
 * - Real-time task fetching via onSnapshot (forEach pattern)
 * - addTask: creates a task with auto-calculated order and activity logging
 * - updateTask: updates a task with toFirestore conversion
 * - deleteTask: deletes a task
 * - moveTask: changes status, sets completedAt when completed
 * - reorderTasks: atomic reordering via writeBatch
 * - Bulk operations: bulkUpdateStatus, bulkAssign, bulkDelete, bulkSetPriority
 * - Error handling on snapshot failures
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ---- Mock functions ----
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
const mockStartAfter = jest.fn();
const mockGetDocs = jest.fn();

const mockBatchUpdate = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockWriteBatch = jest.fn(() => ({
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
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
  QueryConstraint: jest.fn(),
  DocumentSnapshot: jest.fn(),
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

jest.mock('@/lib/activity', () => ({
  logActivity: jest.fn(),
}));

// Import hook and mocks after jest.mock declarations
import { useTasks } from '@/lib/hooks/useTasks';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

// ---- Mock data ----
const mockTaskData = (overrides: Record<string, unknown> = {}) => ({
  orgId: 'org-1',
  projectId: 'project-1',
  title: 'Install drywall',
  description: 'Hang drywall sheets in living room',
  status: 'pending',
  priority: 'medium',
  assignedTo: ['user-2'],
  order: 0,
  dependencies: [],
  attachments: [],
  createdBy: 'user-1',
  createdAt: { toDate: () => new Date('2024-01-15'), seconds: 1705276800, nanoseconds: 0 },
  updatedAt: { toDate: () => new Date('2024-01-16'), seconds: 1705363200, nanoseconds: 0 },
  ...overrides,
});

const taskDocs = [
  { id: 'task-1', data: mockTaskData({ order: 0 }) },
  { id: 'task-2', data: mockTaskData({ title: 'Paint walls', order: 1, status: 'in_progress' }) },
  { id: 'task-3', data: mockTaskData({ title: 'Install fixtures', order: 2, priority: 'high' }) },
];

/**
 * Helper: simulate onSnapshot with forEach pattern (matches useTasks implementation)
 */
function simulateSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function, _onError?: Function) => {
    onNext({
      docs: docs.map(d => ({ id: d.id, data: () => d.data })),
      forEach: (fn: Function) => docs.forEach(d => fn({ id: d.id, data: () => d.data })),
    });
    return jest.fn(); // unsubscribe
  });
}

// ---- Tests ----

describe('useTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-task-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('doc-ref');
    mockBatchCommit.mockResolvedValue(undefined);

    // Reset useAuth to default
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: mockProfile,
    });
  });

  // ---- Test 1: Loading then data ----
  it('returns loading=true initially, then tasks after snapshot', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(3);
    expect(result.current.tasks[0].id).toBe('task-1');
    expect(result.current.tasks[0].title).toBe('Install drywall');
    expect(result.current.tasks[1].id).toBe('task-2');
    expect(result.current.tasks[1].status).toBe('in_progress');
    expect(result.current.tasks[2].id).toBe('task-3');
    expect(result.current.tasks[2].priority).toBe('high');
    expect(result.current.error).toBeNull();
  });

  // ---- Test 2: Empty projectId ----
  it('returns empty tasks when projectId is empty', async () => {
    const { result } = renderHook(() => useTasks({ projectId: '' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  // ---- Test 3: addTask calls addDoc with correct data ----
  it('addTask calls addDoc with correct data and returns docRef.id', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let newId: string = '';
    await act(async () => {
      newId = await result.current.addTask({
        title: 'New Task',
        description: 'A new task',
        priority: 'high',
        assignedTo: ['user-3'],
      });
    });

    expect(newId).toBe('new-task-id');
    expect(mockAddDoc).toHaveBeenCalledTimes(1);

    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.orgId).toBe('org-1');
    expect(savedData.projectId).toBe('project-1');
    expect(savedData.title).toBe('New Task');
    expect(savedData.description).toBe('A new task');
    expect(savedData.priority).toBe('high');
    expect(savedData.status).toBe('pending');
    expect(savedData.assignedTo).toEqual(['user-3']);
    // order should be max(existing) + 1 = 3
    expect(savedData.order).toBe(3);
    expect(savedData.createdBy).toBe('user-1');
  });

  // ---- Test 4: addTask throws when no orgId ----
  it('addTask throws when no orgId (profile is null)', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: null,
    });

    // No snapshot since we just need to test addTask error
    simulateSnapshot([]);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addTask({ title: 'Will fail' });
      })
    ).rejects.toThrow('No organization');

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // ---- Test 5: addTask shows success toast ----
  it('addTask shows success toast on creation', async () => {
    simulateSnapshot([]);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTask({ title: 'Toast test task' });
    });

    expect(toast.success).toHaveBeenCalledWith('Task created');
  });

  // ---- Test 6: updateTask calls updateDoc ----
  it('updateTask calls updateDoc with converted data', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateTask('task-1', {
        title: 'Updated title',
        priority: 'high' as const,
      });
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'tasks', 'task-1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.title).toBe('Updated title');
    expect(updateData.priority).toBe('high');
    expect(updateData.updatedAt).toBeDefined();
  });

  // ---- Test 7: deleteTask calls deleteDoc and shows toast ----
  it('deleteTask calls deleteDoc and shows success toast', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteTask('task-2');
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'tasks', 'task-2');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Task deleted');
  });

  // ---- Test 8: moveTask sets status and updatedAt ----
  it('moveTask sets status and updatedAt', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTask('task-1', 'in_progress');
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'tasks', 'task-1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.status).toBe('in_progress');
    expect(updateData.updatedAt).toBeDefined();
    // Should NOT have completedAt for non-completed status
    expect(updateData.completedAt).toBeUndefined();
  });

  // ---- Test 9: moveTask sets completedAt when status is completed ----
  it('moveTask sets completedAt when status is completed', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTask('task-1', 'completed');
    });

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.status).toBe('completed');
    expect(updateData.completedAt).toBeDefined();
    expect(updateData.updatedAt).toBeDefined();
  });

  // ---- Test 10: reorderTasks uses writeBatch ----
  it('reorderTasks uses writeBatch to set order values', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.reorderTasks(['task-3', 'task-1', 'task-2'], [0, 1, 2]);
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    // Verify each update call includes order and updatedAt
    for (let i = 0; i < 3; i++) {
      const updateArgs = mockBatchUpdate.mock.calls[i][1];
      expect(updateArgs.order).toBe(i);
      expect(updateArgs.updatedAt).toBeDefined();
    }
  });

  // ---- Test 11: bulkUpdateStatus uses batch ----
  it('bulkUpdateStatus uses batch to update multiple tasks', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.bulkUpdateStatus(['task-1', 'task-2'], 'in_progress');
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    // Verify status set on each call
    for (let i = 0; i < 2; i++) {
      const updateArgs = mockBatchUpdate.mock.calls[i][1];
      expect(updateArgs.status).toBe('in_progress');
      expect(updateArgs.updatedAt).toBeDefined();
    }

    expect(toast.success).toHaveBeenCalledWith('Updated 2 tasks');
  });

  // ---- Test 12: bulkUpdateStatus sets completedAt when completed ----
  it('bulkUpdateStatus sets completedAt when status is completed', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.bulkUpdateStatus(['task-1', 'task-3'], 'completed');
    });

    // Verify completedAt is set for each task
    for (let i = 0; i < 2; i++) {
      const updateArgs = mockBatchUpdate.mock.calls[i][1];
      expect(updateArgs.status).toBe('completed');
      expect(updateArgs.completedAt).toBeDefined();
      expect(updateArgs.updatedAt).toBeDefined();
    }
  });

  // ---- Test 13: bulkAssign uses batch to set assignedTo ----
  it('bulkAssign uses batch to set assignedTo', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.bulkAssign(['task-1', 'task-2', 'task-3'], ['user-5', 'user-6']);
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 3; i++) {
      const updateArgs = mockBatchUpdate.mock.calls[i][1];
      expect(updateArgs.assignedTo).toEqual(['user-5', 'user-6']);
      expect(updateArgs.updatedAt).toBeDefined();
    }

    expect(toast.success).toHaveBeenCalledWith('Assigned 3 tasks');
  });

  // ---- Test 14: bulkDelete uses batch to delete ----
  it('bulkDelete uses batch to delete multiple tasks', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.bulkDelete(['task-1', 'task-2']);
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatchDelete).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    expect(toast.success).toHaveBeenCalledWith('Deleted 2 tasks');
  });

  // ---- Test 15: bulkSetPriority uses batch ----
  it('bulkSetPriority uses batch to set priority', async () => {
    simulateSnapshot(taskDocs);

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.bulkSetPriority(['task-1', 'task-3'], 'urgent');
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 2; i++) {
      const updateArgs = mockBatchUpdate.mock.calls[i][1];
      expect(updateArgs.priority).toBe('urgent');
      expect(updateArgs.updatedAt).toBeDefined();
    }

    expect(toast.success).toHaveBeenCalledWith('Updated priority for 2 tasks');
  });

  // ---- Test 16: Error handling on snapshot error ----
  it('sets error on snapshot error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError?: Function) => {
      if (onError) {
        onError({ message: 'Permission denied' });
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useTasks({ projectId: 'project-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.tasks).toEqual([]);
  });
});
