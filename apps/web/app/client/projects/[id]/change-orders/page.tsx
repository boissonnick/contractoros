"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { ChangeOrder, ProjectPhase } from '@/types';
import { useChangeOrders } from '@/lib/hooks/useChangeOrders';
import { useAuth } from '@/lib/auth';
import ChangeOrderList from '@/components/projects/change-orders/ChangeOrderList';
import ChangeOrderImpactAnalysis from '@/components/projects/change-orders/ChangeOrderImpactAnalysis';
import ChangeOrderApprovalPanel from '@/components/projects/change-orders/ChangeOrderApprovalPanel';
import ChangeOrderScopeComparison from '@/components/projects/change-orders/ChangeOrderScopeComparison';
import ChangeOrderTimeline from '@/components/projects/change-orders/ChangeOrderTimeline';

export default function ClientChangeOrdersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();

  const { changeOrders, loading, approveChangeOrder, rejectChangeOrder } = useChangeOrders({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [selectedCO, setSelectedCO] = useState<ChangeOrder | null>(null);

  useEffect(() => {
    async function fetchPhases() {
      const snap = await getDocs(collection(db, 'projects', projectId, 'phases'));
      setPhases(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));
    }
    fetchPhases();
  }, [projectId]);

  // Only show COs that are visible to clients (not drafts)
  const visibleCOs = changeOrders.filter(co => co.status !== 'draft');
  const activeCO = selectedCO ? changeOrders.find(c => c.id === selectedCO.id) || selectedCO : null;

  const handleApprove = useCallback(
    async (comments?: string) => {
      if (activeCO) await approveChangeOrder(activeCO.id, 'client', comments);
    },
    [activeCO, approveChangeOrder]
  );

  const handleReject = useCallback(
    async (comments?: string) => {
      if (activeCO) await rejectChangeOrder(activeCO.id, 'client', comments);
    },
    [activeCO, rejectChangeOrder]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeCO) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCO(null)} className="text-sm text-blue-600 hover:underline">← Back</button>
        <h2 className="text-lg font-semibold text-gray-900">{activeCO.number}: {activeCO.title}</h2>

        <ChangeOrderApprovalPanel
          co={activeCO}
          currentRole="client"
          onApprove={handleApprove}
          onReject={handleReject}
        />
        <ChangeOrderImpactAnalysis co={activeCO} phases={phases} />
        <ChangeOrderScopeComparison co={activeCO} phases={phases} />
        <ChangeOrderTimeline co={activeCO} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Change Orders</h2>
      {visibleCOs.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50">
          <p className="text-sm text-gray-400">No change orders for this project yet.</p>
        </div>
      ) : (
        <ChangeOrderList changeOrders={visibleCOs} onSelect={setSelectedCO} />
      )}
    </div>
  );
}
