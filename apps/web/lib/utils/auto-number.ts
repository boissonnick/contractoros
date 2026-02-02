/**
 * Auto-numbering System
 * Generates sequential document numbers for estimates, invoices, projects, and change orders
 */

import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';

export type NumberableDocumentType = 'estimate' | 'invoice' | 'project' | 'change_order';

export interface NumberingConfig {
  prefix: string;
  padLength: number;
  startFrom: number;
}

export interface NumberingSettings {
  estimate: NumberingConfig;
  invoice: NumberingConfig;
  project: NumberingConfig;
  change_order: NumberingConfig;
  updatedAt?: Date;
}

/**
 * Default numbering configuration
 */
export const DEFAULT_NUMBERING_CONFIG: NumberingSettings = {
  estimate: {
    prefix: 'EST-',
    padLength: 5,
    startFrom: 1,
  },
  invoice: {
    prefix: 'INV-',
    padLength: 5,
    startFrom: 1,
  },
  project: {
    prefix: 'PRJ-',
    padLength: 5,
    startFrom: 1,
  },
  change_order: {
    prefix: 'CO-',
    padLength: 5,
    startFrom: 1,
  },
};

/**
 * Counter data stored in Firestore
 */
interface NumberingCounters {
  estimate: number;
  invoice: number;
  project: number;
  change_order: number;
}

/**
 * Format a number with prefix and padding
 */
export function formatDocumentNumber(
  config: NumberingConfig,
  counter: number
): string {
  const paddedNumber = String(counter).padStart(config.padLength, '0');
  return `${config.prefix}${paddedNumber}`;
}

/**
 * Get the numbering settings document reference
 */
function getSettingsRef(orgId: string) {
  return doc(db, `organizations/${orgId}/settings/numbering`);
}

/**
 * Get the counters document reference
 */
function getCountersRef(orgId: string) {
  return doc(db, `organizations/${orgId}/settings/numberingCounters`);
}

/**
 * Get the numbering settings for an organization
 */
export async function getNumberingSettings(
  orgId: string
): Promise<NumberingSettings> {
  const settingsRef = getSettingsRef(orgId);
  const settingsDoc = await getDoc(settingsRef);

  if (settingsDoc.exists()) {
    const data = settingsDoc.data();
    return {
      estimate: data.estimate || DEFAULT_NUMBERING_CONFIG.estimate,
      invoice: data.invoice || DEFAULT_NUMBERING_CONFIG.invoice,
      project: data.project || DEFAULT_NUMBERING_CONFIG.project,
      change_order: data.change_order || DEFAULT_NUMBERING_CONFIG.change_order,
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  return DEFAULT_NUMBERING_CONFIG;
}

/**
 * Save numbering settings for an organization
 */
export async function saveNumberingSettings(
  orgId: string,
  settings: Partial<NumberingSettings>
): Promise<void> {
  const settingsRef = getSettingsRef(orgId);

  await setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/**
 * Get the current counter value without incrementing (for preview)
 */
export async function getCurrentCounter(
  orgId: string,
  type: NumberableDocumentType
): Promise<number> {
  const countersRef = getCountersRef(orgId);
  const countersDoc = await getDoc(countersRef);

  if (countersDoc.exists()) {
    const data = countersDoc.data() as NumberingCounters;
    return data[type] || 0;
  }

  return 0;
}

/**
 * Get the next number for a document type (preview only, doesn't reserve)
 */
export async function getNextNumber(
  orgId: string,
  type: NumberableDocumentType
): Promise<string> {
  const [settings, currentCounter] = await Promise.all([
    getNumberingSettings(orgId),
    getCurrentCounter(orgId, type),
  ]);

  const config = settings[type];
  const nextValue = Math.max(currentCounter + 1, config.startFrom);

  return formatDocumentNumber(config, nextValue);
}

/**
 * Reserve and return a number (atomic operation using transaction)
 * This ensures no two documents get the same number even with concurrent requests
 */
export async function reserveNumber(
  orgId: string,
  type: NumberableDocumentType
): Promise<string> {
  const settingsRef = getSettingsRef(orgId);
  const countersRef = getCountersRef(orgId);

  const result = await runTransaction(db, async (transaction) => {
    // Get current settings
    const settingsDoc = await transaction.get(settingsRef);
    const settings = settingsDoc.exists()
      ? settingsDoc.data()
      : DEFAULT_NUMBERING_CONFIG;

    const config: NumberingConfig = settings[type] || DEFAULT_NUMBERING_CONFIG[type];

    // Get current counter
    const countersDoc = await transaction.get(countersRef);
    const counters: NumberingCounters = countersDoc.exists()
      ? (countersDoc.data() as NumberingCounters)
      : { estimate: 0, invoice: 0, project: 0, change_order: 0 };

    // Calculate next number (ensure it's at least startFrom)
    const currentValue = counters[type] || 0;
    const nextValue = Math.max(currentValue + 1, config.startFrom);

    // Update counter
    transaction.set(
      countersRef,
      {
        ...counters,
        [type]: nextValue,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    return formatDocumentNumber(config, nextValue);
  });

  return result;
}

/**
 * Reset a counter to a specific value (admin only)
 * Use with caution - can cause duplicate numbers if set lower than existing documents
 */
export async function resetCounter(
  orgId: string,
  type: NumberableDocumentType,
  value: number
): Promise<void> {
  const countersRef = getCountersRef(orgId);

  await setDoc(
    countersRef,
    {
      [type]: value,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/**
 * Get a preview of what the next number will look like with given settings
 */
export function previewNextNumber(config: NumberingConfig, currentCounter: number): string {
  const nextValue = Math.max(currentCounter + 1, config.startFrom);
  return formatDocumentNumber(config, nextValue);
}
