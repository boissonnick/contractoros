'use client';

import React, { useState } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { useReviewRequests } from '@/lib/hooks/useReviews';
import { useClients } from '@/lib/hooks/useClients';
import { ReviewRequestChannel } from '@/types/review';
import { logger } from '@/lib/utils/logger';

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  preselectedClientId?: string;
  preselectedProjectId?: string;
}

export function ReviewRequestModal({
  isOpen,
  onClose,
  orgId,
  preselectedClientId,
  preselectedProjectId,
}: ReviewRequestModalProps) {
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [projectId, setProjectId] = useState(preselectedProjectId || '');
  const [channel, setChannel] = useState<ReviewRequestChannel>('email');
  const [loading, setLoading] = useState(false);

  const { clients } = useClients({ orgId });
  const { createRequest } = useReviewRequests({ orgId });

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSubmit = async () => {
    if (!clientId || !selectedClient) return;

    setLoading(true);
    try {
      await createRequest({
        orgId,
        projectId: projectId || 'general',
        clientId,
        channel,
        status: 'pending',
        recipientName: selectedClient.displayName,
        recipientEmail: channel === 'email' ? selectedClient.email : undefined,
        recipientPhone: channel === 'sms' ? selectedClient.phone : undefined,
      });
      onClose();
      // Reset form
      setClientId('');
      setProjectId('');
      setChannel('email');
    } catch (err) {
      logger.error('Failed to create review request', { error: err, component: 'ReviewRequestModal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Review"
      loading={loading}
      onSubmit={handleSubmit}
      submitLabel="Send Request"
      disabled={!clientId}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setProjectId('');
            }}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-primary focus:ring-brand-primary"
            required
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Send Via</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="channel"
                value="email"
                checked={channel === 'email'}
                onChange={() => setChannel('email')}
                className="text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700">Email</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="channel"
                value="sms"
                checked={channel === 'sms'}
                onChange={() => setChannel('sms')}
                className="text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700">SMS</span>
            </label>
          </div>
        </div>

        {selectedClient && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <strong>Sending to:</strong>{' '}
            {channel === 'email'
              ? selectedClient.email || 'No email on file'
              : selectedClient.phone || 'No phone on file'}
          </div>
        )}
      </div>
    </FormModal>
  );
}

export default ReviewRequestModal;
