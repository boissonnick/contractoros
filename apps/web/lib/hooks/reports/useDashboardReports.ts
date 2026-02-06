"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  DashboardKPIs,
  ProjectStatusDistribution,
  RevenueByMonth,
  TeamPerformance,
} from './types';
import { STATUS_COLORS } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Dashboard reports hook for KPIs, charts, and aggregated metrics
 */
export function useDashboardReports(orgId?: string) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [projectStatusDistribution, setProjectStatusDistribution] = useState<ProjectStatusDistribution[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch all required data in parallel
      // NOTE: All collections are top-level with orgId field, not subcollections
      const [projectsSnap, usersSnap, tasksSnap, timeEntriesSnap, expensesSnap, invoicesSnap] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'users'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'timeEntries'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'expenses'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'invoices'), where('orgId', '==', orgId))),
      ]);

      // Process projects
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; status?: string; budget?: number; name?: string }>;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const totalProjectValue = projects.reduce((sum, p) => sum + ((p as { budget?: number }).budget || 0), 0);

      // Project status distribution for pie chart
      const statusCounts: Record<string, number> = {};
      projects.forEach(p => {
        const status = (p as { status?: string }).status || 'planning';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const distribution: ProjectStatusDistribution[] = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value,
        color: STATUS_COLORS[name] || '#6B7280',
      }));
      setProjectStatusDistribution(distribution);

      // Process users/team
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activeTeamMembers = users.filter(u => (u as { status?: string }).status !== 'inactive').length;

      // Process tasks
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const openTasks = tasks.filter(t => !['completed', 'cancelled'].includes((t as { status?: string }).status || '')).length;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedTasksThisMonth = tasks.filter(t => {
        const status = (t as { status?: string }).status;
        const completedAt = (t as { completedAt?: { toDate: () => Date } }).completedAt;
        return status === 'completed' && completedAt && completedAt.toDate() >= startOfMonth;
      }).length;
      const taskCompletionRate = tasks.length > 0
        ? (tasks.filter(t => (t as { status?: string }).status === 'completed').length / tasks.length) * 100
        : 0;

      // Process time entries
      const timeEntries = timeEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const hoursLoggedThisMonth = timeEntries
        .filter(e => {
          const clockIn = (e as { clockIn?: { toDate: () => Date } }).clockIn;
          return clockIn && clockIn.toDate() >= startOfMonth;
        })
        .reduce((sum, e) => sum + (((e as { totalMinutes?: number }).totalMinutes || 0) / 60), 0);

      // Process expenses
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalExpenses = expenses
        .filter(e => (e as { status?: string }).status === 'approved')
        .reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);

      // Process invoices
      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalRevenue = invoices
        .filter(i => (i as { status?: string }).status === 'paid')
        .reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);
      const outstandingInvoices = invoices
        .filter(i => ['sent', 'viewed', 'overdue'].includes((i as { status?: string }).status || ''))
        .reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);

      // Calculate KPIs
      const calculatedKpis: DashboardKPIs = {
        activeProjects,
        completedProjects,
        totalProjectValue,
        averageProjectValue: projects.length > 0 ? totalProjectValue / projects.length : 0,
        totalRevenue,
        totalExpenses,
        // Fix: Allow negative profit margins; show -100% if no revenue but expenses exist
        profitMargin: totalRevenue > 0
          ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
          : (totalExpenses > 0 ? -100 : 0),
        outstandingInvoices,
        activeTeamMembers,
        hoursLoggedThisMonth,
        averageHoursPerMember: activeTeamMembers > 0 ? hoursLoggedThisMonth / activeTeamMembers : 0,
        openTasks,
        completedTasksThisMonth,
        taskCompletionRate,
      };
      setKpis(calculatedKpis);

      // Generate revenue by month (last 6 months)
      const revenueData: RevenueByMonth[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });

        const monthRevenue = invoices
          .filter(inv => {
            const paidAt = (inv as { paidAt?: { toDate: () => Date } }).paidAt;
            if (!paidAt || (inv as { status?: string }).status !== 'paid') return false;
            const date = paidAt.toDate();
            return date >= monthDate && date <= monthEnd;
          })
          .reduce((sum, inv) => sum + ((inv as { total?: number }).total || 0), 0);

        const monthExpenses = expenses
          .filter(exp => {
            const createdAt = (exp as { createdAt?: { toDate: () => Date } }).createdAt;
            if (!createdAt || (exp as { status?: string }).status !== 'approved') return false;
            const date = createdAt.toDate();
            return date >= monthDate && date <= monthEnd;
          })
          .reduce((sum, exp) => sum + ((exp as { amount?: number }).amount || 0), 0);

        revenueData.push({
          name: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        });
      }
      setRevenueByMonth(revenueData);

      // Team performance
      const teamData: TeamPerformance[] = users
        .filter(u => ['EMPLOYEE', 'CONTRACTOR', 'PM'].includes((u as { role?: string }).role || ''))
        .slice(0, 10) // Limit to top 10 for chart
        .map(u => {
          const userId = (u as { id: string }).id;
          const userName = (u as { displayName?: string }).displayName || 'Unknown';

          const userHours = timeEntries
            .filter(e => (e as { userId?: string }).userId === userId)
            .reduce((sum, e) => sum + (((e as { totalMinutes?: number }).totalMinutes || 0) / 60), 0);

          const userTasksCompleted = tasks
            .filter(t =>
              ((t as { assignedTo?: string[] }).assignedTo || []).includes(userId) &&
              (t as { status?: string }).status === 'completed'
            ).length;

          const userTasksTotal = tasks
            .filter(t => ((t as { assignedTo?: string[] }).assignedTo || []).includes(userId)).length;

          return {
            name: userName.split(' ')[0], // First name only for chart
            hoursLogged: Math.round(userHours),
            tasksCompleted: userTasksCompleted,
            efficiency: userTasksTotal > 0 ? Math.round((userTasksCompleted / userTasksTotal) * 100) : 0,
          };
        })
        .filter(t => t.hoursLogged > 0 || t.tasksCompleted > 0); // Only include active members

      setTeamPerformance(teamData);

    } catch (err) {
      logger.error('Failed to fetch dashboard data', { error: err, hook: 'useDashboardReports' });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Fetch on mount and when orgId changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    error,
    kpis,
    projectStatusDistribution,
    revenueByMonth,
    teamPerformance,
    refetch: fetchDashboardData,
  };
}
