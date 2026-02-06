"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Submittal, SubmittalStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import CreateSubmittalModal from '@/components/projects/submittals/CreateSubmittalModal';
import SubmittalDetailModal from '@/components/projects/submittals/SubmittalDetailModal';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from '@/components/ui/Toast';

// Mock data for development
const _mockSubmittals: Submittal[] = [
  {
    id: '1',
    projectId: 'proj-1',
    number: 'SUB-001',
    title: 'Concrete Mix Design',
    description: 'Submittal for concrete mix design per spec section 03 30 00',
    specSection: '03 30 00',
    status: 'approved',
    priority: 'high',
    submittedBy: 'user-1',
    submittedByName: 'John Smith',
    assignedTo: 'user-2',
    assignedToName: 'Jane Doe',
    dueDate: new Date('2024-02-15'),
    submittedAt: new Date('2024-02-01'),
    reviewedAt: new Date('2024-02-10'),
    reviewedBy: 'user-2',
    reviewedByName: 'Jane Doe',
    reviewComments: 'Approved as submitted. Mix meets project requirements.',
    attachments: [
      { name: 'concrete-mix-design.pdf', url: '#', type: 'application/pdf', size: 245000 },
    ],
    revisionNumber: 0,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    projectId: 'proj-1',
    number: 'SUB-002',
    title: 'Structural Steel Shop Drawings',
    description: 'Shop drawings for structural steel fabrication',
    specSection: '05 12 00',
    status: 'pending_review',
    priority: 'urgent',
    submittedBy: 'user-1',
    submittedByName: 'John Smith',
    assignedTo: 'user-3',
    assignedToName: 'Mike Johnson',
    dueDate: new Date('2024-02-20'),
    submittedAt: new Date('2024-02-05'),
    attachments: [
      { name: 'steel-shop-drawings.pdf', url: '#', type: 'application/pdf', size: 5200000 },
      { name: 'steel-calcs.xlsx', url: '#', type: 'application/xlsx', size: 320000 },
    ],
    revisionNumber: 1,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '3',
    projectId: 'proj-1',
    number: 'SUB-003',
    title: 'HVAC Equipment Specifications',
    description: 'Product data for rooftop HVAC units',
    specSection: '23 74 00',
    status: 'revise_resubmit',
    priority: 'medium',
    submittedBy: 'user-1',
    submittedByName: 'John Smith',
    assignedTo: 'user-2',
    assignedToName: 'Jane Doe',
    dueDate: new Date('2024-02-18'),
    submittedAt: new Date('2024-02-08'),
    reviewedAt: new Date('2024-02-12'),
    reviewedBy: 'user-2',
    reviewedByName: 'Jane Doe',
    reviewComments: 'Equipment capacity does not meet design requirements. Please resubmit with correct tonnage.',
    attachments: [],
    revisionNumber: 0,
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-12'),
  },
];

const statusConfig: Record<SubmittalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: <ClockIcon className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  approved_as_noted: { label: 'Approved as Noted', color: 'bg-blue-100 text-blue-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  revise_resubmit: { label: 'Revise & Resubmit', color: 'bg-orange-100 text-orange-700', icon: <ArrowPathIcon className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
};

export default function SubmittalsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { profile } = useAuth();

  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmittalStatus | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch submittals from Firestore
  useEffect(() => {
    if (!profile?.orgId || !projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const submittalsRef = collection(
      db,
      'organizations',
      profile.orgId,
      'projects',
      projectId,
      'submittals'
    );
    const q = query(submittalsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate?.() || null,
            submittedAt: data.submittedAt?.toDate?.() || null,
            reviewedAt: data.reviewedAt?.toDate?.() || null,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || null,
          } as Submittal;
        });
        setSubmittals(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching submittals:', error);
        toast.error('Failed to load submittals');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  // Filter submittals
  const filteredSubmittals = useMemo(() => {
    return submittals.filter((submittal) => {
      const matchesSearch =
        submittal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submittal.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submittal.specSection?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || submittal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submittals, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = submittals.length;
    const pending = submittals.filter((s) => s.status === 'pending_review').length;
    const approved = submittals.filter((s) => s.status === 'approved' || s.status === 'approved_as_noted').length;
    const needsRevision = submittals.filter((s) => s.status === 'revise_resubmit').length;
    const rejected = submittals.filter((s) => s.status === 'rejected').length;
    return { total, pending, approved, needsRevision, rejected };
  }, [submittals]);

  const handleCreateSubmittal = async (data: Partial<Submittal>) => {
    if (!profile?.orgId) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const submittalsRef = collection(
        db,
        'organizations',
        profile.orgId,
        'projects',
        projectId,
        'submittals'
      );

      // Generate submittal number
      const submittalNumber = `SUB-${String(submittals.length + 1).padStart(3, '0')}`;

      await addDoc(submittalsRef, {
        ...data,
        projectId,
        number: submittalNumber,
        status: data.status || 'pending_review',
        revisionNumber: 0,
        submittedBy: profile.uid,
        submittedByName: profile.displayName || profile.email,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Submittal created successfully');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating submittal:', error);
      toast.error('Failed to create submittal');
    }
  };

  const handleUpdateStatus = async (submittalId: string, status: SubmittalStatus, comments?: string) => {
    if (!profile?.orgId) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const submittalRef = doc(
        db,
        'organizations',
        profile.orgId,
        'projects',
        projectId,
        'submittals',
        submittalId
      );

      await updateDoc(submittalRef, {
        status,
        reviewComments: comments || null,
        reviewedAt: serverTimestamp(),
        reviewedBy: profile.uid,
        reviewedByName: profile.displayName || profile.email,
        updatedAt: serverTimestamp(),
      });

      toast.success('Submittal status updated');

      // Update the selected submittal if it's the one being updated
      if (selectedSubmittal?.id === submittalId) {
        setSelectedSubmittal({
          ...selectedSubmittal,
          status,
          reviewComments: comments,
        });
      }
    } catch (error) {
      console.error('Error updating submittal:', error);
      toast.error('Failed to update submittal');
    }
  };

  const openDetail = (submittal: Submittal) => {
    setSelectedSubmittal(submittal);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Submittals</h1>
          <p className="text-gray-500 mt-1">
            Track and manage project submittals
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Submittal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArrowPathIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.needsRevision}</p>
              <p className="text-xs text-gray-500">Needs Revision</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
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
            placeholder="Search submittals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmittalStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="approved_as_noted">Approved as Noted</option>
            <option value="revise_resubmit">Revise & Resubmit</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submittals List */}
      {filteredSubmittals.length === 0 ? (
        <EmptyState
          icon={<DocumentArrowUpIcon className="h-12 w-12" />}
          title="No submittals found"
          description={searchQuery || statusFilter !== 'all'
            ? "Try adjusting your search or filters"
            : "Create your first submittal to get started"
          }
          action={
            !searchQuery && statusFilter === 'all'
              ? { label: 'New Submittal', onClick: () => setIsCreateModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSubmittals.map((submittal) => {
            const isOverdue = submittal.dueDate &&
              new Date(submittal.dueDate) < new Date() &&
              submittal.status === 'pending_review';

            return (
              <Card
                key={submittal.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetail(submittal)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-brand-600">
                        {submittal.number}
                      </span>
                      <Badge className={statusConfig[submittal.status].color}>
                        {statusConfig[submittal.status].icon}
                        <span className="ml-1">{statusConfig[submittal.status].label}</span>
                      </Badge>
                      {submittal.revisionNumber > 0 && (
                        <Badge className="bg-purple-100 text-purple-700">
                          Rev {submittal.revisionNumber}
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge className="bg-red-100 text-red-700">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {submittal.title}
                    </h3>
                    {submittal.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {submittal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {submittal.specSection && (
                        <span>Spec: {submittal.specSection}</span>
                      )}
                      {submittal.submittedByName && (
                        <span>By: {submittal.submittedByName}</span>
                      )}
                      {submittal.submittedAt && (
                        <span>
                          Submitted: {format(new Date(submittal.submittedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {submittal.dueDate && (
                      <div className={cn(
                        "text-xs",
                        isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                      )}>
                        Due: {format(new Date(submittal.dueDate), 'MMM d')}
                      </div>
                    )}
                    {submittal.attachments && submittal.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <DocumentTextIcon className="h-4 w-4" />
                        {submittal.attachments.length} file{submittal.attachments.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateSubmittalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmittal}
        projectId={projectId}
      />

      {/* Detail Modal */}
      <SubmittalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        submittal={selectedSubmittal}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
