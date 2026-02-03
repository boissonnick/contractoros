/**
 * Session Management System for ContractorOS
 *
 * Provides comprehensive session tracking and management including:
 * - Multi-device session tracking
 * - Session timeout management
 * - Concurrent session limits
 * - Device fingerprinting
 * - Session revocation
 *
 * Storage: users/{userId}/sessions/{sessionId}
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logAuditEvent } from './audit-logger';

// ============================================
// Types
// ============================================

/**
 * Device information extracted from user agent
 */
export interface DeviceInfo {
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  device: string;
  isMobile: boolean;
}

/**
 * Geographic location information
 */
export interface SessionLocation {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
}

/**
 * User session record
 */
export interface UserSession {
  id: string;
  userId: string;
  orgId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: SessionLocation;
  userAgent: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isCurrentSession: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}

/**
 * Session configuration options
 */
export interface SessionConfig {
  /** Maximum concurrent sessions per user (default: 5) */
  maxConcurrentSessions: number;
  /** Inactivity timeout in milliseconds (default: 30 minutes) */
  sessionTimeout: number;
  /** Maximum session duration in milliseconds (default: 7 days) */
  absoluteTimeout: number;
  /** Actions that require fresh authentication */
  requireReauthFor: string[];
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  userId: string;
  orgId: string;
  userAgent: string;
  ipAddress?: string;
  location?: SessionLocation;
}

// ============================================
// Constants
// ============================================

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxConcurrentSessions: 5,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  absoluteTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  requireReauthFor: [
    'change_password',
    'change_email',
    'delete_account',
    'manage_billing',
    'export_all_data',
    'revoke_all_sessions',
  ],
};

/**
 * Browser detection patterns
 */
const BROWSER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+)/ },
  { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
  { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
  { name: 'Safari', pattern: /Version\/(\d+).*Safari/ },
  { name: 'Opera', pattern: /OPR\/(\d+)/ },
  { name: 'IE', pattern: /(?:MSIE |Trident.*rv:)(\d+)/ },
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/(\d+)/ },
];

/**
 * OS detection patterns
 */
const OS_PATTERNS: Array<{ name: string; pattern: RegExp; version?: RegExp }> = [
  { name: 'Windows', pattern: /Windows NT/, version: /Windows NT (\d+\.\d+)/ },
  { name: 'macOS', pattern: /Mac OS X/, version: /Mac OS X (\d+[._]\d+)/ },
  { name: 'iOS', pattern: /(?:iPhone|iPad|iPod)/, version: /OS (\d+[._]\d+)/ },
  { name: 'Android', pattern: /Android/, version: /Android (\d+\.\d+)/ },
  { name: 'Linux', pattern: /Linux/ },
  { name: 'Chrome OS', pattern: /CrOS/ },
];

/**
 * Device type detection patterns
 */
const DEVICE_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'iPhone', pattern: /iPhone/ },
  { name: 'iPad', pattern: /iPad/ },
  { name: 'Android Phone', pattern: /Android.*Mobile/ },
  { name: 'Android Tablet', pattern: /Android(?!.*Mobile)/ },
  { name: 'Windows Phone', pattern: /Windows Phone/ },
];

/**
 * Labels for browsers
 */
export const BROWSER_LABELS: Record<string, string> = {
  Chrome: 'Google Chrome',
  Firefox: 'Mozilla Firefox',
  Safari: 'Apple Safari',
  Edge: 'Microsoft Edge',
  Opera: 'Opera',
  IE: 'Internet Explorer',
  'Samsung Internet': 'Samsung Internet',
  Unknown: 'Unknown Browser',
};

/**
 * Labels for operating systems
 */
export const OS_LABELS: Record<string, string> = {
  Windows: 'Windows',
  macOS: 'macOS',
  iOS: 'iOS',
  Android: 'Android',
  Linux: 'Linux',
  'Chrome OS': 'Chrome OS',
  Unknown: 'Unknown OS',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the sessions collection path for a user
 */
function getSessionsPath(userId: string): string {
  return `users/${userId}/sessions`;
}

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      isMobile: false,
    };
  }

  // Detect browser
  let browser = 'Unknown';
  let browserVersion: string | undefined;
  for (const { name, pattern } of BROWSER_PATTERNS) {
    const match = userAgent.match(pattern);
    if (match) {
      browser = name;
      browserVersion = match[1];
      break;
    }
  }

  // Detect OS
  let os = 'Unknown';
  let osVersion: string | undefined;
  for (const { name, pattern, version } of OS_PATTERNS) {
    if (pattern.test(userAgent)) {
      os = name;
      if (version) {
        const vMatch = userAgent.match(version);
        if (vMatch) {
          osVersion = vMatch[1].replace(/_/g, '.');
        }
      }
      break;
    }
  }

  // Detect device
  let device = 'Desktop';
  let isMobile = false;
  for (const { name, pattern } of DEVICE_PATTERNS) {
    if (pattern.test(userAgent)) {
      device = name;
      isMobile = true;
      break;
    }
  }

  // Check for mobile keyword if not already detected
  if (!isMobile && /Mobile|Android/.test(userAgent)) {
    isMobile = true;
    device = 'Mobile Device';
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    isMobile,
  };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Check if a session has expired
 */
export function isSessionExpired(session: UserSession): boolean {
  const now = new Date();
  return (
    session.expiresAt < now ||
    (session.revokedAt !== undefined && session.revokedAt !== null)
  );
}

/**
 * Check if a session is stale (inactive too long)
 */
export function isSessionStale(
  session: UserSession,
  timeout: number = DEFAULT_SESSION_CONFIG.sessionTimeout
): boolean {
  const now = Date.now();
  const lastActive = session.lastActiveAt.getTime();
  return now - lastActive > timeout;
}

// ============================================
// Core Functions
// ============================================

/**
 * Create a new session for a user
 */
export async function createSession(
  input: CreateSessionInput
): Promise<UserSession> {
  const { userId, orgId, userAgent, ipAddress = 'unknown', location } = input;

  const sessionId = generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEFAULT_SESSION_CONFIG.absoluteTimeout);
  const deviceInfo = parseUserAgent(userAgent);

  const session: Omit<UserSession, 'id' | 'isCurrentSession'> = {
    userId,
    orgId,
    deviceInfo,
    ipAddress,
    location,
    userAgent,
    createdAt: now,
    lastActiveAt: now,
    expiresAt,
  };

  const sessionsRef = collection(db, getSessionsPath(userId));
  const sessionDocRef = doc(sessionsRef, sessionId);

  await setDoc(sessionDocRef, {
    ...session,
    createdAt: Timestamp.fromDate(now),
    lastActiveAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  // Log session creation
  await logAuditEvent(orgId, {
    userId,
    userEmail: 'system',
    action: 'LOGIN',
    resource: 'session',
    resourceId: sessionId,
    details: {
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      device: deviceInfo.device,
      ipAddress,
      location: location?.city ? `${location.city}, ${location.country}` : undefined,
    },
    severity: 'info',
  });

  return {
    ...session,
    id: sessionId,
    isCurrentSession: true,
  };
}

/**
 * Get all active sessions for a user
 */
export async function getActiveSessions(
  userId: string,
  currentSessionId?: string
): Promise<UserSession[]> {
  if (!userId) {
    return [];
  }

  try {
    const sessionsRef = collection(db, getSessionsPath(userId));
    const constraints: QueryConstraint[] = [orderBy('lastActiveAt', 'desc')];

    const q = query(sessionsRef, ...constraints);
    const snapshot = await getDocs(q);

    const now = new Date();
    const sessions: UserSession[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const session: UserSession = {
        id: doc.id,
        userId: data.userId,
        orgId: data.orgId,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        location: data.location,
        userAgent: data.userAgent,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
        lastActiveAt:
          data.lastActiveAt instanceof Timestamp
            ? data.lastActiveAt.toDate()
            : new Date(data.lastActiveAt),
        expiresAt:
          data.expiresAt instanceof Timestamp
            ? data.expiresAt.toDate()
            : new Date(data.expiresAt),
        isCurrentSession: doc.id === currentSessionId,
        revokedAt:
          data.revokedAt instanceof Timestamp
            ? data.revokedAt.toDate()
            : data.revokedAt
            ? new Date(data.revokedAt)
            : undefined,
        revokedBy: data.revokedBy,
        revokeReason: data.revokeReason,
      };

      // Only include active (non-revoked, non-expired) sessions
      if (!session.revokedAt && session.expiresAt > now) {
        sessions.push(session);
      }
    });

    return sessions;
  } catch (error) {
    console.error('[SessionManager] Failed to get active sessions:', error);
    return [];
  }
}

/**
 * Get a specific session by ID
 */
export async function getSession(
  userId: string,
  sessionId: string
): Promise<UserSession | null> {
  if (!userId || !sessionId) {
    return null;
  }

  try {
    const sessionRef = doc(db, getSessionsPath(userId), sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return null;
    }

    const data = sessionDoc.data();
    return {
      id: sessionDoc.id,
      userId: data.userId,
      orgId: data.orgId,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      location: data.location,
      userAgent: data.userAgent,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
      lastActiveAt:
        data.lastActiveAt instanceof Timestamp
          ? data.lastActiveAt.toDate()
          : new Date(data.lastActiveAt),
      expiresAt:
        data.expiresAt instanceof Timestamp
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt),
      isCurrentSession: false,
      revokedAt:
        data.revokedAt instanceof Timestamp
          ? data.revokedAt.toDate()
          : data.revokedAt
          ? new Date(data.revokedAt)
          : undefined,
      revokedBy: data.revokedBy,
      revokeReason: data.revokeReason,
    };
  } catch (error) {
    console.error('[SessionManager] Failed to get session:', error);
    return null;
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
  userId: string,
  sessionId: string,
  revokedBy: string,
  reason?: string
): Promise<void> {
  if (!userId || !sessionId) {
    return;
  }

  try {
    const sessionRef = doc(db, getSessionsPath(userId), sessionId);
    const session = await getSession(userId, sessionId);

    if (!session) {
      console.warn('[SessionManager] Session not found:', sessionId);
      return;
    }

    const now = new Date();
    await updateDoc(sessionRef, {
      revokedAt: Timestamp.fromDate(now),
      revokedBy,
      revokeReason: reason || 'User initiated',
    });

    // Log session revocation
    await logAuditEvent(session.orgId, {
      userId: revokedBy,
      userEmail: 'system',
      action: 'LOGOUT',
      resource: 'session',
      resourceId: sessionId,
      details: {
        targetUserId: userId,
        reason: reason || 'User initiated',
        sessionDevice: session.deviceInfo.device,
        sessionBrowser: session.deviceInfo.browser,
      },
      severity: 'info',
    });
  } catch (error) {
    console.error('[SessionManager] Failed to revoke session:', error);
    throw error;
  }
}

/**
 * Revoke all sessions for a user, optionally except the current one
 */
export async function revokeAllSessions(
  userId: string,
  revokedBy: string,
  exceptSessionId?: string,
  reason?: string
): Promise<number> {
  if (!userId) {
    return 0;
  }

  try {
    const sessions = await getActiveSessions(userId);
    const sessionsToRevoke = sessions.filter((s) => s.id !== exceptSessionId);

    if (sessionsToRevoke.length === 0) {
      return 0;
    }

    const batch = writeBatch(db);
    const now = Timestamp.fromDate(new Date());

    sessionsToRevoke.forEach((session) => {
      const sessionRef = doc(db, getSessionsPath(userId), session.id);
      batch.update(sessionRef, {
        revokedAt: now,
        revokedBy,
        revokeReason: reason || 'Bulk revocation',
      });
    });

    await batch.commit();

    // Log bulk revocation
    const orgId = sessionsToRevoke[0]?.orgId;
    if (orgId) {
      await logAuditEvent(orgId, {
        userId: revokedBy,
        userEmail: 'system',
        action: 'LOGOUT',
        resource: 'session',
        details: {
          targetUserId: userId,
          sessionCount: sessionsToRevoke.length,
          reason: reason || 'Bulk revocation',
          exceptSessionId,
        },
        severity: 'warning',
      });
    }

    return sessionsToRevoke.length;
  } catch (error) {
    console.error('[SessionManager] Failed to revoke all sessions:', error);
    throw error;
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(
  userId: string,
  sessionId: string
): Promise<void> {
  if (!userId || !sessionId) {
    return;
  }

  try {
    const sessionRef = doc(db, getSessionsPath(userId), sessionId);
    await updateDoc(sessionRef, {
      lastActiveAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    // Silently fail - activity updates shouldn't break the app
    console.warn('[SessionManager] Failed to update session activity:', error);
  }
}

/**
 * Check if user has reached session limit
 */
export async function checkSessionLimit(
  userId: string,
  maxSessions: number = DEFAULT_SESSION_CONFIG.maxConcurrentSessions
): Promise<{ limitReached: boolean; activeSessions: number; oldestSession?: UserSession }> {
  const sessions = await getActiveSessions(userId);
  const activeSessions = sessions.length;

  if (activeSessions >= maxSessions) {
    // Find oldest session for potential eviction
    const oldestSession = sessions[sessions.length - 1];
    return {
      limitReached: true,
      activeSessions,
      oldestSession,
    };
  }

  return {
    limitReached: false,
    activeSessions,
  };
}

/**
 * Clean up expired sessions for a user
 */
export async function cleanupExpiredSessions(userId: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  try {
    const sessionsRef = collection(db, getSessionsPath(userId));
    const snapshot = await getDocs(sessionsRef);

    const now = new Date();
    const batch = writeBatch(db);
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const expiresAt =
        data.expiresAt instanceof Timestamp
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt);

      // Delete sessions that expired more than 30 days ago
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (expiresAt < thirtyDaysAgo || data.revokedAt) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return deletedCount;
  } catch (error) {
    console.error('[SessionManager] Failed to cleanup sessions:', error);
    return 0;
  }
}

/**
 * Subscribe to session changes for real-time updates
 */
export function subscribeToSessions(
  userId: string,
  currentSessionId: string | undefined,
  callback: (sessions: UserSession[]) => void
): () => void {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const sessionsRef = collection(db, getSessionsPath(userId));
  const q = query(sessionsRef, orderBy('lastActiveAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const now = new Date();
      const sessions: UserSession[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const session: UserSession = {
          id: doc.id,
          userId: data.userId,
          orgId: data.orgId,
          deviceInfo: data.deviceInfo,
          ipAddress: data.ipAddress,
          location: data.location,
          userAgent: data.userAgent,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
          lastActiveAt:
            data.lastActiveAt instanceof Timestamp
              ? data.lastActiveAt.toDate()
              : new Date(data.lastActiveAt),
          expiresAt:
            data.expiresAt instanceof Timestamp
              ? data.expiresAt.toDate()
              : new Date(data.expiresAt),
          isCurrentSession: doc.id === currentSessionId,
          revokedAt:
            data.revokedAt instanceof Timestamp
              ? data.revokedAt.toDate()
              : data.revokedAt
              ? new Date(data.revokedAt)
              : undefined,
          revokedBy: data.revokedBy,
          revokeReason: data.revokeReason,
        };

        // Only include active sessions
        if (!session.revokedAt && session.expiresAt > now) {
          sessions.push(session);
        }
      });

      callback(sessions);
    },
    (error) => {
      console.error('[SessionManager] Session subscription error:', error);
      callback([]);
    }
  );
}

/**
 * Check if an action requires re-authentication
 */
export function requiresReauth(
  action: string,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): boolean {
  return config.requireReauthFor.includes(action);
}

/**
 * Get human-readable device description
 */
export function getDeviceDescription(deviceInfo: DeviceInfo): string {
  const browser = BROWSER_LABELS[deviceInfo.browser] || deviceInfo.browser;
  const os = OS_LABELS[deviceInfo.os] || deviceInfo.os;

  if (deviceInfo.isMobile) {
    return `${deviceInfo.device} (${browser})`;
  }

  return `${browser} on ${os}`;
}

/**
 * Detect suspicious session activity
 */
export function detectSuspiciousSession(
  newSession: UserSession,
  existingSessions: UserSession[]
): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check for different country in short timeframe
  if (newSession.location?.country) {
    for (const session of existingSessions) {
      if (session.location?.country && session.location.country !== newSession.location.country) {
        const timeDiff = newSession.createdAt.getTime() - session.lastActiveAt.getTime();
        // If location changed within 2 hours, flag as suspicious
        if (timeDiff < 2 * 60 * 60 * 1000) {
          reasons.push(
            `Rapid location change: ${session.location.country} to ${newSession.location.country}`
          );
        }
      }
    }
  }

  // Check for significantly different browser/OS on same day
  const today = new Date().toDateString();
  const recentSessions = existingSessions.filter(
    (s) => s.createdAt.toDateString() === today
  );

  if (recentSessions.length > 0) {
    const uniqueBrowsers = new Set(recentSessions.map((s) => s.deviceInfo.browser));
    uniqueBrowsers.add(newSession.deviceInfo.browser);
    if (uniqueBrowsers.size > 3) {
      reasons.push('Multiple different browsers used today');
    }
  }

  // Check for unknown/spoofed user agent
  if (
    newSession.deviceInfo.browser === 'Unknown' &&
    newSession.deviceInfo.os === 'Unknown'
  ) {
    reasons.push('Unrecognized browser/device');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}
