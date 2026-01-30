/**
 * Audit Log Service
 *
 * Tracks security-sensitive actions for compliance and troubleshooting.
 * This includes role changes, permission modifications, team management, and access events.
 */

import { collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserRole, RolePermissions } from '@/types';

// ============================================
// Types
// ============================================

export type AuditEventType =
  // Role & Permission Events
  | 'role_changed'
  | 'permissions_updated'
  // Team Management Events
  | 'user_invited'
  | 'user_activated'
  | 'user_deactivated'
  | 'user_removed'
  | 'invitation_revoked'
  | 'invitation_accepted'
  // Access Events
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'impersonation_started'
  | 'impersonation_ended'
  // Settings Changes
  | 'org_settings_updated'
  | 'security_settings_updated'
  // Data Access Events
  | 'sensitive_data_accessed'
  | 'data_exported'
  | 'bulk_operation';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string;
  orgId: string;
  type: AuditEventType;
  severity: AuditSeverity;
  message: string;
  // Who performed the action
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  // Who was affected (for user-related events)
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  // What changed
  previousValue?: string | Record<string, unknown>;
  newValue?: string | Record<string, unknown>;
  // Additional context
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  // Timestamps
  timestamp: Date;
}

export type AuditLogInput = Omit<AuditLogEntry, 'id' | 'timestamp'>;

// ============================================
// Constants
// ============================================

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  role_changed: 'Role Changed',
  permissions_updated: 'Permissions Updated',
  user_invited: 'User Invited',
  user_activated: 'User Activated',
  user_deactivated: 'User Deactivated',
  user_removed: 'User Removed',
  invitation_revoked: 'Invitation Revoked',
  invitation_accepted: 'Invitation Accepted',
  login_success: 'Login Successful',
  login_failed: 'Login Failed',
  logout: 'Logged Out',
  impersonation_started: 'Impersonation Started',
  impersonation_ended: 'Impersonation Ended',
  org_settings_updated: 'Organization Settings Updated',
  security_settings_updated: 'Security Settings Updated',
  sensitive_data_accessed: 'Sensitive Data Accessed',
  data_exported: 'Data Exported',
  bulk_operation: 'Bulk Operation Performed',
};

export const SEVERITY_CONFIG: Record<AuditSeverity, { label: string; color: string }> = {
  info: { label: 'Info', color: 'blue' },
  warning: { label: 'Warning', color: 'amber' },
  critical: { label: 'Critical', color: 'red' },
};

// ============================================
// Core Functions
// ============================================

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogInput): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'auditLog'), {
      ...entry,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    // Silent fail - audit logging should never block operations
    console.warn('Failed to log audit event:', err);
    return null;
  }
}

/**
 * Get recent audit events for an organization
 */
export async function getRecentAuditEvents(
  orgId: string,
  options: {
    limit?: number;
    type?: AuditEventType;
    severity?: AuditSeverity;
  } = {}
): Promise<AuditLogEntry[]> {
  try {
    const constraints = [
      where('orgId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(options.limit || 50),
    ];

    const q = query(collection(db, 'auditLog'), ...constraints);
    const snap = await getDocs(q);

    let entries = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AuditLogEntry[];

    // Filter in memory if type/severity specified (Firestore doesn't support multiple where with orderBy easily)
    if (options.type) {
      entries = entries.filter((e) => e.type === options.type);
    }
    if (options.severity) {
      entries = entries.filter((e) => e.severity === options.severity);
    }

    return entries;
  } catch (err) {
    console.error('Failed to fetch audit events:', err);
    return [];
  }
}

// ============================================
// Helper Functions for Common Events
// ============================================

/**
 * Log a role change event
 */
export async function logRoleChange(params: {
  orgId: string;
  actor: { id: string; name: string; role: UserRole };
  target: { id: string; name: string; email: string };
  previousRole: UserRole;
  newRole: UserRole;
}): Promise<void> {
  await logAuditEvent({
    orgId: params.orgId,
    type: 'role_changed',
    severity: 'warning',
    message: `${params.actor.name} changed ${params.target.name}'s role from ${params.previousRole} to ${params.newRole}`,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    targetUserId: params.target.id,
    targetUserName: params.target.name,
    targetUserEmail: params.target.email,
    previousValue: params.previousRole,
    newValue: params.newRole,
  });
}

/**
 * Log a user invitation event
 */
export async function logUserInvitation(params: {
  orgId: string;
  actor: { id: string; name: string; role: UserRole };
  invitedEmail: string;
  assignedRole: UserRole;
}): Promise<void> {
  await logAuditEvent({
    orgId: params.orgId,
    type: 'user_invited',
    severity: 'info',
    message: `${params.actor.name} invited ${params.invitedEmail} as ${params.assignedRole}`,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    targetUserEmail: params.invitedEmail,
    newValue: params.assignedRole,
  });
}

/**
 * Log a user activation/deactivation event
 */
export async function logUserStatusChange(params: {
  orgId: string;
  actor: { id: string; name: string; role: UserRole };
  target: { id: string; name: string; email: string };
  action: 'activated' | 'deactivated' | 'removed';
}): Promise<void> {
  const typeMap: Record<string, AuditEventType> = {
    activated: 'user_activated',
    deactivated: 'user_deactivated',
    removed: 'user_removed',
  };

  await logAuditEvent({
    orgId: params.orgId,
    type: typeMap[params.action],
    severity: params.action === 'removed' ? 'warning' : 'info',
    message: `${params.actor.name} ${params.action} ${params.target.name}`,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    targetUserId: params.target.id,
    targetUserName: params.target.name,
    targetUserEmail: params.target.email,
  });
}

/**
 * Log an impersonation event
 */
export async function logImpersonation(params: {
  orgId: string;
  actor: { id: string; name: string; role: UserRole };
  impersonatedRole: string;
  action: 'started' | 'ended';
}): Promise<void> {
  await logAuditEvent({
    orgId: params.orgId,
    type: params.action === 'started' ? 'impersonation_started' : 'impersonation_ended',
    severity: 'warning',
    message: `${params.actor.name} ${params.action} impersonating ${params.impersonatedRole} role`,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    metadata: { impersonatedRole: params.impersonatedRole },
  });
}

/**
 * Log a data export event
 */
export async function logDataExport(params: {
  orgId: string;
  actor: { id: string; name: string; role: UserRole };
  exportType: string;
  recordCount: number;
}): Promise<void> {
  await logAuditEvent({
    orgId: params.orgId,
    type: 'data_exported',
    severity: 'info',
    message: `${params.actor.name} exported ${params.recordCount} ${params.exportType} records`,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    metadata: {
      exportType: params.exportType,
      recordCount: params.recordCount,
    },
  });
}

/**
 * Log settings update
 */
export async function logSettingsUpdate(params: {
  orgId: string;
  actor: { id: string; name: string; role: UserRole };
  settingType: 'organization' | 'security' | 'integrations';
  changedFields: string[];
}): Promise<void> {
  const typeMap: Record<string, AuditEventType> = {
    organization: 'org_settings_updated',
    security: 'security_settings_updated',
    integrations: 'org_settings_updated',
  };

  await logAuditEvent({
    orgId: params.orgId,
    type: typeMap[params.settingType],
    severity: params.settingType === 'security' ? 'warning' : 'info',
    message: `${params.actor.name} updated ${params.settingType} settings: ${params.changedFields.join(', ')}`,
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    metadata: {
      settingType: params.settingType,
      changedFields: params.changedFields,
    },
  });
}
