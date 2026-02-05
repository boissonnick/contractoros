'use client';

import { useMemo, useCallback } from 'react';
import { orderBy, where, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useFirestoreCrud } from './useFirestoreCrud';
import type { ReportScheduleConfig } from '@/components/reports/ReportScheduleModal';

function convertSchedule(id: string, data: DocumentData): ReportScheduleConfig & { id: string } {
  return {
    id,
    frequency: data.frequency || 'weekly',
    dayOfWeek: data.dayOfWeek,
    dayOfMonth: data.dayOfMonth,
    time: data.time || '09:00',
    recipients: data.recipients || [],
    enabled: data.enabled ?? true,
    reportId: data.reportId || '',
    reportName: data.reportName || '',
  };
}

export function useReportSchedules(reportId?: string) {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const collectionPath = `organizations/${orgId}/reportSchedules`;

  const constraints = useMemo(
    () =>
      reportId
        ? [where('reportId', '==', reportId), orderBy('reportName', 'asc')]
        : [orderBy('reportName', 'asc')],
    [reportId]
  );

  const converter = useCallback(
    (id: string, data: DocumentData) => convertSchedule(id, data),
    []
  );

  const { items: schedules, loading, error } = useFirestoreCollection<ReportScheduleConfig & { id: string }>({
    path: collectionPath,
    constraints,
    converter,
    enabled: !!orgId,
  });

  const { create, update, remove } = useFirestoreCrud<ReportScheduleConfig & { id: string }>(collectionPath, {
    entityName: 'Schedule',
  });

  const saveSchedule = useCallback(
    async (config: ReportScheduleConfig) => {
      const existing = schedules.find((s) => s.reportId === config.reportId);
      if (existing) {
        await update(existing.id, config);
      } else {
        await create(config as Omit<ReportScheduleConfig & { id: string }, 'id' | 'createdAt' | 'updatedAt'>);
      }
    },
    [schedules, create, update]
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string) => {
      await remove(scheduleId);
    },
    [remove]
  );

  const getScheduleForReport = useCallback(
    (rid: string) => schedules.find((s) => s.reportId === rid) || null,
    [schedules]
  );

  return {
    schedules,
    loading,
    error,
    saveSchedule,
    deleteSchedule,
    getScheduleForReport,
  };
}
