/**
 * GDPR Data Export Module for ContractorOS
 *
 * Provides GDPR-compliant data portability functionality allowing users
 * to export their personal data in machine-readable formats (JSON/CSV).
 *
 * Storage: organizations/{orgId}/dataExportRequests/{requestId}
 *
 * Features:
 * - Request management (create, track, cancel)
 * - Data collection across multiple categories
 * - JSON and CSV export formats
 * - Download link management with expiration
 * - Audit logging integration
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

/**
 * Data categories available for GDPR export
 */
export type DataCategory =
  | 'profile'           // User profile info
  | 'projects'          // Projects user is involved in
  | 'tasks'             // Tasks assigned to user
  | 'timeLogs'          // Time tracking data
  | 'messages'          // Messages sent/received
  | 'activityLogs'      // User activity history
  | 'documents'         // Documents uploaded
  | 'invoices'          // Invoices (if applicable)
  | 'expenses';         // Expenses submitted

/**
 * Status of a data export request
 */
export type ExportRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Data export request structure
 */
export interface DataExportRequest {
  id: string;
  orgId: string;
  requestedBy: string;          // User ID who requested
  requestedByEmail: string;
  requestedByName?: string;
  targetUserId?: string;        // If exporting specific user's data (admin only)
  targetUserEmail?: string;
  status: ExportRequestStatus;
  requestedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;             // Download link expiration (7 days from completion)
  downloadUrl?: string;
  format: ExportFormat;
  includeAttachments: boolean;
  dataCategories: DataCategory[];
  errorMessage?: string;
  recordCounts?: Record<DataCategory, number>;
  totalRecords?: number;
  fileSizeBytes?: number;
}

/**
 * Input for creating an export request
 */
export type CreateExportRequestInput = Pick<
  DataExportRequest,
  | 'requestedBy'
  | 'requestedByEmail'
  | 'requestedByName'
  | 'targetUserId'
  | 'targetUserEmail'
  | 'format'
  | 'includeAttachments'
  | 'dataCategories'
>;

/**
 * Exported user data structure
 */
export interface ExportedUserData {
  exportMetadata: {
    exportedAt: string;
    requestId: string;
    targetUser: string;
    format: ExportFormat;
    categories: DataCategory[];
    recordCounts: Record<string, number>;
  };
  profile?: Record<string, unknown>;
  projects?: Record<string, unknown>[];
  tasks?: Record<string, unknown>[];
  timeLogs?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
  activityLogs?: Record<string, unknown>[];
  documents?: Record<string, unknown>[];
  invoices?: Record<string, unknown>[];
  expenses?: Record<string, unknown>[];
}

// ============================================
// Constants
// ============================================

/**
 * Human-readable labels for data categories
 */
export const DATA_CATEGORY_LABELS: Record<DataCategory, string> = {
  profile: 'Profile Information',
  projects: 'Projects',
  tasks: 'Tasks',
  timeLogs: 'Time Logs',
  messages: 'Messages',
  activityLogs: 'Activity History',
  documents: 'Documents',
  invoices: 'Invoices',
  expenses: 'Expenses',
};

/**
 * Descriptions for each data category
 */
export const DATA_CATEGORY_DESCRIPTIONS: Record<DataCategory, string> = {
  profile: 'Your account information, contact details, and preferences',
  projects: 'Projects you are assigned to or have created',
  tasks: 'Tasks assigned to you or created by you',
  timeLogs: 'Time tracking entries and timesheets',
  messages: 'Messages and communications within the platform',
  activityLogs: 'Your activity history and audit trail',
  documents: 'Documents you have uploaded or have access to',
  invoices: 'Invoices you have created or are associated with',
  expenses: 'Expense reports and receipts you have submitted',
};

/**
 * Status labels for display
 */
export const EXPORT_STATUS_LABELS: Record<ExportRequestStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

/**
 * Status styling configuration
 */
export const EXPORT_STATUS_CONFIG: Record<
  ExportRequestStatus,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  processing: {
    label: 'Processing',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  completed: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  failed: {
    label: 'Failed',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  expired: {
    label: 'Expired',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
};

/**
 * Default categories for user self-export
 */
export const DEFAULT_USER_CATEGORIES: DataCategory[] = [
  'profile',
  'projects',
  'tasks',
  'timeLogs',
  'expenses',
];

/**
 * All available categories
 */
export const ALL_DATA_CATEGORIES: DataCategory[] = [
  'profile',
  'projects',
  'tasks',
  'timeLogs',
  'messages',
  'activityLogs',
  'documents',
  'invoices',
  'expenses',
];

// Download link expiration in days
const DOWNLOAD_LINK_EXPIRY_DAYS = 7;

// ============================================
// Helper Functions
// ============================================

/**
 * Get the data export requests collection path
 */
function getExportRequestsPath(orgId: string): string {
  return `organizations/${orgId}/dataExportRequests`;
}

/**
 * Convert Firestore timestamp to Date
 */
function toDate(timestamp: Timestamp | Date | undefined): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return timestamp;
}

/**
 * Safely convert document data with timestamps
 */
function convertExportRequest(
  id: string,
  data: Record<string, unknown>,
  orgId: string
): DataExportRequest {
  return {
    id,
    orgId,
    requestedBy: data.requestedBy as string,
    requestedByEmail: data.requestedByEmail as string,
    requestedByName: data.requestedByName as string | undefined,
    targetUserId: data.targetUserId as string | undefined,
    targetUserEmail: data.targetUserEmail as string | undefined,
    status: data.status as ExportRequestStatus,
    requestedAt: toDate(data.requestedAt as Timestamp)!,
    startedAt: toDate(data.startedAt as Timestamp | undefined),
    completedAt: toDate(data.completedAt as Timestamp | undefined),
    expiresAt: toDate(data.expiresAt as Timestamp | undefined),
    downloadUrl: data.downloadUrl as string | undefined,
    format: data.format as ExportFormat,
    includeAttachments: data.includeAttachments as boolean,
    dataCategories: data.dataCategories as DataCategory[],
    errorMessage: data.errorMessage as string | undefined,
    recordCounts: data.recordCounts as Record<DataCategory, number> | undefined,
    totalRecords: data.totalRecords as number | undefined,
    fileSizeBytes: data.fileSizeBytes as number | undefined,
  };
}

// ============================================
// Core Functions
// ============================================

/**
 * Create a new data export request
 */
export async function createExportRequest(
  orgId: string,
  input: CreateExportRequestInput
): Promise<string> {
  if (!orgId) {
    throw new Error('Organization ID is required');
  }

  if (!input.dataCategories || input.dataCategories.length === 0) {
    throw new Error('At least one data category must be selected');
  }

  const exportRequestsRef = collection(db, getExportRequestsPath(orgId));

  const docData = {
    requestedBy: input.requestedBy,
    requestedByEmail: input.requestedByEmail,
    requestedByName: input.requestedByName || null,
    targetUserId: input.targetUserId || input.requestedBy,
    targetUserEmail: input.targetUserEmail || input.requestedByEmail,
    status: 'pending' as ExportRequestStatus,
    requestedAt: Timestamp.now(),
    format: input.format,
    includeAttachments: input.includeAttachments,
    dataCategories: input.dataCategories,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(exportRequestsRef, docData);
  return docRef.id;
}

/**
 * Get all export requests for an organization
 */
export async function getExportRequests(
  orgId: string,
  options?: {
    limit?: number;
    requestedBy?: string;
    status?: ExportRequestStatus;
  }
): Promise<DataExportRequest[]> {
  if (!orgId) return [];

  const exportRequestsRef = collection(db, getExportRequestsPath(orgId));

  let q = query(exportRequestsRef, orderBy('requestedAt', 'desc'));

  if (options?.requestedBy) {
    q = query(
      exportRequestsRef,
      where('requestedBy', '==', options.requestedBy),
      orderBy('requestedAt', 'desc')
    );
  }

  if (options?.status) {
    q = query(
      exportRequestsRef,
      where('status', '==', options.status),
      orderBy('requestedAt', 'desc')
    );
  }

  if (options?.limit) {
    q = query(q, firestoreLimit(options.limit));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) =>
    convertExportRequest(docSnap.id, docSnap.data(), orgId)
  );
}

/**
 * Get a single export request by ID
 */
export async function getExportRequest(
  orgId: string,
  requestId: string
): Promise<DataExportRequest | null> {
  if (!orgId || !requestId) return null;

  const docRef = doc(db, getExportRequestsPath(orgId), requestId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return convertExportRequest(docSnap.id, docSnap.data(), orgId);
}

/**
 * Update export request status
 */
export async function updateExportRequestStatus(
  orgId: string,
  requestId: string,
  status: ExportRequestStatus,
  additionalData?: Partial<DataExportRequest>
): Promise<void> {
  if (!orgId || !requestId) {
    throw new Error('Organization ID and Request ID are required');
  }

  const docRef = doc(db, getExportRequestsPath(orgId), requestId);

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'processing') {
    updateData.startedAt = Timestamp.now();
  }

  if (status === 'completed') {
    updateData.completedAt = Timestamp.now();
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DOWNLOAD_LINK_EXPIRY_DAYS);
    updateData.expiresAt = Timestamp.fromDate(expiresAt);
  }

  if (status === 'failed' && additionalData?.errorMessage) {
    updateData.errorMessage = additionalData.errorMessage;
  }

  if (additionalData?.downloadUrl) {
    updateData.downloadUrl = additionalData.downloadUrl;
  }

  if (additionalData?.recordCounts) {
    updateData.recordCounts = additionalData.recordCounts;
    updateData.totalRecords = Object.values(additionalData.recordCounts).reduce(
      (sum, count) => sum + count,
      0
    );
  }

  if (additionalData?.fileSizeBytes) {
    updateData.fileSizeBytes = additionalData.fileSizeBytes;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Cancel an export request
 */
export async function cancelExportRequest(
  orgId: string,
  requestId: string
): Promise<void> {
  await updateExportRequestStatus(orgId, requestId, 'cancelled');
}

// ============================================
// Data Collection Functions
// ============================================

/**
 * Collect user data for export based on selected categories
 */
export async function getUserDataForExport(
  orgId: string,
  userId: string,
  categories: DataCategory[],
  requestId: string
): Promise<ExportedUserData> {
  const exportData: ExportedUserData = {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      requestId,
      targetUser: userId,
      format: 'json',
      categories,
      recordCounts: {},
    },
  };

  // Collect data from each category
  for (const category of categories) {
    try {
      switch (category) {
        case 'profile':
          exportData.profile = await collectProfileData(userId);
          exportData.exportMetadata.recordCounts.profile = exportData.profile ? 1 : 0;
          break;

        case 'projects':
          exportData.projects = await collectProjectsData(orgId, userId);
          exportData.exportMetadata.recordCounts.projects = exportData.projects?.length || 0;
          break;

        case 'tasks':
          exportData.tasks = await collectTasksData(orgId, userId);
          exportData.exportMetadata.recordCounts.tasks = exportData.tasks?.length || 0;
          break;

        case 'timeLogs':
          exportData.timeLogs = await collectTimeLogsData(orgId, userId);
          exportData.exportMetadata.recordCounts.timeLogs = exportData.timeLogs?.length || 0;
          break;

        case 'messages':
          exportData.messages = await collectMessagesData(orgId, userId);
          exportData.exportMetadata.recordCounts.messages = exportData.messages?.length || 0;
          break;

        case 'activityLogs':
          exportData.activityLogs = await collectActivityLogsData(orgId, userId);
          exportData.exportMetadata.recordCounts.activityLogs = exportData.activityLogs?.length || 0;
          break;

        case 'documents':
          exportData.documents = await collectDocumentsData(orgId, userId);
          exportData.exportMetadata.recordCounts.documents = exportData.documents?.length || 0;
          break;

        case 'invoices':
          exportData.invoices = await collectInvoicesData(orgId, userId);
          exportData.exportMetadata.recordCounts.invoices = exportData.invoices?.length || 0;
          break;

        case 'expenses':
          exportData.expenses = await collectExpensesData(orgId, userId);
          exportData.exportMetadata.recordCounts.expenses = exportData.expenses?.length || 0;
          break;
      }
    } catch (error) {
      logger.error('Failed to collect ${category} data', { error: error, component: 'security-gdpr-export' });
      // Continue with other categories even if one fails
    }
  }

  return exportData;
}

// Individual data collection functions

async function collectProfileData(userId: string): Promise<Record<string, unknown>> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return {};

  const data = userDoc.data();
  // Remove sensitive fields
  const { bankInfo: _bankInfo, ...safeData } = data;

  // Convert timestamps
  return {
    ...safeData,
    createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
    updatedAt: toDate(data.updatedAt as Timestamp)?.toISOString(),
  };
}

async function collectProjectsData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  // Get projects where user is a member or created by user
  const projectsRef = collection(db, `organizations/${orgId}/projects`);
  const snapshot = await getDocs(projectsRef);

  return snapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data();
      const assignees = (data.assignees || []) as string[];
      return data.createdBy === userId || assignees.includes(userId);
    })
    .map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        status: data.status,
        address: data.address,
        startDate: toDate(data.startDate as Timestamp)?.toISOString(),
        endDate: toDate(data.endDate as Timestamp)?.toISOString(),
        createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
        updatedAt: toDate(data.updatedAt as Timestamp)?.toISOString(),
      };
    });
}

async function collectTasksData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const tasksRef = collection(db, `organizations/${orgId}/tasks`);
  const q = query(tasksRef, where('assigneeId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      projectId: data.projectId,
      dueDate: toDate(data.dueDate as Timestamp)?.toISOString(),
      completedAt: toDate(data.completedAt as Timestamp)?.toISOString(),
      createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
    };
  });
}

async function collectTimeLogsData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const timeEntriesRef = collection(db, `organizations/${orgId}/timeEntries`);
  const q = query(timeEntriesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      projectId: data.projectId,
      taskId: data.taskId,
      hours: data.hours,
      description: data.description,
      date: toDate(data.date as Timestamp)?.toISOString(),
      createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
    };
  });
}

async function collectMessagesData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  // Collect messages sent by user
  const messagesRef = collection(db, `organizations/${orgId}/messages`);
  const q = query(messagesRef, where('senderId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      content: data.content,
      recipientId: data.recipientId,
      projectId: data.projectId,
      sentAt: toDate(data.sentAt as Timestamp)?.toISOString(),
      createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
    };
  });
}

async function collectActivityLogsData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const auditLogsRef = collection(db, `organizations/${orgId}/auditLogs`);
  const q = query(auditLogsRef, where('userId', '==', userId), firestoreLimit(500));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: data.details,
      timestamp: toDate(data.timestamp as Timestamp)?.toISOString(),
    };
  });
}

async function collectDocumentsData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  // Note: This collects document metadata, not the actual files
  // Actual file URLs would need separate handling
  const docsRef = collection(db, `organizations/${orgId}/documents`);
  const q = query(docsRef, where('uploadedBy', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      type: data.type,
      size: data.size,
      projectId: data.projectId,
      uploadedAt: toDate(data.uploadedAt as Timestamp)?.toISOString(),
    };
  });
}

async function collectInvoicesData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const invoicesRef = collection(db, `organizations/${orgId}/invoices`);
  const q = query(invoicesRef, where('createdBy', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      projectName: data.projectName,
      status: data.status,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      issueDate: toDate(data.issueDate as Timestamp)?.toISOString(),
      dueDate: toDate(data.dueDate as Timestamp)?.toISOString(),
      createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
    };
  });
}

async function collectExpensesData(
  orgId: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const expensesRef = collection(db, `organizations/${orgId}/expenses`);
  const q = query(expensesRef, where('submittedBy', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      description: data.description,
      amount: data.amount,
      category: data.category,
      vendor: data.vendor,
      projectId: data.projectId,
      status: data.status,
      date: toDate(data.date as Timestamp)?.toISOString(),
      createdAt: toDate(data.createdAt as Timestamp)?.toISOString(),
    };
  });
}

// ============================================
// Export Formatting Functions
// ============================================

/**
 * Format exported data as JSON string
 */
export function formatDataAsJSON(data: ExportedUserData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format exported data as CSV
 * Creates a ZIP-like structure with multiple CSV sections
 */
export function formatDataAsCSV(data: ExportedUserData): string {
  const sections: string[] = [];

  // Helper to escape CSV values
  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Helper to convert array of objects to CSV
  const arrayToCSV = (arr: Record<string, unknown>[], sectionName: string): string => {
    if (!arr || arr.length === 0) return '';

    const headers = Object.keys(arr[0]);
    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = arr.map((row) =>
      headers.map((h) => escapeCSV(row[h])).join(',')
    );

    return `\n=== ${sectionName.toUpperCase()} ===\n${headerRow}\n${dataRows.join('\n')}`;
  };

  // Export metadata header
  sections.push('=== EXPORT METADATA ===');
  sections.push(`Exported At,${data.exportMetadata.exportedAt}`);
  sections.push(`Request ID,${data.exportMetadata.requestId}`);
  sections.push(`Target User,${data.exportMetadata.targetUser}`);
  sections.push(`Categories,${data.exportMetadata.categories.join(';')}`);

  // Profile section
  if (data.profile && Object.keys(data.profile).length > 0) {
    sections.push('\n=== PROFILE ===');
    Object.entries(data.profile).forEach(([key, value]) => {
      sections.push(`${escapeCSV(key)},${escapeCSV(value)}`);
    });
  }

  // Array sections
  if (data.projects) sections.push(arrayToCSV(data.projects, 'Projects'));
  if (data.tasks) sections.push(arrayToCSV(data.tasks, 'Tasks'));
  if (data.timeLogs) sections.push(arrayToCSV(data.timeLogs, 'Time Logs'));
  if (data.messages) sections.push(arrayToCSV(data.messages, 'Messages'));
  if (data.activityLogs) sections.push(arrayToCSV(data.activityLogs, 'Activity Logs'));
  if (data.documents) sections.push(arrayToCSV(data.documents, 'Documents'));
  if (data.invoices) sections.push(arrayToCSV(data.invoices, 'Invoices'));
  if (data.expenses) sections.push(arrayToCSV(data.expenses, 'Expenses'));

  return sections.join('\n');
}

/**
 * Generate and download export file
 */
export function downloadExportFile(
  data: ExportedUserData,
  format: ExportFormat,
  filename?: string
): void {
  const timestamp = format === 'json' ? data.exportMetadata.exportedAt : new Date().toISOString();
  const dateStr = timestamp.split('T')[0];
  const defaultFilename = `gdpr-export-${dateStr}`;

  let content: string;
  let mimeType: string;
  let extension: string;

  if (format === 'json') {
    content = formatDataAsJSON(data);
    mimeType = 'application/json';
    extension = 'json';
  } else {
    content = formatDataAsCSV(data);
    mimeType = 'text/csv;charset=utf-8;';
    extension = 'csv';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename || defaultFilename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a download link has expired
 */
export function isExportExpired(request: DataExportRequest): boolean {
  if (!request.expiresAt) return false;
  return new Date() > request.expiresAt;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate time until export expires
 */
export function getExpirationMessage(request: DataExportRequest): string {
  if (!request.expiresAt) return '';

  const now = new Date();
  const expiry = request.expiresAt;

  if (now > expiry) return 'Expired';

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  if (diffHours > 0) {
    return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
  return 'Expires soon';
}
