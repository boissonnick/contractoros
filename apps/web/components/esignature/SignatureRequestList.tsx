"use client";

import React, { useState } from 'react';
import { SignatureRequest } from '@/lib/esignature/types';
import { useSignatureRequests } from '@/lib/hooks/useSignatureRequests';
import { useAuth } from '@/lib/auth';
import SignatureStatusBadge from './SignatureStatusBadge';
import { Card, Button } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  cancelSignatureRequest,
  sendReminder,
  generateSigningUrl,
} from '@/lib/esignature';
import {
  DocumentTextIcon,
  PaperAirplaneIcon,
  ClockIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  XMarkIcon,
  LinkIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface SignatureRequestListProps {
  projectId?: string;
  emptyMessage?: string;
  maxItems?: number;
  className?: string;
}

export default function SignatureRequestList({
  projectId,
  emptyMessage = 'No signature requests yet',
  maxItems,
  className,
}: SignatureRequestListProps) {
  const { profile } = useAuth();
  const { requests, loading, error, refresh } = useSignatureRequests({
    projectId,
    orgId: profile?.orgId || '',
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const displayRequests = maxItems ? requests.slice(0, maxItems) : requests;

  // Handle sending reminder
  const handleSendReminder = async (request: SignatureRequest, signerIndex: number) => {
    if (!profile?.orgId) return;

    setActionLoading(`reminder-${request.id}-${signerIndex}`);
    try {
      await sendReminder(request.id, signerIndex, profile.orgId);
      refresh();
    } catch (err) {
      logger.error('Error sending reminder', { error: err, component: 'SignatureRequestList' });
      toast.error('Failed to send reminder');
    }
    setActionLoading(null);
  };

  // Handle cancel
  const handleCancel = async (request: SignatureRequest) => {
    if (!profile?.uid || !profile?.displayName) return;
    if (!confirm('Are you sure you want to cancel this signature request?')) return;

    setActionLoading(`cancel-${request.id}`);
    try {
      await cancelSignatureRequest(request.id, profile.uid, profile.displayName);
      refresh();
    } catch (err) {
      logger.error('Error cancelling request', { error: err, component: 'SignatureRequestList' });
      toast.error('Failed to cancel request');
    }
    setActionLoading(null);
  };

  // Copy signing URL
  const handleCopyUrl = (requestId: string, signerIndex: number) => {
    const url = generateSigningUrl(requestId, signerIndex);
    navigator.clipboard.writeText(url);
    setCopiedUrl(`${requestId}-${signerIndex}`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 rounded-lg text-sm text-red-700', className)}>
        Failed to load signature requests
      </div>
    );
  }

  if (displayRequests.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayRequests.map((request) => {
        const isExpanded = expandedId === request.id;
        const _pendingSigners = request.signers.filter(
          (s) => s.status === 'pending' || s.status === 'sent' || s.status === 'viewed'
        );
        const signedSigners = request.signers.filter((s) => s.status === 'signed');

        return (
          <Card key={request.id} className="overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : request.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">{request.documentTitle}</h4>
                  <p className="text-sm text-gray-500">
                    {request.signers.length} signer{request.signers.length > 1 ? 's' : ''} ·{' '}
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SignatureStatusBadge status={request.status} size="sm" />
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                {/* Progress bar */}
                <div className="py-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {signedSigners.length} of {request.signers.length} signed
                    </span>
                    <span className="text-gray-500">
                      {Math.round((signedSigners.length / request.signers.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${(signedSigners.length / request.signers.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Signers */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Signers</h5>
                  {request.signers.map((signer, index) => (
                    <div
                      key={signer.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                          <p className="text-xs text-gray-500">{signer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {signer.status === 'signed' && signer.signedAt && (
                          <span className="text-xs text-green-600">
                            Signed {format(new Date(signer.signedAt), 'MMM d, h:mm a')}
                          </span>
                        )}
                        {signer.status === 'viewed' && (
                          <span className="text-xs text-blue-600">Viewed</span>
                        )}
                        {(signer.status === 'pending' || signer.status === 'sent' || signer.status === 'viewed') && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyUrl(request.id, index)}
                              className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary-light rounded transition-colors"
                              title="Copy signing link"
                            >
                              {copiedUrl === `${request.id}-${index}` ? (
                                <ClipboardDocumentIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <LinkIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleSendReminder(request, index)}
                              disabled={actionLoading === `reminder-${request.id}-${index}`}
                              className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary-light rounded transition-colors disabled:opacity-50"
                              title="Send reminder"
                            >
                              {actionLoading === `reminder-${request.id}-${index}` ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <PaperAirplaneIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                        {signer.status === 'declined' && (
                          <span className="text-xs text-red-600">Declined</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expiration notice */}
                {request.expiresAt && request.status !== 'signed' && request.status !== 'cancelled' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    Expires {format(new Date(request.expiresAt), 'MMMM d, yyyy')}
                  </div>
                )}

                {/* Actions */}
                {(request.status === 'pending' || request.status === 'viewed' || request.status === 'draft') && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCancel(request)}
                      disabled={actionLoading === `cancel-${request.id}`}
                      icon={
                        actionLoading === `cancel-${request.id}` ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <XMarkIcon className="h-4 w-4" />
                        )
                      }
                      className="!text-red-600 hover:!bg-red-50"
                    >
                      Cancel Request
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {maxItems && requests.length > maxItems && (
        <p className="text-center text-sm text-gray-500">
          and {requests.length - maxItems} more...
        </p>
      )}
    </div>
  );
}
