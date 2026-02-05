'use client';

/**
 * useSessionManagement Hook
 *
 * Provides comprehensive session management capabilities with real-time updates.
 * Includes session tracking, revocation, and suspicious activity detection.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  UserSession,
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  createSession,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  updateSessionActivity,
  checkSessionLimit,
  subscribeToSessions,
  getDeviceDescription,
  detectSuspiciousSession,
  isSessionExpired,
  isSessionStale,
} from '@/lib/security/session-manager';

// ============================================
// Types
// ============================================

interface UseSessionManagementOptions {
  /** Custom session configuration */
  config?: Partial<SessionConfig>;
  /** Update activity interval in ms (default: 60000 = 1 minute) */
  activityUpdateInterval?: number;
  /** Auto-refresh sessions interval in ms (0 = use real-time subscription) */
  refreshInterval?: number;
}

interface UseSessionManagementReturn {
  /** List of active sessions */
  sessions: UserSession[];
  /** Current session (if identifiable) */
  currentSession: UserSession | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Session configuration */
  config: SessionConfig;
  /** Suspicious sessions detected */
  suspiciousSessions: Array<{ session: UserSession; reasons: string[] }>;

  // Actions
  /** Refresh sessions list */
  refresh: () => Promise<void>;
  /** Revoke a specific session */
  revokeSessionById: (sessionId: string, reason?: string) => Promise<void>;
  /** Revoke all sessions except current */
  revokeOtherSessions: (reason?: string) => Promise<number>;
  /** Revoke all sessions (including current - will log out) */
  revokeAllUserSessions: (reason?: string) => Promise<number>;
  /** Create a new session (typically called on login) */
  createNewSession: () => Promise<UserSession | null>;
  /** Update current session activity */
  updateActivity: () => Promise<void>;
  /** Get formatted device description for a session */
  formatDevice: (session: UserSession) => string;
  /** Check if session is expired */
  isExpired: (session: UserSession) => boolean;
  /** Check if session is stale (inactive) */
  isStale: (session: UserSession) => boolean;
}

// ============================================
// Session ID Storage
// ============================================

const SESSION_ID_KEY = 'contractoros_session_id';

function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

function setCurrentSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_ID_KEY, sessionId);
}

function clearCurrentSessionId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_ID_KEY);
}

// ============================================
// Hook Implementation
// ============================================

export function useSessionManagement(
  options: UseSessionManagementOptions = {}
): UseSessionManagementReturn {
  const { profile, user } = useAuth();
  const {
    config: customConfig,
    activityUpdateInterval = 60000,
    refreshInterval = 0,
  } = options;

  // Merge custom config with defaults
  const config = useMemo<SessionConfig>(
    () => ({
      ...DEFAULT_SESSION_CONFIG,
      ...customConfig,
    }),
    [customConfig]
  );

  // State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(getCurrentSessionId());

  // Get current session ID from storage
  const currentSessionId = currentSessionIdRef.current;

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!user?.uid) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const activeSessions = await getActiveSessions(user.uid, currentSessionId || undefined);
      setSessions(activeSessions);
    } catch (err) {
      console.error('[useSessionManagement] Failed to fetch sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentSessionId]);

  // Set up real-time subscription or polling
  useEffect(() => {
    if (!user?.uid) {
      setSessions([]);
      setLoading(false);
      return;
    }

    // Initial load
    setLoading(true);

    if (refreshInterval === 0) {
      // Use real-time subscription
      const unsubscribe = subscribeToSessions(
        user.uid,
        currentSessionId || undefined,
        (updatedSessions) => {
          setSessions(updatedSessions);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // Use polling
      fetchSessions();
      const interval = setInterval(fetchSessions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [user?.uid, currentSessionId, refreshInterval, fetchSessions]);

  // Set up activity heartbeat
  useEffect(() => {
    if (!user?.uid || !currentSessionId || activityUpdateInterval <= 0) {
      return;
    }

    // Update activity immediately
    updateSessionActivity(user.uid, currentSessionId);

    // Set up interval
    const interval = setInterval(() => {
      updateSessionActivity(user.uid, currentSessionId);
    }, activityUpdateInterval);

    return () => clearInterval(interval);
  }, [user?.uid, currentSessionId, activityUpdateInterval]);

  // Calculate current session
  const currentSession = useMemo(() => {
    return sessions.find((s) => s.isCurrentSession) || null;
  }, [sessions]);

  // Detect suspicious sessions
  const suspiciousSessions = useMemo(() => {
    const suspicious: Array<{ session: UserSession; reasons: string[] }> = [];

    sessions.forEach((session) => {
      if (!session.isCurrentSession) {
        const otherSessions = sessions.filter((s) => s.id !== session.id);
        const result = detectSuspiciousSession(session, otherSessions);
        if (result.suspicious) {
          suspicious.push({ session, reasons: result.reasons });
        }
      }
    });

    return suspicious;
  }, [sessions]);

  // Actions
  const refresh = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  const revokeSessionById = useCallback(
    async (sessionId: string, reason?: string) => {
      if (!user?.uid) return;

      try {
        await revokeSession(user.uid, sessionId, user.uid, reason);

        // If revoking current session, clear storage
        if (sessionId === currentSessionId) {
          clearCurrentSessionId();
          currentSessionIdRef.current = null;
        }

        // Refresh list
        await fetchSessions();
      } catch (err) {
        console.error('[useSessionManagement] Failed to revoke session:', err);
        throw new Error('Failed to revoke session');
      }
    },
    [user?.uid, currentSessionId, fetchSessions]
  );

  const revokeOtherSessions = useCallback(
    async (reason?: string) => {
      if (!user?.uid) return 0;

      try {
        const count = await revokeAllSessions(
          user.uid,
          user.uid,
          currentSessionId || undefined,
          reason || 'Signed out from other devices'
        );
        await fetchSessions();
        return count;
      } catch (err) {
        console.error('[useSessionManagement] Failed to revoke other sessions:', err);
        throw new Error('Failed to revoke sessions');
      }
    },
    [user?.uid, currentSessionId, fetchSessions]
  );

  const revokeAllUserSessions = useCallback(
    async (reason?: string) => {
      if (!user?.uid) return 0;

      try {
        const count = await revokeAllSessions(
          user.uid,
          user.uid,
          undefined,
          reason || 'Signed out from all devices'
        );
        clearCurrentSessionId();
        currentSessionIdRef.current = null;
        setSessions([]);
        return count;
      } catch (err) {
        console.error('[useSessionManagement] Failed to revoke all sessions:', err);
        throw new Error('Failed to revoke sessions');
      }
    },
    [user?.uid]
  );

  const createNewSession = useCallback(async () => {
    if (!user?.uid || !profile?.orgId) return null;

    try {
      // Check session limit first
      const { limitReached, oldestSession } = await checkSessionLimit(
        user.uid,
        config.maxConcurrentSessions
      );

      // If limit reached, revoke oldest session
      if (limitReached && oldestSession) {
        await revokeSession(
          user.uid,
          oldestSession.id,
          user.uid,
          'Session limit reached - oldest session evicted'
        );
      }

      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';

      const newSession = await createSession({
        userId: user.uid,
        orgId: profile.orgId,
        userAgent,
        ipAddress: 'client', // IP should be captured server-side
      });

      // Store session ID
      setCurrentSessionId(newSession.id);
      currentSessionIdRef.current = newSession.id;

      await fetchSessions();
      return newSession;
    } catch (err) {
      console.error('[useSessionManagement] Failed to create session:', err);
      throw new Error('Failed to create session');
    }
  }, [user?.uid, profile?.orgId, config.maxConcurrentSessions, fetchSessions]);

  const updateActivity = useCallback(async () => {
    if (!user?.uid || !currentSessionId) return;
    await updateSessionActivity(user.uid, currentSessionId);
  }, [user?.uid, currentSessionId]);

  const formatDevice = useCallback((session: UserSession) => {
    return getDeviceDescription(session.deviceInfo);
  }, []);

  const isExpired = useCallback((session: UserSession) => {
    return isSessionExpired(session);
  }, []);

  const isStale = useCallback(
    (session: UserSession) => {
      return isSessionStale(session, config.sessionTimeout);
    },
    [config.sessionTimeout]
  );

  return {
    sessions,
    currentSession,
    loading,
    error,
    config,
    suspiciousSessions,
    refresh,
    revokeSessionById,
    revokeOtherSessions,
    revokeAllUserSessions,
    createNewSession,
    updateActivity,
    formatDevice,
    isExpired,
    isStale,
  };
}

// ============================================
// Re-exports
// ============================================

export type { UserSession, SessionConfig } from '@/lib/security/session-manager';
export { DEFAULT_SESSION_CONFIG, parseUserAgent, BROWSER_LABELS, OS_LABELS } from '@/lib/security/session-manager';
