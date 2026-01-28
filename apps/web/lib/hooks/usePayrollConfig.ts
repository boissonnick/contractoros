"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PayrollConfig } from '@/types';
import { useAuth } from '@/lib/auth';

function fromFirestore(id: string, data: Record<string, unknown>): PayrollConfig {
  return {
    id,
    orgId: data.orgId as string,
    payPeriod: (data.payPeriod as PayrollConfig['payPeriod']) || 'biweekly',
    overtimeThresholdHours: (data.overtimeThresholdHours as number) || 40,
    overtimeMultiplier: (data.overtimeMultiplier as number) || 1.5,
    defaultHourlyRate: (data.defaultHourlyRate as number) || 25,
    payDay: (data.payDay as string) || 'Friday',
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

export function usePayrollConfig() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) return;
    const q = query(collection(db, 'payrollConfig'), where('orgId', '==', profile.orgId));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.docs.length > 0) {
        setConfig(fromFirestore(snap.docs[0].id, snap.docs[0].data()));
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [profile?.orgId]);

  const saveConfig = useCallback(async (data: Partial<PayrollConfig>) => {
    if (!profile?.orgId) return;
    const configId = config?.id || `payroll_${profile.orgId}`;
    await setDoc(doc(db, 'payrollConfig', configId), {
      ...data,
      orgId: profile.orgId,
      updatedAt: Timestamp.now(),
      ...(!config && { createdAt: Timestamp.now() }),
    }, { merge: true });
  }, [profile?.orgId, config]);

  return { config, loading, saveConfig };
}
