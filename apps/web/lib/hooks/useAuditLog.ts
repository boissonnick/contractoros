'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import {
  AuditLogEntry,
  AuditEventType,
  AuditSeverity,
  getRecentAuditEvents,
  logRoleChange,
  logUserInvitation,
  logUserStatusChange,
  logImpersonation,
  logDataExport,
  logSettingsUpdate,
} from '@/lib/audit';
import { UserRole } from '@/types';
import { logger } from '@/lib/utils/logger';

interface UseAuditLogOptions {
  limit?: number;
  type?: AuditEventType;
  severity?: AuditSeverity;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRecentAuditEvents(profile.orgId, {
        limit: options.limit,
        type: options.type,
        severity: options.severity,
      });
      setEntries(data);
    } catch (err) {
      logger.error('Failed to fetch audit log', { error: err, hook: 'useAuditLog' });
      setError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId, options.limit, options.type, options.severity]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!options.autoRefresh || !profile?.orgId) return;

    const interval = setInterval(
      fetchEntries,
      options.refreshInterval || 30000 // Default: 30 seconds
    );

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, fetchEntries, profile?.orgId]);

  return {
    entries,
    loading,
    error,
    refresh: fetchEntries,
  };
}

/**
 * Hook that provides audit logging helper functions with the current user context
 */
export function useAuditLogger() {
  const { profile } = useAuth();

  const getActor = useCallback(() => {
    if (!profile) {
      throw new Error('Cannot log audit event: No user profile');
    }
    return {
      id: profile.uid,
      name: profile.displayName || profile.email || 'Unknown User',
      role: profile.role,
    };
  }, [profile]);

  const logRoleChangeEvent = useCallback(
    async (params: {
      target: { id: string; name: string; email: string };
      previousRole: UserRole;
      newRole: UserRole;
    }) => {
      if (!profile?.orgId) return;
      await logRoleChange({
        orgId: profile.orgId,
        actor: getActor(),
        ...params,
      });
    },
    [profile?.orgId, getActor]
  );

  const logUserInvitationEvent = useCallback(
    async (invitedEmail: string, assignedRole: UserRole) => {
      if (!profile?.orgId) return;
      await logUserInvitation({
        orgId: profile.orgId,
        actor: getActor(),
        invitedEmail,
        assignedRole,
      });
    },
    [profile?.orgId, getActor]
  );

  const logUserStatusChangeEvent = useCallback(
    async (
      target: { id: string; name: string; email: string },
      action: 'activated' | 'deactivated' | 'removed'
    ) => {
      if (!profile?.orgId) return;
      await logUserStatusChange({
        orgId: profile.orgId,
        actor: getActor(),
        target,
        action,
      });
    },
    [profile?.orgId, getActor]
  );

  const logImpersonationEvent = useCallback(
    async (impersonatedRole: string, action: 'started' | 'ended') => {
      if (!profile?.orgId) return;
      await logImpersonation({
        orgId: profile.orgId,
        actor: getActor(),
        impersonatedRole,
        action,
      });
    },
    [profile?.orgId, getActor]
  );

  const logDataExportEvent = useCallback(
    async (exportType: string, recordCount: number) => {
      if (!profile?.orgId) return;
      await logDataExport({
        orgId: profile.orgId,
        actor: getActor(),
        exportType,
        recordCount,
      });
    },
    [profile?.orgId, getActor]
  );

  const logSettingsUpdateEvent = useCallback(
    async (
      settingType: 'organization' | 'security' | 'integrations',
      changedFields: string[]
    ) => {
      if (!profile?.orgId) return;
      await logSettingsUpdate({
        orgId: profile.orgId,
        actor: getActor(),
        settingType,
        changedFields,
      });
    },
    [profile?.orgId, getActor]
  );

  return {
    logRoleChange: logRoleChangeEvent,
    logUserInvitation: logUserInvitationEvent,
    logUserStatusChange: logUserStatusChangeEvent,
    logImpersonation: logImpersonationEvent,
    logDataExport: logDataExportEvent,
    logSettingsUpdate: logSettingsUpdateEvent,
  };
}
