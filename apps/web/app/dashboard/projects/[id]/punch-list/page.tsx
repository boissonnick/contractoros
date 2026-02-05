"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { PunchItem, PunchItemStatus, PunchItemPriority } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MapPinIcon,
  UserCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import CreatePunchItemModal from '@/components/projects/punchlist/CreatePunchItemModal';
import PunchItemDetailModal from '@/components/projects/punchlist/PunchItemDetailModal';

const statusConfig: Record<PunchItemStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: <ArrowPathIcon className="h-4 w-4" /> },
  ready_for_review: { label: 'Ready for Review', color: 'bg-blue-100 text-blue-700', icon: <ClockIcon className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
};

const priorityConfig: Record<PunchItemPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

export default function PunchListPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();

  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PunchItemStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PunchItemPriority | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PunchItem | null>(null);

  const loadPunchItems = useCallback(async () => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);
      setError(null);
      const q = query(
        collection(db, 'punchItems'),
        where('projectId', '==', projectId),
        where('orgId', '==', profile.orgId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as PunchItem[];

      setPunchItems(items);
    } catch (err: unknown) {
      console.error('Error loading punch items:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('requires an index')) {
        setError('Database index required. Please deploy indexes.');
      } else if (errorMessage.includes('permission-denied')) {
        setError('Permission denied. Please check Firestore security rules.');
      } else {
        setError('Failed to load punch items. Please try again.');
        toast.error('Failed to load punch items');
      }
      setPunchItems([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId, projectId]);

  useEffect(() => {
    if (profile?.orgId) {
      loadPunchItems();
    }
  }, [profile?.orgId, projectId, loadPunchItems]);

  const filteredItems = useMemo(() => {
    return punchItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [punchItems, searchQuery, statusFilter, priorityFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = punchItems.length;
    const open = punchItems.filter((i) => i.status === 'open').length;
    const inProgress = punchItems.filter((i) => i.status === 'in_progress').length;
    const review = punchItems.filter((i) => i.status === 'ready_for_review').length;
    const approved = punchItems.filter((i) => i.status === 'approved').length;
    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, open, inProgress, review, approved, completionRate };
  }, [punchItems]);

  const getNextItemNumber = () => {
    const maxNumber = punchItems.reduce((max, item) => {
      const num = parseInt(item.number.replace('PI-', ''));
      return num > max ? num : max;
    }, 0);
    return `PI-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const handleCreateItem = async (data: Partial<PunchItem>) => {
    if (!user || !profile) return;

    try {
      const newItem = {
        ...data,
        projectId,
        orgId: profile.orgId,
        number: getNextItemNumber(),
        status: 'open' as PunchItemStatus,
        createdBy: user.uid,
        createdByName: profile.displayName,
        photos: [],
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

      await addDoc(collection(db, 'punchItems'), newItem);
      toast.success('Punch item created');
      setShowCreateModal(false);
      loadPunchItems();
    } catch (error) {
      console.error('Error creating punch item:', error);
      toast.error('Failed to create punch item');
    }
  };

  const handleUpdateStatus = async (itemId: string, status: PunchItemStatus) => {
    if (!user || !profile) return;

    try {
      const itemRef = doc(db, 'punchItems', itemId);
      await updateDoc(itemRef, {
        status,
        updatedAt: Timestamp.now(),
        ...(status === 'approved' && {
          completedAt: Timestamp.now(),
          completedBy: user.uid,
          completedByName: profile.displayName,
        }),
      });

      toast.success(`Status updated to ${statusConfig[status].label}`);
      setSelectedItem(null);
      loadPunchItems();
    } catch (error) {
      console.error('Error updating punch item:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this punch item?')) return;

    try {
      await deleteDoc(doc(db, 'punchItems', itemId));
      toast.success('Punch item deleted');
      setSelectedItem(null);
      loadPunchItems();
    } catch (error) {
      console.error('Error deleting punch item:', error);
      toast.error('Failed to delete punch item');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">Punch List</h1>
          <p className="text-gray-500 mt-1">
            Track and resolve punch items before project close-out
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ArrowPathIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.review}</p>
              <p className="text-xs text-gray-500">Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.completionRate}%</p>
              <p className="text-xs text-gray-500">Complete</p>
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
            placeholder="Search punch items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PunchItemStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PunchItemPriority | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Punch Items List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <Card className="p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Punch Items</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={loadPunchItems}>Try Again</Button>
        </Card>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<ClipboardDocumentListIcon className="h-full w-full" />}
          title={punchItems.length === 0 ? "No punch items yet" : "No matching items"}
          description={punchItems.length === 0
            ? "Add your first punch item to track deficiencies."
            : "Try adjusting your search or filter criteria."
          }
          action={punchItems.length === 0 ? {
            label: 'Add Item',
            onClick: () => setShowCreateModal(true),
          } : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedItem(item)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-500">{item.number}</span>
                    <Badge className={statusConfig[item.status].color}>
                      {statusConfig[item.status].icon}
                      <span className="ml-1">{statusConfig[item.status].label}</span>
                    </Badge>
                  </div>
                  <Badge className={priorityConfig[item.priority].color}>
                    {priorityConfig[item.priority].label}
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-medium text-gray-900 line-clamp-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>

                {/* Photo Thumbnail */}
                {item.photos && item.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {item.photos.slice(0, 3).map((photo, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded border-2 border-white bg-gray-200 overflow-hidden"
                        >
                          <Image
                            src={photo.url}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {item.photos.length > 3 && (
                      <span className="text-xs text-gray-500">+{item.photos.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">{item.location}</span>
                    </div>
                  )}
                  {item.assignedToName && (
                    <div className="flex items-center gap-1">
                      <UserCircleIcon className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[80px]">{item.assignedToName}</span>
                    </div>
                  )}
                  {!item.location && !item.assignedToName && (
                    <span>Created {format(new Date(item.createdAt), 'MMM d')}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePunchItemModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateItem}
          projectId={projectId}
        />
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <PunchItemDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
}
