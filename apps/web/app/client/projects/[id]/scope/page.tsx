"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { ProjectPhase, QuoteSection, ScopeItem } from '@/types';
import { useScopes } from '@/lib/hooks/useScopes';
import { useAuth } from '@/lib/auth';
import ScopePhaseGroup from '@/components/projects/scope/ScopePhaseGroup';
import ScopeApprovalPanel from '@/components/projects/scope/ScopeApprovalPanel';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ClientScopePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();

  const { currentScope, loading, approveScope, rejectScope } = useScopes({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [, setQuoteSections] = useState<QuoteSection[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [phaseSnap, quoteSnap] = await Promise.all([
          getDocs(collection(db, 'projects', projectId, 'phases')),
          getDocs(collection(db, 'projects', projectId, 'quoteSections')),
        ]);
        setPhases(
          phaseSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as ProjectPhase)
            .sort((a, b) => a.order - b.order)
        );
        setQuoteSections(
          quoteSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as QuoteSection)
        );
      } catch (err) {
        console.error('Error fetching scope data:', err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const scope = currentScope;

  const handleApprove = useCallback(
    async (comments?: string) => {
      if (scope && user && profile) {
        await approveScope(scope.id, user.uid, profile.displayName, comments);
      }
    },
    [scope, user, profile, approveScope]
  );

  const handleReject = useCallback(
    async (comments?: string) => {
      if (scope && user && profile) {
        await rejectScope(scope.id, user.uid, profile.displayName, comments);
      }
    },
    [scope, user, profile, rejectScope]
  );

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50">
        <p className="text-sm text-gray-500">No scope of work available for this project yet.</p>
      </div>
    );
  }

  // Group items by phase
  const grouped = new Map<string, ScopeItem[]>();
  const ungrouped: ScopeItem[] = [];
  const sorted = [...scope.items].sort((a, b) => a.order - b.order);
  for (const item of sorted) {
    if (item.phaseId) {
      const existing = grouped.get(item.phaseId) || [];
      existing.push(item);
      grouped.set(item.phaseId, existing);
    } else {
      ungrouped.push(item);
    }
  }

  const totalCost = scope.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold font-heading tracking-tight text-gray-900">Scope of Work — v{scope.version}</h2>
        <p className="text-sm text-gray-500">{scope.items.length} items · {fmt(totalCost)}</p>
      </div>

      {/* Approval panel */}
      <ScopeApprovalPanel
        scope={scope}
        clientId={user?.uid}
        clientName={profile?.displayName}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Scope items (read-only) */}
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([phaseId, phaseItems]) => {
          const phase = phases.find(p => p.id === phaseId);
          return (
            <ScopePhaseGroup
              key={phaseId}
              phaseName={phase?.name || 'Phase'}
              items={phaseItems}
              quoteSections={[]}
              onEditItem={() => {}}
              onRemoveItem={() => {}}
              selectedIds={new Set()}
              onToggleSelect={() => {}}
              isDraft={false}
            />
          );
        })}
        {ungrouped.length > 0 && (
          <ScopePhaseGroup
            phaseName="General"
            items={ungrouped}
            quoteSections={[]}
            onEditItem={() => {}}
            onRemoveItem={() => {}}
            selectedIds={new Set()}
            onToggleSelect={() => {}}
            isDraft={false}
          />
        )}
      </div>
    </div>
  );
}
