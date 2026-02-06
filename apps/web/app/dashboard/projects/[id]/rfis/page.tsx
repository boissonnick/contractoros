"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { Button, Card, EmptyState, Avatar } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn, formatRelativeTime } from '@/lib/utils';
import { RFI, RFIStatus, RFIPriority } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import RFIDetailModal from '@/components/projects/rfis/RFIDetailModal';
import CreateRFIModal from '@/components/projects/rfis/CreateRFIModal';

const statusConfig: Record<RFIStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: <ChatBubbleLeftRightIcon className="h-4 w-4" /> },
  pending_response: { label: 'Pending Response', color: 'bg-amber-100 text-amber-700', icon: <ClockIcon className="h-4 w-4" /> },
  answered: { label: 'Answered', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: <CheckCircleIcon className="h-4 w-4" /> },
};

const priorityConfig: Record<RFIPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export default function RFIsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();

  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RFIStatus | 'all'>('all');
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadRFIs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rfisQuery = query(
        collection(db, 'rfis'),
        where('projectId', '==', projectId),
        where('orgId', '==', profile?.orgId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(rfisQuery);
      const rfisData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        answeredAt: doc.data().answeredAt?.toDate(),
        closedAt: doc.data().closedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as RFI[];
      setRfis(rfisData);
    } catch (err: unknown) {
      console.error('Error loading RFIs:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('requires an index')) {
        setError('Database index required. Please deploy indexes.');
      } else if (errorMessage.includes('permission-denied')) {
        setError('Permission denied. Please check Firestore security rules.');
      } else {
        setError('Failed to load RFIs. Please try again.');
        toast.error('Failed to load RFIs');
      }
      setRfis([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, profile?.orgId]);

  useEffect(() => {
    if (projectId && profile?.orgId) {
      loadRFIs();
    }
  }, [projectId, profile?.orgId, loadRFIs]);

  const filteredRFIs = rfis.filter(rfi => {
    const matchesSearch =
      rfi.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfi.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfi.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getNextRFINumber = () => {
    const maxNumber = rfis.reduce((max, rfi) => {
      const num = parseInt(rfi.number.replace('RFI-', ''));
      return num > max ? num : max;
    }, 0);
    return `RFI-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const handleCreateRFI = async (data: Partial<RFI>) => {
    if (!user || !profile) return;

    try {
      const newRFI = {
        ...data,
        projectId,
        orgId: profile.orgId,
        number: getNextRFINumber(),
        status: 'open' as RFIStatus,
        submittedBy: user.uid,
        submittedByName: profile.displayName,
        submittedAt: Timestamp.now(),
        attachments: [],
        history: [{
          id: `hist-${Date.now()}`,
          action: 'created',
          userId: user.uid,
          userName: profile.displayName,
          timestamp: new Date(),
        }],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'rfis'), newRFI);
      toast.success('RFI created');
      setShowCreateModal(false);
      loadRFIs();
    } catch (error) {
      console.error('Error creating RFI:', error);
      toast.error('Failed to create RFI');
    }
  };

  const handleAddResponse = async (rfiId: string, response: string) => {
    if (!user || !profile) return;

    try {
      const rfiRef = doc(db, 'rfis', rfiId);
      const rfiDoc = await getDoc(rfiRef);
      if (!rfiDoc.exists()) {
        toast.error('RFI not found');
        return;
      }

      const currentRFI = rfiDoc.data();
      const newResponse = {
        id: `resp-${Date.now()}`,
        content: response,
        authorId: user.uid,
        authorName: profile.displayName,
        createdAt: new Date(),
        isOfficial: false,
      };

      await updateDoc(rfiRef, {
        responses: [...(currentRFI.responses || []), newResponse],
        updatedAt: Timestamp.now(),
      });

      toast.success('Response added');
      loadRFIs();
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Failed to add response');
    }
  };

  const handleUpdateStatus = async (rfiId: string, status: RFIStatus) => {
    if (!user || !profile) return;

    try {
      const rfiRef = doc(db, 'rfis', rfiId);
      await updateDoc(rfiRef, {
        status,
        updatedAt: Timestamp.now(),
        ...(status === 'answered' && {
          respondedAt: Timestamp.now(),
        }),
        ...(status === 'closed' && {
          closedAt: Timestamp.now(),
          closedBy: user.uid,
          closedByName: profile.displayName,
        }),
      });

      toast.success(`RFI status updated to ${status.replace('_', ' ')}`);
      setSelectedRFI(null);
      loadRFIs();
    } catch (error) {
      console.error('Error updating RFI status:', error);
      toast.error('Failed to update RFI status');
    }
  };

  // Stats
  const stats = {
    total: rfis.length,
    open: rfis.filter(r => r.status === 'open' || r.status === 'pending_response').length,
    answered: rfis.filter(r => r.status === 'answered').length,
    overdue: rfis.filter(r => r.dueDate && r.dueDate < new Date() && r.status !== 'closed' && r.status !== 'answered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">RFIs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Request for Information tracking
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon className="h-5 w-5" />}
          onClick={() => setShowCreateModal(true)}
        >
          New RFI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Open</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Answered</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.answered}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search RFIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RFIStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending_response">Pending Response</option>
          <option value="answered">Answered</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* RFI List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <Card className="p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load RFIs</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={loadRFIs}>Try Again</Button>
        </Card>
      ) : filteredRFIs.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title={rfis.length === 0 ? "No RFIs yet" : "No matching RFIs"}
          description={rfis.length === 0
            ? "Create your first RFI to track questions and clarifications."
            : "Try adjusting your search or filter criteria."
          }
          action={rfis.length === 0 ? {
            label: 'Create RFI',
            onClick: () => setShowCreateModal(true),
          } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredRFIs.map((rfi) => (
            <Card
              key={rfi.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedRFI(rfi)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{rfi.number}</span>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      statusConfig[rfi.status].color
                    )}>
                      {statusConfig[rfi.status].icon}
                      {statusConfig[rfi.status].label}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      priorityConfig[rfi.priority].color
                    )}>
                      {priorityConfig[rfi.priority].label}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{rfi.subject}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-1">{rfi.question}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Submitted by {rfi.submittedByName}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(rfi.submittedAt)}</span>
                    {rfi.dueDate && (
                      <>
                        <span>•</span>
                        <span className={cn(
                          rfi.dueDate < new Date() && rfi.status !== 'answered' && rfi.status !== 'closed'
                            ? 'text-red-600 font-medium'
                            : ''
                        )}>
                          Due {formatRelativeTime(rfi.dueDate)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {rfi.assignedTo && (
                  <Avatar name={rfi.assignedToName || ''} size="sm" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create RFI Modal */}
      {showCreateModal && (
        <CreateRFIModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRFI}
          projectId={projectId}
        />
      )}

      {/* RFI Detail Modal */}
      {selectedRFI && (
        <RFIDetailModal
          isOpen={!!selectedRFI}
          onClose={() => setSelectedRFI(null)}
          rfi={selectedRFI}
          onAddResponse={handleAddResponse}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
