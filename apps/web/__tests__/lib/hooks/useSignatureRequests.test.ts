/**
 * @fileoverview Unit tests for useSignatureRequests and useSignatureStats hooks
 * Sprint 80: Unit Test Coverage — Signature Requests
 *
 * Tests cover:
 * - useSignatureRequests: Real-time subscription, filters (projectId, status), refresh, error handling
 * - useSignatureStats: Computed stats from requests (total, pending, signed, declined, expired)
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useSignatureRequests,
  useSignatureStats,
} from '@/lib/hooks/useSignatureRequests';

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field: string, dir?: string) => ({ field, dir, _type: 'orderBy' })),
  onSnapshot: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

import {
  onSnapshot,
  where,
} from 'firebase/firestore';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const mockOrgId = 'org-123';

function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: `sig-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    projectId: 'proj-1',
    documentType: 'contract',
    documentTitle: 'Service Agreement',
    signers: [{ name: 'John Doe', email: 'john@example.com', status: 'pending' }],
    currentSignerIndex: 0,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function toFirestoreDoc(item: Record<string, unknown>) {
  return {
    id: item.id,
    data: () => {
      const raw: Record<string, unknown> = { ...item };
      delete raw.id;
      // Convert Date fields to Firestore Timestamp-like objects
      for (const key of ['createdAt', 'updatedAt', 'expiresAt', 'completedAt']) {
        if (raw[key] instanceof Date) {
          const d = raw[key] as Date;
          raw[key] = { toDate: () => d };
        }
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
      setTimeout(() => onNext({ docs: [] }), 0);
      return jest.fn();
    }
  );
});

// =============================================================================
// useSignatureRequests
// =============================================================================

describe('useSignatureRequests', () => {
  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId })
      );
      expect(result.current.loading).toBe(true);
      expect(result.current.requests).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should return loading=false when no orgId', async () => {
      const { result } = renderHook(() =>
        useSignatureRequests({ orgId: '' })
      );
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.requests).toEqual([]);
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should fetch requests when orgId is provided', async () => {
      const mockRequests = [
        createMockRequest({ id: 'sig-1', status: 'pending' }),
        createMockRequest({ id: 'sig-2', status: 'signed' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: mockRequests.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId })
      );

      await waitFor(() => {
        expect(result.current.requests).toHaveLength(2);
      });

      expect(result.current.requests[0].id).toBe('sig-1');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('filters', () => {
    it('should apply orgId filter', () => {
      renderHook(() => useSignatureRequests({ orgId: mockOrgId }));
      expect(where).toHaveBeenCalledWith('orgId', '==', mockOrgId);
    });

    it('should apply projectId filter', () => {
      renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId, projectId: 'proj-42' })
      );
      expect(where).toHaveBeenCalledWith('projectId', '==', 'proj-42');
    });

    it('should apply status filter', () => {
      renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId, status: 'signed' })
      );
      expect(where).toHaveBeenCalledWith('status', '==', 'signed');
    });

    it('should apply both projectId and status filters', () => {
      renderHook(() =>
        useSignatureRequests({
          orgId: mockOrgId,
          projectId: 'proj-1',
          status: 'pending',
        })
      );
      expect(where).toHaveBeenCalledWith('projectId', '==', 'proj-1');
      expect(where).toHaveBeenCalledWith('status', '==', 'pending');
    });
  });

  describe('refresh', () => {
    it('should re-subscribe on refresh', async () => {
      const mockRequests = [
        createMockRequest({ id: 'sig-1' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: mockRequests.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId })
      );

      await waitFor(() => {
        expect(result.current.requests).toHaveLength(1);
      });

      const callCount = (onSnapshot as jest.Mock).mock.calls.length;

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect((onSnapshot as jest.Mock).mock.calls.length).toBeGreaterThan(callCount);
      });
    });
  });

  describe('error handling', () => {
    it('should set error on snapshot failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, _onNext: unknown, onError: (err: Error) => void) => {
          setTimeout(() => onError(new Error('Permission denied')), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Permission denied');
      expect(result.current.loading).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsub = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: [] }), 0);
          return mockUnsub;
        }
      );

      const { unmount } = renderHook(() =>
        useSignatureRequests({ orgId: mockOrgId })
      );

      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });

      unmount();
      expect(mockUnsub).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// useSignatureStats
// =============================================================================

describe('useSignatureStats', () => {
  it('should compute stats from signature requests', async () => {
    const mockRequests = [
      createMockRequest({ id: 'sig-1', status: 'pending' }),
      createMockRequest({ id: 'sig-2', status: 'viewed' }),
      createMockRequest({ id: 'sig-3', status: 'signed' }),
      createMockRequest({ id: 'sig-4', status: 'signed' }),
      createMockRequest({ id: 'sig-5', status: 'declined' }),
      createMockRequest({ id: 'sig-6', status: 'expired' }),
    ];

    (onSnapshot as jest.Mock).mockImplementation(
      (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => onNext({ docs: mockRequests.map(toFirestoreDoc) }), 0);
        return jest.fn();
      }
    );

    const { result } = renderHook(() => useSignatureStats(mockOrgId));

    await waitFor(() => {
      expect(result.current.stats.total).toBe(6);
    });

    expect(result.current.stats.pending).toBe(2); // pending + viewed
    expect(result.current.stats.signed).toBe(2);
    expect(result.current.stats.declined).toBe(1);
    expect(result.current.stats.expired).toBe(1);
  });

  it('should return zeros for empty data', async () => {
    const { result } = renderHook(() => useSignatureStats(mockOrgId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.total).toBe(0);
    expect(result.current.stats.pending).toBe(0);
    expect(result.current.stats.signed).toBe(0);
    expect(result.current.stats.declined).toBe(0);
    expect(result.current.stats.expired).toBe(0);
  });

  it('should pass loading from underlying hook', () => {
    (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
    const { result } = renderHook(() => useSignatureStats(mockOrgId));
    expect(result.current.loading).toBe(true);
  });
});
