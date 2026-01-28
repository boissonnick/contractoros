"use client";

import React, { useState } from 'react';
import { Subcontractor } from '@/types';
import { Button } from '@/components/ui';
import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import SubForm from './SubForm';
import SubDocuments from './SubDocuments';
import SubPerformanceMetrics from './SubPerformanceMetrics';
import { formatDate } from '@/lib/date-utils';

type Tab = 'details' | 'documents' | 'performance';

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'documents', label: 'Documents' },
  { id: 'performance', label: 'Performance' },
];

interface SubDetailModalProps {
  sub: Subcontractor;
  onClose: () => void;
  onUpdate: (subId: string, data: Partial<Subcontractor>) => Promise<void>;
  onDelete: (subId: string) => Promise<void>;
}

export default function SubDetailModal({ sub, onClose, onUpdate, onDelete }: SubDetailModalProps) {
  const [tab, setTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleFormSubmit = async (data: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
    await onUpdate(sub.id, data);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overscroll-contain">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{sub.companyName}</h2>
            <p className="text-sm text-gray-500">{sub.contactName} · {sub.trade}</p>
          </div>
          <div className="flex items-center gap-1">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!editing && (
          <div className="flex border-b border-gray-200 px-5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {editing ? (
            <SubForm
              initialData={sub}
              onSubmit={handleFormSubmit}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {tab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900">{sub.email}</p></div>
                    <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm text-gray-900">{sub.phone || '—'}</p></div>
                    <div><p className="text-xs text-gray-500">Trade</p><p className="text-sm text-gray-900">{sub.trade}</p></div>
                    <div><p className="text-xs text-gray-500">License</p><p className="text-sm text-gray-900">{sub.licenseNumber || '—'}</p></div>
                    <div><p className="text-xs text-gray-500">Insurance Expiry</p><p className="text-sm text-gray-900">{sub.insuranceExpiry ? formatDate(sub.insuranceExpiry) : '—'}</p></div>
                    <div><p className="text-xs text-gray-500">Status</p><p className="text-sm text-gray-900">{sub.isActive ? 'Active' : 'Inactive'}</p></div>
                  </div>
                  {sub.address && (
                    <div><p className="text-xs text-gray-500">Address</p><p className="text-sm text-gray-900">{sub.address}</p></div>
                  )}
                  {sub.notes && (
                    <div><p className="text-xs text-gray-500">Notes</p><p className="text-sm text-gray-700">{sub.notes}</p></div>
                  )}
                </div>
              )}
              {tab === 'documents' && (
                <SubDocuments
                  sub={sub}
                  onUpdate={(documents) => onUpdate(sub.id, { documents })}
                />
              )}
              {tab === 'performance' && <SubPerformanceMetrics sub={sub} />}
            </>
          )}
        </div>

        {confirmDelete && (
          <div className="px-5 py-4 border-t border-gray-200 bg-red-50">
            <p className="text-sm text-red-700 mb-3">Delete this subcontractor? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={async () => { await onDelete(sub.id); onClose(); }} className="!bg-red-600 hover:!bg-red-700">Delete</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
