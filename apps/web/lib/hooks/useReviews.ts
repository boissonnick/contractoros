/**
 * @fileoverview Review Management Hooks
 * Sprint 75: Review solicitation and reputation monitoring
 *
 * This module exports several hooks:
 * - useReviews: List and filter reviews with stats
 * - useReview: Single review with CRUD operations
 * - useReviewRequests: Review request management
 * - useReviewAutomationRules: Automation rule management
 * - useReviewResponseTemplates: Response template management
 *
 * Uses shared utilities:
 * - convertTimestamps from lib/firebase/timestamp-converter.ts
 * - useFirestoreCollection from lib/hooks/useFirestoreCollection.ts
 * - useFirestoreCrud from lib/hooks/useFirestoreCrud.ts
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  QueryConstraint,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';
import { useFirestoreCollection, createConverter } from '@/lib/hooks/useFirestoreCollection';
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';
import {
  Review,
  ReviewRequest,
  ReviewAutomationRule,
  ReviewResponseTemplate,
  ReviewStats,
  ReviewRequestStats,
  ReviewPlatform,
  ReviewRequestStatus,
  ReviewRequestChannel,
} from '@/types/review';

// =============================================================================
// COLLECTION PATHS
// =============================================================================

const getReviewsPath = (orgId: string) => `organizations/${orgId}/reviews`;
const getRequestsPath = (orgId: string) => `organizations/${orgId}/reviewRequests`;
const getRulesPath = (orgId: string) => `organizations/${orgId}/reviewAutomationRules`;
const getTemplatesPath = (orgId: string) => `organizations/${orgId}/reviewResponseTemplates`;

// =============================================================================
// DATE FIELDS FOR CONVERSION
// =============================================================================

const REVIEW_DATE_FIELDS = ['reviewDate', 'respondedAt', 'syncedAt', 'createdAt', 'updatedAt'] as const;
const REQUEST_DATE_FIELDS = ['sentAt', 'clickedAt', 'completedAt', 'createdAt', 'updatedAt'] as const;
const RULE_DATE_FIELDS = ['createdAt', 'updatedAt'] as const;
const TEMPLATE_DATE_FIELDS = ['createdAt', 'updatedAt'] as const;

// =============================================================================
// CONVERTERS
// =============================================================================

const reviewConverter = createConverter<Review>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, REVIEW_DATE_FIELDS),
} as Review));

const requestConverter = createConverter<ReviewRequest>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, REQUEST_DATE_FIELDS),
} as ReviewRequest));

const ruleConverter = createConverter<ReviewAutomationRule>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, RULE_DATE_FIELDS),
} as ReviewAutomationRule));

const templateConverter = createConverter<ReviewResponseTemplate>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, TEMPLATE_DATE_FIELDS),
} as ReviewResponseTemplate));

// =============================================================================
// useReviews - List reviews with filtering
// =============================================================================

interface UseReviewsOptions {
  orgId: string;
  platform?: ReviewPlatform;
  minRating?: number;
  maxRating?: number;
  projectId?: string;
  clientId?: string;
  limitCount?: number;
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: Error | null;
  stats: ReviewStats | null;
  refresh: () => void;
}

/**
 * Hook for fetching and filtering reviews with real-time updates.
 *
 * @param {UseReviewsOptions} options - Configuration options
 * @returns {UseReviewsReturn} Reviews data, stats, and operations
 *
 * @example
 * const { reviews, stats, loading } = useReviews({ orgId });
 *
 * @example
 * // Filter by platform and rating
 * const { reviews } = useReviews({
 *   orgId,
 *   platform: 'google',
 *   minRating: 4,
 * });
 */
export function useReviews(options: UseReviewsOptions): UseReviewsReturn {
  const { orgId, platform, minRating, maxRating, projectId, clientId, limitCount = 50 } = options;

  // Build constraints based on filters
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('reviewDate', 'desc'), limit(limitCount)];
    if (platform) {
      c.unshift(where('platform', '==', platform));
    }
    if (projectId) {
      c.unshift(where('projectId', '==', projectId));
    }
    if (clientId) {
      c.unshift(where('clientId', '==', clientId));
    }
    return c;
  }, [platform, projectId, clientId, limitCount]);

  // Use shared collection hook
  const { items, loading, error, refetch } = useFirestoreCollection<Review>({
    path: getReviewsPath(orgId),
    constraints,
    converter: reviewConverter,
    enabled: !!orgId,
  });

  // Client-side filtering for rating (Firestore doesn't support range queries with orderBy on different field)
  const filteredReviews = useMemo(() => {
    let result = items;
    if (minRating !== undefined) {
      result = result.filter((r) => r.rating >= minRating);
    }
    if (maxRating !== undefined) {
      result = result.filter((r) => r.rating <= maxRating);
    }
    return result;
  }, [items, minRating, maxRating]);

  // Calculate stats from reviews
  const stats = useMemo((): ReviewStats | null => {
    if (filteredReviews.length === 0) return null;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const platformBreakdown: Record<ReviewPlatform, number> = { google: 0, yelp: 0, facebook: 0, manual: 0 };
    let totalRating = 0;
    let respondedCount = 0;
    let totalResponseTime = 0;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let reviewsThisMonth = 0;
    let reviewsLastMonth = 0;

    filteredReviews.forEach((review) => {
      totalRating += review.rating;
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      platformBreakdown[review.platform] = (platformBreakdown[review.platform] || 0) + 1;

      if (review.responseText) {
        respondedCount++;
        if (review.respondedAt && review.reviewDate) {
          const responseTime = (review.respondedAt.getTime() - review.reviewDate.getTime()) / (1000 * 60 * 60);
          totalResponseTime += responseTime;
        }
      }

      const reviewDate = review.reviewDate;
      if (reviewDate >= thisMonth) {
        reviewsThisMonth++;
      } else if (reviewDate >= lastMonth && reviewDate < thisMonth) {
        reviewsLastMonth++;
      }
    });

    return {
      totalReviews: filteredReviews.length,
      averageRating: totalRating / filteredReviews.length,
      ratingDistribution,
      platformBreakdown,
      reviewsThisMonth,
      reviewsLastMonth,
      responseRate: (respondedCount / filteredReviews.length) * 100,
      averageResponseTime: respondedCount > 0 ? totalResponseTime / respondedCount : 0,
    };
  }, [filteredReviews]);

  return {
    reviews: filteredReviews,
    loading,
    error,
    stats,
    refresh: refetch,
  };
}

// =============================================================================
// useReview - Single review CRUD
// =============================================================================

interface UseReviewReturn {
  review: Review | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updateReview: (data: Partial<Review>) => Promise<void>;
  respondToReview: (responseText: string, respondedBy: string) => Promise<void>;
}

/**
 * Hook for fetching and managing a single review with real-time updates.
 *
 * @param {string} orgId - Organization ID
 * @param {string|null} reviewId - Review ID to fetch
 * @returns {UseReviewReturn} Review data and operations
 *
 * @example
 * const { review, respondToReview } = useReview(orgId, reviewId);
 * await respondToReview('Thank you for your feedback!', userId);
 */
export function useReview(orgId: string, reviewId: string | null): UseReviewReturn {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Use shared CRUD hook for update operations
  const { update } = useFirestoreCrud<Review>(
    getReviewsPath(orgId),
    { entityName: 'Review', showToast: false }
  );

  useEffect(() => {
    if (!orgId || !reviewId) {
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, getReviewsPath(orgId), reviewId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setReview(null);
          setLoading(false);
          return;
        }

        setReview(reviewConverter(snapshot.id, snapshot.data()));
        setLoading(false);
      },
      (err) => {
        logger.error('Error fetching review', { error: err, hook: 'useReviews' });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, reviewId, refreshKey]);

  const updateReview = useCallback(
    async (data: Partial<Review>) => {
      if (!orgId || !reviewId) throw new Error('Organization ID and Review ID required');
      await update(reviewId, data);
    },
    [orgId, reviewId, update]
  );

  const respondToReview = useCallback(
    async (responseText: string, respondedBy: string) => {
      if (!orgId || !reviewId) throw new Error('Organization ID and Review ID required');
      const docRef = doc(db, getReviewsPath(orgId), reviewId);
      await updateDoc(docRef, {
        responseText,
        respondedBy,
        respondedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    },
    [orgId, reviewId]
  );

  return { review, loading, error, refresh, updateReview, respondToReview };
}

// =============================================================================
// useReviewRequests - Review request management
// =============================================================================

interface UseReviewRequestsOptions {
  orgId: string;
  status?: ReviewRequestStatus;
  projectId?: string;
  clientId?: string;
  limitCount?: number;
}

interface UseReviewRequestsReturn {
  requests: ReviewRequest[];
  loading: boolean;
  error: Error | null;
  stats: ReviewRequestStats | null;
  createRequest: (data: Omit<ReviewRequest, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>) => Promise<string>;
  updateRequest: (requestId: string, data: Partial<ReviewRequest>) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  refresh: () => void;
}

/**
 * Hook for managing review requests with real-time updates.
 *
 * @param {UseReviewRequestsOptions} options - Configuration options
 * @returns {UseReviewRequestsReturn} Requests data, stats, and CRUD operations
 *
 * @example
 * const { requests, createRequest, stats } = useReviewRequests({ orgId });
 * await createRequest({ projectId, clientId, channel: 'email', ... });
 */
export function useReviewRequests(options: UseReviewRequestsOptions): UseReviewRequestsReturn {
  const { orgId, status, projectId, clientId, limitCount = 50 } = options;

  // Build constraints
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(limitCount)];
    if (status) {
      c.unshift(where('status', '==', status));
    }
    if (projectId) {
      c.unshift(where('projectId', '==', projectId));
    }
    if (clientId) {
      c.unshift(where('clientId', '==', clientId));
    }
    return c;
  }, [status, projectId, clientId, limitCount]);

  // Use shared collection hook
  const { items: requests, loading, error, refetch } = useFirestoreCollection<ReviewRequest>({
    path: getRequestsPath(orgId),
    constraints,
    converter: requestConverter,
    enabled: !!orgId,
  });

  // Use shared CRUD hook
  const { create, update, remove } = useFirestoreCrud<ReviewRequest>(
    getRequestsPath(orgId),
    { entityName: 'Review request', showToast: true }
  );

  // Calculate stats
  const stats = useMemo((): ReviewRequestStats | null => {
    if (requests.length === 0) return null;

    const byChannel: Record<ReviewRequestChannel, number> = { sms: 0, email: 0 };
    let sentCount = 0;
    let clickedCount = 0;
    let completedCount = 0;
    let pendingCount = 0;

    requests.forEach((req) => {
      byChannel[req.channel] = (byChannel[req.channel] || 0) + 1;

      if (req.status === 'pending') pendingCount++;
      if (req.status !== 'pending' && req.status !== 'failed') sentCount++;
      if (req.clickedAt) clickedCount++;
      if (req.status === 'completed') completedCount++;
    });

    return {
      totalSent: sentCount,
      pendingCount,
      clickRate: sentCount > 0 ? (clickedCount / sentCount) * 100 : 0,
      conversionRate: sentCount > 0 ? (completedCount / sentCount) * 100 : 0,
      byChannel,
    };
  }, [requests]);

  const createRequest = useCallback(
    async (data: Omit<ReviewRequest, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>) => {
      if (!orgId) throw new Error('Organization ID required');
      return create({ ...data, retryCount: 0 } as Omit<ReviewRequest, 'id' | 'createdAt' | 'updatedAt'>);
    },
    [orgId, create]
  );

  const updateRequest = useCallback(
    async (requestId: string, data: Partial<ReviewRequest>) => {
      if (!orgId) throw new Error('Organization ID required');
      await update(requestId, data);
    },
    [orgId, update]
  );

  const deleteRequest = useCallback(
    async (requestId: string) => {
      if (!orgId) throw new Error('Organization ID required');
      await remove(requestId);
    },
    [orgId, remove]
  );

  return { requests, loading, error, stats, createRequest, updateRequest, deleteRequest, refresh: refetch };
}

// =============================================================================
// useReviewAutomationRules - Automation rule management
// =============================================================================

interface UseAutomationRulesReturn {
  rules: ReviewAutomationRule[];
  loading: boolean;
  error: Error | null;
  createRule: (data: Omit<ReviewAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'requestsSent' | 'reviewsReceived'>) => Promise<string>;
  updateRule: (ruleId: string, data: Partial<ReviewAutomationRule>) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  refresh: () => void;
}

/**
 * Hook for managing review automation rules.
 *
 * @param {string} orgId - Organization ID
 * @returns {UseAutomationRulesReturn} Rules data and CRUD operations
 *
 * @example
 * const { rules, createRule, toggleRule } = useReviewAutomationRules(orgId);
 * await toggleRule(ruleId, false); // Disable rule
 */
export function useReviewAutomationRules(orgId: string): UseAutomationRulesReturn {
  const constraints = useMemo(() => [orderBy('createdAt', 'desc')], []);

  // Use shared collection hook
  const { items: rules, loading, error, refetch } = useFirestoreCollection<ReviewAutomationRule>({
    path: getRulesPath(orgId),
    constraints,
    converter: ruleConverter,
    enabled: !!orgId,
  });

  // Use shared CRUD hook
  const { create, update, remove } = useFirestoreCrud<ReviewAutomationRule>(
    getRulesPath(orgId),
    { entityName: 'Automation rule', showToast: true }
  );

  const createRule = useCallback(
    async (data: Omit<ReviewAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'requestsSent' | 'reviewsReceived'>) => {
      if (!orgId) throw new Error('Organization ID required');
      return create({
        ...data,
        requestsSent: 0,
        reviewsReceived: 0,
      } as Omit<ReviewAutomationRule, 'id' | 'createdAt' | 'updatedAt'>);
    },
    [orgId, create]
  );

  const updateRule = useCallback(
    async (ruleId: string, data: Partial<ReviewAutomationRule>) => {
      if (!orgId) throw new Error('Organization ID required');
      await update(ruleId, data);
    },
    [orgId, update]
  );

  const deleteRule = useCallback(
    async (ruleId: string) => {
      if (!orgId) throw new Error('Organization ID required');
      await remove(ruleId);
    },
    [orgId, remove]
  );

  const toggleRule = useCallback(
    async (ruleId: string, enabled: boolean) => {
      if (!orgId) throw new Error('Organization ID required');
      await update(ruleId, { enabled });
    },
    [orgId, update]
  );

  return { rules, loading, error, createRule, updateRule, deleteRule, toggleRule, refresh: refetch };
}

// =============================================================================
// useReviewResponseTemplates - Response template management
// =============================================================================

interface UseResponseTemplatesReturn {
  templates: ReviewResponseTemplate[];
  loading: boolean;
  error: Error | null;
  createTemplate: (data: Omit<ReviewResponseTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<string>;
  updateTemplate: (templateId: string, data: Partial<ReviewResponseTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  incrementUsage: (templateId: string) => Promise<void>;
  refresh: () => void;
}

/**
 * Hook for managing review response templates.
 *
 * @param {string} orgId - Organization ID
 * @returns {UseResponseTemplatesReturn} Templates data and CRUD operations
 *
 * @example
 * const { templates, createTemplate, incrementUsage } = useReviewResponseTemplates(orgId);
 * await incrementUsage(templateId); // Track template usage
 */
export function useReviewResponseTemplates(orgId: string): UseResponseTemplatesReturn {
  const constraints = useMemo(() => [orderBy('usageCount', 'desc')], []);

  // Use shared collection hook
  const { items: templates, loading, error, refetch } = useFirestoreCollection<ReviewResponseTemplate>({
    path: getTemplatesPath(orgId),
    constraints,
    converter: templateConverter,
    enabled: !!orgId,
  });

  // Use shared CRUD hook
  const { create, update, remove } = useFirestoreCrud<ReviewResponseTemplate>(
    getTemplatesPath(orgId),
    { entityName: 'Response template', showToast: true }
  );

  const createTemplate = useCallback(
    async (data: Omit<ReviewResponseTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
      if (!orgId) throw new Error('Organization ID required');
      return create({
        ...data,
        usageCount: 0,
      } as Omit<ReviewResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>);
    },
    [orgId, create]
  );

  const updateTemplate = useCallback(
    async (templateId: string, data: Partial<ReviewResponseTemplate>) => {
      if (!orgId) throw new Error('Organization ID required');
      await update(templateId, data);
    },
    [orgId, update]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!orgId) throw new Error('Organization ID required');
      await remove(templateId);
    },
    [orgId, remove]
  );

  const incrementUsage = useCallback(
    async (templateId: string) => {
      if (!orgId) throw new Error('Organization ID required');
      const docRef = doc(db, getTemplatesPath(orgId), templateId);
      await updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: Timestamp.now(),
      });
    },
    [orgId]
  );

  return { templates, loading, error, createTemplate, updateTemplate, deleteTemplate, incrementUsage, refresh: refetch };
}

// =============================================================================
// LABEL EXPORTS (re-exported from types for convenience)
// =============================================================================

export {
  REVIEW_PLATFORM_LABELS,
  REVIEW_REQUEST_STATUS_LABELS,
  REVIEW_REQUEST_CHANNEL_LABELS,
  REVIEW_AUTOMATION_TRIGGER_LABELS,
} from '@/types/review';
import { logger } from '@/lib/utils/logger';
