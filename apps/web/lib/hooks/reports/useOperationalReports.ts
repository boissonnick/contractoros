"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { OperationalMetrics, ProjectTimeline } from './types';
import { TASK_STATUS_COLORS } from './types';

/**
 * Operational reports hook for project timelines, task metrics, and resource utilization
 */
export function useOperationalReports(orgId?: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [projectTimelines, setProjectTimelines] = useState<ProjectTimeline[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [hoursbyProject, setHoursByProject] = useState<{ name: string; hours: number }[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchOperationalData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // NOTE: All collections are top-level with orgId field, not subcollections
      const [projectsSnap, tasksSnap, timeEntriesSnap, subsSnap, changeOrdersSnap] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'timeEntries'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'subcontractors'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'changeOrders'), where('orgId', '==', orgId))),
      ]);

      // Process projects
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const completedProjects = projects.filter(p => (p as { status?: string }).status === 'completed');

      // Calculate average project duration
      let totalDuration = 0;
      let onTimeCount = 0;
      const timelines: ProjectTimeline[] = [];

      completedProjects.forEach(p => {
        const startDate = (p as { startDate?: { toDate: () => Date } }).startDate;
        const endDate = (p as { endDate?: { toDate: () => Date } }).endDate;
        const plannedEndDate = (p as { plannedEndDate?: { toDate: () => Date } }).plannedEndDate;

        if (startDate && endDate) {
          const duration = Math.ceil((endDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24));
          totalDuration += duration;

          if (plannedEndDate && endDate.toDate() <= plannedEndDate.toDate()) {
            onTimeCount++;
          }
        }
      });

      // Project timelines for chart (active projects)
      projects
        .filter(p => (p as { status?: string }).status === 'active')
        .slice(0, 8)
        .forEach(p => {
          const startDate = (p as { startDate?: { toDate: () => Date } }).startDate;
          const plannedEndDate = (p as { plannedEndDate?: { toDate: () => Date } }).plannedEndDate;
          const now = new Date();

          if (startDate) {
            const plannedDays = plannedEndDate
              ? Math.ceil((plannedEndDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const actualDays = Math.ceil((now.getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24));

            timelines.push({
              name: ((p as { name?: string }).name || 'Unknown').substring(0, 15),
              planned: plannedDays,
              actual: actualDays,
              status: (p as { status?: string }).status || 'active',
            });
          }
        });
      setProjectTimelines(timelines);

      // Process tasks
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const taskStatusCounts: Record<string, number> = {};
      tasks.forEach(t => {
        const status = (t as { status?: string }).status || 'todo';
        taskStatusCounts[status] = (taskStatusCounts[status] || 0) + 1;
      });
      const tasksByStatusData = Object.entries(taskStatusCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
        value,
        color: TASK_STATUS_COLORS[name] || '#6B7280',
      }));
      setTasksByStatus(tasksByStatusData);

      // Process time entries by project
      const timeEntries = timeEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const hoursByProjectMap = new Map<string, { name: string; hours: number }>();

      // Create project ID to name map
      const projectNameMap = new Map<string, string>();
      projects.forEach(p => {
        projectNameMap.set((p as { id: string }).id, (p as { name?: string }).name || 'Unknown');
      });

      timeEntries.forEach(e => {
        const projectId = (e as { projectId?: string }).projectId;
        const minutes = (e as { totalMinutes?: number }).totalMinutes || 0;
        if (projectId) {
          const existing = hoursByProjectMap.get(projectId);
          if (existing) {
            existing.hours += minutes / 60;
          } else {
            hoursByProjectMap.set(projectId, {
              name: (projectNameMap.get(projectId) || 'Unknown').substring(0, 12),
              hours: minutes / 60,
            });
          }
        }
      });
      const hoursData = Array.from(hoursByProjectMap.values())
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 8)
        .map(h => ({ ...h, hours: Math.round(h.hours) }));
      setHoursByProject(hoursData);

      // Process subcontractors
      const subs = subsSnap.docs.filter(d => (d.data() as { status?: string }).status === 'active');

      // Process change orders
      const changeOrders = changeOrdersSnap.docs.filter(d =>
        (d.data() as { status?: string }).status === 'pending'
      );

      // Calculate metrics
      setMetrics({
        averageProjectDuration: completedProjects.length > 0 ? totalDuration / completedProjects.length : 0,
        onTimeCompletionRate: completedProjects.length > 0 ? (onTimeCount / completedProjects.length) * 100 : 0,
        averageTasksPerProject: projects.length > 0 ? tasks.length / projects.length : 0,
        resourceUtilization: 0, // Would need capacity data to calculate
        activeSubcontractors: subs.length,
        pendingChangeOrders: changeOrders.length,
      });

    } catch (err) {
      console.error('Failed to fetch operational data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOperationalData();
  }, [fetchOperationalData]);

  return {
    loading,
    error,
    metrics,
    projectTimelines,
    tasksByStatus,
    hoursbyProject,
    refetch: fetchOperationalData,
  };
}
