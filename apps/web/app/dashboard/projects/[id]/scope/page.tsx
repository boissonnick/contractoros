"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { ProjectPhase, QuoteSection, Scope, ScopeItem } from '@/types';
import { useScopes } from '@/lib/hooks/useScopes';
import ScopeBuilder from '@/components/projects/scope/ScopeBuilder';

export default function ProjectScopePage() {
  const params = useParams();
  const projectId = params.id as string;

  const { scopes, currentScope, loading, createScope, updateScope, submitForApproval } = useScopes({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [quoteSections, setQuoteSections] = useState<QuoteSection[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [viewingScope, setViewingScope] = useState<Scope | null>(null);

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

  const activeScope = viewingScope || currentScope;

  const handleSaveItems = useCallback(
    async (items: ScopeItem[]) => {
      if (activeScope) {
        await updateScope(activeScope.id, { items });
      }
    },
    [activeScope, updateScope]
  );

  const handleSubmitForApproval = useCallback(async () => {
    if (activeScope) {
      await submitForApproval(activeScope.id);
    }
  }, [activeScope, submitForApproval]);

  const handleCreateNewVersion = useCallback(
    async (items: ScopeItem[], notes?: string) => {
      await createScope(items, notes);
    },
    [createScope]
  );

  const handleSelectVersion = useCallback((scope: Scope) => {
    setViewingScope(scope);
  }, []);

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <ScopeBuilder
        scope={activeScope}
        allScopes={scopes}
        phases={phases}
        quoteSections={quoteSections}
        onSaveItems={handleSaveItems}
        onSubmitForApproval={handleSubmitForApproval}
        onCreateNewVersion={handleCreateNewVersion}
        onSelectVersion={handleSelectVersion}
      />
    </div>
  );
}
