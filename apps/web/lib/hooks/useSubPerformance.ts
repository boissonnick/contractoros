"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

// TODO: Replace with import from '@/types' once types agent adds SubPerformanceMetrics
type SubPerformanceMetrics = {
  subcontractorId: string;
  orgId: string;
  totalProjects: number;
  completedProjects: number;
  onTimePercentage: number;
  averageQualityRating: number;
  totalBidsSubmitted: number;
  bidsWon: number;
  winRate: number;
  averageResponseTime: number;
  lastUpdated: Date;
};

interface UseSubPerformanceReturn {
  metrics: SubPerformanceMetrics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Computes performance metrics for a subcontractor by aggregating
 * data from projects, bids, assignments, and tasks collections.
 */
export function useSubPerformance(subcontractorId: string | null): UseSubPerformanceReturn {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<SubPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const computeMetrics = useCallback(async () => {
    if (!subcontractorId || !profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignmentsSnap = await getDocs(
        query(
          collection(db, 'subAssignments'),
          where('subId', '==', subcontractorId),
          limit(500)
        )
      );

      const projectIds = new Set<string>();
      const completedProjectIds = new Set<string>();
      let onTimeCount = 0;
      let totalWithDeadline = 0;

      assignmentsSnap.docs.forEach((d) => {
        const data = d.data();
        const projectId = data.projectId as string;
        projectIds.add(projectId);

        if (data.status === 'completed') {
          completedProjectIds.add(projectId);

          const endDate = data.endDate instanceof Timestamp
            ? data.endDate.toDate()
            : data.endDate;
          const completedAt = data.completedAt instanceof Timestamp
            ? data.completedAt.toDate()
            : data.completedAt;

          if (endDate) {
            totalWithDeadline++;
            const actualEnd = completedAt || (
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : data.updatedAt
            );
            if (actualEnd && new Date(actualEnd as Date) <= new Date(endDate as Date)) {
              onTimeCount++;
            }
          }
        }
      });

      const tasksSnap = await getDocs(
        query(
          collection(db, 'tasks'),
          where('assignedSubcontractors', 'array-contains', subcontractorId),
          limit(500)
        )
      );

      tasksSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.projectId) {
          projectIds.add(data.projectId as string);
        }
      });

      const totalProjects = projectIds.size;
      const completedProjects = completedProjectIds.size;
      const onTimePercentage = totalWithDeadline > 0
        ? Math.round((onTimeCount / totalWithDeadline) * 100)
        : totalProjects > 0 ? 100 : 0;

      const bidsSnap = await getDocs(
        query(
          collection(db, 'bids'),
          where('subId', '==', subcontractorId),
          limit(500)
        )
      );

      let totalBidsSubmitted = 0;
      let bidsWon = 0;
      let totalResponseTimeMs = 0;
      let bidsWithResponseTime = 0;

      bidsSnap.docs.forEach((d) => {
        const data = d.data();
        totalBidsSubmitted++;

        if (data.status === 'accepted' || data.status === 'awarded') {
          bidsWon++;
        }

        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt;
        const submittedAt = data.submittedAt instanceof Timestamp
          ? data.submittedAt.toDate()
          : data.submittedAt;

        if (createdAt && submittedAt) {
          const responseMs = new Date(submittedAt as Date).getTime() - new Date(createdAt as Date).getTime();
          if (responseMs > 0) {
            totalResponseTimeMs += responseMs;
            bidsWithResponseTime++;
          }
        }
      });

      const winRate = totalBidsSubmitted > 0
        ? Math.round((bidsWon / totalBidsSubmitted) * 100)
        : 0;

      const averageResponseTime = bidsWithResponseTime > 0
        ? Math.round((totalResponseTimeMs / bidsWithResponseTime) / (1000 * 60 * 60))
        : 0;

      let averageQualityRating = 0;
      try {
        const reviewsSnap = await getDocs(
          query(
            collection(db, 'organizations', profile.orgId, 'reviews'),
            where('subjectId', '==', subcontractorId),
            limit(100)
          )
        );

        if (reviewsSnap.docs.length > 0) {
          const totalRating = reviewsSnap.docs.reduce((sum, d) => {
            const rating = d.data().rating as number;
            return sum + (typeof rating === 'number' ? rating : 0);
          }, 0);
          averageQualityRating = Math.round((totalRating / reviewsSnap.docs.length) * 10) / 10;
        }
      } catch {
        averageQualityRating = 0;
      }

      setMetrics({
        subcontractorId,
        orgId: profile.orgId,
        totalProjects,
        completedProjects,
        onTimePercentage,
        averageQualityRating,
        totalBidsSubmitted,
        bidsWon,
        winRate,
        averageResponseTime,
        lastUpdated: new Date(),
      });
    } catch (err) {
      logger.error('Failed to compute sub performance metrics', {
        error: err,
        hook: 'useSubPerformance',
        subcontractorId,
      });
      setError(err instanceof Error ? err : new Error('Failed to load performance metrics'));
    } finally {
      setLoading(false);
    }
  }, [subcontractorId, profile?.orgId]);

  useEffect(() => {
    computeMetrics();
  }, [computeMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: computeMetrics,
  };
}
