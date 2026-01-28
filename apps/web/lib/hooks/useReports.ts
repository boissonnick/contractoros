"use client";

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface LaborCostData {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  totalMinutes: number;
  totalCost: number;
}

export interface ProjectPnLData {
  projectId: string;
  projectName: string;
  budget: number;
  actualSpend: number;
  laborCost: number;
  variance: number;
}

export interface ProductivityData {
  userId: string;
  userName: string;
  tasksCompleted: number;
  tasksTotal: number;
  totalHours: number;
  completionRate: number;
}

export function useReports(orgId?: string) {
  const [loading, setLoading] = useState(false);

  const fetchLaborCosts = useCallback(async (startDate: Date, endDate: Date): Promise<LaborCostData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      const entriesSnap = await getDocs(query(
        collection(db, 'timeEntries'),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));
      const projectsSnap = await getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId)));

      const userMap = new Map<string, { name: string; rate: number }>();
      usersSnap.docs.forEach(d => {
        const data = d.data();
        if (data.orgId === orgId) userMap.set(d.id, { name: data.displayName || 'Unknown', rate: data.hourlyRate || 0 });
      });

      const projectMap = new Map<string, string>();
      projectsSnap.docs.forEach(d => projectMap.set(d.id, d.data().name || 'Unknown'));

      const aggregated = new Map<string, LaborCostData>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        if (!userMap.has(data.userId)) return;
        const key = `${data.userId}_${data.projectId}`;
        const existing = aggregated.get(key) || {
          userId: data.userId,
          userName: userMap.get(data.userId)?.name || 'Unknown',
          projectId: data.projectId,
          projectName: projectMap.get(data.projectId) || 'Unknown',
          totalMinutes: 0,
          totalCost: 0,
        };
        existing.totalMinutes += data.totalMinutes || 0;
        existing.totalCost += ((data.totalMinutes || 0) / 60) * (userMap.get(data.userId)?.rate || 0);
        aggregated.set(key, existing);
      });

      return Array.from(aggregated.values());
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchProjectPnL = useCallback(async (startDate: Date, endDate: Date): Promise<ProjectPnLData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      const projectsSnap = await getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId)));
      const entriesSnap = await getDocs(query(
        collection(db, 'timeEntries'),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));

      const userRates = new Map<string, number>();
      usersSnap.docs.forEach(d => userRates.set(d.id, d.data().hourlyRate || 0));

      const laborByProject = new Map<string, number>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        const cost = ((data.totalMinutes || 0) / 60) * (userRates.get(data.userId) || 0);
        laborByProject.set(data.projectId, (laborByProject.get(data.projectId) || 0) + cost);
      });

      return projectsSnap.docs.map(d => {
        const data = d.data();
        const budget = data.budget || 0;
        const laborCost = laborByProject.get(d.id) || 0;
        const actualSpend = data.currentSpend || laborCost;
        return {
          projectId: d.id,
          projectName: data.name || 'Unknown',
          budget,
          actualSpend,
          laborCost,
          variance: budget - actualSpend,
        };
      });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchProductivity = useCallback(async (startDate: Date, endDate: Date): Promise<ProductivityData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));
      const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId)));
      const entriesSnap = await getDocs(query(
        collection(db, 'timeEntries'),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));

      const hoursByUser = new Map<string, number>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        hoursByUser.set(data.userId, (hoursByUser.get(data.userId) || 0) + (data.totalMinutes || 0) / 60);
      });

      return usersSnap.docs
        .filter(d => ['EMPLOYEE', 'CONTRACTOR', 'SUB'].includes(d.data().role))
        .map(d => {
          const data = d.data();
          const uid = d.id;
          const userTasks = tasksSnap.docs.filter(t => (t.data().assignedTo || []).includes(uid));
          const completed = userTasks.filter(t => t.data().status === 'completed').length;
          return {
            userId: uid,
            userName: data.displayName || 'Unknown',
            tasksCompleted: completed,
            tasksTotal: userTasks.length,
            totalHours: hoursByUser.get(uid) || 0,
            completionRate: userTasks.length > 0 ? (completed / userTasks.length) * 100 : 0,
          };
        });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  return { loading, fetchLaborCosts, fetchProjectPnL, fetchProductivity };
}
