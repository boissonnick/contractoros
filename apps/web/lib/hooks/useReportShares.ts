'use client';

import { useMemo, useCallback } from 'react';
import { orderBy, where, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useFirestoreCrud } from './useFirestoreCrud';
import type { ReportShareConfig } from '@/components/reports/ReportShareModal';

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function convertShare(id: string, data: DocumentData): ReportShareConfig {
  return {
    id,
    token: data.token || '',
    reportId: data.reportId || '',
    reportName: data.reportName || '',
    createdBy: data.createdBy || '',
    createdAt: data.createdAt?.toDate?.() || new Date(),
    expiresAt: data.expiresAt?.toDate?.() || undefined,
    enabled: data.enabled ?? true,
    viewCount: data.viewCount || 0,
  };
}

export function useReportShares(reportId?: string) {
  const { profile, user } = useAuth();
  const orgId = profile?.orgId;

  const collectionPath = `organizations/${orgId}/reportShares`;

  const constraints = useMemo(
    () =>
      reportId
        ? [where('reportId', '==', reportId), orderBy('createdAt', 'desc')]
        : [orderBy('createdAt', 'desc')],
    [reportId]
  );

  const converter = useCallback(
    (id: string, data: DocumentData) => convertShare(id, data),
    []
  );

  const { items: shares, loading, error } = useFirestoreCollection<ReportShareConfig>({
    path: collectionPath,
    constraints,
    converter,
    enabled: !!orgId,
  });

  const { create, update, remove } = useFirestoreCrud<ReportShareConfig>(collectionPath, {
    entityName: 'Share link',
    toFirestore: (data) => {
      const result: DocumentData = { ...data };
      if (result.createdAt instanceof Date) {
        result.createdAt = Timestamp.fromDate(result.createdAt);
      }
      if (result.expiresAt instanceof Date) {
        result.expiresAt = Timestamp.fromDate(result.expiresAt);
      }
      // Strip undefined values
      Object.keys(result).forEach((k) => {
        if (result[k] === undefined) delete result[k];
      });
      return result;
    },
  });

  const createShare = useCallback(
    async (config: { reportId: string; expiryDays: number | null }): Promise<ReportShareConfig> => {
      const now = new Date();
      const expiresAt = config.expiryDays
        ? new Date(now.getTime() + config.expiryDays * 24 * 60 * 60 * 1000)
        : undefined;

      const shareData: Omit<ReportShareConfig, 'id'> = {
        token: generateToken(),
        reportId: config.reportId,
        reportName: '', // Will be set by caller or could look up
        createdBy: user?.uid || '',
        createdAt: now,
        expiresAt,
        enabled: true,
        viewCount: 0,
      };

      const id = await create(shareData as Omit<ReportShareConfig, 'id' | 'createdAt' | 'updatedAt'>);
      return { ...shareData, id };
    },
    [create, user]
  );

  const revokeShare = useCallback(
    async (shareId: string) => {
      await update(shareId, { enabled: false } as Partial<ReportShareConfig>);
    },
    [update]
  );

  const deleteShare = useCallback(
    async (shareId: string) => {
      await remove(shareId);
    },
    [remove]
  );

  return {
    shares,
    loading,
    error,
    createShare,
    revokeShare,
    deleteShare,
  };
}
