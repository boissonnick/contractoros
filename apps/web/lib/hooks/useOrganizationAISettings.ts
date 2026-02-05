'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  OrganizationAISettings,
  AIUsageRecord,
  DEFAULT_AI_SETTINGS,
  AIModelDisplayConfig,
} from '@/types';
import { getModelsForTier } from '@/lib/assistant/models/types';

export interface UseOrganizationAISettingsReturn {
  settings: OrganizationAISettings | null;
  usage: AIUsageRecord | null;
  usageHistory: AIUsageRecord[];
  availableModels: AIModelDisplayConfig[];
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<OrganizationAISettings>) => Promise<void>;
  refreshUsage: () => Promise<void>;
}

/**
 * Hook to manage organization-level AI settings and usage
 */
export function useOrganizationAISettings(): UseOrganizationAISettingsReturn {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<OrganizationAISettings | null>(null);
  const [usage, setUsage] = useState<AIUsageRecord | null>(null);
  const [usageHistory, setUsageHistory] = useState<AIUsageRecord[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModelDisplayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;

  // Load settings with real-time updates
  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const settingsRef = doc(db, `organizations/${orgId}/settings/ai`);

    const unsubscribe = onSnapshot(
      settingsRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          } as OrganizationAISettings);
        } else {
          // Create default settings
          const defaults: OrganizationAISettings = {
            ...DEFAULT_AI_SETTINGS,
            orgId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await setDoc(settingsRef, {
              ...defaults,
              createdAt: Timestamp.fromDate(defaults.createdAt),
              updatedAt: Timestamp.fromDate(defaults.updatedAt),
            });
            setSettings(defaults);
          } catch (err) {
            console.error('[useOrganizationAISettings] Error creating defaults:', err);
            setError('Failed to initialize AI settings');
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useOrganizationAISettings] Error loading settings:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Load today's usage with real-time updates
  useEffect(() => {
    if (!orgId) return;

    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, `organizations/${orgId}/aiUsage/${today}`);

    const unsubscribe = onSnapshot(usageRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUsage({
          ...data,
          firstRequestAt: data.firstRequestAt?.toDate?.() || new Date(),
          lastRequestAt: data.lastRequestAt?.toDate?.() || new Date(),
        } as AIUsageRecord);
      } else {
        setUsage(null);
      }
    });

    return () => unsubscribe();
  }, [orgId]);

  // Compute available models based on settings
  useEffect(() => {
    if (!settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
      setAvailableModels([]);
      return;
    }

    const tierModels = getModelsForTier(settings.tier);
    const models: AIModelDisplayConfig[] = Object.entries(tierModels).map(
      ([key, config]) => ({
        key,
        provider: config.provider,
        displayName: config.displayName,
        description: config.description,
        tier: config.tier,
        isDefault: config.isDefault || false,
        isAvailable: settings.allowedModels.includes(key),
      })
    );

    setAvailableModels(models);
  }, [settings]);

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<OrganizationAISettings>) => {
      if (!orgId) {
        throw new Error('No organization ID');
      }

      const settingsRef = doc(db, `organizations/${orgId}/settings/ai`);

      try {
        await setDoc(
          settingsRef,
          {
            ...updates,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[useOrganizationAISettings] Error updating settings:', err);
        throw err;
      }
    },
    [orgId]
  );

  // Refresh usage history (last 7 days)
  const refreshUsage = useCallback(async () => {
    if (!orgId) return;

    const history: AIUsageRecord[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const usageRef = doc(db, `organizations/${orgId}/aiUsage/${dateKey}`);
      const usageSnap = await getDoc(usageRef);

      if (usageSnap.exists()) {
        const data = usageSnap.data();
        history.push({
          ...data,
          firstRequestAt: data.firstRequestAt?.toDate?.() || new Date(),
          lastRequestAt: data.lastRequestAt?.toDate?.() || new Date(),
        } as AIUsageRecord);
      } else {
        history.push({
          orgId,
          date: dateKey,
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          modelBreakdown: {},
          firstRequestAt: new Date(),
          lastRequestAt: new Date(),
        });
      }
    }

    setUsageHistory(history.reverse()); // Chronological order
  }, [orgId]);

  return {
    settings,
    usage,
    usageHistory,
    availableModels,
    loading,
    error,
    updateSettings,
    refreshUsage,
  };
}

// Note: Server-side AI settings functions have been moved to lib/assistant/server-utils.ts
// to avoid bundling firebase-admin in client code
