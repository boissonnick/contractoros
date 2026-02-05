"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { ChangeOrder, ProjectPhase, ScopeChange, ChangeOrderImpact } from '@/types';
import { useChangeOrders } from '@/lib/hooks/useChangeOrders';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@/components/ui';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ChangeOrderList from '@/components/projects/change-orders/ChangeOrderList';
import ChangeOrderForm from '@/components/projects/change-orders/ChangeOrderForm';
import ChangeOrderImpactAnalysis from '@/components/projects/change-orders/ChangeOrderImpactAnalysis';
import ChangeOrderApprovalPanel from '@/components/projects/change-orders/ChangeOrderApprovalPanel';
import ChangeOrderTimeline from '@/components/projects/change-orders/ChangeOrderTimeline';
import ChangeOrderScopeComparison from '@/components/projects/change-orders/ChangeOrderScopeComparison';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ProjectChangeOrdersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { profile } = useAuth();

  const { changeOrders, loading, error, createChangeOrder, submitForApproval, approveChangeOrder, rejectChangeOrder } = useChangeOrders({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCO, setSelectedCO] = useState<ChangeOrder | null>(null);

  useEffect(() => {
    async function fetchPhases() {
      const snap = await getDocs(collection(db, 'projects', projectId, 'phases'));
      setPhases(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));
    }
    fetchPhases();
  }, [projectId]);

  // Keep selected CO in sync with live data
  const activeCO = selectedCO ? changeOrders.find(c => c.id === selectedCO.id) || selectedCO : null;

  const currentRole = profile?.role === 'PM' ? 'pm' as const :
    profile?.role === 'OWNER' ? 'owner' as const :
    profile?.role === 'CLIENT' ? 'client' as const : undefined;

  const handleCreate = useCallback(async (data: { title: string; description: string; reason: string; scopeChanges: ScopeChange[]; impact: ChangeOrderImpact }) => {
    await createChangeOrder(data);
    setShowCreate(false);
  }, [createChangeOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Change Orders</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
      </Card>
    );
  }

  // Detail view
  if (activeCO) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setSelectedCO(null)} className="text-sm text-brand-600 hover:text-brand-700 hover:underline mb-1">← Back to Change Orders</button>
            <h2 className="text-lg font-semibold text-gray-900 font-heading tracking-tight">{activeCO.number}: {activeCO.title}</h2>
            <p className="text-sm text-gray-500">{activeCO.reason}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ChangeOrderImpactAnalysis co={activeCO} phases={phases} />
            <ChangeOrderScopeComparison co={activeCO} phases={phases} />
          </div>
          <div className="space-y-6">
            <ChangeOrderApprovalPanel
              co={activeCO}
              currentRole={currentRole}
              onSubmitForApproval={() => submitForApproval(activeCO.id)}
              onApprove={(comments) => currentRole && approveChangeOrder(activeCO.id, currentRole, comments)}
              onReject={(comments) => currentRole && rejectChangeOrder(activeCO.id, currentRole, comments)}
            />
            <ChangeOrderTimeline co={activeCO} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 font-heading tracking-tight">Change Orders</h2>
          <p className="text-sm text-gray-500">{changeOrders.length} change order{changeOrders.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          New Change Order
        </Button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 font-heading tracking-tight">New Change Order</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <ChangeOrderForm phases={phases} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}

      <ChangeOrderList changeOrders={changeOrders} onSelect={setSelectedCO} />
    </div>
  );
}
