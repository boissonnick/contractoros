"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Subcontractor } from '@/types';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { Button } from '@/components/ui';
import { PlusIcon } from '@heroicons/react/24/outline';
import SubList from '@/components/subcontractors/SubList';
import SubForm from '@/components/subcontractors/SubForm';

export default function SubcontractorsPage() {
  const router = useRouter();
  const { subs, loading, addSub } = useSubcontractors();
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = useCallback(
    async (data: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
      await addSub(data);
      setShowAdd(false);
    },
    [addSub]
  );

  const handleSubClick = (sub: Subcontractor) => {
    router.push(`/dashboard/subcontractors/${sub.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Subcontractors</h1>
          <p className="text-sm text-gray-500">{subs.length} subcontractor{subs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
          Add Subcontractor
        </Button>
      </div>

      <SubList subs={subs} onSubClick={handleSubClick} />

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Subcontractor</h3>
            <SubForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
