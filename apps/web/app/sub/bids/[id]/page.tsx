"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { Bid, BidStatus, Project } from '@/types';
import { formatDate, formatDistanceToNow } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  PageHeader,
  Button,
  FirestoreError,
  Card,
  CardContent,
} from '@/components/ui';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  MapPinIcon,
  PencilIcon,
  PaperAirplaneIcon,
  ArchiveBoxXMarkIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

// Bid status configuration
const BID_STATUS_CONFIG: Record<BidStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: DocumentTextIcon },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: ClockIcon },
  under_review: { label: 'Under Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: ClockIcon },
  accepted: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircleIcon },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-500', bgColor: 'bg-gray-50', icon: ArchiveBoxXMarkIcon },
};

// Bid submission form data
interface BidFormData {
  amount: number;
  laborCost?: number;
  materialCost?: number;
  proposedStartDate?: string;
  proposedEndDate?: string;
  timeline?: string;
  description?: string;
}

// Helper to convert Firestore data to Bid
function bidFromFirestore(id: string, data: Record<string, unknown>): Bid {
  return {
    id,
    projectId: data.projectId as string,
    phaseIds: data.phaseIds as string[] | undefined,
    taskId: data.taskId as string | undefined,
    quoteSectionIds: data.quoteSectionIds as string[] | undefined,
    subId: data.subId as string,
    amount: (data.amount as number) || 0,
    laborCost: data.laborCost as number | undefined,
    materialCost: data.materialCost as number | undefined,
    proposedStartDate: data.proposedStartDate ? (data.proposedStartDate as Timestamp).toDate() : undefined,
    proposedEndDate: data.proposedEndDate ? (data.proposedEndDate as Timestamp).toDate() : undefined,
    timeline: data.timeline as string | undefined,
    description: data.description as string | undefined,
    attachments: data.attachments as string[] | undefined,
    status: data.status as BidStatus,
    submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
    expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
    respondedAt: data.respondedAt ? (data.respondedAt as Timestamp).toDate() : undefined,
    respondedBy: data.respondedBy as string | undefined,
    responseNotes: data.responseNotes as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

export default function SubBidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bidId = params.id as string;

  const [bid, setBid] = useState<Bid | null>(null);
  const [project, setProject] = useState<{ name: string; address?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BidFormData>({
    amount: 0,
    laborCost: undefined,
    materialCost: undefined,
    proposedStartDate: '',
    proposedEndDate: '',
    timeline: '',
    description: '',
  });

  // Fetch bid and project data
  const fetchData = useCallback(async () => {
    if (!bidId || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch bid
      const bidDoc = await getDoc(doc(db, 'bids', bidId));
      if (!bidDoc.exists()) {
        setError('Bid not found');
        setLoading(false);
        return;
      }

      const bidData = bidFromFirestore(bidDoc.id, bidDoc.data());

      // Verify this bid belongs to the current user
      if (bidData.subId !== user.uid) {
        setError('You do not have permission to view this bid');
        setLoading(false);
        return;
      }

      setBid(bidData);

      // Initialize form data
      setFormData({
        amount: bidData.amount,
        laborCost: bidData.laborCost,
        materialCost: bidData.materialCost,
        proposedStartDate: bidData.proposedStartDate?.toISOString().split('T')[0] || '',
        proposedEndDate: bidData.proposedEndDate?.toISOString().split('T')[0] || '',
        timeline: bidData.timeline || '',
        description: bidData.description || '',
      });

      // Fetch project details
      try {
        const projectDoc = await getDoc(doc(db, 'projects', bidData.projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProject({
            name: projectData.name as string,
            address: projectData.address
              ? `${projectData.address.street}, ${projectData.address.city}, ${projectData.address.state}`
              : undefined,
          });
        }
      } catch (projErr) {
        console.error('Error fetching project:', projErr);
      }
    } catch (err) {
      console.error('Error fetching bid:', err);
      setError('Failed to load bid details');
    } finally {
      setLoading(false);
    }
  }, [bidId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save changes to draft
  const handleSave = async () => {
    if (!bid) return;

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        amount: formData.amount,
        laborCost: formData.laborCost || null,
        materialCost: formData.materialCost || null,
        proposedStartDate: formData.proposedStartDate ? Timestamp.fromDate(new Date(formData.proposedStartDate)) : null,
        proposedEndDate: formData.proposedEndDate ? Timestamp.fromDate(new Date(formData.proposedEndDate)) : null,
        timeline: formData.timeline || null,
        description: formData.description || null,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'bids', bid.id), updateData);
      await fetchData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving bid:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Submit draft bid
  const handleSubmit = async () => {
    if (!bid || bid.status !== 'draft') return;

    if (!confirm('Are you sure you want to submit this bid? You will not be able to edit it after submission.')) {
      return;
    }

    setSaving(true);
    try {
      // Save any pending changes first
      const updateData: Record<string, unknown> = {
        amount: formData.amount,
        laborCost: formData.laborCost || null,
        materialCost: formData.materialCost || null,
        proposedStartDate: formData.proposedStartDate ? Timestamp.fromDate(new Date(formData.proposedStartDate)) : null,
        proposedEndDate: formData.proposedEndDate ? Timestamp.fromDate(new Date(formData.proposedEndDate)) : null,
        timeline: formData.timeline || null,
        description: formData.description || null,
        status: 'submitted',
        submittedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'bids', bid.id), updateData);
      await fetchData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error submitting bid:', err);
      setError('Failed to submit bid');
    } finally {
      setSaving(false);
    }
  };

  // Withdraw bid
  const handleWithdraw = async () => {
    if (!bid || !['draft', 'submitted'].includes(bid.status)) return;

    if (!confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'bids', bid.id), {
        status: 'withdrawn',
        updatedAt: Timestamp.now(),
      });
      await fetchData();
    } catch (err) {
      console.error('Error withdrawing bid:', err);
      setError('Failed to withdraw bid');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/sub/bids"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Bids
        </Link>
        <FirestoreError message={error} onRetry={fetchData} />
      </div>
    );
  }

  if (!bid) return null;

  const config = BID_STATUS_CONFIG[bid.status];
  const StatusIcon = config.icon;
  const isEditable = bid.status === 'draft';
  const canWithdraw = ['draft', 'submitted'].includes(bid.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={project?.name || `Project ${bid.projectId.slice(-6)}`}
        description={project?.address || 'Bid Details'}
        backButton={{
          href: '/sub/bids',
          label: 'Back to Bids',
        }}
        actions={
          <div className="flex items-center gap-3">
            {isEditable && !isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                icon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            )}
            {isEditable && (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={saving}
                icon={<PaperAirplaneIcon className="h-4 w-4" />}
              >
                Submit Bid
              </Button>
            )}
            {canWithdraw && (
              <Button
                variant="danger"
                onClick={handleWithdraw}
                loading={saving}
              >
                Withdraw
              </Button>
            )}
          </div>
        }
      >
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
          <StatusIcon className="h-4 w-4" />
          {config.label}
        </span>
      </PageHeader>

      {/* Bid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Bid Amount *
                    </label>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Labor Cost
                    </label>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Cost
                    </label>
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
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Total Bid Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(bid.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Labor Cost</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bid.laborCost ? formatCurrency(bid.laborCost) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Material Cost</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bid.materialCost ? formatCurrency(bid.materialCost) : '-'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.proposedStartDate}
                      onChange={(e) => setFormData({ ...formData, proposedStartDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed End Date
                    </label>
                    <input
                      type="date"
                      value={formData.proposedEndDate}
                      onChange={(e) => setFormData({ ...formData, proposedEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration
                    </label>
                    <input
                      type="text"
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      placeholder="e.g., 2-3 weeks"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Proposed Start</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bid.proposedStartDate ? formatDate(bid.proposedStartDate) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Proposed End</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bid.proposedEndDate ? formatDate(bid.proposedEndDate) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bid.timeline || '-'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>

              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  rows={6}
                  placeholder="Include any relevant details about your bid, approach, or qualifications..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {bid.description || 'No description provided.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data
                  setFormData({
                    amount: bid.amount,
                    laborCost: bid.laborCost,
                    materialCost: bid.materialCost,
                    proposedStartDate: bid.proposedStartDate?.toISOString().split('T')[0] || '',
                    proposedEndDate: bid.proposedEndDate?.toISOString().split('T')[0] || '',
                    timeline: bid.timeline || '',
                    description: bid.description || '',
                  });
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
              >
                Save Changes
              </Button>
            </div>
          )}

          {/* Contractor Response */}
          {bid.responseNotes && (
            <Card className={bid.status === 'accepted' ? 'border-green-200 bg-green-50' : bid.status === 'rejected' ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contractor Response</h3>
                <p className={`${bid.status === 'accepted' ? 'text-green-700' : bid.status === 'rejected' ? 'text-red-700' : 'text-gray-700'}`}>
                  {bid.responseNotes}
                </p>
                {bid.respondedAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Responded on {formatDate(bid.respondedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                Project
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium text-gray-900">{project?.name || `Project ${bid.projectId.slice(-6)}`}</p>
                </div>
                {project?.address && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{project.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bid Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-full">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-500">{formatDate(bid.createdAt)}</p>
                  </div>
                </div>

                {bid.submittedAt && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 rounded-full">
                      <PaperAirplaneIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submitted</p>
                      <p className="text-sm text-gray-500">{formatDate(bid.submittedAt)}</p>
                    </div>
                  </div>
                )}

                {bid.respondedAt && (
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${bid.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {bid.status === 'accepted' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {bid.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(bid.respondedAt)}</p>
                    </div>
                  </div>
                )}

                {bid.status === 'withdrawn' && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-full">
                      <ArchiveBoxXMarkIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Withdrawn</p>
                      <p className="text-sm text-gray-500">{formatDate(bid.updatedAt || bid.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {bid.status === 'accepted' && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <CheckCircleIcon className="h-8 w-8 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Bid Accepted!</h3>
              <p className="text-green-100 text-sm">
                Congratulations! Your bid has been selected. The contractor will be in touch with next steps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
