"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ProjectPhase, Task, Bid, Subcontractor } from '@/types';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { useSubAssignments } from '@/lib/hooks/useSubAssignments';
import { useTasks } from '@/lib/hooks/useTasks';
import SubAssignmentManager from '@/components/subcontractors/SubAssignmentManager';
import BidList from '@/components/projects/bids/BidList';
import BidComparison from '@/components/projects/bids/BidComparison';
import { cn } from '@/lib/utils';

type Tab = 'assignments' | 'bids' | 'compare';

export default function ProjectSubsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { subs } = useSubcontractors();
  const { assignments, createAssignment, updateAssignment } = useSubAssignments({ projectId });
  const { tasks } = useTasks({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [tab, setTab] = useState<Tab>('assignments');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [phaseSnap, bidSnap] = await Promise.all([
          getDocs(collection(db, 'projects', projectId, 'phases')),
          getDocs(query(collection(db, 'bids'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'))),
        ]);
        setPhases(phaseSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));
        setBids(bidSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            proposedStartDate: data.proposedStartDate ? (data.proposedStartDate as Timestamp).toDate() : undefined,
            proposedEndDate: data.proposedEndDate ? (data.proposedEndDate as Timestamp).toDate() : undefined,
            submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
            expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
            respondedAt: data.respondedAt ? (data.respondedAt as Timestamp).toDate() : undefined,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
          } as Bid;
        }));
      } catch (err) {
        console.error('Error fetching subs data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [projectId]);

  const handleBidStatusChange = async (bidId: string, status: Bid['status']) => {
    await updateDoc(doc(db, 'bids', bidId), { status, respondedAt: Timestamp.now(), updatedAt: Timestamp.now() });
    setBids(prev => prev.map(b => b.id === bidId ? { ...b, status } : b));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'assignments', label: `Assignments (${assignments.length})` },
    { id: 'bids', label: `Bids (${bids.length})` },
    { id: 'compare', label: 'Compare' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assignments' && (
        <SubAssignmentManager
          assignments={assignments}
          subs={subs}
          phases={phases}
          tasks={tasks}
          onCreateAssignment={createAssignment}
          onUpdateAssignment={async (id, data) => { await updateAssignment(id, data); }}
          projectId={projectId}
        />
      )}

      {tab === 'bids' && (
        <BidList bids={bids} subs={subs} onStatusChange={handleBidStatusChange} />
      )}

      {tab === 'compare' && (
        <BidComparison bids={bids} subs={subs} onAccept={(bidId) => handleBidStatusChange(bidId, 'accepted')} />
      )}
    </div>
  );
}
