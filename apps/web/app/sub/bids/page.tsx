"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubBids, BidWithProject, BidSubmissionData } from '@/lib/hooks/useSubBids';
import { BidStatus } from '@/types';
import { formatDate, formatDistanceToNow } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  PageHeader,
  FilterBar,
  useFilterBar,
  Button,
  EmptyState,
  FormModal,
  FirestoreError,
  SkeletonBidsList,
} from '@/components/ui';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  MapPinIcon,
  PencilIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArchiveBoxXMarkIcon,
} from '@heroicons/react/24/outline';

// Bid status configuration for styling
const BID_STATUS_CONFIG: Record<BidStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: DocumentTextIcon },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: ClockIcon },
  under_review: { label: 'Under Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: ClockIcon },
  accepted: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircleIcon },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-500', bgColor: 'bg-gray-50', icon: ArchiveBoxXMarkIcon },
};

// Status filter options
const STATUS_FILTER_OPTIONS = [
  { label: 'All Bids', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Won', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

// Bid Request Card Component
function BidCard({
  bid,
  onView,
  onEdit,
  onWithdraw,
}: {
  bid: BidWithProject;
  onView: () => void;
  onEdit: () => void;
  onWithdraw: () => void;
}) {
  const config = BID_STATUS_CONFIG[bid.status];
  const StatusIcon = config.icon;
  const isEditable = bid.status === 'draft';
  const canWithdraw = ['draft', 'submitted'].includes(bid.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`p-2.5 rounded-xl ${config.bgColor} flex-shrink-0`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold font-heading tracking-tight text-gray-900 truncate">
                {bid.projectName || `Project ${bid.projectId.slice(-6)}`}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
            </div>

            {bid.projectAddress && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {bid.projectAddress}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-700">
                <BanknotesIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{formatCurrency(bid.amount)}</span>
              </div>

              {bid.submittedAt && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>Submitted {formatDistanceToNow(bid.submittedAt)}</span>
                </div>
              )}

              {bid.proposedStartDate && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>Start: {formatDate(bid.proposedStartDate)}</span>
                </div>
              )}
            </div>

            {bid.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{bid.description}</p>
            )}

            {bid.responseNotes && bid.status === 'rejected' && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Feedback:</span> {bid.responseNotes}
                </p>
              </div>
            )}

            {bid.status === 'accepted' && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  Congratulations! Your bid has been accepted.
                </p>
                {bid.responseNotes && (
                  <p className="text-sm text-green-600 mt-1">{bid.responseNotes}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              icon={<PencilIcon className="h-4 w-4" />}
            >
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            icon={<EyeIcon className="h-4 w-4" />}
          >
            View
          </Button>
          {canWithdraw && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onWithdraw}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Bid Detail/Edit Modal
function BidDetailModal({
  bid,
  isOpen,
  onClose,
  onSubmit,
  onWithdraw,
  mode,
}: {
  bid: BidWithProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BidSubmissionData) => Promise<void>;
  onWithdraw: () => Promise<void>;
  mode: 'view' | 'edit';
}) {
  const [formData, setFormData] = useState<BidSubmissionData>({
    amount: bid?.amount || 0,
    laborCost: bid?.laborCost,
    materialCost: bid?.materialCost,
    proposedStartDate: bid?.proposedStartDate,
    proposedEndDate: bid?.proposedEndDate,
    timeline: bid?.timeline || '',
    description: bid?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when bid changes
  React.useEffect(() => {
    if (bid) {
      setFormData({
        amount: bid.amount || 0,
        laborCost: bid.laborCost,
        materialCost: bid.materialCost,
        proposedStartDate: bid.proposedStartDate,
        proposedEndDate: bid.proposedEndDate,
        timeline: bid.timeline || '',
        description: bid.description || '',
      });
    }
  }, [bid]);

  const handleSubmit = async () => {
    if (mode === 'view') {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bid');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await onWithdraw();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw bid');
    } finally {
      setLoading(false);
    }
  };

  if (!bid) return null;

  const config = BID_STATUS_CONFIG[bid.status];
  const isEditable = mode === 'edit' && bid.status === 'draft';
  const canWithdraw = ['draft', 'submitted'].includes(bid.status);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? 'Bid Details' : 'Edit Bid'}
      size="lg"
      submitLabel={mode === 'view' ? 'Close' : (bid.status === 'draft' ? 'Submit Bid' : 'Save Changes')}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      footer={
        mode === 'view' ? (
          <div className="flex justify-between w-full">
            {canWithdraw && (
              <Button
                variant="danger"
                onClick={handleWithdraw}
                disabled={loading}
              >
                Withdraw Bid
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* Project Info Header */}
      <div className="bg-gray-50 -mx-6 -mt-4 px-6 py-4 mb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {bid.projectName || `Project ${bid.projectId.slice(-6)}`}
            </h3>
            {bid.projectAddress && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPinIcon className="h-3.5 w-3.5" />
                {bid.projectAddress}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Bid Amount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Bid Amount *
            </label>
            {isEditable ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  min="0"
                  step="0.01"
                />
              </div>
            ) : (
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(bid.amount)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labor Cost
            </label>
            {isEditable ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.laborCost || ''}
                  onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || undefined })}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <p className="text-gray-900">{bid.laborCost ? formatCurrency(bid.laborCost) : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Cost
            </label>
            {isEditable ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.materialCost || ''}
                  onChange={(e) => setFormData({ ...formData, materialCost: parseFloat(e.target.value) || undefined })}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <p className="text-gray-900">{bid.materialCost ? formatCurrency(bid.materialCost) : '-'}</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed Start Date
            </label>
            {isEditable ? (
              <input
                type="date"
                value={formData.proposedStartDate ? formData.proposedStartDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, proposedStartDate: e.target.value ? new Date(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            ) : (
              <p className="text-gray-900">{bid.proposedStartDate ? formatDate(bid.proposedStartDate) : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed End Date
            </label>
            {isEditable ? (
              <input
                type="date"
                value={formData.proposedEndDate ? formData.proposedEndDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, proposedEndDate: e.target.value ? new Date(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            ) : (
              <p className="text-gray-900">{bid.proposedEndDate ? formatDate(bid.proposedEndDate) : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Timeline
            </label>
            {isEditable ? (
              <input
                type="text"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                placeholder="e.g., 2-3 weeks"
              />
            ) : (
              <p className="text-gray-900">{bid.timeline || '-'}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bid Description / Notes
          </label>
          {isEditable ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              rows={4}
              placeholder="Include any relevant details about your bid, approach, or qualifications..."
            />
          ) : (
            <p className="text-gray-900 whitespace-pre-wrap">{bid.description || 'No description provided.'}</p>
          )}
        </div>

        {/* Metadata */}
        {mode === 'view' && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(bid.createdAt)}</span>
              </div>
              {bid.submittedAt && (
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <span className="ml-2 text-gray-900">{formatDate(bid.submittedAt)}</span>
                </div>
              )}
              {bid.respondedAt && (
                <div>
                  <span className="text-gray-500">Response Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(bid.respondedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Response Notes */}
        {bid.responseNotes && mode === 'view' && (
          <div className={`p-4 rounded-lg ${bid.status === 'accepted' ? 'bg-green-50' : bid.status === 'rejected' ? 'bg-red-50' : 'bg-gray-50'}`}>
            <h4 className="font-medium font-heading tracking-tight text-gray-900 mb-1">Contractor Response</h4>
            <p className={`text-sm ${bid.status === 'accepted' ? 'text-green-700' : bid.status === 'rejected' ? 'text-red-700' : 'text-gray-700'}`}>
              {bid.responseNotes}
            </p>
          </div>
        )}
      </div>
    </FormModal>
  );
}

// Stats Cards
function BidStats({ bids }: { bids: BidWithProject[] }) {
  const stats = useMemo(() => {
    const active = bids.filter(b => ['submitted', 'under_review'].includes(b.status)).length;
    const won = bids.filter(b => b.status === 'accepted').length;
    const pending = bids.filter(b => b.status === 'draft').length;
    const totalWonValue = bids
      .filter(b => b.status === 'accepted')
      .reduce((sum, b) => sum + b.amount, 0);

    return { active, won, pending, totalWonValue };
  }, [bids]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <ClockIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-sm text-gray-500">Active Bids</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.won}</p>
            <p className="text-sm text-gray-500">Won Bids</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <DocumentTextIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-500">Drafts</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <BanknotesIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalWonValue)}</p>
            <p className="text-sm text-gray-500">Won Value</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function SubBidsPage() {
  useAuth();
  const { bids, solicitations, loading, error, updateBid, withdrawBid, submitDraftBid, refetch } = useSubBids();

  const { search, filters, setSearch, setFilter, clearAll } = useFilterBar({
    initialFilters: { status: '' },
  });

  const [selectedBid, setSelectedBid] = useState<BidWithProject | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  // Filter bids based on search and status
  const filteredBids = useMemo(() => {
    let result = bids;

    // Status filter
    if (filters.status) {
      if (filters.status === 'active') {
        result = result.filter(b => ['submitted', 'under_review'].includes(b.status));
      } else {
        result = result.filter(b => b.status === filters.status);
      }
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(b =>
        b.projectName?.toLowerCase().includes(searchLower) ||
        b.projectAddress?.toLowerCase().includes(searchLower) ||
        b.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [bids, filters.status, search]);

  // Handlers
  const handleView = useCallback((bid: BidWithProject) => {
    setSelectedBid(bid);
    setModalMode('view');
  }, []);

  const handleEdit = useCallback((bid: BidWithProject) => {
    setSelectedBid(bid);
    setModalMode('edit');
  }, []);

  const handleWithdrawBid = useCallback(async (bidId: string) => {
    if (!confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return;
    }
    try {
      await withdrawBid(bidId);
    } catch (err) {
      console.error('Failed to withdraw bid:', err);
    }
  }, [withdrawBid]);

  const handleSubmitBid = useCallback(async (data: BidSubmissionData) => {
    if (!selectedBid) return;

    if (selectedBid.status === 'draft') {
      // Update the draft and then submit it
      await updateBid(selectedBid.id, data);
      await submitDraftBid(selectedBid.id);
    } else {
      // Just update the bid
      await updateBid(selectedBid.id, data);
    }
  }, [selectedBid, updateBid, submitDraftBid]);

  const handleWithdrawFromModal = useCallback(async () => {
    if (!selectedBid) return;
    await withdrawBid(selectedBid.id);
  }, [selectedBid, withdrawBid]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Bids"
          description="View and manage your bid submissions"
        />
        <SkeletonBidsList />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Bids"
          description="View and manage your bid submissions"
        />
        <FirestoreError message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bids"
        description="View and manage your bid submissions"
      />

      {/* Stats */}
      <BidStats bids={bids} />

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search bids..."
        onSearch={setSearch}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        filterValues={filters}
        onFilterChange={setFilter}
        onClearFilters={clearAll}
      />

      {/* Bid List */}
      {filteredBids.length > 0 ? (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              onView={() => handleView(bid)}
              onEdit={() => handleEdit(bid)}
              onWithdraw={() => handleWithdrawBid(bid.id)}
            />
          ))}
        </div>
      ) : bids.length > 0 ? (
        <EmptyState
          title="No bids match your filters"
          description="Try adjusting your search or filter criteria."
          action={{
            label: 'Clear Filters',
            onClick: clearAll,
          }}
        />
      ) : (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title="No bids yet"
          description="When you receive bid requests from contractors, they'll appear here. You can also view any bids you've submitted."
          action={{
            label: 'Go to Dashboard',
            href: '/sub',
          }}
        />
      )}

      {/* Pending Bid Requests Section */}
      {solicitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold font-heading tracking-tight text-gray-900 mb-4">
            Open Bid Requests ({solicitations.length})
          </h2>
          <div className="space-y-3">
            {solicitations.map((solicitation) => (
              <div
                key={solicitation.id}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold font-heading tracking-tight text-gray-900">{solicitation.title}</h3>
                    {solicitation.description && (
                      <p className="text-sm text-gray-600 mt-1">{solicitation.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {solicitation.trade && (
                        <span className="bg-white px-2 py-0.5 rounded border">{solicitation.trade}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Deadline: {formatDate(solicitation.deadline)}
                      </span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">
                    Submit Bid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <BidDetailModal
        bid={selectedBid}
        isOpen={!!selectedBid}
        onClose={() => setSelectedBid(null)}
        onSubmit={handleSubmitBid}
        onWithdraw={handleWithdrawFromModal}
        mode={modalMode}
      />
    </div>
  );
}
