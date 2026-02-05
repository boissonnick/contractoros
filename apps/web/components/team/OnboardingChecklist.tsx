"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { Card, Button, Badge, toast, EmptyState, BaseModal, Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  UserProfile,
  OnboardingStatus,
  OnboardingStep,
} from '@/types';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import {
  initiateOnboarding,
  resendWelcomeEmail,
  updateOnboardingStep,
  bulkInitiateOnboarding,
  ONBOARDING_STEPS,
} from '@/lib/onboarding/user-onboarding';

interface OnboardingChecklistProps {
  /** Optional filter to show only specific users */
  userIds?: string[];
  /** Compact mode for embedding in other views */
  compact?: boolean;
  /** Show bulk actions */
  showBulkActions?: boolean;
}

// Step icons
const STEP_ICONS: Record<OnboardingStep, React.ComponentType<{ className?: string }>> = {
  invite_sent: PaperAirplaneIcon,
  email_verified: ShieldCheckIcon,
  profile_completed: UserIcon,
  first_login: CheckCircleIcon,
};

// Status filter options
type OnboardingFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export default function OnboardingChecklist({
  userIds,
  compact = false,
  showBulkActions = true,
}: OnboardingChecklistProps) {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [onboardingStatuses, setOnboardingStatuses] = useState<Record<string, OnboardingStatus>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OnboardingFilter>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [processingUsers, setProcessingUsers] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  // Load users and onboarding statuses
  useEffect(() => {
    if (!profile?.orgId) return;

    setLoading(true);

    // Build users query
    let usersQuery;
    if (userIds && userIds.length > 0) {
      // Firestore 'in' queries are limited to 30 items
      const limitedUserIds = userIds.slice(0, 30);
      usersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', profile.orgId),
        where('uid', 'in', limitedUserIds)
      );
    } else {
      usersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', profile.orgId)
      );
    }

    // Subscribe to users
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const userData = snap.docs.map((d) => ({
        ...d.data(),
        uid: d.id,
      })) as UserProfile[];

      // Filter out clients and subs for team onboarding
      const teamUsers = userData.filter(
        (u) => u.role !== 'CLIENT' && u.role !== 'SUB'
      );
      setUsers(teamUsers);
      setLoading(false);
    });

    // Subscribe to onboarding statuses
    const statusQuery = query(
      collection(db, 'organizations', profile.orgId, 'onboardingStatuses')
    );

    const unsubStatus = onSnapshot(statusQuery, (snap) => {
      const statusMap: Record<string, OnboardingStatus> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        statusMap[data.userId] = {
          userId: data.userId,
          inviteSent: data.inviteSent || false,
          inviteSentAt: data.inviteSentAt?.toDate(),
          emailVerified: data.emailVerified || false,
          profileCompleted: data.profileCompleted || false,
          firstLoginAt: data.firstLoginAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          currentStep: data.currentStep,
          steps: data.steps,
        };
      });
      setOnboardingStatuses(statusMap);
    });

    return () => {
      unsubUsers();
      unsubStatus();
    };
  }, [profile?.orgId, userIds]);

  // Calculate onboarding progress for a user
  const getOnboardingProgress = useCallback((userId: string): { progress: number; status: 'pending' | 'in_progress' | 'completed' } => {
    const status = onboardingStatuses[userId];
    if (!status) {
      return { progress: 0, status: 'pending' };
    }

    const steps = ['inviteSent', 'emailVerified', 'profileCompleted', 'firstLoginAt'] as const;
    const completed = steps.filter((step) => {
      if (step === 'firstLoginAt') return !!status.firstLoginAt;
      if (step === 'inviteSent') return status.inviteSent === true;
      if (step === 'emailVerified') return status.emailVerified === true;
      if (step === 'profileCompleted') return status.profileCompleted === true;
      return false;
    }).length;

    const progress = Math.round((completed / steps.length) * 100);

    if (progress === 100) return { progress, status: 'completed' };
    if (progress > 0) return { progress, status: 'in_progress' };
    return { progress: 0, status: 'pending' };
  }, [onboardingStatuses]);

  // Filter users based on search and status
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower);

      // Status filter
      const { status } = getOnboardingProgress(user.uid);
      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter, getOnboardingProgress]);

  // Get status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, in_progress: 0, completed: 0 };
    users.forEach((user) => {
      const { status } = getOnboardingProgress(user.uid);
      counts.all++;
      counts[status]++;
    });
    return counts;
  }, [users, getOnboardingProgress]);

  // Handle manual step trigger
  const handleTriggerStep = async (userId: string, step: OnboardingStep) => {
    if (!profile?.orgId) return;

    setProcessingUsers((prev) => [...prev, userId]);

    try {
      switch (step) {
        case 'invite_sent':
          const emailSent = await resendWelcomeEmail(userId, profile.orgId);
          if (emailSent) {
            toast.success('Welcome email sent');
          } else {
            toast.error('Failed to send welcome email');
          }
          break;

        case 'email_verified':
        case 'profile_completed':
        case 'first_login':
          // These can be manually marked as complete
          await updateOnboardingStep(userId, profile.orgId, step, true);
          toast.success(`Step marked as complete`);
          break;
      }
    } catch (error) {
      console.error('Error triggering step:', error);
      toast.error('Failed to update onboarding step');
    } finally {
      setProcessingUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Handle initiate onboarding for a single user
  const handleInitiateOnboarding = async (userId: string) => {
    setProcessingUsers((prev) => [...prev, userId]);

    try {
      await initiateOnboarding(userId);
      toast.success('Onboarding initiated');
    } catch (error) {
      console.error('Error initiating onboarding:', error);
      toast.error('Failed to initiate onboarding');
    } finally {
      setProcessingUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Handle bulk onboarding
  const handleBulkOnboarding = async () => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    setBulkSending(true);

    try {
      const results = await bulkInitiateOnboarding(selectedUsers);

      if (results.success.length > 0) {
        toast.success(`Onboarding initiated for ${results.success.length} users`);
      }
      if (results.failed.length > 0) {
        toast.error(`Failed to initiate onboarding for ${results.failed.length} users`);
      }

      setSelectedUsers([]);
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error in bulk onboarding:', error);
      toast.error('Failed to process bulk onboarding');
    } finally {
      setBulkSending(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.uid));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<UserGroupIcon className="h-full w-full" />}
        title="No team members"
        description="Invite team members to track their onboarding progress"
        size={compact ? 'sm' : 'md'}
      />
    );
  }

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Header with filters */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['all', 'pending', 'in_progress', 'completed'] as OnboardingFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                    statusFilter === filter
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {filter.replace('_', ' ')} ({statusCounts[filter]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && selectedUsers.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm text-blue-700">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers([])}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBulkModal(true)}
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
              Send Onboarding
            </Button>
          </div>
        </div>
      )}

      {/* Users List */}
      <Card className="divide-y divide-gray-100 overflow-hidden">
        {/* Header row with select all */}
        {showBulkActions && filteredUsers.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 flex items-center gap-3 text-xs text-gray-500">
            <Checkbox
              checked={selectedUsers.length === filteredUsers.length}
              onChange={toggleSelectAll}
              label=""
            />
            <span className="font-medium">Select all</span>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users match your filters
          </div>
        ) : (
          filteredUsers.map((user) => {
            const { progress, status } = getOnboardingProgress(user.uid);
            const onboardingStatus = onboardingStatuses[user.uid];
            const isExpanded = expandedUser === user.uid;
            const isProcessing = processingUsers.includes(user.uid);

            return (
              <div key={user.uid} className="hover:bg-gray-50">
                {/* Main row */}
                <div className="px-4 py-3 flex items-center gap-4">
                  {/* Checkbox */}
                  {showBulkActions && (
                    <Checkbox
                      checked={selectedUsers.includes(user.uid)}
                      onChange={() => toggleUserSelection(user.uid)}
                      label=""
                    />
                  )}

                  {/* User info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.photoURL ? (
                        <Image src={user.photoURL} alt="" width={36} height={36} className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.displayName || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    {/* Progress bar */}
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            status === 'completed' ? 'bg-green-500' :
                            status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
                    </div>

                    {/* Status badge */}
                    <Badge
                      variant={
                        status === 'completed' ? 'success' :
                        status === 'in_progress' ? 'info' : 'default'
                      }
                      size="sm"
                    >
                      {status === 'completed' ? 'Completed' :
                       status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!onboardingStatus && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInitiateOnboarding(user.uid)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                    )}

                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : user.uid)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {ONBOARDING_STEPS.map((step) => {
                        const StepIcon = STEP_ICONS[step.id];
                        const stepStatus = onboardingStatus?.steps?.[step.id];
                        const isCompleted = stepStatus?.completed || false;
                        const canTrigger = step.id === 'invite_sent' || (onboardingStatus && !isCompleted);

                        return (
                          <div
                            key={step.id}
                            className={cn(
                              'p-3 rounded-lg border',
                              isCompleted
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {isCompleted ? (
                                <CheckCircleSolidIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <StepIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-sm font-medium',
                                  isCompleted ? 'text-green-700' : 'text-gray-700'
                                )}>
                                  {step.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {step.description}
                                </p>
                                {isCompleted && stepStatus?.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    {formatDistanceToNow(new Date(stepStatus.completedAt), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {canTrigger && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTriggerStep(user.uid, step.id)}
                                disabled={isProcessing}
                                className="mt-2 w-full"
                              >
                                {isProcessing ? (
                                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                ) : step.id === 'invite_sent' ? (
                                  <>
                                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                                    {onboardingStatus?.inviteSent ? 'Resend Email' : 'Send Email'}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Mark Complete
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>

      {/* Bulk Onboarding Modal */}
      <BaseModal
        open={showBulkModal}
        onClose={() => !bulkSending && setShowBulkModal(false)}
        title="Bulk Onboarding"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <ExclamationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                You are about to initiate onboarding for <strong>{selectedUsers.length}</strong> users.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Each user will receive a welcome email and have their defaults set up.
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {selectedUsers.map((userId) => {
              const user = users.find((u) => u.uid === userId);
              if (!user) return null;
              return (
                <div key={userId} className="px-3 py-2 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{user.displayName || user.email}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
              disabled={bulkSending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkOnboarding}
              disabled={bulkSending}
            >
              {bulkSending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                  Processing...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                  Send Onboarding
                </>
              )}
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export { OnboardingChecklist };
