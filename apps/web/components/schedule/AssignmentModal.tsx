'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScheduleEvent, UserProfile, UserRole } from '@/types';
import { Button, Avatar } from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useScheduleEvents } from '@/lib/hooks/useSchedule';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

// New interface for the modal (preferred)
export interface AssignmentModalProps {
  isOpen?: boolean;
  open?: boolean; // Backward compatibility alias for isOpen
  onClose: () => void;
  event?: ScheduleEvent | {
    id: string;
    title: string;
    start?: Date;
    end?: Date;
    startDate?: Date;
    endDate?: Date;
    projectId?: string;
    currentAssignees?: string[];
    assignedUserIds?: string[];
  };
  onAssign: ((eventId: string, assigneeIds: string[]) => void) | ((assigneeIds: string[]) => void | Promise<void>);
}

interface TeamMember extends UserProfile {
  uid: string;
}

interface MemberConflict {
  eventId: string;
  eventTitle: string;
}

// Role options for filtering
const ROLE_OPTIONS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'EMPLOYEE', label: 'Employees' },
  { value: 'CONTRACTOR', label: 'Contractors' },
  { value: 'PM', label: 'Project Managers' },
  { value: 'SUB', label: 'Subcontractors' },
];

export function AssignmentModal({
  isOpen,
  open,
  onClose,
  event,
  onAssign,
}: AssignmentModalProps) {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [memberConflicts, setMemberConflicts] = useState<Map<string, MemberConflict[]>>(new Map());

  // Support both isOpen and open props
  const modalOpen = isOpen ?? open ?? false;

  // Get schedule events for conflict checking
  const { events: allEvents } = useScheduleEvents();

  // Normalize event data to support both old and new interfaces
  const normalizedEvent = useMemo(() => {
    if (!event) return null;

    const start = (event as { start?: Date }).start || (event as ScheduleEvent).startDate;
    const end = (event as { end?: Date }).end || (event as ScheduleEvent).endDate;
    const currentAssignees = (event as { currentAssignees?: string[] }).currentAssignees ||
                              (event as ScheduleEvent).assignedUserIds || [];

    return {
      id: event.id,
      title: event.title,
      start: start instanceof Date ? start : new Date(),
      end: end instanceof Date ? end : new Date(),
      projectId: event.projectId,
      currentAssignees,
    };
  }, [event]);

  // Load team members
  useEffect(() => {
    async function loadTeamMembers() {
      if (!profile?.orgId) return;

      setLoading(true);
      try {
        const membersQuery = query(
          collection(db, 'users'),
          where('orgId', '==', profile.orgId),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(membersQuery);
        const members = snapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        })) as TeamMember[];

        // Filter to assignable workers (EMPLOYEE, CONTRACTOR, PM, SUB roles)
        const assignableWorkers = members.filter(
          (m) =>
            m.role === 'EMPLOYEE' ||
            m.role === 'CONTRACTOR' ||
            m.role === 'PM' ||
            m.role === 'SUB'
        );
        setTeamMembers(assignableWorkers);
      } catch (error) {
        logger.error('Error loading team members', { error: error, component: 'AssignmentModal' });
      } finally {
        setLoading(false);
      }
    }

    if (modalOpen) {
      loadTeamMembers();
      // Initialize with existing assignments
      setSelectedIds(normalizedEvent?.currentAssignees || []);
      setSearchQuery('');
      setShowAvailableOnly(false);
      setRoleFilter('all');
    }
  }, [modalOpen, profile?.orgId, normalizedEvent?.currentAssignees]);

  // Check for conflicts when event or team members change
  useEffect(() => {
    if (!normalizedEvent || !teamMembers.length || !allEvents.length) return;

    const conflicts = new Map<string, MemberConflict[]>();
    const eventStart = normalizedEvent.start;
    const eventEnd = normalizedEvent.end;

    teamMembers.forEach((member) => {
      const memberConflictList: MemberConflict[] = [];

      allEvents.forEach((existingEvent) => {
        // Skip the current event being edited
        if (existingEvent.id === normalizedEvent.id) return;

        // Check if member is assigned to this event
        if (!existingEvent.assignedUserIds?.includes(member.uid)) return;

        // Check for time overlap
        const existingStart = existingEvent.startDate;
        const existingEnd = existingEvent.endDate;

        const hasOverlap = eventStart < existingEnd && eventEnd > existingStart;

        if (hasOverlap) {
          memberConflictList.push({
            eventId: existingEvent.id,
            eventTitle: existingEvent.title,
          });
        }
      });

      if (memberConflictList.length > 0) {
        conflicts.set(member.uid, memberConflictList);
      }
    });

    setMemberConflicts(conflicts);
  }, [normalizedEvent, teamMembers, allEvents]);

  // Filter members by search, role, and availability
  const filteredMembers = useMemo(() => {
    let filtered = teamMembers;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.displayName?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.trade?.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }

    // Available only filter
    if (showAvailableOnly) {
      filtered = filtered.filter((m) => !memberConflicts.has(m.uid));
    }

    return filtered;
  }, [teamMembers, searchQuery, roleFilter, showAvailableOnly, memberConflicts]);

  // Group members by trade
  const membersByTrade = useMemo(() => {
    const groups: Record<string, TeamMember[]> = {};
    filteredMembers.forEach((member) => {
      const trade = member.trade || 'General';
      if (!groups[trade]) {
        groups[trade] = [];
      }
      groups[trade].push(member);
    });
    return groups;
  }, [filteredMembers]);

  const toggleMember = (uid: string) => {
    setSelectedIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    if (!normalizedEvent) return;

    setSaving(true);
    try {
      // Support both callback signatures
      if (onAssign.length === 2) {
        // New signature: (eventId, assigneeIds)
        (onAssign as (eventId: string, assigneeIds: string[]) => void)(normalizedEvent.id, selectedIds);
      } else {
        // Old signature: (assigneeIds)
        await (onAssign as (assigneeIds: string[]) => void | Promise<void>)(selectedIds);
      }
      onClose();
    } catch (error) {
      logger.error('Error saving assignment', { error: error, component: 'AssignmentModal' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredMembers.map((m) => m.uid);
    setSelectedIds(allIds);
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Count members with conflicts
  const conflictCount = useMemo(() => {
    return filteredMembers.filter((m) => memberConflicts.has(m.uid)).length;
  }, [filteredMembers, memberConflicts]);

  // Format event date/time
  const formatEventTime = () => {
    if (!normalizedEvent) return '';

    const startDate = normalizedEvent.start;
    const endDate = normalizedEvent.end;

    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr} - ${startTime} to ${endTime}`;
  };

  const activeFiltersCount = (showAvailableOnly ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0);

  if (!normalizedEvent) return null;

  return (
    <BaseModal
      open={modalOpen}
      onClose={onClose}
      title={`Assign Team to ${normalizedEvent.title}`}
      size="md"
      className="sm:max-w-md md:max-w-lg"
    >
      <div className="flex flex-col h-full max-h-[80vh] sm:max-h-[70vh]">
        {/* Event Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex-shrink-0">
          <h4 className="font-medium text-gray-900 truncate">{normalizedEvent.title}</h4>
          <p className="text-sm text-gray-500 mt-1">{formatEventTime()}</p>
          {normalizedEvent.projectId && (
            <p className="text-sm text-gray-500">Project linked</p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 mb-4 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
            />
            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors',
                showFilters || activeFiltersCount > 0
                  ? 'bg-brand-100 text-brand-primary'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              <FunnelIcon className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setShowAvailableOnly(false);
                      setRoleFilter('all');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Available Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-brand-primary/20"
                />
                <span className="text-sm text-gray-700">Available only</span>
                {conflictCount > 0 && (
                  <span className="text-xs text-amber-600">
                    ({conflictCount} with conflicts)
                  </span>
                )}
              </label>

              {/* Role Filter */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between text-sm mb-3 flex-shrink-0">
          <span className="text-gray-500">
            {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleClearAll}
              className="text-gray-500 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Team Members List */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No team members found</p>
              {showAvailableOnly && conflictCount === teamMembers.length && (
                <p className="text-xs text-gray-400 mt-1">
                  Try disabling &quot;Available only&quot; filter
                </p>
              )}
            </div>
          ) : (
            Object.entries(membersByTrade).map(([trade, members]) => (
              <div key={trade}>
                {/* Trade header */}
                <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                  {trade} ({members.length})
                </div>
                {/* Members */}
                {members.map((member) => {
                  const isSelected = selectedIds.includes(member.uid);
                  const conflicts = memberConflicts.get(member.uid);
                  const hasConflict = Boolean(conflicts?.length);

                  return (
                    <label
                      key={member.uid}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors',
                        isSelected && 'bg-blue-50 hover:bg-blue-50',
                        hasConflict && !isSelected && 'bg-amber-50/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.uid)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-brand-primary/20 flex-shrink-0"
                      />
                      <Avatar name={member.displayName || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {member.displayName}
                          </p>
                          {hasConflict && (
                            <div className="relative group">
                              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                Has conflict: {conflicts?.[0]?.eventTitle}
                                {conflicts && conflicts.length > 1 && (
                                  <span> (+{conflicts.length - 1} more)</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {member.role}
                          {member.phone && ` - ${member.phone}`}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            icon={saving ? undefined : <UserPlusIcon className="h-4 w-4" />}
          >
            {saving ? 'Saving...' : 'Assign'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

export default AssignmentModal;
