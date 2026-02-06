"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ComplianceDocument,
  ComplianceDocType,
  ComplianceStatus,
  COMPLIANCE_DOC_TYPE_LABELS,
} from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

/** Number of days before expiry to flag as "expiring_soon" */
const EXPIRING_SOON_DAYS = 30;

/** Required document types that every subcontractor should have */
export const REQUIRED_DOC_TYPES: ComplianceDocType[] = [
  'insurance_coi',
  'w9',
  'business_license',
  'workers_comp',
];

// Safe date conversion helper - handles Timestamp, Date, string, or undefined
function safeToDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value === 'number') return new Date(value);
  return undefined;
}

function computeStatus(expiryDate?: Date): ComplianceStatus {
  if (!expiryDate) return 'valid'; // No expiry means perpetual / always valid
  const now = new Date();
  if (expiryDate < now) return 'expired';
  const soonThreshold = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);
  if (expiryDate < soonThreshold) return 'expiring_soon';
  return 'valid';
}

function fromFirestore(id: string, data: Record<string, unknown>): ComplianceDocument {
  const expiryDate = safeToDate(data.expiryDate);
  return {
    id,
    orgId: data.orgId as string,
    subcontractorId: data.subcontractorId as string,
    type: data.type as ComplianceDocType,
    name: data.name as string,
    fileUrl: data.fileUrl as string | undefined,
    fileName: data.fileName as string | undefined,
    issueDate: safeToDate(data.issueDate),
    expiryDate,
    status: computeStatus(expiryDate),
    notes: data.notes as string | undefined,
    verifiedBy: data.verifiedBy as string | undefined,
    verifiedAt: safeToDate(data.verifiedAt),
    createdAt: safeToDate(data.createdAt) || new Date(),
    updatedAt: safeToDate(data.updatedAt) || new Date(),
  };
}

function toFirestore(docData: Partial<ComplianceDocument>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...docData };
  delete data.id;
  // Convert Date fields to Firestore Timestamps
  const dateFields = ['issueDate', 'expiryDate', 'verifiedAt', 'createdAt', 'updatedAt'];
  for (const field of dateFields) {
    if (data[field] instanceof Date) {
      data[field] = Timestamp.fromDate(data[field] as Date);
    }
  }
  // Strip undefined values (Firestore rejects them)
  Object.keys(data).forEach((k) => {
    if (data[k] === undefined) delete data[k];
  });
  return data;
}

export interface ComplianceOverview {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  missing: number;
  missingTypes: ComplianceDocType[];
  overallStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

/**
 * Hook for managing subcontractor compliance documents with real-time updates.
 *
 * Provides a list of compliance documents for a specific subcontractor, with CRUD
 * operations and compliance status computation. Subscribes to Firestore for real-time
 * updates. Documents are ordered by type.
 *
 * @param subcontractorId - The subcontractor ID to load documents for
 * @returns Compliance documents, CRUD operations, and status helpers
 *
 * @example
 * const { documents, loading, addDocument, getComplianceStatus } = useSubCompliance(subId);
 * const overview = getComplianceStatus();
 * if (overview.overallStatus === 'non_compliant') showWarning();
 */
export function useSubCompliance(subcontractorId: string | undefined) {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId || !subcontractorId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `organizations/${orgId}/complianceDocuments`),
      where('subcontractorId', '==', subcontractorId),
      orderBy('type', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocuments(snap.docs.map((d) => fromFirestore(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('useSubCompliance subscription error', { error: err, hook: 'useSubCompliance' });
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [orgId, subcontractorId]);

  const addDocument = useCallback(
    async (data: Omit<ComplianceDocument, 'id' | 'orgId' | 'createdAt' | 'updatedAt' | 'status'>) => {
      if (!orgId) throw new Error('No organization');
      try {
        const now = new Date();
        const expiryDate = data.expiryDate;
        await addDoc(
          collection(db, `organizations/${orgId}/complianceDocuments`),
          toFirestore({
            ...data,
            orgId,
            status: computeStatus(expiryDate),
            createdAt: now,
            updatedAt: now,
          })
        );
        toast.success(`${COMPLIANCE_DOC_TYPE_LABELS[data.type] || data.type} added`);
      } catch (err) {
        logger.error('Failed to add compliance document', { error: err, hook: 'useSubCompliance' });
        toast.error('Failed to add compliance document');
        throw err;
      }
    },
    [orgId]
  );

  const updateDocument = useCallback(
    async (docId: string, data: Partial<ComplianceDocument>) => {
      if (!orgId) throw new Error('No organization');
      try {
        const updateData: Partial<ComplianceDocument> = { ...data, updatedAt: new Date() };
        // Re-compute status if expiryDate changed
        if ('expiryDate' in data) {
          updateData.status = computeStatus(data.expiryDate);
        }
        await updateDoc(
          doc(db, `organizations/${orgId}/complianceDocuments`, docId),
          toFirestore(updateData)
        );
        toast.success('Document updated');
      } catch (err) {
        logger.error('Failed to update compliance document', { error: err, hook: 'useSubCompliance' });
        toast.error('Failed to update compliance document');
        throw err;
      }
    },
    [orgId]
  );

  const deleteDocument = useCallback(
    async (docId: string) => {
      if (!orgId) throw new Error('No organization');
      try {
        await deleteDoc(doc(db, `organizations/${orgId}/complianceDocuments`, docId));
        toast.success('Document removed');
      } catch (err) {
        logger.error('Failed to delete compliance document', { error: err, hook: 'useSubCompliance' });
        toast.error('Failed to delete compliance document');
        throw err;
      }
    },
    [orgId]
  );

  const getComplianceStatus = useCallback((): ComplianceOverview => {
    const typesPresent = new Set(documents.map((d) => d.type));
    const missingTypes = REQUIRED_DOC_TYPES.filter((t) => !typesPresent.has(t));

    const valid = documents.filter((d) => d.status === 'valid').length;
    const expiringSoon = documents.filter((d) => d.status === 'expiring_soon').length;
    const expired = documents.filter((d) => d.status === 'expired').length;

    let overallStatus: ComplianceOverview['overallStatus'] = 'compliant';
    if (expired > 0 || missingTypes.length > 0) {
      overallStatus = 'non_compliant';
    } else if (expiringSoon > 0) {
      overallStatus = 'at_risk';
    }

    return {
      total: documents.length,
      valid,
      expiringSoon,
      expired,
      missing: missingTypes.length,
      missingTypes,
      overallStatus,
    };
  }, [documents]);

  /** Documents grouped by their computed status */
  const documentsByStatus = useMemo(() => {
    const groups: Record<ComplianceStatus, ComplianceDocument[]> = {
      valid: [],
      expiring_soon: [],
      expired: [],
      missing: [],
    };
    for (const d of documents) {
      groups[d.status].push(d);
    }
    return groups;
  }, [documents]);

  return {
    documents,
    documentsByStatus,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    getComplianceStatus,
  };
}
