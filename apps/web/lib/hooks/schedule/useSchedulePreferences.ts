"use client";

import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { ScheduleViewPreferences } from '@/types';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// HOOK
// =============================================================================

export function useSchedulePreferences() {
  const { profile } = useAuth();
  const [preferences, setPreferences] = useState<ScheduleViewPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = profile?.uid;

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'schedulePreferences', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          setPreferences(snapshot.data() as ScheduleViewPreferences);
        } else {
          // Default preferences
          setPreferences({
            userId,
            defaultView: 'week',
            showWeekends: true,
            startOfWeek: 1,
            workingHoursStart: '07:00',
            workingHoursEnd: '18:00',
            showWeather: true,
            showConflicts: true,
            colorBy: 'type',
          });
        }
        setLoading(false);
      },
      (err) => {
        logger.error('Error loading schedule preferences', { error: err, hook: 'useSchedulePreferences' });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const updatePreferences = useCallback(
    async (data: Partial<ScheduleViewPreferences>): Promise<void> => {
      if (!userId) return;

      await setDoc(doc(db, 'schedulePreferences', userId), data, { merge: true });
    },
    [userId]
  );

  return { preferences, loading, updatePreferences };
}
