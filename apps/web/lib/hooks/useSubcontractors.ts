"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Subcontractor, SubcontractorDocument, SubcontractorMetrics } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

// Safe date conversion helper - handles Timestamp, Date, string, or undefined
function safeToDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  // Firestore Timestamp
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  // Already a Date
  if (value instanceof Date) return value;
  // ISO string or other parseable string
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  // Number (milliseconds timestamp)
  if (typeof value === 'number') return new Date(value);
  return undefined;
}

function fromFirestore(id: string, data: Record<string, unknown>): Subcontractor {
  const docs = ((data.documents as unknown[]) || []).map((d: unknown) => {
    const doc = d as Record<string, unknown>;
    return {
      ...doc,
      expiresAt: safeToDate(doc.expiresAt),
      uploadedAt: safeToDate(doc.uploadedAt) || new Date(),
    } as SubcontractorDocument;
  });

  return {
    id,
    orgId: data.orgId as string,
    userId: data.userId as string | undefined,
    companyName: data.companyName as string,
    contactName: data.contactName as string,
    email: data.email as string,
    phone: data.phone as string | undefined,
    trade: data.trade as string,
    licenseNumber: data.licenseNumber as string | undefined,
    insuranceExpiry: safeToDate(data.insuranceExpiry),
    address: data.address as string | undefined,
    notes: data.notes as string | undefined,
    metrics: (data.metrics as SubcontractorMetrics) || {
      projectsCompleted: 0,
      onTimeRate: 0,
      avgRating: 0,
      totalPaid: 0,
    },
    documents: docs,
    isActive: data.isActive !== false,
    createdAt: safeToDate(data.createdAt) || new Date(),
    updatedAt: safeToDate(data.updatedAt),
  };
}

function toFirestore(sub: Partial<Subcontractor>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...sub };
  delete data.id;
  if (data.insuranceExpiry instanceof Date) data.insuranceExpiry = Timestamp.fromDate(data.insuranceExpiry);
  if (data.createdAt instanceof Date) data.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.updatedAt instanceof Date) data.updatedAt = Timestamp.fromDate(data.updatedAt);
  if (Array.isArray(data.documents)) {
    data.documents = (data.documents as SubcontractorDocument[]).map((d) => ({
      ...d,
      expiresAt: d.expiresAt instanceof Date ? Timestamp.fromDate(d.expiresAt) : d.expiresAt,
      uploadedAt: d.uploadedAt instanceof Date ? Timestamp.fromDate(d.uploadedAt) : d.uploadedAt,
    }));
  }
  // Firestore rejects undefined values — strip them
  Object.keys(data).forEach((k) => {
    if (data[k] === undefined) delete data[k];
  });
  return data;
}

/**
 * Hook for managing subcontractors with real-time updates.
 *
 * Provides a list of subcontractors for the organization with CRUD operations.
 * Subscribes to Firestore for real-time updates. Subcontractors are ordered
 * alphabetically by company name.
 *
 * @returns {Object} Subcontractor data and operations
 * @returns {Subcontractor[]} subs - Array of subcontractors for the organization
 * @returns {boolean} loading - True while initial fetch is in progress
 * @returns {string|null} error - Error message if the subscription failed
 * @returns {Function} addSub - Create a new subcontractor
 * @returns {Function} updateSub - Update a subcontractor by ID
 * @returns {Function} deleteSub - Delete a subcontractor by ID
 *
 * @example
 * // Display subcontractor directory
 * const { subs, loading, addSub } = useSubcontractors();
 *
 * if (loading) return <Spinner />;
 *
 * return subs.map(sub => <SubCard key={sub.id} subcontractor={sub} />);
 *
 * @example
 * // Add a new subcontractor
 * const { addSub } = useSubcontractors();
 *
 * await addSub({
 *   orgId,
 *   companyName: 'ABC Plumbing',
 *   contactName: 'John Smith',
 *   email: 'john@abcplumbing.com',
 *   trade: 'plumbing',
 *   isActive: true
 * });
 *
 * @example
 * // Filter by trade
 * const { subs } = useSubcontractors();
 * const electricians = subs.filter(s => s.trade === 'electrical');
 * const plumbers = subs.filter(s => s.trade === 'plumbing');
 *
 * @example
 * // Check for expiring insurance
 * const { subs } = useSubcontractors();
 * const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
 * const expiringSoon = subs.filter(s =>
 *   s.insuranceExpiry && s.insuranceExpiry < thirtyDaysFromNow
 * );
 */
export function useSubcontractors() {
  const { profile } = useAuth();
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId) return;

    const q = query(
      collection(db, 'subcontractors'),
      where('orgId', '==', profile.orgId),
      orderBy('companyName', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setSubs(snap.docs.map((d) => fromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        logger.error('useSubcontractors error', { error: err, hook: 'useSubcontractors' });
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [profile?.orgId]);

  const addSub = useCallback(
    async (data: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
      try {
        const now = new Date();
        await addDoc(collection(db, 'subcontractors'), toFirestore({
          ...data,
          metrics: { projectsCompleted: 0, onTimeRate: 0, avgRating: 0, totalPaid: 0 },
          createdAt: now,
          updatedAt: now,
        }));
        toast.success('Subcontractor added');
      } catch (err) {
        logger.error('Failed to add subcontractor', { error: err, hook: 'useSubcontractors' });
        toast.error('Failed to add subcontractor');
        throw err;
      }
    },
    []
  );

  const updateSub = useCallback(
    async (subId: string, data: Partial<Subcontractor>) => {
      try {
        await updateDoc(doc(db, 'subcontractors', subId), toFirestore({ ...data, updatedAt: new Date() }));
        toast.success('Subcontractor updated');
      } catch (err) {
        logger.error('Failed to update subcontractor', { error: err, hook: 'useSubcontractors' });
        toast.error('Failed to update subcontractor');
        throw err;
      }
    },
    []
  );

  const deleteSub = useCallback(
    async (subId: string) => {
      try {
        await deleteDoc(doc(db, 'subcontractors', subId));
        toast.success('Subcontractor deleted');
      } catch (err) {
        logger.error('Failed to delete subcontractor', { error: err, hook: 'useSubcontractors' });
        toast.error('Failed to delete subcontractor');
        throw err;
      }
    },
    []
  );

  return { subs, loading, error, addSub, updateSub, deleteSub };
}
