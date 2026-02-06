/**
 * Comprehensive Audit Logger for ContractorOS
 *
 * Logs all security-related and business-critical events to Firestore for
 * auditing, compliance, and analysis. Supports both security events and
 * general business operations tracking.
 *
 * Storage: organizations/{orgId}/auditLogs/{logId}
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
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

/**
 * Comprehensive audit action types covering all system operations
 */
export type AuditAction =
  // CRUD Operations
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  // Authentication Events
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  // Permission & Role Management
  | 'PERMISSION_CHANGE'
  | 'SETTINGS_CHANGE'
  // Data Operations
  | 'EXPORT'
  | 'IMPORT'
  | 'SHARE'
  // Financial Operations
  | 'PAYMENT'
  | 'REFUND'
  // Team Management
  | 'INVITE_SENT'
  | 'INVITE_ACCEPTED'
  | 'INVITE_REVOKED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'USER_REMOVED'
  // Security Events
  | 'SECURITY_THREAT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROMPT_INJECTION'
  | 'DATA_EXFILTRATION'
  | 'PII_EXPOSURE'
  | 'JAILBREAK_ATTEMPT'
  // Access Events
  | 'IMPERSONATION_START'
  | 'IMPERSONATION_END'
  | 'SENSITIVE_DATA_ACCESS';

/**
 * Severity levels for audit events
 */
export type AuditSeverity = 'info' | 'warning' | 'critical';

/**
 * Resource types that can be audited
 */
export type AuditResource =
  | 'client'
  | 'project'
  | 'invoice'
  | 'estimate'
  | 'expense'
  | 'task'
  | 'user'
  | 'team'
  | 'document'
  | 'payment'
  | 'subcontractor'
  | 'bid'
  | 'change_order'
  | 'rfi'
  | 'schedule'
  | 'time_entry'
  | 'payroll'
  | 'settings'
  | 'integration'
  | 'report'
  | 'system';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string;
  orgId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: AuditAction;
  resource: AuditResource | string;
  resourceId?: string;
  resourceName?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: AuditSeverity;
}

/**
 * Input for creating an audit log entry
 */
export type AuditLogInput = Omit<AuditLogEntry, 'id' | 'orgId' | 'timestamp'>;

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilters {
  action?: AuditAction;
  resource?: AuditResource | string;
  userId?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Pagination options for audit log queries
 */
export interface AuditLogPagination {
  limit?: number;
  cursor?: DocumentSnapshot;
}

/**
 * Result of paginated audit log query
 */
export interface AuditLogResult {
  entries: AuditLogEntry[];
  lastDoc?: DocumentSnapshot;
  hasMore: boolean;
}

// ============================================
// Constants
// ============================================

/**
 * Human-readable labels for audit actions
 */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Created',
  READ: 'Viewed',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Logged In',
  LOGOUT: 'Logged Out',
  LOGIN_FAILED: 'Login Failed',
  PERMISSION_CHANGE: 'Permission Changed',
  SETTINGS_CHANGE: 'Settings Changed',
  EXPORT: 'Exported Data',
  IMPORT: 'Imported Data',
  SHARE: 'Shared',
  PAYMENT: 'Payment Made',
  REFUND: 'Refund Issued',
  INVITE_SENT: 'Invitation Sent',
  INVITE_ACCEPTED: 'Invitation Accepted',
  INVITE_REVOKED: 'Invitation Revoked',
  USER_ACTIVATED: 'User Activated',
  USER_DEACTIVATED: 'User Deactivated',
  USER_REMOVED: 'User Removed',
  SECURITY_THREAT: 'Security Threat',
  RATE_LIMIT_EXCEEDED: 'Rate Limit Exceeded',
  PROMPT_INJECTION: 'Prompt Injection Attempt',
  DATA_EXFILTRATION: 'Data Exfiltration Attempt',
  PII_EXPOSURE: 'PII Exposure',
  JAILBREAK_ATTEMPT: 'Jailbreak Attempt',
  IMPERSONATION_START: 'Impersonation Started',
  IMPERSONATION_END: 'Impersonation Ended',
  SENSITIVE_DATA_ACCESS: 'Sensitive Data Accessed',
};

/**
 * Human-readable labels for resource types
 */
export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  client: 'Client',
  project: 'Project',
  invoice: 'Invoice',
  estimate: 'Estimate',
  expense: 'Expense',
  task: 'Task',
  user: 'User',
  team: 'Team',
  document: 'Document',
  payment: 'Payment',
  subcontractor: 'Subcontractor',
  bid: 'Bid',
  change_order: 'Change Order',
  rfi: 'RFI',
  schedule: 'Schedule',
  time_entry: 'Time Entry',
  payroll: 'Payroll',
  settings: 'Settings',
  integration: 'Integration',
  report: 'Report',
  system: 'System',
};

/**
 * Severity configuration with styling info
 */
export const AUDIT_SEVERITY_CONFIG: Record<
  AuditSeverity,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  info: {
    label: 'Info',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  warning: {
    label: 'Warning',
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
  },
  critical: {
    label: 'Critical',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the audit logs collection path for an organization
 */
function getAuditLogsPath(orgId: string): string {
  return `organizations/${orgId}/auditLogs`;
}

/**
 * Determine severity based on action type
 */
function determineSeverity(action: AuditAction): AuditSeverity {
  // Critical actions
  const criticalActions: AuditAction[] = [
    'DELETE',
    'SECURITY_THREAT',
    'DATA_EXFILTRATION',
    'JAILBREAK_ATTEMPT',
    'PII_EXPOSURE',
    'USER_REMOVED',
  ];
  if (criticalActions.includes(action)) return 'critical';

  // Warning actions
  const warningActions: AuditAction[] = [
    'PERMISSION_CHANGE',
    'LOGIN_FAILED',
    'RATE_LIMIT_EXCEEDED',
    'PROMPT_INJECTION',
    'IMPERSONATION_START',
    'IMPERSONATION_END',
    'REFUND',
    'SETTINGS_CHANGE',
    'USER_DEACTIVATED',
    'INVITE_REVOKED',
  ];
  if (warningActions.includes(action)) return 'warning';

  // Default to info
  return 'info';
}

/**
 * Generate a human-readable message for an audit event
 */
function generateMessage(entry: AuditLogInput): string {
  const resourceLabel = AUDIT_RESOURCE_LABELS[entry.resource] || entry.resource;
  const actionLabel = AUDIT_ACTION_LABELS[entry.action] || entry.action;
  const resourceName = entry.resourceName || entry.resourceId || '';

  switch (entry.action) {
    case 'CREATE':
      return `${entry.userName || entry.userEmail} created ${resourceLabel}${resourceName ? `: ${resourceName}` : ''}`;
    case 'UPDATE':
      return `${entry.userName || entry.userEmail} updated ${resourceLabel}${resourceName ? `: ${resourceName}` : ''}`;
    case 'DELETE':
      return `${entry.userName || entry.userEmail} deleted ${resourceLabel}${resourceName ? `: ${resourceName}` : ''}`;
    case 'LOGIN':
      return `${entry.userEmail} logged in`;
    case 'LOGOUT':
      return `${entry.userEmail} logged out`;
    case 'LOGIN_FAILED':
      return `Failed login attempt for ${entry.userEmail}`;
    case 'PERMISSION_CHANGE':
      return `${entry.userName || entry.userEmail} changed permissions for ${resourceName}`;
    case 'EXPORT':
      return `${entry.userName || entry.userEmail} exported ${entry.details.recordCount || ''} ${resourceLabel} records`;
    case 'INVITE_SENT':
      return `${entry.userName || entry.userEmail} invited ${entry.details.invitedEmail || 'a user'}`;
    case 'PAYMENT':
      return `${entry.userName || entry.userEmail} recorded payment${entry.details.amount ? ` of $${entry.details.amount}` : ''}`;
    default:
      return `${entry.userName || entry.userEmail} ${actionLabel.toLowerCase()} ${resourceLabel}${resourceName ? `: ${resourceName}` : ''}`;
  }
}

// ============================================
// Core Functions
// ============================================

/**
 * Log an audit event to Firestore
 */
export async function logAuditEvent(
  orgId: string,
  entry: AuditLogInput
): Promise<string | null> {
  if (!orgId) {
    logger.warn('[AuditLogger] Missing orgId, skipping audit log', { component: 'security-audit-logger' });
    return null;
  }

  try {
    const auditLogsRef = collection(db, getAuditLogsPath(orgId));

    // Auto-determine severity if not reasonable default
    const severity = entry.severity || determineSeverity(entry.action);

    const docData = {
      userId: entry.userId,
      userEmail: entry.userEmail,
      userName: entry.userName || null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || null,
      resourceName: entry.resourceName || null,
      details: entry.details || {},
      message: generateMessage(entry),
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      severity,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(auditLogsRef, docData);

    // Log critical events to console for immediate visibility
    if (severity === 'critical') {
      logger.error('Audit critical event', { action: entry.action, orgId, userId: entry.userId, resource: entry.resource, resourceId: entry.resourceId, component: 'security-audit-logger' });
    }

    return docRef.id;
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    logger.error('[AuditLogger] Failed to log audit event', { error: error, component: 'security-audit-logger' });
    return null;
  }
}

/**
 * Get audit events with filtering and pagination
 */
export async function getAuditEvents(
  orgId: string,
  filters?: AuditLogFilters,
  pagination?: AuditLogPagination
): Promise<AuditLogResult> {
  if (!orgId) {
    return { entries: [], hasMore: false };
  }

  try {
    const auditLogsRef = collection(db, getAuditLogsPath(orgId));
    const pageLimit = pagination?.limit || 50;

    // Build query constraints
    const constraints: QueryConstraint[] = [
      orderBy('timestamp', 'desc'),
      firestoreLimit(pageLimit + 1), // Fetch one extra to check if there are more
    ];

    // Add cursor for pagination
    if (pagination?.cursor) {
      constraints.push(startAfter(pagination.cursor));
    }

    // Add filters - note: Firestore has limits on compound queries
    // We apply some filters server-side, others client-side
    if (filters?.severity) {
      constraints.unshift(where('severity', '==', filters.severity));
    } else if (filters?.action) {
      constraints.unshift(where('action', '==', filters.action));
    } else if (filters?.userId) {
      constraints.unshift(where('userId', '==', filters.userId));
    } else if (filters?.resource) {
      constraints.unshift(where('resource', '==', filters.resource));
    }

    const q = query(auditLogsRef, ...constraints);
    const snapshot = await getDocs(q);

    let entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orgId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName || undefined,
        action: data.action as AuditAction,
        resource: data.resource,
        resourceId: data.resourceId || undefined,
        resourceName: data.resourceName || undefined,
        details: data.details || {},
        message: data.message,
        ipAddress: data.ipAddress || undefined,
        userAgent: data.userAgent || undefined,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp),
        severity: data.severity as AuditSeverity,
      };
    });

    // Apply client-side date filters if provided
    if (filters?.startDate) {
      entries = entries.filter((e) => e.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      entries = entries.filter((e) => e.timestamp <= filters.endDate!);
    }

    // Check if there are more results
    const hasMore = entries.length > pageLimit;
    if (hasMore) {
      entries = entries.slice(0, pageLimit);
    }

    return {
      entries,
      lastDoc: snapshot.docs[Math.min(snapshot.docs.length - 1, pageLimit - 1)],
      hasMore,
    };
  } catch (error) {
    logger.error('[AuditLogger] Failed to get audit events', { error: error, component: 'security-audit-logger' });
    return { entries: [], hasMore: false };
  }
}

// ============================================
// Helper Functions for Common Operations
// ============================================

export const auditHelpers = {
  /**
   * Log a CREATE operation
   */
  logCreate: async (
    orgId: string,
    resource: AuditResource | string,
    resourceId: string,
    userId: string,
    userEmail: string,
    details?: Record<string, unknown>
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'CREATE',
      resource,
      resourceId,
      details: details || {},
      severity: 'info',
    });
  },

  /**
   * Log an UPDATE operation with change tracking
   */
  logUpdate: async (
    orgId: string,
    resource: AuditResource | string,
    resourceId: string,
    userId: string,
    userEmail: string,
    changes: Record<string, { old: unknown; new: unknown }>
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'UPDATE',
      resource,
      resourceId,
      details: { changes },
      severity: 'info',
    });
  },

  /**
   * Log a DELETE operation
   */
  logDelete: async (
    orgId: string,
    resource: AuditResource | string,
    resourceId: string,
    userId: string,
    userEmail: string,
    details?: Record<string, unknown>
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'DELETE',
      resource,
      resourceId,
      details: details || {},
      severity: 'critical',
    });
  },

  /**
   * Log a login event
   */
  logLogin: async (
    orgId: string,
    userId: string,
    userEmail: string,
    success: boolean,
    ipAddress?: string
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      resource: 'system',
      details: { success },
      ipAddress,
      severity: success ? 'info' : 'warning',
    });
  },

  /**
   * Log a data export event
   */
  logExport: async (
    orgId: string,
    resource: AuditResource | string,
    userId: string,
    userEmail: string,
    format: string,
    recordCount: number
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'EXPORT',
      resource,
      details: { format, recordCount },
      severity: 'info',
    });
  },

  /**
   * Log a permission change event
   */
  logPermissionChange: async (
    orgId: string,
    targetUserId: string,
    userId: string,
    userEmail: string,
    oldRole: string,
    newRole: string
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'PERMISSION_CHANGE',
      resource: 'user',
      resourceId: targetUserId,
      details: { oldRole, newRole },
      severity: 'warning',
    });
  },

  /**
   * Log a settings change event
   */
  logSettingsChange: async (
    orgId: string,
    userId: string,
    userEmail: string,
    settingType: string,
    changedFields: string[]
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'SETTINGS_CHANGE',
      resource: 'settings',
      details: { settingType, changedFields },
      severity: 'warning',
    });
  },

  /**
   * Log an invitation sent event
   */
  logInviteSent: async (
    orgId: string,
    userId: string,
    userEmail: string,
    invitedEmail: string,
    assignedRole: string
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'INVITE_SENT',
      resource: 'team',
      details: { invitedEmail, assignedRole },
      severity: 'info',
    });
  },

  /**
   * Log an invitation accepted event
   */
  logInviteAccepted: async (
    orgId: string,
    userId: string,
    userEmail: string,
    invitedBy: string
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'INVITE_ACCEPTED',
      resource: 'team',
      details: { invitedBy },
      severity: 'info',
    });
  },

  /**
   * Log a payment event
   */
  logPayment: async (
    orgId: string,
    userId: string,
    userEmail: string,
    invoiceId: string,
    amount: number,
    method: string
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: 'PAYMENT',
      resource: 'payment',
      resourceId: invoiceId,
      details: { amount, method },
      severity: 'info',
    });
  },

  /**
   * Log an impersonation event
   */
  logImpersonation: async (
    orgId: string,
    userId: string,
    userEmail: string,
    impersonatedRole: string,
    action: 'start' | 'end'
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId,
      userEmail,
      action: action === 'start' ? 'IMPERSONATION_START' : 'IMPERSONATION_END',
      resource: 'system',
      details: { impersonatedRole },
      severity: 'warning',
    });
  },

  /**
   * Log a security threat event
   */
  logSecurityThreat: async (
    orgId: string,
    userId: string | undefined,
    userEmail: string | undefined,
    threatType: string,
    description: string,
    blocked: boolean,
    riskScore?: number
  ): Promise<void> => {
    await logAuditEvent(orgId, {
      userId: userId || 'unknown',
      userEmail: userEmail || 'unknown',
      action: 'SECURITY_THREAT',
      resource: 'system',
      details: { threatType, description, blocked, riskScore },
      severity: 'critical',
    });
  },
};

// ============================================
// Legacy Compatibility Exports
// ============================================

// Re-export types for backwards compatibility with existing code
export type AuditEventType = AuditAction;
export type StoredAuditEvent = AuditLogEntry;

// Legacy function signatures for backwards compatibility
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
  await logAuditEvent(orgId, {
    userId: userId || 'unknown',
    userEmail: 'unknown',
    action: 'RATE_LIMIT_EXCEEDED',
    resource: 'system',
    details,
    severity: 'warning',
  });
}

export async function logAuthFailure(
  orgId: string,
  details: {
    reason: string;
    ip?: string;
    endpoint: string;
    userId?: string;
  }
): Promise<void> {
  await logAuditEvent(orgId, {
    userId: details.userId || 'unknown',
    userEmail: 'unknown',
    action: 'LOGIN_FAILED',
    resource: 'system',
    details,
    ipAddress: details.ip,
    severity: 'warning',
  });
}

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
  await auditHelpers.logSecurityThreat(
    orgId,
    userId,
    undefined,
    details.threatType,
    details.description,
    details.blocked,
    details.riskScore
  );
}
