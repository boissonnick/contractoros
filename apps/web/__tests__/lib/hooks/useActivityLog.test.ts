/**
 * @fileoverview Unit tests for useActivityLog and usePaginatedActivityLog hooks
 * Sprint 80: Unit Test Coverage — Activity Log
 *
 * Tests cover:
 * - useActivityLog: Real-time activity log with timeAgo, missing index handling
 * - usePaginatedActivityLog: Cursor-based pagination, filters, loadMore, refresh
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useActivityLog,
  usePaginatedActivityLog,
} from '@/lib/hooks/useActivityLog';
import { ActivityLogEntry } from '@/lib/activity';

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field: string, dir?: string) => ({ field, dir, _type: 'orderBy' })),
  limit: jest.fn((n: number) => ({ n, _type: 'limit' })),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
  startAfter: jest.fn((doc: unknown) => ({ _type: 'startAfter', doc })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
  },
  DocumentSnapshot: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

import {
  onSnapshot,
  getDocs,
  where,
  limit,
} from 'firebase/firestore';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const mockOrgId = 'org-123';

function createMockActivity(overrides: Partial<ActivityLogEntry> = {}): ActivityLogEntry {
  return {
    id: `act-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    type: 'project',
    message: 'Created project Kitchen Remodel',
    userId: 'user-123',
    userName: 'Test User',
    projectId: 'project-1',
    projectName: 'Kitchen Remodel',
    timestamp: new Date(),
    ...overrides,
  };
}

function toFirestoreActivityDoc(item: ActivityLogEntry) {
  return {
    id: item.id,
    data: () => {
      const raw: Record<string, unknown> = { ...item };
      delete raw.id;
      if (raw.timestamp instanceof Date) {
        const ts = raw.timestamp;
        raw.timestamp = { toDate: () => ts };
      }
      return raw;
    },
  };
}

// =============================================================================
// SETUP / TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  (onSnapshot as jest.Mock).mockImplementation(
    (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
      setTimeout(() => {
        onNext({ docs: [] });
      }, 0);
      return jest.fn();
    }
  );

  (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
});

// =============================================================================
// useActivityLog
// =============================================================================

describe('useActivityLog', () => {
  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() => useActivityLog(mockOrgId));
      expect(result.current.loading).toBe(true);
      expect(result.current.activities).toEqual([]);
    });

    it('should return empty activities when no data', async () => {
      const { result } = renderHook(() => useActivityLog(mockOrgId));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.activities).toEqual([]);
    });

    it('should set loading=false when no orgId', async () => {
      const { result } = renderHook(() => useActivityLog(undefined));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.activities).toEqual([]);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching activities', () => {
    it('should fetch activities with timeAgo field', async () => {
      const recentDate = new Date(Date.now() - 30000); // 30 seconds ago
      const mockActivities = [
        createMockActivity({ id: 'act-1', timestamp: recentDate, message: 'Created project' }),
        createMockActivity({ id: 'act-2', timestamp: new Date(Date.now() - 3600000), message: 'Updated task' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => {
            onNext({
              docs: mockActivities.map(toFirestoreActivityDoc),
            });
          }, 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useActivityLog(mockOrgId));

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(2);
      });

      expect(result.current.activities[0].id).toBe('act-1');
      expect(result.current.activities[0].timeAgo).toBe('just now');
      expect(result.current.activities[1].timeAgo).toBe('1h ago');
      expect(result.current.loading).toBe(false);
    });

    it('should use correct limit', () => {
      renderHook(() => useActivityLog(mockOrgId, 50));
      expect(limit).toHaveBeenCalledWith(50);
    });

    it('should use default limit of 20', () => {
      renderHook(() => useActivityLog(mockOrgId));
      expect(limit).toHaveBeenCalledWith(20);
    });
  });

  describe('error handling', () => {
    it('should handle missing index error gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, _onNext: unknown, onError: (err: Error) => void) => {
          setTimeout(() => {
            onError(new Error('The query requires an index'));
          }, 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useActivityLog(mockOrgId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing Firestore index')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle general error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, _onNext: unknown, onError: (err: Error) => void) => {
          setTimeout(() => {
            onError(new Error('Network error'));
          }, 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useActivityLog(mockOrgId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('useActivityLog error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: [] }), 0);
          return mockUnsubscribe;
        }
      );

      const { unmount } = renderHook(() => useActivityLog(mockOrgId));
      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

// =============================================================================
// usePaginatedActivityLog
// =============================================================================

describe('usePaginatedActivityLog', () => {
  describe('initial state', () => {
    it('should return uninitialized state when no orgId', () => {
      const { result } = renderHook(() => usePaginatedActivityLog(undefined));
      expect(result.current.initialized).toBe(false);
      expect(result.current.activities).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalLoaded).toBe(0);
    });

    it('should not fetch when no orgId', async () => {
      renderHook(() => usePaginatedActivityLog(undefined));
      await waitFor(() => {
        expect(getDocs).not.toHaveBeenCalled();
      });
    });
  });

  describe('fetching initial page', () => {
    it('should fetch initial page on mount', async () => {
      const mockActivities = Array.from({ length: 5 }, (_, i) =>
        createMockActivity({ id: `act-${i}`, timestamp: new Date(Date.now() - i * 60000) })
      );

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockActivities.map(toFirestoreActivityDoc),
      });

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.activities).toHaveLength(5);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(getDocs).toHaveBeenCalledTimes(1);
    });
  });

  describe('filters', () => {
    it('should apply projectId filter', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { projectId: 'project-42' })
      );

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });

      expect(where).toHaveBeenCalledWith('projectId', '==', 'project-42');
    });

    it('should apply userId filter', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { userId: 'user-42' })
      );

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });

      expect(where).toHaveBeenCalledWith('userId', '==', 'user-42');
    });

    it('should apply entityType filter', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { entityType: 'task' })
      );

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });

      expect(where).toHaveBeenCalledWith('type', '==', 'task');
    });
  });

  describe('pagination', () => {
    it('should determine hasMore when items exceed pageSize', async () => {
      const pageSize = 5;
      const mockActivities = Array.from({ length: pageSize + 1 }, (_, i) =>
        createMockActivity({ id: `act-${i}`, timestamp: new Date(Date.now() - i * 60000) })
      );

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockActivities.map(toFirestoreActivityDoc),
      });

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { pageSize })
      );

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.activities).toHaveLength(pageSize);
      expect(result.current.hasMore).toBe(true);
    });

    it('should set hasMore=false when items are less than or equal to pageSize', async () => {
      const pageSize = 10;
      const mockActivities = Array.from({ length: 3 }, (_, i) =>
        createMockActivity({ id: `act-${i}` })
      );

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockActivities.map(toFirestoreActivityDoc),
      });

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { pageSize })
      );

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.hasMore).toBe(false);
    });

    it('loadMore should do nothing when no more items', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.hasMore).toBe(false);

      const getDocsCallCount = (getDocs as jest.Mock).mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect((getDocs as jest.Mock).mock.calls.length).toBe(getDocsCallCount);
    });
  });

  describe('refresh', () => {
    it('should reset and re-fetch on refresh', async () => {
      const mockActivities = [
        createMockActivity({ id: 'act-1', message: 'First load' }),
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockActivities.map(toFirestoreActivityDoc),
      });

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId, { pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.activities).toHaveLength(1);
      expect((getDocs as jest.Mock).mock.calls.length).toBe(1);

      const refreshedActivities = [
        createMockActivity({ id: 'act-2', message: 'After refresh' }),
        createMockActivity({ id: 'act-3', message: 'Another' }),
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: refreshedActivities.map(toFirestoreActivityDoc),
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(2);
      });

      expect((getDocs as jest.Mock).mock.calls.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle missing index error with helpful message', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (getDocs as jest.Mock).mockRejectedValue(
        new Error('The query requires an index')
      );

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId)
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toContain('Missing Firestore index');
      expect(result.current.loading).toBe(false);

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle general error with message', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (getDocs as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const { result } = renderHook(() =>
        usePaginatedActivityLog(mockOrgId)
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBe('Permission denied');
      expect(result.current.loading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });
});
