"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSignatureRequests, useSignatureStats } from '@/lib/hooks/useSignatureRequests';
import { SignatureRequest, SignatureRequestStatus } from '@/lib/esignature/types';
import { SignatureStatusBadge } from '@/components/esignature';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import {
  cancelSignatureRequest,
  sendReminder,
  generateSigningUrl,
} from '@/lib/esignature';
import { toast } from '@/components/ui/Toast';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/utils/logger';

const statusFilters: { value: SignatureRequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'signed', label: 'Signed' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

export default function SignaturesDashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const { requests, loading, refresh } = useSignatureRequests({
    orgId: profile?.orgId || '',
  });
  const { stats } = useSignatureStats(profile?.orgId || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SignatureRequestStatus | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pre-compute expiry threshold to avoid Date.now() during render
  // eslint-disable-next-line react-hooks/purity -- Date.now() in useMemo([]) only runs once on mount
  const expiryThreshold = useMemo(() => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.signers.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // Handle send reminder
  const handleSendReminder = async (request: SignatureRequest, signerIndex: number) => {
    if (!profile?.orgId) return;

    setActionLoading(`reminder-${request.id}-${signerIndex}`);
    try {
      const result = await sendReminder(request.id, signerIndex, profile.orgId);
      if (result.success) {
        toast.success('Reminder sent');
        refresh();
      } else {
        toast.error(result.error || 'Failed to send reminder');
      }
    } catch (err) {
      logger.error('Error sending reminder', { error: err, page: 'dashboard-signatures' });
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
      toast.success('Signature request cancelled');
      refresh();
    } catch (err) {
      logger.error('Error cancelling request', { error: err, page: 'dashboard-signatures' });
      toast.error('Failed to cancel request');
    }
    setActionLoading(null);
  };

  // Copy signing URL
  const handleCopyUrl = (requestId: string, signerIndex: number) => {
    const url = generateSigningUrl(requestId, signerIndex);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">E-Signatures</h1>
          <p className="text-gray-500 mt-1">
            Track and manage signature requests for your documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.signed}</p>
              <p className="text-xs text-gray-500">Signed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.declined}</p>
              <p className="text-xs text-gray-500">Declined</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.expired}</p>
              <p className="text-xs text-gray-500">Expired</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by document or signer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SignatureRequestStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title={requests.length === 0 ? "No signature requests yet" : "No matching requests"}
          description={requests.length === 0
            ? "Send an estimate or document for signature to get started."
            : "Try adjusting your search or filter criteria."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const _pendingSigners = request.signers.filter(
              (s) => s.status === 'pending' || s.status === 'sent' || s.status === 'viewed'
            );
            const signedSigners = request.signers.filter((s) => s.status === 'signed');
            const isExpiringSoon = request.expiresAt &&
              new Date(request.expiresAt) < expiryThreshold &&
              (request.status === 'pending' || request.status === 'viewed');

            return (
              <Card
                key={request.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SignatureStatusBadge status={request.status} size="sm" />
                      {isExpiringSoon && (
                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Expiring soon
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">{request.documentTitle}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4" />
                        {signedSigners.length}/{request.signers.length} signed
                      </span>
                      <span>
                        Created {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Signers */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {request.signers.map((signer, index) => (
                        <div
                          key={signer.id}
                          className={cn(
                            "inline-flex items-center gap-2 px-2 py-1 rounded text-xs",
                            signer.status === 'signed' && "bg-green-50 text-green-700",
                            signer.status === 'declined' && "bg-red-50 text-red-700",
                            signer.status === 'viewed' && "bg-blue-50 text-blue-700",
                            (signer.status === 'pending' || signer.status === 'sent') && "bg-gray-100 text-gray-700"
                          )}
                        >
                          <span>{signer.name}</span>
                          {signer.status === 'signed' && <CheckCircleIcon className="h-3 w-3" />}
                          {signer.status === 'declined' && <XCircleIcon className="h-3 w-3" />}
                          {signer.status === 'viewed' && <EyeIcon className="h-3 w-3" />}
                          {(signer.status === 'pending' || signer.status === 'sent') && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyUrl(request.id, index);
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded"
                                title="Copy signing link"
                              >
                                <LinkIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendReminder(request, index);
                                }}
                                disabled={actionLoading === `reminder-${request.id}-${index}`}
                                className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-50"
                                title="Send reminder"
                              >
                                {actionLoading === `reminder-${request.id}-${index}` ? (
                                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                ) : (
                                  <PaperAirplaneIcon className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(request.status === 'pending' || request.status === 'viewed') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCancel(request)}
                        disabled={actionLoading === `cancel-${request.id}`}
                        className="!text-red-600 hover:!bg-red-50"
                      >
                        {actionLoading === `cancel-${request.id}` ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircleIcon className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/dashboard/signatures/${request.id}`)}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
