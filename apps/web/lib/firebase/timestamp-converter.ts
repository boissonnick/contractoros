/**
 * Firestore Timestamp Converter
 *
 * Centralizes timestamp-to-Date conversion logic used across all hooks.
 * Eliminates duplicate conversion code in useClients, useExpenses, useTasks, etc.
 *
 * @example
 * // In a hook's fromFirestore converter:
 * import { convertTimestamps, DATE_FIELDS } from '@/lib/firebase/timestamp-converter';
 *
 * const client = convertTimestamps(doc.data(), DATE_FIELDS.client);
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Check if a value is a Firestore Timestamp
 */
export function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return (
    value !== null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  );
}

/**
 * Convert a single value that might be a Timestamp to a Date
 */
export function convertTimestamp(value: unknown): Date | unknown {
  if (isFirestoreTimestamp(value)) {
    return value.toDate();
  }
  return value;
}

/**
 * Convert specified fields from Firestore Timestamps to JavaScript Dates.
 * Safe to call even if fields are already Dates or undefined.
 *
 * @param data - The document data from Firestore
 * @param dateFields - Array of field names that should be converted
 * @returns Data with specified fields converted to Dates
 */
export function convertTimestamps<T extends Record<string, unknown>>(
  data: T,
  dateFields: readonly string[]
): T {
  const result = { ...data };

  for (const field of dateFields) {
    const value = result[field];
    if (value !== undefined && value !== null) {
      (result as Record<string, unknown>)[field] = convertTimestamp(value);
    }
  }

  return result;
}

/**
 * Recursively convert all Timestamp fields in an object (including nested objects and arrays).
 * Use this for complex nested structures.
 */
export function convertTimestampsDeep<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (isFirestoreTimestamp(data)) {
    return data.toDate() as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertTimestampsDeep(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = convertTimestampsDeep(value);
    }
    return result as T;
  }

  return data;
}

/**
 * Common date fields for each entity type.
 * Use these with convertTimestamps() for consistent field handling.
 *
 * @example
 * const client = convertTimestamps(docData, DATE_FIELDS.client);
 */
export const DATE_FIELDS = {
  // Core entities
  user: ['createdAt', 'updatedAt'],
  organization: ['createdAt', 'updatedAt'],

  // Client module
  client: ['createdAt', 'updatedAt', 'lastContactDate'],
  clientNote: ['createdAt'],
  communicationLog: ['timestamp', 'createdAt'],

  // Project module
  project: ['createdAt', 'updatedAt', 'startDate', 'endDate', 'completionDate'],
  phase: ['createdAt', 'updatedAt', 'startDate', 'endDate'],
  task: ['createdAt', 'updatedAt', 'dueDate', 'startDate', 'completedAt'],
  taskComment: ['createdAt'],
  taskActivity: ['timestamp'],

  // Financial module
  expense: ['createdAt', 'updatedAt', 'date', 'approvedAt', 'reimbursedAt'],
  invoice: ['createdAt', 'updatedAt', 'dueDate', 'sentAt', 'paidAt'],
  estimate: ['createdAt', 'updatedAt', 'sentAt', 'acceptedAt', 'expiresAt'],
  payment: ['createdAt', 'processedAt', 'refundedAt'],

  // Time tracking module
  timeEntry: ['createdAt', 'updatedAt', 'clockIn', 'clockOut', 'approvedAt'],
  dailyLog: ['createdAt', 'updatedAt', 'date', 'followUpDate'],

  // Payroll module
  payrollRun: ['createdAt', 'updatedAt', 'periodStart', 'periodEnd', 'processedAt'],
  payrollEntry: ['createdAt'],

  // Scheduling module
  scheduleEvent: ['createdAt', 'updatedAt', 'startDate', 'endDate'],
  availability: ['date'],

  // Materials module
  material: ['createdAt', 'updatedAt', 'lastOrderDate'],
  equipment: ['createdAt', 'updatedAt', 'lastServiceDate', 'nextServiceDate'],
  purchaseOrder: ['createdAt', 'updatedAt', 'orderDate', 'expectedDate', 'receivedDate'],

  // Documents module
  sow: ['createdAt', 'updatedAt', 'approvedAt'],
  changeOrder: ['createdAt', 'updatedAt', 'submittedAt', 'approvedAt'],
  rfi: ['createdAt', 'updatedAt', 'submittedAt', 'respondedAt'],
  submittal: ['createdAt', 'updatedAt', 'submittedAt', 'approvedAt'],
  punchList: ['createdAt', 'updatedAt', 'completedAt'],

  // Signature module
  signatureRequest: ['createdAt', 'updatedAt', 'sentAt', 'viewedAt', 'signedAt', 'expiresAt'],

  // Subcontractor module
  subcontractor: ['createdAt', 'updatedAt'],
  bid: ['createdAt', 'updatedAt', 'submittedAt', 'expiresAt'],

  // Generic - for unknown entities
  generic: ['createdAt', 'updatedAt'],
} as const;

/**
 * Type helper for entity names in DATE_FIELDS
 */
export type EntityType = keyof typeof DATE_FIELDS;

/**
 * Get date fields for an entity type, with fallback to generic fields.
 */
export function getDateFields(entityType: string): readonly string[] {
  return DATE_FIELDS[entityType as EntityType] || DATE_FIELDS.generic;
}
