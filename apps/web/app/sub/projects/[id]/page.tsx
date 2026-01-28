"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useSubAssignments } from '@/lib/hooks/useSubAssignments';
import { ProjectPhase, Task, SubAssignment } from '@/types';
import { cn } from '@/lib/utils';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  accepted: { bg: 'bg-blue-100', text: 'text-blue-700' },
  in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export default function SubProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();

  const { assignments, loading: assignmentsLoading } = useSubAssignments({ projectId, subId: user?.uid });
  const [projectName, setProjectName] = useState('');
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const projectSnap = await getDoc(doc(db, 'projects', projectId));
        if (projectSnap.exists()) setProjectName(projectSnap.data().name || '');

        const phaseSnap = await getDocs(collection(db, 'projects', projectId, 'phases'));
        setPhases(phaseSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));

        if (user?.uid) {
          const taskSnap = await getDocs(
            query(collection(db, 'projects', projectId, 'tasks'), where('assignedSubId', '==', user.uid))
          );
          setTasks(taskSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
              dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : undefined,
              completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
              createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
              dependencies: data.dependencies || [],
              attachments: data.attachments || [],
              assignedTo: data.assignedTo || [],
            } as Task;
          }));
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [projectId, user?.uid]);

  if (loading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalAgreed = assignments.reduce((sum, a) => sum + a.agreedAmount, 0);
  const totalPaid = assignments.reduce((sum, a) => sum + a.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{projectName}</h1>
        <p className="text-sm text-gray-500">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{fmt(totalAgreed)}</p>
          <p className="text-xs text-gray-500">Contract Total</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
          <p className="text-xs text-gray-500">Paid</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{fmt(totalAgreed - totalPaid)}</p>
          <p className="text-xs text-gray-500">Remaining</p>
        </div>
      </div>

      {/* Assignments */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">My Assignments</h3>
        {assignments.map((a) => {
          const target = a.type === 'phase'
            ? phases.find(p => p.id === a.phaseId)?.name
            : tasks.find(t => t.id === a.taskId)?.title;
          const style = STATUS_STYLES[a.status] || STATUS_STYLES.pending;

          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{target || 'Assignment'}</p>
                <p className="text-xs text-gray-500 capitalize">{a.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{fmt(a.agreedAmount)}</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', style.bg, style.text)}>
                  {a.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Assigned Tasks</h3>
          {tasks.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              {t.dueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Due {t.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
