"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { ProjectPhase, ScopeItem } from '@/types';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { useSubAssignments } from '@/lib/hooks/useSubAssignments';
import { useTasks } from '@/lib/hooks/useTasks';
import { useBids } from '@/lib/hooks/useBids';
import { useScopes } from '@/lib/hooks/useScopes';
import SubAssignmentManager from '@/components/subcontractors/SubAssignmentManager';
import SubForm from '@/components/subcontractors/SubForm';
import InlineCreateModal from '@/components/ui/InlineCreateModal';
import BidList from '@/components/projects/bids/BidList';
import BidComparison from '@/components/projects/bids/BidComparison';
import BidSolicitationForm from '@/components/projects/bids/BidSolicitationForm';
import BidSolicitationList from '@/components/projects/bids/BidSolicitationList';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';

type Tab = 'assignments' | 'bids' | 'compare' | 'solicitations';

export default function ProjectSubsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { profile } = useAuth();
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [showSolicitationForm, setShowSolicitationForm] = useState(false);

  const { subs } = useSubcontractors();
  const { assignments, createAssignment, updateAssignment } = useSubAssignments({ projectId });
  const { tasks } = useTasks({ projectId });
  const { bids, solicitations, updateBidStatus, createSolicitation, closeSolicitation } = useBids(projectId);
  const { currentScope } = useScopes({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [tab, setTab] = useState<Tab>('assignments');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const phaseSnap = await getDocs(collection(db, 'projects', projectId, 'phases'));
        setPhases(phaseSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));
      } catch (err) {
        console.error('Error fetching subs data:', err);
        toast.error('Failed to load subcontractor data');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [projectId]);

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
    { id: 'solicitations', label: `Solicitations (${solicitations.length})` },
    { id: 'compare', label: 'Compare' },
  ];

  const scopeItems: ScopeItem[] = currentScope?.items || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          {tab === 'solicitations' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSolicitationForm(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Solicit Bids
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateSub(true)}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Subcontractor
          </Button>
        </div>
      </div>

      {/* Create Sub Modal */}
      <InlineCreateModal open={showCreateSub} onClose={() => setShowCreateSub(false)} title="Add Subcontractor">
        <SubForm
          onSubmit={async (data) => {
            if (!profile?.orgId) return;
            await addDoc(collection(db, 'subcontractors'), {
              ...data,
              orgId: profile.orgId,
              isActive: true,
              metrics: { projectsCompleted: 0, onTimeRate: 100, avgRating: 0, totalPaid: 0 },
              documents: [],
              createdAt: Timestamp.now(),
            });
            setShowCreateSub(false);
          }}
          onCancel={() => setShowCreateSub(false)}
        />
      </InlineCreateModal>

      {/* Solicitation Form Modal */}
      <InlineCreateModal open={showSolicitationForm} onClose={() => setShowSolicitationForm(false)} title="Solicit Bids">
        <BidSolicitationForm
          scopeItems={scopeItems}
          phases={phases}
          subs={subs}
          projectId={projectId}
          onSubmit={async (data) => {
            await createSolicitation(data);
            setShowSolicitationForm(false);
          }}
          onCancel={() => setShowSolicitationForm(false)}
        />
      </InlineCreateModal>

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
        <BidList bids={bids} subs={subs} onStatusChange={updateBidStatus} />
      )}

      {tab === 'solicitations' && (
        <BidSolicitationList
          solicitations={solicitations}
          subs={subs}
          onClose={closeSolicitation}
        />
      )}

      {tab === 'compare' && (
        <BidComparison bids={bids} subs={subs} onAccept={(bidId) => updateBidStatus(bidId, 'accepted')} />
      )}
    </div>
  );
}
