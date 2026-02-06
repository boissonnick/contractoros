"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Subcontractor, SubcontractorDocument, SubcontractorMetrics, Project, SubAssignment } from '@/types';
import { useAuth } from '@/lib/auth';
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

export interface LinkedProject {
  project: Project;
  assignment?: SubAssignment;
  tasksAssigned: number;
  tasksCompleted: number;
  totalPaid: number;
}

export function useSubcontractor(subId: string | null) {
  const { profile } = useAuth();
  const [sub, setSub] = useState<Subcontractor | null>(null);
  const [linkedProjects, setLinkedProjects] = useState<LinkedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSubcontractor = useCallback(async () => {
    if (!subId || !profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch subcontractor
      const subDoc = await getDoc(doc(db, 'subcontractors', subId));
      if (!subDoc.exists()) {
        throw new Error('Subcontractor not found');
      }

      const subData = fromFirestore(subDoc.id, subDoc.data());

      // Verify org access
      if (subData.orgId !== profile.orgId) {
        throw new Error('Access denied');
      }

      setSub(subData);

      // Fetch assignments for this subcontractor
      const assignmentsSnap = await getDocs(
        query(
          collection(db, 'subAssignments'),
          where('subId', '==', subId)
        )
      );

      const projectIds = new Set<string>();
      const assignmentsByProject: Record<string, SubAssignment> = {};

      assignmentsSnap.docs.forEach((d) => {
        const data = d.data();
        const projectId = data.projectId as string;
        projectIds.add(projectId);
        assignmentsByProject[projectId] = {
          id: d.id,
          subId: data.subId,
          projectId,
          type: data.type,
          phaseId: data.phaseId,
          taskId: data.taskId,
          status: data.status,
          agreedRate: data.agreedRate,
          agreedAmount: data.agreedAmount ?? 0,
          paidAmount: data.paidAmount ?? 0,
          rateType: data.rateType,
          startDate: data.startDate?.toDate?.(),
          endDate: data.endDate?.toDate?.(),
          notes: data.notes,
          paymentSchedule: data.paymentSchedule || [],
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.(),
        } as SubAssignment;
      });

      // Also look for tasks assigned to this subcontractor
      const tasksSnap = await getDocs(
        query(
          collection(db, 'tasks'),
          where('assignedSubcontractors', 'array-contains', subId)
        )
      );

      tasksSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.projectId) projectIds.add(data.projectId as string);
      });

      // Fetch all linked projects
      const linked: LinkedProject[] = [];

      for (const projectId of Array.from(projectIds)) {
        try {
          const projDoc = await getDoc(doc(db, 'projects', projectId));
          if (projDoc.exists()) {
            const projData = projDoc.data();

            // Count tasks for this sub in this project
            const projectTasks = tasksSnap.docs.filter(
              (t) => t.data().projectId === projectId
            );
            const tasksAssigned = projectTasks.length;
            const tasksCompleted = projectTasks.filter(
              (t) => t.data().status === 'completed'
            ).length;

            // Calculate total paid from assignment payment schedule
            const assignment = assignmentsByProject[projectId];
            let totalPaid = 0;
            if (assignment?.paymentSchedule) {
              totalPaid = assignment.paymentSchedule
                .filter((p) => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0);
            }

            linked.push({
              project: {
                id: projDoc.id,
                orgId: projData.orgId,
                name: projData.name,
                description: projData.description,
                address: projData.address,
                status: projData.status,
                clientId: projData.clientId,
                pmId: projData.pmId,
                startDate: projData.startDate?.toDate?.(),
                estimatedEndDate: projData.estimatedEndDate?.toDate?.(),
                actualEndDate: projData.actualEndDate?.toDate?.(),
                budget: projData.budget,
                currentSpend: projData.currentSpend,
                createdAt: projData.createdAt?.toDate?.() || new Date(),
                updatedAt: projData.updatedAt?.toDate?.(),
              } as Project,
              assignment,
              tasksAssigned,
              tasksCompleted,
              totalPaid,
            });
          }
        } catch (err) {
          logger.error(`Error fetching project ${projectId}`, { error: err, hook: 'useSubcontractor' });
        }
      }

      // Sort by most recent first
      linked.sort((a, b) => {
        const dateA = a.project.createdAt?.getTime() || 0;
        const dateB = b.project.createdAt?.getTime() || 0;
        return dateB - dateA;
      });

      setLinkedProjects(linked);
    } catch (err) {
      logger.error('Error loading subcontractor', { error: err, hook: 'useSubcontractor' });
      setError(err instanceof Error ? err : new Error('Failed to load subcontractor'));
    } finally {
      setLoading(false);
    }
  }, [subId, profile?.orgId]);

  useEffect(() => {
    loadSubcontractor();
  }, [loadSubcontractor]);

  return {
    sub,
    linkedProjects,
    loading,
    error,
    reload: loadSubcontractor,
  };
}
