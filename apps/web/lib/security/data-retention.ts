/**
 * Data Retention Policy Management for ContractorOS
 *
 * Provides configurable data retention policies for compliance with various
 * data protection regulations (GDPR, CCPA, etc.). Allows organizations to
 * define how long different types of data should be retained before archival,
 * anonymization, or deletion.
 *
 * Storage: organizations/{orgId}/settings/dataRetention
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { addDays, differenceInDays, startOfDay, isAfter, isBefore } from 'date-fns';

// ============================================
// Types
// ============================================

/**
 * Supported resource types for data retention policies
 */
export type RetentionResource =
  | 'auditLogs'
  | 'messages'
  | 'activityLogs'
  | 'deletedItems'
  | 'exportedData'
  | 'notifications'
  | 'voiceLogs'
  | 'aiConversations'
  | 'timeEntries'
  | 'photos';

/**
 * Actions to take when retention period expires
 */
export type RetentionAction = 'archive' | 'delete' | 'anonymize';

/**
 * A single retention policy configuration
 */
export interface RetentionPolicy {
  id: string;
  orgId: string;
  resource: RetentionResource;
  retentionDays: number;
  action: RetentionAction;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastRunRecordsAffected?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Input for creating/updating a retention policy
 */
export type RetentionPolicyInput = Omit<
  RetentionPolicy,
  'id' | 'orgId' | 'createdAt' | 'updatedAt'
>;

/**
 * Configuration limits for each resource type
 */
export interface RetentionLimits {
  default: number;
  min: number;
  max: number;
  description: string;
  recommendedAction: RetentionAction;
}

/**
 * Complete retention configuration with all resource limits
 */
export interface RetentionConfig {
  auditLogs: RetentionLimits;
  messages: RetentionLimits;
  activityLogs: RetentionLimits;
  deletedItems: RetentionLimits;
  exportedData: RetentionLimits;
  notifications: RetentionLimits;
  voiceLogs: RetentionLimits;
  aiConversations: RetentionLimits;
  timeEntries: RetentionLimits;
  photos: RetentionLimits;
}

/**
 * Data affected by retention policy (for preview)
 */
export interface RetentionPreview {
  resource: RetentionResource;
  totalRecords: number;
  recordsAffected: number;
  oldestRecord?: Date;
  newestAffected?: Date;
  estimatedStorageSaved?: string;
}

/**
 * Retention run history entry
 */
export interface RetentionRunHistory {
  id: string;
  orgId: string;
  resource: RetentionResource;
  action: RetentionAction;
  recordsProcessed: number;
  recordsAffected: number;
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

// ============================================
// Constants
// ============================================

/**
 * Default retention configuration with compliance-aware limits
 */
export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  auditLogs: {
    default: 365,
    min: 90,
    max: 2555, // ~7 years for compliance
    description: 'Security and compliance audit trail',
    recommendedAction: 'archive',
  },
  messages: {
    default: 180,
    min: 30,
    max: 365,
    description: 'Internal team and client messages',
    recommendedAction: 'archive',
  },
  activityLogs: {
    default: 90,
    min: 30,
    max: 365,
    description: 'User activity and system events',
    recommendedAction: 'delete',
  },
  deletedItems: {
    default: 30,
    min: 7,
    max: 90,
    description: 'Soft-deleted records awaiting permanent removal',
    recommendedAction: 'delete',
  },
  exportedData: {
    default: 7,
    min: 1,
    max: 30,
    description: 'Temporary export files and downloads',
    recommendedAction: 'delete',
  },
  notifications: {
    default: 60,
    min: 7,
    max: 180,
    description: 'Push and in-app notifications',
    recommendedAction: 'delete',
  },
  voiceLogs: {
    default: 30,
    min: 7,
    max: 90,
    description: 'Voice memo recordings and transcriptions',
    recommendedAction: 'archive',
  },
  aiConversations: {
    default: 90,
    min: 30,
    max: 365,
    description: 'AI assistant conversation history',
    recommendedAction: 'anonymize',
  },
  timeEntries: {
    default: 730, // 2 years
    min: 365,
    max: 2555, // 7 years for payroll compliance
    description: 'Employee time tracking records',
    recommendedAction: 'archive',
  },
  photos: {
    default: 365,
    min: 90,
    max: 2555,
    description: 'Project and job site photos',
    recommendedAction: 'archive',
  },
};

/**
 * Human-readable labels for retention resources
 */
export const RETENTION_RESOURCE_LABELS: Record<RetentionResource, string> = {
  auditLogs: 'Audit Logs',
  messages: 'Messages',
  activityLogs: 'Activity Logs',
  deletedItems: 'Deleted Items',
  exportedData: 'Exported Data',
  notifications: 'Notifications',
  voiceLogs: 'Voice Logs',
  aiConversations: 'AI Conversations',
  timeEntries: 'Time Entries',
  photos: 'Photos',
};

/**
 * Human-readable labels for retention actions
 */
export const RETENTION_ACTION_LABELS: Record<RetentionAction, string> = {
  archive: 'Archive',
  delete: 'Delete',
  anonymize: 'Anonymize',
};

/**
 * Descriptions for retention actions
 */
export const RETENTION_ACTION_DESCRIPTIONS: Record<RetentionAction, string> = {
  archive: 'Move to cold storage. Data remains accessible but is removed from active database.',
  delete: 'Permanently remove from all systems. This action cannot be undone.',
  anonymize: 'Remove personally identifiable information while keeping aggregate data.',
};

/**
 * Firestore collection paths for each resource type
 */
export const RESOURCE_COLLECTION_PATHS: Record<RetentionResource, string> = {
  auditLogs: 'auditLogs',
  messages: 'messages',
  activityLogs: 'activityLogs',
  deletedItems: 'deletedItems',
  exportedData: 'exportedData',
  notifications: 'notifications',
  voiceLogs: 'voiceLogs',
  aiConversations: 'aiConversations',
  timeEntries: 'timeEntries',
  photos: 'photos',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the settings document path for an organization's retention policies
 */
function getRetentionSettingsPath(orgId: string): string {
  return `organizations/${orgId}/settings/dataRetention`;
}

/**
 * Get the retention history collection path
 */
function getRetentionHistoryPath(orgId: string): string {
  return `organizations/${orgId}/retentionHistory`;
}

/**
 * Convert Firestore data to RetentionPolicy
 */
function toRetentionPolicy(
  id: string,
  orgId: string,
  data: Record<string, unknown>
): RetentionPolicy {
  return {
    id,
    orgId,
    resource: data.resource as RetentionResource,
    retentionDays: data.retentionDays as number,
    action: data.action as RetentionAction,
    enabled: data.enabled as boolean,
    lastRun: data.lastRun instanceof Timestamp ? data.lastRun.toDate() : undefined,
    nextRun: data.nextRun instanceof Timestamp ? data.nextRun.toDate() : undefined,
    lastRunRecordsAffected: data.lastRunRecordsAffected as number | undefined,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    createdBy: data.createdBy as string | undefined,
    updatedBy: data.updatedBy as string | undefined,
  };
}

/**
 * Validate retention days against resource limits
 */
function validateRetentionDays(
  resource: RetentionResource,
  days: number
): { valid: boolean; message?: string } {
  const limits = DEFAULT_RETENTION_CONFIG[resource];
  if (days < limits.min) {
    return {
      valid: false,
      message: `Minimum retention for ${RETENTION_RESOURCE_LABELS[resource]} is ${limits.min} days`,
    };
  }
  if (days > limits.max) {
    return {
      valid: false,
      message: `Maximum retention for ${RETENTION_RESOURCE_LABELS[resource]} is ${limits.max} days`,
    };
  }
  return { valid: true };
}

// ============================================
// Core Functions
// ============================================

/**
 * Get all retention policies for an organization
 */
export async function getRetentionPolicies(
  orgId: string
): Promise<RetentionPolicy[]> {
  if (!orgId) {
    console.warn('[DataRetention] Missing orgId');
    return [];
  }

  try {
    const docRef = doc(db, getRetentionSettingsPath(orgId));
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Return default policies if none exist
      return getDefaultPolicies(orgId);
    }

    const data = docSnap.data();
    const policies: RetentionPolicy[] = [];

    // Extract policies from the document
    for (const resource of Object.keys(RETENTION_RESOURCE_LABELS) as RetentionResource[]) {
      if (data[resource]) {
        policies.push(toRetentionPolicy(resource, orgId, data[resource]));
      } else {
        // Add default policy for missing resources
        const defaultConfig = DEFAULT_RETENTION_CONFIG[resource];
        policies.push({
          id: resource,
          orgId,
          resource,
          retentionDays: defaultConfig.default,
          action: defaultConfig.recommendedAction,
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return policies;
  } catch (error) {
    console.error('[DataRetention] Failed to get retention policies:', error);
    return getDefaultPolicies(orgId);
  }
}

/**
 * Get a single retention policy by resource type
 */
export async function getRetentionPolicy(
  orgId: string,
  resource: RetentionResource
): Promise<RetentionPolicy | null> {
  if (!orgId) return null;

  try {
    const policies = await getRetentionPolicies(orgId);
    return policies.find((p) => p.resource === resource) || null;
  } catch (error) {
    console.error('[DataRetention] Failed to get retention policy:', error);
    return null;
  }
}

/**
 * Update a retention policy
 */
export async function updateRetentionPolicy(
  orgId: string,
  resource: RetentionResource,
  updates: Partial<RetentionPolicyInput>,
  updatedBy?: string
): Promise<{ success: boolean; error?: string }> {
  if (!orgId) {
    return { success: false, error: 'Missing organization ID' };
  }

  // Validate retention days if provided
  if (updates.retentionDays !== undefined) {
    const validation = validateRetentionDays(resource, updates.retentionDays);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }
  }

  try {
    const docRef = doc(db, getRetentionSettingsPath(orgId));
    const docSnap = await getDoc(docRef);

    const policyData = {
      resource,
      retentionDays:
        updates.retentionDays ?? DEFAULT_RETENTION_CONFIG[resource].default,
      action:
        updates.action ?? DEFAULT_RETENTION_CONFIG[resource].recommendedAction,
      enabled: updates.enabled ?? false,
      updatedAt: Timestamp.now(),
      updatedBy,
    };

    if (!docSnap.exists()) {
      // Create new document with this policy
      await setDoc(docRef, {
        [resource]: {
          ...policyData,
          createdAt: Timestamp.now(),
          createdBy: updatedBy,
        },
        updatedAt: Timestamp.now(),
      });
    } else {
      // Update existing document
      await updateDoc(docRef, {
        [resource]: {
          ...docSnap.data()[resource],
          ...policyData,
        },
        updatedAt: Timestamp.now(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[DataRetention] Failed to update retention policy:', error);
    return { success: false, error: 'Failed to update policy' };
  }
}

/**
 * Update multiple retention policies at once
 */
export async function updateRetentionPolicies(
  orgId: string,
  policies: Array<{ resource: RetentionResource; updates: Partial<RetentionPolicyInput> }>,
  updatedBy?: string
): Promise<{ success: boolean; errors?: string[] }> {
  if (!orgId) {
    return { success: false, errors: ['Missing organization ID'] };
  }

  const errors: string[] = [];

  // Validate all policies first
  for (const { resource, updates } of policies) {
    if (updates.retentionDays !== undefined) {
      const validation = validateRetentionDays(resource, updates.retentionDays);
      if (!validation.valid) {
        errors.push(validation.message!);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  try {
    const docRef = doc(db, getRetentionSettingsPath(orgId));
    const docSnap = await getDoc(docRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    for (const { resource, updates } of policies) {
      const existingPolicy = existingData[resource] || {};
      updateData[resource] = {
        ...existingPolicy,
        resource,
        retentionDays:
          updates.retentionDays ??
          existingPolicy.retentionDays ??
          DEFAULT_RETENTION_CONFIG[resource].default,
        action:
          updates.action ??
          existingPolicy.action ??
          DEFAULT_RETENTION_CONFIG[resource].recommendedAction,
        enabled: updates.enabled ?? existingPolicy.enabled ?? false,
        updatedAt: Timestamp.now(),
        updatedBy,
        createdAt: existingPolicy.createdAt || Timestamp.now(),
        createdBy: existingPolicy.createdBy || updatedBy,
      };
    }

    if (!docSnap.exists()) {
      await setDoc(docRef, updateData);
    } else {
      await updateDoc(docRef, updateData);
    }

    return { success: true };
  } catch (error) {
    console.error('[DataRetention] Failed to update retention policies:', error);
    return { success: false, errors: ['Failed to update policies'] };
  }
}

/**
 * Get the default retention configuration
 */
export function getDefaultRetentionConfig(): RetentionConfig {
  return DEFAULT_RETENTION_CONFIG;
}

/**
 * Get default policies for an organization (used when no policies are configured)
 */
export function getDefaultPolicies(orgId: string): RetentionPolicy[] {
  return (Object.keys(DEFAULT_RETENTION_CONFIG) as RetentionResource[]).map(
    (resource) => ({
      id: resource,
      orgId,
      resource,
      retentionDays: DEFAULT_RETENTION_CONFIG[resource].default,
      action: DEFAULT_RETENTION_CONFIG[resource].recommendedAction,
      enabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}

/**
 * Calculate the deletion date based on creation date and retention days
 */
export function calculateDeletionDate(
  createdAt: Date,
  retentionDays: number
): Date {
  return startOfDay(addDays(createdAt, retentionDays));
}

/**
 * Check if a record is past its retention period
 */
export function isRecordExpired(
  createdAt: Date,
  retentionDays: number
): boolean {
  const deletionDate = calculateDeletionDate(createdAt, retentionDays);
  return isAfter(new Date(), deletionDate);
}

/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(
  createdAt: Date,
  retentionDays: number
): number {
  const deletionDate = calculateDeletionDate(createdAt, retentionDays);
  return differenceInDays(deletionDate, new Date());
}

/**
 * Get a preview of data affected by a retention policy
 * Note: This is an estimate based on date ranges, not a full scan
 */
export async function getRetentionPreview(
  orgId: string,
  resource: RetentionResource,
  retentionDays: number
): Promise<RetentionPreview> {
  if (!orgId) {
    return {
      resource,
      totalRecords: 0,
      recordsAffected: 0,
    };
  }

  try {
    const cutoffDate = startOfDay(addDays(new Date(), -retentionDays));
    const collectionPath = RESOURCE_COLLECTION_PATHS[resource];

    // Query for total records
    const totalQuery = query(
      collection(db, `organizations/${orgId}/${collectionPath}`)
    );
    const totalSnap = await getDocs(totalQuery);
    const totalRecords = totalSnap.size;

    // Query for records that would be affected (older than cutoff)
    const affectedQuery = query(
      collection(db, `organizations/${orgId}/${collectionPath}`),
      where('createdAt', '<', Timestamp.fromDate(cutoffDate)),
      orderBy('createdAt', 'asc')
    );
    const affectedSnap = await getDocs(affectedQuery);
    const recordsAffected = affectedSnap.size;

    // Get oldest record date
    let oldestRecord: Date | undefined;
    let newestAffected: Date | undefined;

    if (affectedSnap.docs.length > 0) {
      const oldestDoc = affectedSnap.docs[0].data();
      if (oldestDoc.createdAt instanceof Timestamp) {
        oldestRecord = oldestDoc.createdAt.toDate();
      }

      const newestDoc = affectedSnap.docs[affectedSnap.docs.length - 1].data();
      if (newestDoc.createdAt instanceof Timestamp) {
        newestAffected = newestDoc.createdAt.toDate();
      }
    }

    return {
      resource,
      totalRecords,
      recordsAffected,
      oldestRecord,
      newestAffected,
    };
  } catch (error) {
    console.error('[DataRetention] Failed to get retention preview:', error);
    return {
      resource,
      totalRecords: 0,
      recordsAffected: 0,
    };
  }
}

/**
 * Get retention run history
 */
export async function getRetentionHistory(
  orgId: string,
  limit: number = 50
): Promise<RetentionRunHistory[]> {
  if (!orgId) return [];

  try {
    const historyRef = collection(db, getRetentionHistoryPath(orgId));
    const q = query(historyRef, orderBy('completedAt', 'desc'));
    const snap = await getDocs(q);

    return snap.docs.slice(0, limit).map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orgId,
        resource: data.resource as RetentionResource,
        action: data.action as RetentionAction,
        recordsProcessed: data.recordsProcessed as number,
        recordsAffected: data.recordsAffected as number,
        startedAt:
          data.startedAt instanceof Timestamp
            ? data.startedAt.toDate()
            : new Date(),
        completedAt:
          data.completedAt instanceof Timestamp
            ? data.completedAt.toDate()
            : new Date(),
        status: data.status as 'success' | 'partial' | 'failed',
        error: data.error as string | undefined,
      };
    });
  } catch (error) {
    console.error('[DataRetention] Failed to get retention history:', error);
    return [];
  }
}

/**
 * Format retention days for display
 */
export function formatRetentionPeriod(days: number): string {
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} year${years === 1 ? '' : 's'}`;
  }
}

/**
 * Get compliance information for a retention policy
 */
export function getComplianceInfo(resource: RetentionResource): {
  regulations: string[];
  notes: string;
} {
  const complianceMap: Record<
    RetentionResource,
    { regulations: string[]; notes: string }
  > = {
    auditLogs: {
      regulations: ['SOX', 'GDPR', 'CCPA'],
      notes:
        'Financial audit logs may need to be retained for 7 years for SOX compliance.',
    },
    messages: {
      regulations: ['GDPR', 'CCPA'],
      notes:
        'Messages containing personal data should be anonymized or deleted per data subject requests.',
    },
    activityLogs: {
      regulations: ['GDPR'],
      notes: 'Activity logs may contain behavioral data subject to privacy regulations.',
    },
    deletedItems: {
      regulations: ['GDPR', 'CCPA'],
      notes:
        'Deleted items should be permanently removed within a reasonable timeframe.',
    },
    exportedData: {
      regulations: ['GDPR', 'CCPA'],
      notes:
        'Temporary exports should be cleaned up promptly to minimize data exposure.',
    },
    notifications: {
      regulations: [],
      notes: 'Notifications typically have minimal compliance requirements.',
    },
    voiceLogs: {
      regulations: ['GDPR', 'CCPA', 'HIPAA'],
      notes: 'Voice recordings may contain sensitive information and require careful handling.',
    },
    aiConversations: {
      regulations: ['GDPR', 'CCPA'],
      notes:
        'AI conversation logs may contain personal data and should be anonymized when possible.',
    },
    timeEntries: {
      regulations: ['FLSA', 'DOL'],
      notes:
        'Payroll records must be retained for at least 3 years under FLSA.',
    },
    photos: {
      regulations: ['GDPR', 'CCPA'],
      notes: 'Photos may contain identifiable individuals and location data.',
    },
  };

  return complianceMap[resource] || { regulations: [], notes: '' };
}
