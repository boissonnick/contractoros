/**
 * @fileoverview Unit tests for useReviews hooks
 * Sprint 77: Unit Test Coverage
 *
 * Tests cover:
 * - useReviews: List and filter reviews with stats
 * - useReview: Single review CRUD
 * - useReviewRequests: Review request management
 * - useReviewAutomationRules: Automation rule management
 * - useReviewResponseTemplates: Response template management
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useReviews,
  useReview,
  useReviewRequests,
  useReviewAutomationRules,
  useReviewResponseTemplates,
} from '@/lib/hooks/useReviews';
import { Review, ReviewRequest, ReviewAutomationRule, ReviewResponseTemplate } from '@/types/review';

// =============================================================================
// MOCKS
// =============================================================================

// Mock Firestore
const mockOnSnapshot = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  limit: jest.fn((n) => ({ n, _type: 'limit' })),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((d) => ({ toDate: () => d })),
  },
  increment: jest.fn((n) => ({ _type: 'increment', value: n })),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Mock useFirestoreCollection
const mockRefetch = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCollection', () => ({
  useFirestoreCollection: jest.fn(),
  createConverter: jest.fn((fn) => fn),
}));

// Mock useFirestoreCrud
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCrud', () => ({
  useFirestoreCrud: jest.fn(() => ({
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
  })),
}));

// Import mocked modules for assertions
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';
import { onSnapshot, updateDoc, doc } from 'firebase/firestore';

const mockUseFirestoreCollection = useFirestoreCollection as jest.Mock;
const mockUseFirestoreCrud = useFirestoreCrud as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'test-org-123';

const createMockReview = (overrides: Partial<Review> = {}): Review => ({
  id: `review-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  platform: 'google',
  rating: 5,
  reviewText: 'Great service!',
  reviewerName: 'John Doe',
  reviewDate: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockRequest = (overrides: Partial<ReviewRequest> = {}): ReviewRequest => ({
  id: `request-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  projectId: 'project-1',
  clientId: 'client-1',
  channel: 'email',
  status: 'pending',
  recipientName: 'Jane Doe',
  recipientEmail: 'jane@example.com',
  retryCount: 0,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockRule = (overrides: Partial<ReviewAutomationRule> = {}): ReviewAutomationRule => ({
  id: `rule-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  name: 'Post-Completion Request',
  enabled: true,
  trigger: 'project_completed',
  delayDays: 3,
  channel: 'email',
  requestsSent: 0,
  reviewsReceived: 0,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockTemplate = (overrides: Partial<ReviewResponseTemplate> = {}): ReviewResponseTemplate => ({
  id: `template-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  name: 'Positive Review Response',
  content: 'Thank you for your kind words!',
  category: 'positive',
  usageCount: 5,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock for useFirestoreCollection
  mockUseFirestoreCollection.mockReturnValue({
    items: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
  });

  // Default mock for useFirestoreCrud
  mockUseFirestoreCrud.mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
  });

  // Default mock implementations
  mockCreate.mockResolvedValue('new-id');
  mockUpdate.mockResolvedValue(undefined);
  mockRemove.mockResolvedValue(undefined);
});

// =============================================================================
// useReviews TESTS
// =============================================================================

describe('useReviews', () => {
  describe('basic functionality', () => {
    it('should return empty reviews when no data', () => {
      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      expect(result.current.reviews).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.stats).toBe(null);
    });

    it('should return reviews from Firestore collection', () => {
      const mockReviews = [
        createMockReview({ id: 'review-1', rating: 5 }),
        createMockReview({ id: 'review-2', rating: 4 }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockReviews,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      expect(result.current.reviews).toHaveLength(2);
      expect(result.current.reviews[0].id).toBe('review-1');
    });

    it('should show loading state', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      expect(result.current.loading).toBe(true);
    });

    it('should show error state', () => {
      const error = new Error('Firestore error');
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      expect(result.current.error).toBe(error);
    });

    it('should not fetch data without orgId', () => {
      renderHook(() => useReviews({ orgId: '' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('should call refetch when refresh is invoked', () => {
      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      result.current.refresh();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('filtering', () => {
    it('should filter by platform', () => {
      renderHook(() => useReviews({ orgId: mockOrgId, platform: 'google' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'platform', op: '==', value: 'google' }),
          ]),
        })
      );
    });

    it('should filter by projectId', () => {
      renderHook(() => useReviews({ orgId: mockOrgId, projectId: 'project-1' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'projectId', op: '==', value: 'project-1' }),
          ]),
        })
      );
    });

    it('should filter by clientId', () => {
      renderHook(() => useReviews({ orgId: mockOrgId, clientId: 'client-1' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'clientId', op: '==', value: 'client-1' }),
          ]),
        })
      );
    });

    it('should apply client-side minRating filter', () => {
      const mockReviews = [
        createMockReview({ id: 'review-1', rating: 5 }),
        createMockReview({ id: 'review-2', rating: 3 }),
        createMockReview({ id: 'review-3', rating: 4 }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockReviews,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId, minRating: 4 }));

      expect(result.current.reviews).toHaveLength(2);
      expect(result.current.reviews.every((r) => r.rating >= 4)).toBe(true);
    });

    it('should apply client-side maxRating filter', () => {
      const mockReviews = [
        createMockReview({ id: 'review-1', rating: 5 }),
        createMockReview({ id: 'review-2', rating: 3 }),
        createMockReview({ id: 'review-3', rating: 4 }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockReviews,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId, maxRating: 4 }));

      expect(result.current.reviews).toHaveLength(2);
      expect(result.current.reviews.every((r) => r.rating <= 4)).toBe(true);
    });

    it('should respect limitCount option', () => {
      renderHook(() => useReviews({ orgId: mockOrgId, limitCount: 25 }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([expect.objectContaining({ n: 25, _type: 'limit' })]),
        })
      );
    });
  });

  describe('stats calculation', () => {
    it('should calculate review stats correctly', () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);

      const mockReviews = [
        createMockReview({ rating: 5, platform: 'google', reviewDate: thisMonth }),
        createMockReview({ rating: 4, platform: 'google', reviewDate: thisMonth }),
        createMockReview({ rating: 5, platform: 'yelp', reviewDate: lastMonth }),
        createMockReview({
          rating: 3,
          platform: 'manual',
          reviewDate: lastMonth,
          responseText: 'Thanks!',
          respondedAt: new Date(lastMonth.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockReviews,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      expect(result.current.stats).not.toBeNull();
      expect(result.current.stats?.totalReviews).toBe(4);
      expect(result.current.stats?.averageRating).toBe(4.25);
      expect(result.current.stats?.ratingDistribution[5]).toBe(2);
      expect(result.current.stats?.ratingDistribution[4]).toBe(1);
      expect(result.current.stats?.ratingDistribution[3]).toBe(1);
      expect(result.current.stats?.platformBreakdown.google).toBe(2);
      expect(result.current.stats?.platformBreakdown.yelp).toBe(1);
      expect(result.current.stats?.platformBreakdown.manual).toBe(1);
      expect(result.current.stats?.reviewsThisMonth).toBe(2);
      expect(result.current.stats?.reviewsLastMonth).toBe(2);
      expect(result.current.stats?.responseRate).toBe(25);
    });

    it('should return null stats when no reviews', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviews({ orgId: mockOrgId }));

      expect(result.current.stats).toBeNull();
    });
  });
});

// =============================================================================
// useReview TESTS
// =============================================================================

describe('useReview', () => {
  beforeEach(() => {
    (onSnapshot as jest.Mock).mockImplementation((docRef, onNext, onError) => {
      // Return unsubscribe function
      return jest.fn();
    });
    (doc as jest.Mock).mockReturnValue({ id: 'review-1', path: 'reviews/review-1' });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  describe('basic functionality', () => {
    it('should return null review when reviewId is null', () => {
      const { result } = renderHook(() => useReview(mockOrgId, null));

      expect(result.current.review).toBeNull();
    });

    it('should fetch review on mount', () => {
      renderHook(() => useReview(mockOrgId, 'review-1'));

      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should not fetch without orgId', () => {
      renderHook(() => useReview('', 'review-1'));

      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should set review from snapshot', async () => {
      const mockReview = createMockReview({ id: 'review-1' });

      (onSnapshot as jest.Mock).mockImplementation((docRef, onNext) => {
        setTimeout(() => {
          onNext({
            exists: () => true,
            id: 'review-1',
            data: () => mockReview,
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useReview(mockOrgId, 'review-1'));

      await waitFor(() => {
        expect(result.current.review).not.toBeNull();
      });

      expect(result.current.review?.id).toBe('review-1');
    });

    it('should handle non-existent review', async () => {
      (onSnapshot as jest.Mock).mockImplementation((docRef, onNext) => {
        setTimeout(() => {
          onNext({
            exists: () => false,
            id: 'review-1',
            data: () => null,
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useReview(mockOrgId, 'review-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.review).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Fetch error');

      (onSnapshot as jest.Mock).mockImplementation((docRef, onNext, onError) => {
        setTimeout(() => onError(error), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useReview(mockOrgId, 'review-1'));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Fetch error');
    });
  });

  describe('updateReview', () => {
    it('should call update with correct data', async () => {
      const { result } = renderHook(() => useReview(mockOrgId, 'review-1'));

      await act(async () => {
        await result.current.updateReview({ reviewText: 'Updated text' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('review-1', { reviewText: 'Updated text' });
    });

    it('should throw error without orgId', async () => {
      const { result } = renderHook(() => useReview('', 'review-1'));

      await expect(result.current.updateReview({ reviewText: 'Test' })).rejects.toThrow(
        'Organization ID and Review ID required'
      );
    });

    it('should throw error without reviewId', async () => {
      const { result } = renderHook(() => useReview(mockOrgId, null));

      await expect(result.current.updateReview({ reviewText: 'Test' })).rejects.toThrow(
        'Organization ID and Review ID required'
      );
    });
  });

  describe('respondToReview', () => {
    it('should update review with response data', async () => {
      const { result } = renderHook(() => useReview(mockOrgId, 'review-1'));

      await act(async () => {
        await result.current.respondToReview('Thank you!', 'user-1');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          responseText: 'Thank you!',
          respondedBy: 'user-1',
        })
      );
    });

    it('should throw error without orgId or reviewId', async () => {
      const { result } = renderHook(() => useReview('', 'review-1'));

      await expect(result.current.respondToReview('Thanks', 'user-1')).rejects.toThrow(
        'Organization ID and Review ID required'
      );
    });
  });

  describe('refresh', () => {
    it('should trigger refetch by updating refreshKey', () => {
      const { result, rerender } = renderHook(() => useReview(mockOrgId, 'review-1'));

      const initialCallCount = (onSnapshot as jest.Mock).mock.calls.length;

      act(() => {
        result.current.refresh();
      });

      rerender();

      expect((onSnapshot as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});

// =============================================================================
// useReviewRequests TESTS
// =============================================================================

describe('useReviewRequests', () => {
  describe('basic functionality', () => {
    it('should return empty requests when no data', () => {
      const { result } = renderHook(() => useReviewRequests({ orgId: mockOrgId }));

      expect(result.current.requests).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.stats).toBe(null);
    });

    it('should return requests from Firestore', () => {
      const mockRequests = [
        createMockRequest({ id: 'request-1', status: 'pending' }),
        createMockRequest({ id: 'request-2', status: 'sent' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockRequests,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviewRequests({ orgId: mockOrgId }));

      expect(result.current.requests).toHaveLength(2);
    });

    it('should not fetch without orgId', () => {
      renderHook(() => useReviewRequests({ orgId: '' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('filtering', () => {
    it('should filter by status', () => {
      renderHook(() => useReviewRequests({ orgId: mockOrgId, status: 'pending' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'status', op: '==', value: 'pending' }),
          ]),
        })
      );
    });

    it('should filter by projectId', () => {
      renderHook(() => useReviewRequests({ orgId: mockOrgId, projectId: 'project-1' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'projectId', op: '==', value: 'project-1' }),
          ]),
        })
      );
    });

    it('should filter by clientId', () => {
      renderHook(() => useReviewRequests({ orgId: mockOrgId, clientId: 'client-1' }));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'clientId', op: '==', value: 'client-1' }),
          ]),
        })
      );
    });
  });

  describe('stats calculation', () => {
    it('should calculate request stats correctly', () => {
      const mockRequests = [
        createMockRequest({ status: 'pending', channel: 'email' }),
        createMockRequest({ status: 'sent', channel: 'email', clickedAt: new Date() }),
        createMockRequest({ status: 'completed', channel: 'sms', clickedAt: new Date() }),
        createMockRequest({ status: 'failed', channel: 'sms' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockRequests,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviewRequests({ orgId: mockOrgId }));

      expect(result.current.stats).not.toBeNull();
      expect(result.current.stats?.totalSent).toBe(2); // sent + completed
      expect(result.current.stats?.pendingCount).toBe(1);
      expect(result.current.stats?.byChannel.email).toBe(2);
      expect(result.current.stats?.byChannel.sms).toBe(2);
      expect(result.current.stats?.clickRate).toBe(100); // 2/2 * 100
      expect(result.current.stats?.conversionRate).toBe(50); // 1/2 * 100
    });
  });

  describe('CRUD operations', () => {
    it('should create request with retryCount initialized', async () => {
      const { result } = renderHook(() => useReviewRequests({ orgId: mockOrgId }));

      const newRequest = {
        orgId: mockOrgId,
        projectId: 'project-1',
        clientId: 'client-1',
        channel: 'email' as const,
        status: 'pending' as const,
        recipientName: 'John',
        recipientEmail: 'john@example.com',
      };

      await act(async () => {
        await result.current.createRequest(newRequest);
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newRequest,
          retryCount: 0,
        })
      );
    });

    it('should throw error when creating without orgId', async () => {
      const { result } = renderHook(() => useReviewRequests({ orgId: '' }));

      await expect(
        result.current.createRequest({
          orgId: '',
          projectId: 'p1',
          clientId: 'c1',
          channel: 'email',
          status: 'pending',
          recipientName: 'Test',
          recipientEmail: 'test@example.com',
        })
      ).rejects.toThrow('Organization ID required');
    });

    it('should update request', async () => {
      const { result } = renderHook(() => useReviewRequests({ orgId: mockOrgId }));

      await act(async () => {
        await result.current.updateRequest('request-1', { status: 'sent' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('request-1', { status: 'sent' });
    });

    it('should delete request', async () => {
      const { result } = renderHook(() => useReviewRequests({ orgId: mockOrgId }));

      await act(async () => {
        await result.current.deleteRequest('request-1');
      });

      expect(mockRemove).toHaveBeenCalledWith('request-1');
    });
  });
});

// =============================================================================
// useReviewAutomationRules TESTS
// =============================================================================

describe('useReviewAutomationRules', () => {
  describe('basic functionality', () => {
    it('should return empty rules when no data', () => {
      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      expect(result.current.rules).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should return rules from Firestore', () => {
      const mockRules = [
        createMockRule({ id: 'rule-1', name: 'Rule 1' }),
        createMockRule({ id: 'rule-2', name: 'Rule 2' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockRules,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      expect(result.current.rules).toHaveLength(2);
    });

    it('should not fetch without orgId', () => {
      renderHook(() => useReviewAutomationRules(''));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('CRUD operations', () => {
    it('should create rule with initialized counters', async () => {
      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      const newRule = {
        orgId: mockOrgId,
        name: 'New Rule',
        enabled: true,
        trigger: 'project_completed' as const,
        delayDays: 3,
        channel: 'email' as const,
      };

      await act(async () => {
        await result.current.createRule(newRule);
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newRule,
          requestsSent: 0,
          reviewsReceived: 0,
        })
      );
    });

    it('should update rule', async () => {
      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      await act(async () => {
        await result.current.updateRule('rule-1', { name: 'Updated Rule' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('rule-1', { name: 'Updated Rule' });
    });

    it('should delete rule', async () => {
      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      await act(async () => {
        await result.current.deleteRule('rule-1');
      });

      expect(mockRemove).toHaveBeenCalledWith('rule-1');
    });

    it('should toggle rule enabled state', async () => {
      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      await act(async () => {
        await result.current.toggleRule('rule-1', false);
      });

      expect(mockUpdate).toHaveBeenCalledWith('rule-1', { enabled: false });
    });

    it('should throw error when toggling without orgId', async () => {
      const { result } = renderHook(() => useReviewAutomationRules(''));

      await expect(result.current.toggleRule('rule-1', true)).rejects.toThrow('Organization ID required');
    });
  });

  describe('refresh', () => {
    it('should call refetch', () => {
      const { result } = renderHook(() => useReviewAutomationRules(mockOrgId));

      result.current.refresh();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// useReviewResponseTemplates TESTS
// =============================================================================

describe('useReviewResponseTemplates', () => {
  describe('basic functionality', () => {
    it('should return empty templates when no data', () => {
      const { result } = renderHook(() => useReviewResponseTemplates(mockOrgId));

      expect(result.current.templates).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should return templates from Firestore', () => {
      const mockTemplates = [
        createMockTemplate({ id: 'template-1', name: 'Template 1' }),
        createMockTemplate({ id: 'template-2', name: 'Template 2' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockTemplates,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useReviewResponseTemplates(mockOrgId));

      expect(result.current.templates).toHaveLength(2);
    });

    it('should order templates by usageCount desc', () => {
      renderHook(() => useReviewResponseTemplates(mockOrgId));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'usageCount', dir: 'desc' }),
          ]),
        })
      );
    });
  });

  describe('CRUD operations', () => {
    it('should create template with initialized usageCount', async () => {
      const { result } = renderHook(() => useReviewResponseTemplates(mockOrgId));

      const newTemplate = {
        orgId: mockOrgId,
        name: 'New Template',
        content: 'Thank you!',
        category: 'positive' as const,
      };

      await act(async () => {
        await result.current.createTemplate(newTemplate);
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newTemplate,
          usageCount: 0,
        })
      );
    });

    it('should update template', async () => {
      const { result } = renderHook(() => useReviewResponseTemplates(mockOrgId));

      await act(async () => {
        await result.current.updateTemplate('template-1', { content: 'Updated content' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('template-1', { content: 'Updated content' });
    });

    it('should delete template', async () => {
      const { result } = renderHook(() => useReviewResponseTemplates(mockOrgId));

      await act(async () => {
        await result.current.deleteTemplate('template-1');
      });

      expect(mockRemove).toHaveBeenCalledWith('template-1');
    });
  });

  describe('incrementUsage', () => {
    beforeEach(() => {
      (doc as jest.Mock).mockReturnValue({ id: 'template-1' });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
    });

    it('should increment template usage count', async () => {
      const { result } = renderHook(() => useReviewResponseTemplates(mockOrgId));

      await act(async () => {
        await result.current.incrementUsage('template-1');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          usageCount: expect.objectContaining({ _type: 'increment', value: 1 }),
        })
      );
    });

    it('should throw error without orgId', async () => {
      const { result } = renderHook(() => useReviewResponseTemplates(''));

      await expect(result.current.incrementUsage('template-1')).rejects.toThrow('Organization ID required');
    });
  });
});
