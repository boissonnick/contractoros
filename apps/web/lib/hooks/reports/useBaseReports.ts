"use client";

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LaborCostData, ProjectPnLData, ProductivityData } from './types';

/**
 * Base reports hook for labor costs, project P&L, and productivity metrics
 */
export function useBaseReports(orgId?: string) {
  const [loading, setLoading] = useState(false);

  const fetchLaborCosts = useCallback(async (startDate: Date, endDate: Date): Promise<LaborCostData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      // NOTE: timeEntries is top-level collection with orgId field
      const entriesSnap = await getDocs(query(
        collection(db, 'timeEntries'),
        where('orgId', '==', orgId),
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
      // NOTE: timeEntries is top-level collection with orgId field
      const entriesSnap = await getDocs(query(
        collection(db, 'timeEntries'),
        where('orgId', '==', orgId),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));

      // NOTE: expenses is top-level collection with orgId field
      const expensesSnap = await getDocs(query(
        collection(db, 'expenses'),
        where('orgId', '==', orgId),
        where('status', '==', 'approved')
      ));

      const userRates = new Map<string, number>();
      usersSnap.docs.forEach(d => userRates.set(d.id, d.data().hourlyRate || 0));

      const laborByProject = new Map<string, number>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        const cost = ((data.totalMinutes || 0) / 60) * (userRates.get(data.userId) || 0);
        laborByProject.set(data.projectId, (laborByProject.get(data.projectId) || 0) + cost);
      });

      // Sum expenses by project
      const expensesByProject = new Map<string, number>();
      expensesSnap.docs.forEach(d => {
        const data = d.data();
        const projectId = data.projectId as string;
        const amount = (data.amount as number) || 0;
        if (projectId) {
          expensesByProject.set(projectId, (expensesByProject.get(projectId) || 0) + amount);
        }
      });

      return projectsSnap.docs.map(d => {
        const data = d.data();
        const budget = data.budget || 0;
        const laborCost = laborByProject.get(d.id) || 0;
        const expenseCost = expensesByProject.get(d.id) || 0;
        // Actual spend = labor cost + expenses (materials, equipment, etc.)
        const actualSpend = laborCost + expenseCost;
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
      // NOTE: timeEntries is top-level collection with orgId field
      const entriesSnap = await getDocs(query(
        collection(db, 'timeEntries'),
        where('orgId', '==', orgId),
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
