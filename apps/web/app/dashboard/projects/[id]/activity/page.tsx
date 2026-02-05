"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Button, Card, Badge, EmptyState, Avatar, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { ProjectActivity, ProjectNote, ProjectActivityType } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  UserMinusIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  DocumentIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  BookmarkIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

type Tab = 'all' | 'notes' | 'activity';

const activityIcons: Record<ProjectActivityType, React.ComponentType<{ className?: string }>> = {
  project_created: DocumentTextIcon,
  project_updated: ArrowPathIcon,
  status_changed: ArrowPathIcon,
  phase_started: CheckCircleIcon,
  phase_completed: CheckCircleIcon,
  task_created: ClipboardDocumentCheckIcon,
  task_completed: CheckCircleIcon,
  note_added: ChatBubbleLeftEllipsisIcon,
  document_uploaded: DocumentIcon,
  photo_uploaded: PhotoIcon,
  team_member_added: UserPlusIcon,
  team_member_removed: UserMinusIcon,
  budget_updated: CurrencyDollarIcon,
  invoice_sent: CurrencyDollarIcon,
  payment_received: CurrencyDollarIcon,
  rfi_created: ExclamationCircleIcon,
  rfi_answered: CheckCircleIcon,
  submittal_created: DocumentIcon,
  submittal_approved: CheckCircleIcon,
  punch_item_created: ClipboardDocumentCheckIcon,
  punch_item_completed: CheckCircleIcon,
};

const activityColors: Partial<Record<ProjectActivityType, string>> = {
  project_created: 'bg-blue-100 text-blue-600',
  status_changed: 'bg-purple-100 text-purple-600',
  phase_completed: 'bg-green-100 text-green-600',
  task_completed: 'bg-green-100 text-green-600',
  payment_received: 'bg-green-100 text-green-600',
  rfi_created: 'bg-yellow-100 text-yellow-600',
  punch_item_created: 'bg-orange-100 text-orange-600',
};

export default function ActivityPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ProjectActivityType | 'all'>('all');

  // Load notes and activities
  useEffect(() => {
    if (!profile?.orgId) return;

    setLoading(true);

    // Real-time listener for notes
    const notesQuery = query(
      collection(db, 'projects', projectId, 'notes'),
      orderBy('createdAt', 'desc')
    );

    const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
      })) as ProjectNote[];
      setNotes(notesData);
    });

    // Real-time listener for activities
    const activitiesQuery = query(
      collection(db, 'projects', projectId, 'activities'),
      orderBy('createdAt', 'desc')
    );

    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as ProjectActivity[];
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => {
      unsubNotes();
      unsubActivities();
    };
  }, [projectId, profile?.orgId]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !user || !profile?.orgId) return;

    setSubmitting(true);
    try {
      const noteData = {
        projectId,
        orgId: profile.orgId,
        content: newNoteContent.trim(),
        isPinned: false,
        userId: user.uid,
        userName: profile.displayName || user.email || 'Unknown',
        userPhotoUrl: profile.photoURL || null,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'projects', projectId, 'notes'), noteData);

      // Log activity
      await addDoc(collection(db, 'projects', projectId, 'activities'), {
        projectId,
        orgId: profile.orgId,
        type: 'note_added' as ProjectActivityType,
        title: 'Note added',
        description: newNoteContent.trim().substring(0, 100) + (newNoteContent.length > 100 ? '...' : ''),
        userId: user.uid,
        userName: profile.displayName || user.email || 'Unknown',
        userPhotoUrl: profile.photoURL || null,
        createdAt: Timestamp.now(),
      });

      setNewNoteContent('');
      toast.success('Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim()) return;

    try {
      await updateDoc(doc(db, 'projects', projectId, 'notes', noteId), {
        content: editingContent.trim(),
        updatedAt: Timestamp.now(),
      });

      setEditingNoteId(null);
      setEditingContent('');
      toast.success('Note updated');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'projects', projectId, 'notes', noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, 'projects', projectId, 'notes', noteId), {
        isPinned: !currentPinned,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update note');
    }
  };

  // Sort notes: pinned first, then by date
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter(a => a.type === activityFilter);
  }, [activities, activityFilter]);

  // Get unique activity types for filter
  const activityTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.type));
    return Array.from(types);
  }, [activities]);

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'notes'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
        >
          Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'activity'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
        >
          Activity ({activities.length})
        </button>
      </div>

      {/* Notes Section */}
      {(activeTab === 'all' || activeTab === 'notes') && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>

          {/* Add Note Form */}
          <Card className="p-4">
            <Textarea
              placeholder="Add a note about this project..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="primary"
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || submitting}
                loading={submitting}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </Card>

          {/* Notes List */}
          {sortedNotes.length > 0 ? (
            <div className="space-y-3">
              {sortedNotes.map((note) => (
                <Card key={note.id} className={cn('p-4', note.isPinned && 'border-yellow-300 bg-yellow-50/50')}>
                  <div className="flex items-start gap-3">
                    <Avatar name={note.userName} src={note.userPhotoUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{note.userName}</span>
                          {note.isPinned && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <BookmarkSolidIcon className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                          </span>
                          {note.userId === user?.uid && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleTogglePin(note.id, note.isPinned || false)}
                                className={cn(
                                  'p-1 rounded hover:bg-gray-100 transition-colors',
                                  note.isPinned ? 'text-yellow-600' : 'text-gray-400'
                                )}
                                title={note.isPinned ? 'Unpin' : 'Pin'}
                              >
                                {note.isPinned ? (
                                  <BookmarkSolidIcon className="h-4 w-4" />
                                ) : (
                                  <BookmarkIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingContent(note.content);
                                }}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => handleUpdateNote(note.id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingContent('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      )}

                      {note.updatedAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Edited {format(new Date(note.updatedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            activeTab === 'notes' && (
              <EmptyState
                icon={<ChatBubbleLeftEllipsisIcon className="h-full w-full" />}
                title="No notes yet"
                description="Add notes to keep track of important project information."
              />
            )
          )}
        </div>
      )}

      {/* Activity Feed Section */}
      {(activeTab === 'all' || activeTab === 'activity') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
            {activityTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as ProjectActivityType | 'all')}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                >
                  <option value="all">All Activity</option>
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filteredActivities.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const Icon = activityIcons[activity.type] || DocumentTextIcon;
                  const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-600';

                  return (
                    <div key={activity.id} className="flex items-start gap-4 relative">
                      {/* Icon */}
                      <div className={cn('p-2 rounded-full z-10', colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{activity.userName}</span>
                          <span className="text-gray-500">{activity.title}</span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            activeTab === 'activity' && (
              <EmptyState
                icon={<ArrowPathIcon className="h-full w-full" />}
                title="No activity yet"
                description="Project activity will appear here as changes are made."
              />
            )
          )}
        </div>
      )}

      {/* Empty state for 'all' tab when both are empty */}
      {activeTab === 'all' && notes.length === 0 && activities.length === 0 && (
        <EmptyState
          icon={<NewspaperIcon className="h-full w-full" />}
          title="No activity or notes yet"
          description="Add notes and track project activity here."
        />
      )}
    </div>
  );
}
