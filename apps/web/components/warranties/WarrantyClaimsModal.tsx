'use client';

import React, { useState } from 'react';
import { useWarranties } from '@/lib/hooks/useWarranties';
import { WarrantyItem } from '@/types';
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

interface WarrantyClaimsModalProps {
  isOpen: boolean;
  onClose: () => void;
  warranty: WarrantyItem;
}

export default function WarrantyClaimsModal({ isOpen, onClose, warranty }: WarrantyClaimsModalProps) {
  const { addClaim, resolveClaim } = useWarranties();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvingClaimId, setResolvingClaimId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const [newClaim, setNewClaim] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
  });

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaim.description) return;

    setLoading(true);
    try {
      await addClaim(warranty.id, {
        description: newClaim.description,
        date: new Date(newClaim.date),
        referenceNumber: newClaim.referenceNumber || undefined,
      });

      setNewClaim({
        description: '',
        date: new Date().toISOString().split('T')[0],
        referenceNumber: '',
      });
      setShowAddForm(false);
    } catch (error) {
      logger.error('Error adding claim', { error: error, component: 'WarrantyClaimsModal' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClaim = async (claimId: string) => {
    if (!resolution) return;

    setLoading(true);
    try {
      await resolveClaim(warranty.id, claimId, resolution);
      setResolvingClaimId(null);
      setResolution('');
    } catch (error) {
      logger.error('Error resolving claim', { error: error, component: 'WarrantyClaimsModal' });
    } finally {
      setLoading(false);
    }
  };

  const pendingClaims = warranty.claimHistory.filter((c) => !c.resolvedAt);
  const resolvedClaims = warranty.claimHistory.filter((c) => c.resolvedAt);

  return (
    <BaseModal open={isOpen} onClose={onClose} title={`Claims - ${warranty.itemName}`} size="lg">
      <div className="space-y-6">
        {/* Add Claim Button/Form */}
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} variant="secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            File New Claim
          </Button>
        ) : (
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">New Claim</h4>
            <form onSubmit={handleAddClaim} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newClaim.description}
                  onChange={(e) => setNewClaim((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the issue..."
                  rows={2}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newClaim.date}
                    onChange={(e) => setNewClaim((prev) => ({ ...prev, date: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
                  <input
                    type="text"
                    value={newClaim.referenceNumber}
                    onChange={(e) => setNewClaim((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="Claim reference number"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={loading} disabled={!newClaim.description}>
                  Submit Claim
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Pending Claims */}
        {pendingClaims.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-amber-500" />
              Pending Claims ({pendingClaims.length})
            </h4>
            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <Card key={claim.id} className="p-4 border-amber-200 bg-amber-50/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900">{claim.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>Filed: {format(claim.date, 'MMM d, yyyy')}</span>
                        {claim.referenceNumber && (
                          <span>Ref: {claim.referenceNumber}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>

                  {/* Resolve Form */}
                  {resolvingClaimId === claim.id ? (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Describe how the claim was resolved..."
                          rows={2}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResolvingClaimId(null);
                            setResolution('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          loading={loading}
                          disabled={!resolution}
                          onClick={() => handleResolveClaim(claim.id)}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setResolvingClaimId(claim.id)}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Resolve Claim
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Claims */}
        {resolvedClaims.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              Resolved Claims ({resolvedClaims.length})
            </h4>
            <div className="space-y-3">
              {resolvedClaims.map((claim) => (
                <Card key={claim.id} className="p-4 bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900">{claim.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>Filed: {format(claim.date, 'MMM d, yyyy')}</span>
                        {claim.referenceNumber && (
                          <span>Ref: {claim.referenceNumber}</span>
                        )}
                      </div>
                      {claim.resolution && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <span className="font-medium text-green-800">Resolution: </span>
                          <span className="text-green-700">{claim.resolution}</span>
                        </div>
                      )}
                      {claim.resolvedAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          Resolved: {format(claim.resolvedAt, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <Badge variant="success">Resolved</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {warranty.claimHistory.length === 0 && !showAddForm && (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No claims filed yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click &quot;File New Claim&quot; to submit a warranty claim
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
