'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FormModal } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { UserProfile } from '@/types';
import { formatBudgetCurrency } from '@/lib/budget-utils';

interface TeamMemberCostRateModalProps {
  member: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamMemberCostRateModal({
  member,
  isOpen,
  onClose,
}: TeamMemberCostRateModalProps) {
  const [hourlyCost, setHourlyCost] = useState<string>(
    member.hourlyCost?.toString() ?? ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const costValue = hourlyCost ? parseFloat(hourlyCost) : undefined;

    if (costValue !== undefined && (isNaN(costValue) || costValue < 0)) {
      toast.error('Please enter a valid cost rate');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', member.uid), {
        hourlyCost: costValue ?? null,
      });
      toast.success(`Cost rate updated for ${member.displayName}`);
      onClose();
    } catch (err) {
      console.error('Error updating cost rate:', err);
      toast.error('Failed to update cost rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Cost Rate"
      description={`Set the internal cost rate for ${member.displayName}`}
      onSubmit={handleSave}
      submitLabel="Save"
      loading={saving}
    >
      <div className="space-y-4">
        {/* Read-only billing rate context */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Billing Rate (read-only)
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            {member.hourlyRate
              ? `${formatBudgetCurrency(member.hourlyRate)}/hr`
              : 'Not set'}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            What you bill clients for this person&apos;s time
          </p>
        </div>

        {/* Editable cost rate */}
        <div>
          <label
            htmlFor="hourlyCost"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cost Rate ($/hr)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              id="hourlyCost"
              type="number"
              min="0"
              step="0.01"
              value={hourlyCost}
              onChange={(e) => setHourlyCost(e.target.value)}
              className="w-full pl-7 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              /hr
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            What this employee costs your company per hour (wages + burden)
          </p>
        </div>

        {/* Margin preview */}
        {member.hourlyRate && hourlyCost && parseFloat(hourlyCost) > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Margin Preview</p>
            <p className="text-xs text-blue-700 mt-1">
              Billing: {formatBudgetCurrency(member.hourlyRate)}/hr - Cost:{' '}
              {formatBudgetCurrency(parseFloat(hourlyCost))}/hr ={' '}
              <span className="font-semibold">
                {formatBudgetCurrency(
                  member.hourlyRate - parseFloat(hourlyCost)
                )}
                /hr (
                {(
                  ((member.hourlyRate - parseFloat(hourlyCost)) /
                    member.hourlyRate) *
                  100
                ).toFixed(1)}
                % margin)
              </span>
            </p>
          </div>
        )}
      </div>
    </FormModal>
  );
}
