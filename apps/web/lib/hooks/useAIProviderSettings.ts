'use client';

/**
 * useAIProviderSettings Hook - Sprint 37
 *
 * Manages organization AI provider settings including:
 * - Provider priority ordering
 * - Per-feature model assignments
 * - Monthly usage tracking
 * - Automatic fallback configuration
 */

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import type {
  OrganizationAIProviderSettings,
  AIProviderPriority,
  AIFeatureModelAssignment,
  AIMonthlyUsageSummary,
} from '@/types';
import { AVAILABLE_MODELS } from '@/lib/assistant/models/types';
import { getProviderBlendedCost } from '@/lib/ai/provider-manager';

// Default settings factory
function createDefaultSettings(orgId: string): OrganizationAIProviderSettings {
  return {
    orgId,
    providerPriorities: [
      {
        providerId: 'gemini',
        priority: 1,
        enabled: true,
        isPrimary: true,
        costPer1kTokens: 0,
        hasApiKey: true, // Free tier default
      },
      {
        providerId: 'claude',
        priority: 2,
        enabled: false,
        isPrimary: false,
        costPer1kTokens: getProviderBlendedCost('claude'),
        hasApiKey: false,
      },
      {
        providerId: 'openai',
        priority: 3,
        enabled: false,
        isPrimary: false,
        costPer1kTokens: getProviderBlendedCost('openai'),
        hasApiKey: false,
      },
    ],
    featureAssignments: [
      { feature: 'assistant', modelKey: 'gemini-2.0-flash' },
      { feature: 'estimates', modelKey: 'gemini-2.0-flash' },
      { feature: 'photo_analysis', modelKey: 'gemini-2.0-flash' },
      { feature: 'document_analysis', modelKey: 'gemini-2.0-flash' },
      { feature: 'project_summary', modelKey: 'gemini-2.0-flash' },
      { feature: 'nl_query', modelKey: 'gemini-2.0-flash' },
    ],
    enableAutomaticFallback: true,
    fallbackDelayMs: 0,
    maxFallbackAttempts: 3,
    alertThresholdPercent: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export interface UseAIProviderSettingsReturn {
  settings: OrganizationAIProviderSettings | null;
  monthlyUsage: AIMonthlyUsageSummary | null;
  loading: boolean;
  error: string | null;

  // Settings updates
  updateProviderPriorities: (priorities: AIProviderPriority[]) => Promise<void>;
  updateFeatureAssignments: (assignments: AIFeatureModelAssignment[]) => Promise<void>;
  updateSettings: (updates: Partial<OrganizationAIProviderSettings>) => Promise<void>;

  // Computed values
  availableModels: Array<{ key: string; name: string; provider: string; costPer1k: number }>;
  activeProvider: AIProviderPriority | null;
}

export function useAIProviderSettings(): UseAIProviderSettingsReturn {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<OrganizationAIProviderSettings | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<AIMonthlyUsageSummary | null>(null);
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

    const settingsRef = doc(db, `organizations/${orgId}/settings/aiProviders`);

    const unsubscribe = onSnapshot(
      settingsRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            providerPriorities: (data.providerPriorities || []).map((p: AIProviderPriority) => ({
              ...p,
              lastUsed: p.lastUsed ? (p.lastUsed as unknown as Timestamp).toDate?.() || p.lastUsed : undefined,
              lastFailure: p.lastFailure ? (p.lastFailure as unknown as Timestamp).toDate?.() || p.lastFailure : undefined,
            })),
          } as OrganizationAIProviderSettings);
        } else {
          // Create default settings
          const defaults = createDefaultSettings(orgId);

          try {
            await setDoc(settingsRef, {
              ...defaults,
              createdAt: Timestamp.fromDate(defaults.createdAt),
              updatedAt: Timestamp.fromDate(defaults.updatedAt),
            });
            setSettings(defaults);
          } catch (err) {
            console.error('[useAIProviderSettings] Error creating defaults:', err);
            setError('Failed to initialize AI provider settings');
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useAIProviderSettings] Error loading settings:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Load monthly usage summary
  useEffect(() => {
    if (!orgId) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageRef = doc(db, `organizations/${orgId}/aiUsageSummary/${currentMonth}`);

    const unsubscribe = onSnapshot(usageRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMonthlyUsage({
          ...data,
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as AIMonthlyUsageSummary);
      } else {
        setMonthlyUsage(null);
      }
    });

    return () => unsubscribe();
  }, [orgId]);

  // Update provider priorities
  const updateProviderPriorities = useCallback(
    async (priorities: AIProviderPriority[]) => {
      if (!orgId) {
        throw new Error('No organization ID');
      }

      const settingsRef = doc(db, `organizations/${orgId}/settings/aiProviders`);

      try {
        await setDoc(
          settingsRef,
          {
            providerPriorities: priorities,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[useAIProviderSettings] Error updating priorities:', err);
        throw err;
      }
    },
    [orgId]
  );

  // Update feature assignments
  const updateFeatureAssignments = useCallback(
    async (assignments: AIFeatureModelAssignment[]) => {
      if (!orgId) {
        throw new Error('No organization ID');
      }

      const settingsRef = doc(db, `organizations/${orgId}/settings/aiProviders`);

      try {
        await setDoc(
          settingsRef,
          {
            featureAssignments: assignments,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[useAIProviderSettings] Error updating assignments:', err);
        throw err;
      }
    },
    [orgId]
  );

  // Generic settings update
  const updateSettings = useCallback(
    async (updates: Partial<OrganizationAIProviderSettings>) => {
      if (!orgId) {
        throw new Error('No organization ID');
      }

      const settingsRef = doc(db, `organizations/${orgId}/settings/aiProviders`);

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
        console.error('[useAIProviderSettings] Error updating settings:', err);
        throw err;
      }
    },
    [orgId]
  );

  // Compute available models based on enabled providers
  const availableModels = settings
    ? Object.entries(AVAILABLE_MODELS)
        .filter(([, config]) => {
          const providerSettings = settings.providerPriorities.find(
            (p) => p.providerId === config.provider
          );
          return providerSettings?.enabled && providerSettings?.hasApiKey;
        })
        .map(([key, config]) => ({
          key,
          name: config.displayName,
          provider: config.provider,
          costPer1k: (config.costPer1kInputTokens + config.costPer1kOutputTokens) / 2,
        }))
    : [];

  // Get active provider
  const activeProvider = settings
    ? settings.providerPriorities
        .filter((p) => p.enabled && p.hasApiKey)
        .sort((a, b) => a.priority - b.priority)[0] || null
    : null;

  return {
    settings,
    monthlyUsage,
    loading,
    error,
    updateProviderPriorities,
    updateFeatureAssignments,
    updateSettings,
    availableModels,
    activeProvider,
  };
}
