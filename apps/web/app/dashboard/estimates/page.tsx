"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Button, Card, Badge, EmptyState, PageHeader } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Estimate, EstimateStatus } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusConfig: Record<EstimateStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <PencilSquareIcon className="h-4 w-4" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: <EnvelopeIcon className="h-4 w-4" /> },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: <EyeIcon className="h-4 w-4" /> },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700', icon: <ClockIcon className="h-4 w-4" /> },
  revised: { label: 'Revised', color: 'bg-yellow-100 text-yellow-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
};

export default function EstimatesPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | 'all'>('all');

  const loadEstimates = useCallback(async () => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'estimates'),
        where('orgId', '==', profile.orgId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        validUntil: doc.data().validUntil?.toDate(),
        sentAt: doc.data().sentAt?.toDate(),
        viewedAt: doc.data().viewedAt?.toDate(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
      })) as Estimate[];

      setEstimates(items);
    } catch (error) {
      console.error('Error loading estimates:', error);
      toast.error('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId]);

  useEffect(() => {
    if (profile?.orgId) {
      loadEstimates();
    }
  }, [profile?.orgId, loadEstimates]);

  const filteredEstimates = useMemo(() => {
    return estimates.filter((estimate) => {
      const matchesSearch =
        estimate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estimate.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estimate.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [estimates, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = estimates.length;
    const drafts = estimates.filter((e) => e.status === 'draft').length;
    const sent = estimates.filter((e) => e.status === 'sent' || e.status === 'viewed').length;
    const accepted = estimates.filter((e) => e.status === 'accepted').length;
    const declined = estimates.filter((e) => e.status === 'declined').length;
    const totalValue = estimates.reduce((sum, e) => sum + e.total, 0);
    const wonValue = estimates
      .filter((e) => e.status === 'accepted')
      .reduce((sum, e) => sum + e.total, 0);
    const winRate = sent > 0 ? Math.round((accepted / (accepted + declined || 1)) * 100) : 0;
    return { total, drafts, sent, accepted, declined, totalValue, wonValue, winRate };
  }, [estimates]);

  const _handleDelete = async (estimateId: string) => {
    if (!confirm('Are you sure you want to delete this estimate?')) return;

    try {
      await deleteDoc(doc(db, 'estimates', estimateId));
      toast.success('Estimate deleted');
      loadEstimates();
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast.error('Failed to delete estimate');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Estimates"
          description="Create and manage project estimates and proposals"
          actions={
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/estimates/new')}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-xl font-heading font-bold tracking-tight text-gray-900">Estimates</h1>
        <p className="text-xs text-gray-500">Create and manage proposals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Estimates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{stats.sent}</p>
              <p className="text-xs text-gray-500">Pending Response</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{formatCurrency(stats.wonValue)}</p>
              <p className="text-xs text-gray-500">Won Value</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{stats.winRate}%</p>
              <p className="text-xs text-gray-500">Win Rate</p>
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
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EstimateStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Estimates List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredEstimates.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title={estimates.length === 0 ? "No estimates yet" : "No matching estimates"}
          description={estimates.length === 0
            ? "Create your first estimate to start winning work."
            : "Try adjusting your search or filter criteria."
          }
          action={estimates.length === 0 ? {
            label: 'New Estimate',
            onClick: () => router.push('/dashboard/estimates/new'),
          } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredEstimates.map((estimate) => {
            const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date() && estimate.status !== 'accepted';

            return (
              <Card
                key={estimate.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/estimates/${estimate.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">{estimate.number}</span>
                      <Badge className={statusConfig[estimate.status].color}>
                        {statusConfig[estimate.status].icon}
                        <span className="ml-1">{statusConfig[estimate.status].label}</span>
                      </Badge>
                      {isExpired && estimate.status !== 'expired' && (
                        <Badge className="bg-orange-100 text-orange-700">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-heading font-medium text-gray-900">{estimate.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{estimate.clientName}</span>
                      <span>Created {format(new Date(estimate.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(estimate.total)}
                    </p>
                    {estimate.validUntil && (
                      <p className={cn(
                        "text-xs",
                        isExpired ? "text-red-600" : "text-gray-500"
                      )}>
                        Valid until {format(new Date(estimate.validUntil), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mobile FAB for New Estimate */}
      <button
        onClick={() => router.push('/dashboard/estimates/new')}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="New Estimate"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
