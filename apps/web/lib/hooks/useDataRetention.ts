'use client';

/**
 * useDataRetention Hook
 *
 * Provides comprehensive data retention policy management with CRUD operations,
 * preview capabilities, and history tracking. Designed for the admin data
 * retention settings page.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import {
  RetentionPolicy,
  RetentionResource,
  RetentionAction,
  RetentionPreview,
  RetentionRunHistory,
  RetentionConfig,
  getRetentionPolicies,
  updateRetentionPolicy,
  updateRetentionPolicies,
  getRetentionPreview,
  getRetentionHistory,
  getDefaultRetentionConfig,
  formatRetentionPeriod,
  getComplianceInfo,
  RETENTION_RESOURCE_LABELS,
  RETENTION_ACTION_LABELS,
  RETENTION_ACTION_DESCRIPTIONS,
  DEFAULT_RETENTION_CONFIG,
} from '@/lib/security/data-retention';
import { auditHelpers } from '@/lib/security/audit-logger';
import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

interface UseDataRetentionOptions {
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  autoRefreshInterval?: number;
}

interface UseDataRetentionReturn {
  /** All retention policies */
  policies: RetentionPolicy[];
  /** Whether policies are being loaded */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether an update is in progress */
  updating: boolean;
  /** Retention run history */
  history: RetentionRunHistory[];
  /** Preview data for affected records */
  previews: Record<RetentionResource, RetentionPreview | null>;
  /** Default retention configuration */
  config: RetentionConfig;

  // Actions
  /** Refresh policies from database */
  refresh: () => Promise<void>;
  /** Update a single policy */
  updatePolicy: (
    resource: RetentionResource,
    updates: {
      retentionDays?: number;
      action?: RetentionAction;
      enabled?: boolean;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  /** Update multiple policies at once */
  updatePolicies: (
    updates: Array<{
      resource: RetentionResource;
      updates: {
        retentionDays?: number;
        action?: RetentionAction;
        enabled?: boolean;
      };
    }>
  ) => Promise<{ success: boolean; errors?: string[] }>;
  /** Toggle policy enabled state */
  togglePolicy: (resource: RetentionResource) => Promise<void>;
  /** Get preview of affected data for a policy */
  loadPreview: (resource: RetentionResource, retentionDays?: number) => Promise<void>;
  /** Load retention run history */
  loadHistory: () => Promise<void>;
  /** Reset a policy to defaults */
  resetToDefault: (resource: RetentionResource) => Promise<void>;
  /** Reset all policies to defaults */
  resetAllToDefaults: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useDataRetention(
  options: UseDataRetentionOptions = {}
): UseDataRetentionReturn {
  const { profile } = useAuth();
  const { autoRefreshInterval = 0 } = options;

  // State
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [history, setHistory] = useState<RetentionRunHistory[]>([]);
  const [previews, setPreviews] = useState<
    Record<RetentionResource, RetentionPreview | null>
  >({} as Record<RetentionResource, RetentionPreview | null>);

  // Get default config
  const config = useMemo(() => getDefaultRetentionConfig(), []);

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRetentionPolicies(profile.orgId);
      setPolicies(data);
    } catch (err) {
      logger.error('Failed to fetch retention policies', { error: err, hook: 'useDataRetention' });
      setError('Failed to load retention policies');
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId]);

  // Initial load
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0 || !profile?.orgId) {
      return;
    }

    const interval = setInterval(fetchPolicies, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, profile?.orgId, fetchPolicies]);

  // Refresh policies
  const refresh = useCallback(async () => {
    await fetchPolicies();
  }, [fetchPolicies]);

  // Update a single policy
  const handleUpdatePolicy = useCallback(
    async (
      resource: RetentionResource,
      updates: {
        retentionDays?: number;
        action?: RetentionAction;
        enabled?: boolean;
      }
    ): Promise<{ success: boolean; error?: string }> => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) {
        return { success: false, error: 'Not authenticated' };
      }

      setUpdating(true);
      try {
        const result = await updateRetentionPolicy(
          profile.orgId,
          resource,
          updates,
          profile.uid
        );

        if (result.success) {
          // Log the settings change
          await auditHelpers.logSettingsChange(
            profile.orgId,
            profile.uid,
            profile.email,
            'dataRetention',
            Object.keys(updates).map((k) => `${resource}.${k}`)
          );

          // Refresh policies
          await fetchPolicies();
        }

        return result;
      } catch (err) {
        logger.error('Failed to update retention policy', { error: err, hook: 'useDataRetention' });
        return { success: false, error: 'Failed to update policy' };
      } finally {
        setUpdating(false);
      }
    },
    [profile?.orgId, profile?.uid, profile?.email, fetchPolicies]
  );

  // Update multiple policies
  const handleUpdatePolicies = useCallback(
    async (
      updates: Array<{
        resource: RetentionResource;
        updates: {
          retentionDays?: number;
          action?: RetentionAction;
          enabled?: boolean;
        };
      }>
    ): Promise<{ success: boolean; errors?: string[] }> => {
      if (!profile?.orgId || !profile?.uid || !profile?.email) {
        return { success: false, errors: ['Not authenticated'] };
      }

      setUpdating(true);
      try {
        const result = await updateRetentionPolicies(
          profile.orgId,
          updates.map(({ resource, updates }) => ({ resource, updates })),
          profile.uid
        );

        if (result.success) {
          // Log the settings change
          const changedFields = updates.flatMap(({ resource, updates }) =>
            Object.keys(updates).map((k) => `${resource}.${k}`)
          );
          await auditHelpers.logSettingsChange(
            profile.orgId,
            profile.uid,
            profile.email,
            'dataRetention',
            changedFields
          );

          // Refresh policies
          await fetchPolicies();
        }

        return result;
      } catch (err) {
        logger.error('Failed to update retention policies', { error: err, hook: 'useDataRetention' });
        return { success: false, errors: ['Failed to update policies'] };
      } finally {
        setUpdating(false);
      }
    },
    [profile?.orgId, profile?.uid, profile?.email, fetchPolicies]
  );

  // Toggle policy enabled state
  const togglePolicy = useCallback(
    async (resource: RetentionResource) => {
      const policy = policies.find((p) => p.resource === resource);
      if (!policy) return;

      await handleUpdatePolicy(resource, { enabled: !policy.enabled });
    },
    [policies, handleUpdatePolicy]
  );

  // Load preview for a policy
  const loadPreview = useCallback(
    async (resource: RetentionResource, retentionDays?: number) => {
      if (!profile?.orgId) return;

      try {
        const policy = policies.find((p) => p.resource === resource);
        const days = retentionDays ?? policy?.retentionDays ?? config[resource].default;

        const preview = await getRetentionPreview(profile.orgId, resource, days);
        setPreviews((prev) => ({
          ...prev,
          [resource]: preview,
        }));
      } catch (err) {
        logger.error('Failed to load preview', { error: err, hook: 'useDataRetention' });
      }
    },
    [profile?.orgId, policies, config]
  );

  // Load retention history
  const loadHistory = useCallback(async () => {
    if (!profile?.orgId) return;

    try {
      const data = await getRetentionHistory(profile.orgId);
      setHistory(data);
    } catch (err) {
      logger.error('Failed to load retention history', { error: err, hook: 'useDataRetention' });
    }
  }, [profile?.orgId]);

  // Reset a policy to defaults
  const resetToDefault = useCallback(
    async (resource: RetentionResource) => {
      const defaultConfig = config[resource];
      await handleUpdatePolicy(resource, {
        retentionDays: defaultConfig.default,
        action: defaultConfig.recommendedAction,
        enabled: false,
      });
    },
    [config, handleUpdatePolicy]
  );

  // Reset all policies to defaults
  const resetAllToDefaults = useCallback(async () => {
    const updates = (Object.keys(config) as RetentionResource[]).map((resource) => ({
      resource,
      updates: {
        retentionDays: config[resource].default,
        action: config[resource].recommendedAction,
        enabled: false,
      },
    }));

    await handleUpdatePolicies(updates);
  }, [config, handleUpdatePolicies]);

  return {
    policies,
    loading,
    error,
    updating,
    history,
    previews,
    config,
    refresh,
    updatePolicy: handleUpdatePolicy,
    updatePolicies: handleUpdatePolicies,
    togglePolicy,
    loadPreview,
    loadHistory,
    resetToDefault,
    resetAllToDefaults,
  };
}

// ============================================
// Convenience Hook for Policy Validation
// ============================================

/**
 * Hook for validating retention policy values
 */
export function useRetentionValidation() {
  const config = useMemo(() => getDefaultRetentionConfig(), []);

  const validateDays = useCallback(
    (resource: RetentionResource, days: number): { valid: boolean; message?: string } => {
      const limits = config[resource];
      if (days < limits.min) {
        return {
          valid: false,
          message: `Minimum: ${limits.min} days`,
        };
      }
      if (days > limits.max) {
        return {
          valid: false,
          message: `Maximum: ${limits.max} days`,
        };
      }
      return { valid: true };
    },
    [config]
  );

  return {
    validateDays,
    config,
  };
}

// ============================================
// Re-exports for convenience
// ============================================

export type {
  RetentionPolicy,
  RetentionResource,
  RetentionAction,
  RetentionPreview,
  RetentionRunHistory,
  RetentionConfig,
};

export {
  formatRetentionPeriod,
  getComplianceInfo,
  RETENTION_RESOURCE_LABELS,
  RETENTION_ACTION_LABELS,
  RETENTION_ACTION_DESCRIPTIONS,
  DEFAULT_RETENTION_CONFIG,
};
