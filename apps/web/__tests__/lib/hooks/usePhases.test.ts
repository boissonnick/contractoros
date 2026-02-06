/**
 * @fileoverview Unit tests for usePhases hook
 * Sprint 80: Unit Test Coverage
 *
 * Tests cover:
 * - usePhases: Phase CRUD operations, reordering, Firestore snapshot handling
 * - addPhase, updatePhase, deletePhase, reorderPhases
 * - Error handling and toast notifications
 * - Firestore converter logic (fromFirestore/toFirestore)
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePhases } from '@/lib/hooks/usePhases';
import { ProjectPhase } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock useAuth
const mockUser = { uid: 'user-123', email: 'test@example.com' };
const mockProfile = {
  uid: 'user-123',
  orgId: 'org-123',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    profile: mockProfile,
  })),
}));

// Mock toast
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    commit: jest.fn(),
  })),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date('2024-06-15T12:00:00Z') })),
    fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules
import { toast } from '@/components/ui/Toast';
import { onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// =============================================================================
// TEST DATA
// =============================================================================

const mockProjectId = 'project-123';

const createMockPhase = (overrides: Partial<ProjectPhase> = {}): ProjectPhase => ({
  id: `phase-${Math.random().toString(36).slice(2)}`,
  projectId: mockProjectId,
  name: 'Foundation',
  description: 'Foundation work phase',
  order: 0,
  status: 'upcoming',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-02-15'),
  estimatedDuration: 30,
  budgetAmount: 50000,
  actualCost: 0,
  assignedTeamMembers: ['user-456'],
  assignedSubcontractors: ['sub-1'],
  progressPercent: 0,
  tasksTotal: 10,
  tasksCompleted: 0,
  dependencies: [],
  documents: [],
  milestones: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createMockDocSnapshot = (phase: ProjectPhase) => ({
  id: phase.id,
  data: () => ({
    projectId: phase.projectId,
    name: phase.name,
    description: phase.description,
    order: phase.order,
    status: phase.status,
    startDate: phase.startDate
      ? { toDate: () => phase.startDate }
      : undefined,
    endDate: phase.endDate ? { toDate: () => phase.endDate } : undefined,
    estimatedDuration: phase.estimatedDuration,
    budgetAmount: phase.budgetAmount,
    actualCost: phase.actualCost,
    assignedTeamMembers: phase.assignedTeamMembers,
    assignedSubcontractors: phase.assignedSubcontractors,
    progressPercent: phase.progressPercent,
    tasksTotal: phase.tasksTotal,
    tasksCompleted: phase.tasksCompleted,
    dependencies: phase.dependencies,
    documents: phase.documents,
    milestones: phase.milestones,
    createdAt: phase.createdAt
      ? { toDate: () => phase.createdAt }
      : undefined,
    updatedAt: phase.updatedAt
      ? { toDate: () => phase.updatedAt }
      : undefined,
  }),
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
    setTimeout(() => {
      onNext({ docs: [] });
    }, 0);
    return jest.fn();
  });

  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-phase-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (deleteDoc as jest.Mock).mockResolvedValue(undefined);
  (writeBatch as jest.Mock).mockReturnValue({
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  });
});

// =============================================================================
// usePhases TESTS
// =============================================================================

describe('usePhases', () => {
  describe('initial state and loading', () => {
    it('should return loading=true initially before snapshot fires', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => {
        return jest.fn();
      });

      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      expect(result.current.loading).toBe(true);
      expect(result.current.phases).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should set loading=false after snapshot fires', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should return empty phases when no data exists', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.phases).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetching phases', () => {
    it('should return phases from Firestore snapshot', async () => {
      const mockPhases = [
        createMockPhase({ id: 'phase-1', name: 'Foundation', order: 0 }),
        createMockPhase({ id: 'phase-2', name: 'Framing', order: 1 }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockPhases.map(createMockDocSnapshot),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.phases).toHaveLength(2);
      });

      expect(result.current.phases[0].name).toBe('Foundation');
      expect(result.current.phases[1].name).toBe('Framing');
      expect(result.current.loading).toBe(false);
    });

    it('should handle phases with milestones and documents', async () => {
      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: 'phase-rich',
                data: () => ({
                  projectId: mockProjectId,
                  name: 'Rich Phase',
                  order: 0,
                  status: 'active',
                  assignedTeamMembers: [],
                  assignedSubcontractors: [],
                  progressPercent: 25,
                  tasksTotal: 4,
                  tasksCompleted: 1,
                  dependencies: [],
                  createdAt: { toDate: () => new Date('2024-01-01') },
                  updatedAt: { toDate: () => new Date('2024-01-15') },
                  milestones: [
                    {
                      id: 'ms-1',
                      title: 'Inspection',
                      date: { toDate: () => new Date('2024-02-01') },
                      completed: false,
                    },
                  ],
                  documents: [
                    {
                      id: 'doc-1',
                      name: 'spec.pdf',
                      url: 'https://example.com/spec.pdf',
                      type: 'application/pdf',
                      size: 1024,
                      uploadedBy: 'user-123',
                      uploadedAt: { toDate: () => new Date('2024-01-10') },
                    },
                  ],
                }),
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.phases).toHaveLength(1);
      });

      expect(result.current.phases[0].milestones).toHaveLength(1);
      expect(result.current.phases[0].documents).toHaveLength(1);
    });

    it('should handle phases with missing optional fields', async () => {
      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: 'phase-minimal',
                data: () => ({
                  projectId: mockProjectId,
                  name: 'Minimal Phase',
                  status: 'upcoming',
                }),
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.phases).toHaveLength(1);
      });

      const phase = result.current.phases[0];
      expect(phase.name).toBe('Minimal Phase');
      expect(phase.order).toBe(0);
      expect(phase.progressPercent).toBe(0);
      expect(phase.tasksTotal).toBe(0);
      expect(phase.tasksCompleted).toBe(0);
      expect(phase.assignedTeamMembers).toEqual([]);
      expect(phase.assignedSubcontractors).toEqual([]);
      expect(phase.dependencies).toEqual([]);
      expect(phase.documents).toEqual([]);
      expect(phase.milestones).toEqual([]);
    });

    it('should not subscribe when projectId is empty', async () => {
      const { result } = renderHook(() => usePhases({ projectId: '' }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onSnapshot).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(true);
      expect(result.current.phases).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should set error on Firestore snapshot error', async () => {
      const firestoreError = new Error('Permission denied');

      (onSnapshot as jest.Mock).mockImplementation((_query, _onNext, onError) => {
        setTimeout(() => onError(firestoreError), 0);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.error).toBe('Permission denied');
      });

      expect(result.current.loading).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('addPhase', () => {
    it('should call addDoc with correct data and show success toast', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newPhaseData = {
        projectId: mockProjectId,
        name: 'Electrical',
        description: 'Electrical wiring phase',
        order: 2,
        status: 'upcoming' as const,
        assignedTeamMembers: [] as string[],
        assignedSubcontractors: [] as string[],
        dependencies: [] as string[],
        documents: [],
        milestones: [],
      };

      await act(async () => {
        await result.current.addPhase(newPhaseData);
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (addDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        projectId: mockProjectId,
        name: 'Electrical',
        order: 2,
        status: 'upcoming',
        progressPercent: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
      });
      expect(toast.success).toHaveBeenCalledWith('Phase created');
    });

    it('should set progressPercent, tasksTotal, tasksCompleted to 0', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addPhase({
          projectId: mockProjectId,
          name: 'Test',
          order: 0,
          status: 'upcoming' as const,
          assignedTeamMembers: [] as string[],
          assignedSubcontractors: [] as string[],
          dependencies: [] as string[],
          documents: [],
          milestones: [],
        });
      });

      const callArgs = (addDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].progressPercent).toBe(0);
      expect(callArgs[1].tasksTotal).toBe(0);
      expect(callArgs[1].tasksCompleted).toBe(0);
    });

    it('should show error toast and throw on addDoc failure', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Write failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.addPhase({
        projectId: mockProjectId,
        name: 'Plumbing',
        order: 3,
        status: 'upcoming' as const,
        assignedTeamMembers: [] as string[],
        assignedSubcontractors: [] as string[],
        dependencies: [] as string[],
        documents: [],
        milestones: [],
      })).rejects.toThrow('Write failed');
      expect(toast.error).toHaveBeenCalledWith('Failed to create phase');
      consoleSpy.mockRestore();
    });
  });

  describe('updatePhase', () => {
    it('should call updateDoc with data and updatedAt timestamp', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePhase('phase-1', { name: 'Updated Foundation', status: 'active' });
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        name: 'Updated Foundation',
        status: 'active',
      });
      expect(callArgs[1]).toHaveProperty('updatedAt');
    });

    it('should not show success toast on update (silent updates)', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePhase('phase-1', { progressPercent: 50 });
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should show error toast and throw on updateDoc failure', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.updatePhase('phase-1', { name: 'Bad Update' })
      ).rejects.toThrow('Update failed');

      expect(toast.error).toHaveBeenCalledWith('Failed to update phase');
      consoleSpy.mockRestore();
    });
  });

  describe('deletePhase', () => {
    it('should call deleteDoc and show success toast', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deletePhase('phase-1');
      });

      expect(deleteDoc).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Phase deleted');
    });

    it('should show error toast and throw on deleteDoc failure', async () => {
      (deleteDoc as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.deletePhase('phase-1')).rejects.toThrow('Delete failed');
      expect(toast.error).toHaveBeenCalledWith('Failed to delete phase');
      consoleSpy.mockRestore();
    });
  });

  describe('reorderPhases', () => {
    it('should create a writeBatch and update order for each ID', async () => {
      const mockBatchUpdate = jest.fn();
      const mockBatchCommit = jest.fn().mockResolvedValue(undefined);

      (writeBatch as jest.Mock).mockReturnValue({
        update: mockBatchUpdate,
        commit: mockBatchCommit,
      });

      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const orderedIds = ['phase-3', 'phase-1', 'phase-2'];

      await act(async () => {
        await result.current.reorderPhases(orderedIds);
      });

      expect(writeBatch).toHaveBeenCalledTimes(1);
      expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
      expect(mockBatchUpdate.mock.calls[0][1]).toMatchObject({ order: 0 });
      expect(mockBatchUpdate.mock.calls[1][1]).toMatchObject({ order: 1 });
      expect(mockBatchUpdate.mock.calls[2][1]).toMatchObject({ order: 2 });
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it('should show error toast and throw on batch commit failure', async () => {
      const mockBatchCommit = jest.fn().mockRejectedValue(new Error('Batch failed'));

      (writeBatch as jest.Mock).mockReturnValue({
        update: jest.fn(),
        commit: mockBatchCommit,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.reorderPhases(['phase-1', 'phase-2'])
      ).rejects.toThrow('Batch failed');

      expect(toast.error).toHaveBeenCalledWith('Failed to reorder phases');
      consoleSpy.mockRestore();
    });

    it('should handle empty orderedIds array', async () => {
      const mockBatchUpdate = jest.fn();
      const mockBatchCommit = jest.fn().mockResolvedValue(undefined);

      (writeBatch as jest.Mock).mockReturnValue({
        update: mockBatchUpdate,
        commit: mockBatchCommit,
      });

      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.reorderPhases([]);
      });

      expect(mockBatchUpdate).not.toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from Firestore on unmount', async () => {
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({ docs: [] });
        }, 0);
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should not call unsubscribe when projectId is empty', () => {
      const { unmount } = renderHook(() => usePhases({ projectId: '' }));

      unmount();

      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('return value shape', () => {
    it('should return all expected properties', async () => {
      const { result } = renderHook(() => usePhases({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('phases');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('addPhase');
      expect(result.current).toHaveProperty('updatePhase');
      expect(result.current).toHaveProperty('deletePhase');
      expect(result.current).toHaveProperty('reorderPhases');
      expect(typeof result.current.addPhase).toBe('function');
      expect(typeof result.current.updatePhase).toBe('function');
      expect(typeof result.current.deletePhase).toBe('function');
      expect(typeof result.current.reorderPhases).toBe('function');
    });
  });
});
