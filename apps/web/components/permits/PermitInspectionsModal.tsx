'use client';

import React, { useState } from 'react';
import { usePermits } from '@/lib/hooks/usePermits';
import { Permit } from '@/types';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface PermitInspectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: Permit;
}

const RESULT_CONFIG = {
  passed: { label: 'Passed', variant: 'success' as const },
  failed: { label: 'Failed', variant: 'danger' as const },
  partial: { label: 'Partial', variant: 'warning' as const },
};

export default function PermitInspectionsModal({ isOpen, onClose, permit }: PermitInspectionsModalProps) {
  const { addInspection, updateInspection } = usePermits();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);

  const [newInspection, setNewInspection] = useState({
    type: '',
    scheduledDate: '',
    inspector: '',
    notes: '',
  });

  const [editResult, setEditResult] = useState<{
    result: 'passed' | 'failed' | 'partial';
    completedDate: string;
    notes: string;
  }>({
    result: 'passed',
    completedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleAddInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspection.type) return;

    setLoading(true);
    try {
      await addInspection(permit.id, {
        type: newInspection.type,
        scheduledDate: newInspection.scheduledDate ? new Date(newInspection.scheduledDate) : undefined,
        inspector: newInspection.inspector || undefined,
        notes: newInspection.notes || undefined,
      });

      setNewInspection({
        type: '',
        scheduledDate: '',
        inspector: '',
        notes: '',
      });
      setShowAddForm(false);
    } catch (error) {
      logger.error('Error adding inspection', { error: error, component: 'PermitInspectionsModal' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordResult = async (inspectionId: string) => {
    setLoading(true);
    try {
      await updateInspection(permit.id, inspectionId, {
        result: editResult.result,
        completedDate: editResult.completedDate ? new Date(editResult.completedDate) : undefined,
        notes: editResult.notes || undefined,
      });
      setEditingInspectionId(null);
      setEditResult({
        result: 'passed',
        completedDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      logger.error('Error recording result', { error: error, component: 'PermitInspectionsModal' });
    } finally {
      setLoading(false);
    }
  };

  const pendingInspections = permit.inspections.filter((i) => !i.result);
  const completedInspections = permit.inspections.filter((i) => i.result);

  return (
    <BaseModal open={isOpen} onClose={onClose} title={`Inspections - ${permit.description}`} size="lg">
      <div className="space-y-6">
        {/* Add Inspection Button/Form */}
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} variant="secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Schedule Inspection
          </Button>
        ) : (
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">New Inspection</h4>
            <form onSubmit={handleAddInspection} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newInspection.type}
                  onChange={(e) => setNewInspection((prev) => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., Foundation, Framing, Electrical Rough-in"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newInspection.scheduledDate}
                    onChange={(e) => setNewInspection((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                  <input
                    type="text"
                    value={newInspection.inspector}
                    onChange={(e) => setNewInspection((prev) => ({ ...prev, inspector: e.target.value }))}
                    placeholder="Inspector name"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newInspection.notes}
                  onChange={(e) => setNewInspection((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any notes about the inspection..."
                  rows={2}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={loading} disabled={!newInspection.type}>
                  Schedule
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Pending Inspections */}
        {pendingInspections.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-amber-500" />
              Pending Inspections ({pendingInspections.length})
            </h4>
            <div className="space-y-3">
              {pendingInspections.map((inspection) => (
                <Card key={inspection.id} className="p-4 border-amber-200 bg-amber-50/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{inspection.type}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        {inspection.scheduledDate && (
                          <span>Scheduled: {format(inspection.scheduledDate, 'MMM d, yyyy')}</span>
                        )}
                        {inspection.inspector && <span>Inspector: {inspection.inspector}</span>}
                      </div>
                      {inspection.notes && (
                        <p className="mt-1 text-sm text-gray-500">{inspection.notes}</p>
                      )}
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>

                  {/* Record Result Form */}
                  {editingInspectionId === inspection.id ? (
                    <div className="mt-3 pt-3 border-t border-amber-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                          <select
                            value={editResult.result}
                            onChange={(e) =>
                              setEditResult((prev) => ({
                                ...prev,
                                result: e.target.value as 'passed' | 'failed' | 'partial',
                              }))
                            }
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                          >
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="partial">Partial</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date</label>
                          <input
                            type="date"
                            value={editResult.completedDate}
                            onChange={(e) => setEditResult((prev) => ({ ...prev, completedDate: e.target.value }))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={editResult.notes}
                          onChange={(e) => setEditResult((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Inspection notes..."
                          rows={2}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingInspectionId(null);
                            setEditResult({
                              result: 'passed',
                              completedDate: new Date().toISOString().split('T')[0],
                              notes: '',
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" loading={loading} onClick={() => handleRecordResult(inspection.id)}>
                          Record Result
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <Button variant="secondary" size="sm" onClick={() => setEditingInspectionId(inspection.id)}>
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Record Result
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Inspections */}
        {completedInspections.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              Completed Inspections ({completedInspections.length})
            </h4>
            <div className="space-y-3">
              {completedInspections.map((inspection) => (
                <Card key={inspection.id} className="p-4 bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{inspection.type}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        {inspection.completedDate && (
                          <span>Completed: {format(inspection.completedDate, 'MMM d, yyyy')}</span>
                        )}
                        {inspection.inspector && <span>Inspector: {inspection.inspector}</span>}
                      </div>
                      {inspection.notes && (
                        <p className="mt-1 text-sm text-gray-500">{inspection.notes}</p>
                      )}
                    </div>
                    {inspection.result && (
                      <Badge variant={RESULT_CONFIG[inspection.result].variant}>
                        {RESULT_CONFIG[inspection.result].label}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {permit.inspections.length === 0 && !showAddForm && (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No inspections scheduled yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click &quot;Schedule Inspection&quot; to add an inspection
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
