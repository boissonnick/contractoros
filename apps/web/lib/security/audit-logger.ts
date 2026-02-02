/**
 * Audit Logger for Security Events
 *
 * Logs security-related events to Firestore for auditing and analysis.
 * Used for tracking rate limit violations, authentication failures,
 * prompt injection attempts, and other security threats.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Severity level for audit events
 */
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Types of security audit events
 */
export type AuditEventType =
  | 'security_threat'
  | 'rate_limit_exceeded'
  | 'auth_failure'
  | 'prompt_injection'
  | 'data_exfiltration'
  | 'pii_exposure'
  | 'jailbreak_attempt';

/**
 * Audit event structure
 */
export interface AuditEvent {
  type: AuditEventType;
  orgId: string;
  userId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
  severity: AuditSeverity;
}

/**
 * Stored audit event (includes Firestore document ID)
 */
export interface StoredAuditEvent extends AuditEvent {
  id: string;
}

/**
 * Get the audit logs collection path for an organization
 */
function getAuditLogsPath(orgId: string): string {
  return `organizations/${orgId}/auditLogs`;
}

/**
 * Determine severity based on event type and details
 */
function determineSeverity(
  type: AuditEventType,
  details: Record<string, unknown>
): AuditSeverity {
  // Critical: Active attacks or high-risk threats
  if (type === 'prompt_injection' || type === 'jailbreak_attempt') {
    const riskScore = details.riskScore as number | undefined;
    if (riskScore && riskScore >= 80) return 'critical';
    if (riskScore && riskScore >= 60) return 'high';
    return 'medium';
  }

  if (type === 'data_exfiltration') {
    return 'critical';
  }

  if (type === 'pii_exposure') {
    return 'high';
  }

  // Medium: Rate limits, auth failures
  if (type === 'rate_limit_exceeded') {
    const consecutiveViolations = details.consecutiveViolations as number | undefined;
    if (consecutiveViolations && consecutiveViolations >= 5) return 'high';
    return 'medium';
  }

  if (type === 'auth_failure') {
    const attempts = details.attempts as number | undefined;
    if (attempts && attempts >= 5) return 'high';
    return 'medium';
  }

  // Default
  return 'low';
}

/**
 * Log an audit event to Firestore
 */
export async function logAuditEvent(
  event: Omit<AuditEvent, 'severity'> & { severity?: AuditSeverity }
): Promise<void> {
  try {
    const auditLogsRef = collection(db, getAuditLogsPath(event.orgId));

    // Auto-determine severity if not provided
    const severity = event.severity || determineSeverity(event.type, event.details);

    await addDoc(auditLogsRef, {
      type: event.type,
      orgId: event.orgId,
      userId: event.userId || null,
      details: event.details,
      timestamp: Timestamp.fromDate(event.timestamp),
      severity,
      createdAt: Timestamp.now(),
    });

    // Log critical events to console for immediate visibility
    if (severity === 'critical' || severity === 'high') {
      console.error(`[AUDIT:${severity.toUpperCase()}] ${event.type}`, {
        orgId: event.orgId,
        userId: event.userId,
        details: event.details,
      });
    }
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('[AuditLogger] Failed to log audit event:', error, {
      eventType: event.type,
      orgId: event.orgId,
    });
  }
}

/**
 * Get audit events for an organization
 */
export async function getAuditEvents(
  orgId: string,
  options?: {
    limit?: number;
    type?: AuditEventType;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<StoredAuditEvent[]> {
  try {
    const auditLogsRef = collection(db, getAuditLogsPath(orgId));

    // Build query - simple version without complex filters
    // Note: Complex queries with multiple filters require composite indexes
    let q;

    if (options?.type) {
      q = query(
        auditLogsRef,
        where('type', '==', options.type),
        orderBy('timestamp', 'desc'),
        firestoreLimit(options?.limit || 100)
      );
    } else if (options?.severity) {
      q = query(
        auditLogsRef,
        where('severity', '==', options.severity),
        orderBy('timestamp', 'desc'),
        firestoreLimit(options?.limit || 100)
      );
    } else {
      q = query(
        auditLogsRef,
        orderBy('timestamp', 'desc'),
        firestoreLimit(options?.limit || 100)
      );
    }

    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type as AuditEventType,
        orgId: data.orgId,
        userId: data.userId || undefined,
        details: data.details,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp),
        severity: data.severity as AuditSeverity,
      };
    });

    // Apply client-side date filters if provided
    if (options?.startDate) {
      results = results.filter((e) => e.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      results = results.filter((e) => e.timestamp <= options.endDate!);
    }

    return results;
  } catch (error) {
    console.error('[AuditLogger] Failed to get audit events:', error);
    return [];
  }
}

/**
 * Log a rate limit exceeded event
 */
export async function logRateLimitExceeded(
  orgId: string,
  userId: string | undefined,
  details: {
    limit: number;
    current: number;
    resetAt: Date;
    endpoint: string;
  }
): Promise<void> {
  await logAuditEvent({
    type: 'rate_limit_exceeded',
    orgId,
    userId,
    details,
    timestamp: new Date(),
  });
}

/**
 * Log an authentication failure event
 */
export async function logAuthFailure(
  orgId: string,
  details: {
    reason: string;
    ip?: string;
    endpoint: string;
    userId?: string;
  }
): Promise<void> {
  await logAuditEvent({
    type: 'auth_failure',
    orgId,
    userId: details.userId,
    details,
    timestamp: new Date(),
  });
}

/**
 * Log a security threat event (generic)
 */
export async function logSecurityThreat(
  orgId: string,
  userId: string | undefined,
  details: {
    threatType: string;
    description: string;
    blocked: boolean;
    riskScore?: number;
    [key: string]: unknown;
  }
): Promise<void> {
  await logAuditEvent({
    type: 'security_threat',
    orgId,
    userId,
    details,
    timestamp: new Date(),
  });
}
