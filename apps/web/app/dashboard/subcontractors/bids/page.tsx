"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Bid, Subcontractor, Project } from '@/types';
import { PageHeader, Card, Badge, EmptyState } from '@/components/ui';
import { SkeletonBidsList } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface BidWithDetails extends Bid {
  subcontractorName?: string;
  projectName?: string;
  trade?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: ClockIcon },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: PaperAirplaneIcon },
  under_review: { label: 'Under Review', color: 'bg-purple-100 text-purple-700', icon: DocumentTextIcon },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircleIcon },
  withdrawn: { label: 'Withdrawn', color: 'bg-orange-100 text-orange-700', icon: XCircleIcon },
};

export default function SubcontractorBidsPage() {
  const { profile } = useAuth();
  const [bids, setBids] = useState<BidWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadBids() {
      if (!profile?.orgId) {
        setLoading(false);
        return;
      }

      try {
        // Load all bids for the org
        const bidsQuery = query(
          collection(db, 'bids'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc')
        );
        const bidsSnap = await getDocs(bidsQuery);
        const bidsData = bidsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as Bid[];

        // Load subcontractors for names
        const subsQuery = query(
          collection(db, 'organizations', profile.orgId, 'subcontractors')
        );
        const subsSnap = await getDocs(subsQuery);
        const subsMap = new Map<string, Subcontractor>();
        subsSnap.docs.forEach(doc => {
          subsMap.set(doc.id, { id: doc.id, ...doc.data() } as Subcontractor);
        });

        // Load projects for names
        const projectsQuery = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId)
        );
        const projectsSnap = await getDocs(projectsQuery);
        const projectsMap = new Map<string, Project>();
        projectsSnap.docs.forEach(doc => {
          projectsMap.set(doc.id, { id: doc.id, ...doc.data() } as Project);
        });

        // Join data
        const bidsWithDetails: BidWithDetails[] = bidsData.map(bid => {
          const sub = subsMap.get(bid.subId);
          const project = projectsMap.get(bid.projectId);
          return {
            ...bid,
            subcontractorName: sub?.companyName || 'Unknown Subcontractor',
            projectName: project?.name || 'Unknown Project',
            trade: sub?.trade,
          };
        });

        setBids(bidsWithDetails);
      } catch (error) {
        console.error('Error loading bids:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBids();
  }, [profile?.orgId]);

  const filteredBids = useMemo(() => {
    return bids.filter(bid => {
      const matchesSearch =
        bid.subcontractorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.trade?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bids, searchQuery, statusFilter]);

  // Group bids by project
  const bidsByProject = useMemo(() => {
    const grouped: Record<string, typeof filteredBids> = {};
    filteredBids.forEach(bid => {
      const projectName = bid.projectName || 'Unassigned';
      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }
      grouped[projectName].push(bid);
    });
    return grouped;
  }, [filteredBids]);

  if (loading) {
    return <SkeletonBidsList />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard/subcontractors"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Subcontractors
        </Link>
      </div>

      <PageHeader
        title="Subcontractor Bids"
        description="View and manage bids from subcontractors across all projects"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bids by subcontractor, project, or trade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold tracking-tight text-gray-900">{bids.length}</p>
          <p className="text-sm text-gray-500">Total Bids</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold tracking-tight text-blue-600">
            {bids.filter(b => b.status === 'draft' || b.status === 'submitted' || b.status === 'under_review').length}
          </p>
          <p className="text-sm text-gray-500">Pending</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold tracking-tight text-green-600">
            {bids.filter(b => b.status === 'accepted').length}
          </p>
          <p className="text-sm text-gray-500">Accepted</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(bids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + (b.amount || 0), 0))}
          </p>
          <p className="text-sm text-gray-500">Total Awarded</p>
        </Card>
      </div>

      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title="No bids found"
          description={searchQuery || statusFilter !== 'all'
            ? "Try adjusting your search or filters"
            : "Create bid solicitations from the project page to start collecting bids"}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(bidsByProject).map(([projectName, projectBids]) => (
            <Card key={projectName} className="p-0">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900">{projectName}</h3>
                <p className="text-sm text-gray-500">{projectBids.length} bid{projectBids.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {projectBids.map((bid) => {
                  const status = statusConfig[bid.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <div key={bid.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{bid.subcontractorName}</h4>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          {bid.trade && <p className="text-sm text-gray-500">{bid.trade}</p>}
                          {bid.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted {format(new Date(bid.createdAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {bid.amount !== undefined && (
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(bid.amount)}
                            </p>
                          )}
                          <Link
                            href={`/dashboard/projects/${bid.projectId}/bids`}
                            className="text-sm text-brand-600 hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
