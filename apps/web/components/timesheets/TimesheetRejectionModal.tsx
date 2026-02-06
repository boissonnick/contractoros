"use client";

import React, { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TimesheetRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
  employeeName?: string;
}

export function TimesheetRejectionModal({ isOpen, onClose, onReject, employeeName }: TimesheetRejectionModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onReject(reason.trim());
      setReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal open={isOpen} onClose={onClose} title="Reject Timesheet" size="sm">
      <div className="space-y-4">
        {employeeName && (
          <p className="text-sm text-gray-600">
            Rejecting timesheet for <span className="font-medium text-gray-900">{employeeName}</span>
          </p>
        )}
        <div>
          <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            placeholder="Provide a reason for rejection..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            icon={<XMarkIcon className="h-4 w-4" />}
          >
            {submitting ? 'Rejecting...' : 'Reject Timesheet'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
