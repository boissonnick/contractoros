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

function fromFirestore(id: string, data: Record<string, unknown>): Subcontractor {
  const docs = ((data.documents as unknown[]) || []).map((d: unknown) => {
    const doc = d as Record<string, unknown>;
    return {
      ...doc,
      expiresAt: doc.expiresAt ? (doc.expiresAt as Timestamp).toDate() : undefined,
      uploadedAt: doc.uploadedAt ? (doc.uploadedAt as Timestamp).toDate() : new Date(),
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
    insuranceExpiry: data.insuranceExpiry ? (data.insuranceExpiry as Timestamp).toDate() : undefined,
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
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
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
        console.error('useSubcontractors error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [profile?.orgId]);

  const addSub = useCallback(
    async (data: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
      const now = new Date();
      await addDoc(collection(db, 'subcontractors'), toFirestore({
        ...data,
        metrics: { projectsCompleted: 0, onTimeRate: 0, avgRating: 0, totalPaid: 0 },
        createdAt: now,
        updatedAt: now,
      }));
    },
    []
  );

  const updateSub = useCallback(
    async (subId: string, data: Partial<Subcontractor>) => {
      await updateDoc(doc(db, 'subcontractors', subId), toFirestore({ ...data, updatedAt: new Date() }));
    },
    []
  );

  const deleteSub = useCallback(
    async (subId: string) => {
      await deleteDoc(doc(db, 'subcontractors', subId));
    },
    []
  );

  return { subs, loading, error, addSub, updateSub, deleteSub };
}
