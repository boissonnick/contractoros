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
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { TimeOffRequest, PTOBalance } from '@/types';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

export interface AccrualConfig {
  vacationHoursPerPayPeriod: number; // e.g. 3.08 = 80hrs/year biweekly
  sickHoursPerPayPeriod: number;     // e.g. 1.85 = 48hrs/year biweekly
  personalDaysPerYear: number;       // e.g. 3
  payPeriodsPerYear: number;         // e.g. 26 (biweekly) or 24 (semimonthly)
  hireDate?: Date;
}

export interface PTOBalanceSummary {
  vacation: { accrued: number; used: number; balance: number };
  sick: { accrued: number; used: number; balance: number };
  personal: { total: number; used: number; balance: number };
}

const DEFAULT_ACCRUAL: AccrualConfig = {
  vacationHoursPerPayPeriod: 3.08, // ~80 hrs/yr (10 days)
  sickHoursPerPayPeriod: 1.85,     // ~48 hrs/yr (6 days)
  personalDaysPerYear: 3,
  payPeriodsPerYear: 26,
};

// =============================================================================
// TYPES
// =============================================================================

export interface UseTimeOffRequestsOptions {
  userId?: string;
  status?: TimeOffRequest['status'];
}

export interface UseTimeOffRequestsReturn {
  requests: TimeOffRequest[];
  loading: boolean;

  submitRequest: (data: SubmitTimeOffData) => Promise<string>;
  updateRequest: (id: string, data: Partial<SubmitTimeOffData>) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  denyRequest: (id: string, reason: string) => Promise<void>;

  getPendingRequests: () => TimeOffRequest[];
  getUpcomingTimeOff: (userId?: string) => TimeOffRequest[];
  getBalances: (userId: string, accrualConfig?: AccrualConfig) => PTOBalanceSummary;
}

export interface SubmitTimeOffData {
  userId: string;
  userName: string;
  type: TimeOffRequest['type'];
  startDate: Date;
  endDate: Date;
  halfDay?: 'morning' | 'afternoon';
  reason?: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useTimeOffRequests(
  options: UseTimeOffRequestsOptions = {}
): UseTimeOffRequestsReturn {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('startDate', 'desc'),
    ];

    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    const q = query(collection(db, 'timeOffRequests'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            approvedAt: data.approvedAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
          } as TimeOffRequest;
        });

        setRequests(items);
        setLoading(false);
      },
      (err) => {
        logger.error('Error loading time off requests', { error: err, hook: 'useTimeOffRequests' });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.userId, options.status]);

  const submitRequest = useCallback(
    async (data: SubmitTimeOffData): Promise<string> => {
      if (!orgId) {
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, 'timeOffRequests'), {
        orgId,
        ...data,
        status: 'pending',
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        createdAt: serverTimestamp(),
      });

      toast.success('Time off request submitted');
      return docRef.id;
    },
    [orgId]
  );

  const updateRequest = useCallback(
    async (id: string, data: Partial<SubmitTimeOffData>): Promise<void> => {
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }

      await updateDoc(doc(db, 'timeOffRequests', id), updateData);
      toast.success('Request updated');
    },
    []
  );

  const cancelRequest = useCallback(async (id: string): Promise<void> => {
    await updateDoc(doc(db, 'timeOffRequests', id), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    toast.success('Request cancelled');
  }, []);

  const approveRequest = useCallback(
    async (id: string): Promise<void> => {
      if (!profile?.uid) return;

      const request = requests.find((r) => r.id === id);
      if (!request || !orgId) return;

      const batch = writeBatch(db);

      // Update request
      batch.update(doc(db, 'timeOffRequests', id), {
        status: 'approved',
        approvedBy: profile.uid,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create availability records for each day
      const currentDate = new Date(request.startDate);
      while (currentDate <= request.endDate) {
        const availRef = doc(collection(db, 'crewAvailability'));
        batch.set(availRef, {
          orgId,
          userId: request.userId,
          userName: request.userName,
          date: Timestamp.fromDate(new Date(currentDate)),
          allDay: !request.halfDay,
          startTime: request.halfDay === 'afternoon' ? '12:00' : null,
          endTime: request.halfDay === 'morning' ? '12:00' : null,
          status: 'unavailable',
          reason: 'time_off',
          notes: `${request.type}: ${request.reason || 'Approved time off'}`,
          isRecurring: false,
          createdAt: serverTimestamp(),
          createdBy: profile.uid,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      await batch.commit();
      toast.success('Time off approved');
    },
    [requests, orgId, profile?.uid]
  );

  const denyRequest = useCallback(
    async (id: string, reason: string): Promise<void> => {
      if (!profile?.uid) return;

      await updateDoc(doc(db, 'timeOffRequests', id), {
        status: 'denied',
        denialReason: reason,
        approvedBy: profile.uid,
        updatedAt: serverTimestamp(),
      });

      toast.success('Request denied');
    },
    [profile?.uid]
  );

  const getPendingRequests = useCallback((): TimeOffRequest[] => {
    return requests.filter((r) => r.status === 'pending');
  }, [requests]);

  const getUpcomingTimeOff = useCallback(
    (userId?: string): TimeOffRequest[] => {
      const now = new Date();
      return requests.filter(
        (r) =>
          r.status === 'approved' &&
          r.endDate >= now &&
          (!userId || r.userId === userId)
      );
    },
    [requests]
  );

  const getBalances = useCallback(
    (userId: string, accrualConfig: AccrualConfig = DEFAULT_ACCRUAL): PTOBalanceSummary => {
      const now = new Date();
      const hireDate = accrualConfig.hireDate || new Date(now.getFullYear(), 0, 1); // default to Jan 1 of current year

      // Calculate pay periods elapsed since hire date (or start of year)
      const msPerPayPeriod = (365.25 * 24 * 60 * 60 * 1000) / accrualConfig.payPeriodsPerYear;
      const elapsed = now.getTime() - hireDate.getTime();
      const periodsElapsed = Math.min(
        Math.floor(elapsed / msPerPayPeriod),
        accrualConfig.payPeriodsPerYear
      );

      const vacationAccrued = Math.round(periodsElapsed * accrualConfig.vacationHoursPerPayPeriod * 100) / 100;
      const sickAccrued = Math.round(periodsElapsed * accrualConfig.sickHoursPerPayPeriod * 100) / 100;
      const personalTotal = accrualConfig.personalDaysPerYear * 8; // 8 hrs per day

      // Calculate used hours from approved requests
      const userApproved = requests.filter(
        (r) => r.userId === userId && r.status === 'approved' && r.startDate.getFullYear() === now.getFullYear()
      );

      let vacationUsed = 0;
      let sickUsed = 0;
      let personalUsed = 0;

      for (const req of userApproved) {
        const days = Math.max(1, Math.ceil((req.endDate.getTime() - req.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);
        const hours = req.halfDay ? days * 4 : days * 8;

        switch (req.type) {
          case 'vacation':
            vacationUsed += hours;
            break;
          case 'sick':
            sickUsed += hours;
            break;
          case 'personal':
            personalUsed += hours;
            break;
          default:
            // bereavement, jury_duty, other — don't count against PTO
            break;
        }
      }

      return {
        vacation: { accrued: vacationAccrued, used: vacationUsed, balance: Math.round((vacationAccrued - vacationUsed) * 100) / 100 },
        sick: { accrued: sickAccrued, used: sickUsed, balance: Math.round((sickAccrued - sickUsed) * 100) / 100 },
        personal: { total: personalTotal, used: personalUsed, balance: personalTotal - personalUsed },
      };
    },
    [requests]
  );

  return {
    requests,
    loading,
    submitRequest,
    updateRequest,
    cancelRequest,
    approveRequest,
    denyRequest,
    getPendingRequests,
    getUpcomingTimeOff,
    getBalances,
  };
}
