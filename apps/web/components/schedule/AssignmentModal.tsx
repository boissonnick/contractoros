'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScheduleEvent, UserProfile } from '@/types';
import { Button, Avatar } from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface AssignmentModalProps {
  event: ScheduleEvent;
  open: boolean;
  onClose: () => void;
  onAssign: (userIds: string[]) => Promise<void>;
}

interface TeamMember extends UserProfile {
  uid: string;
}

export function AssignmentModal({
  event,
  open,
  onClose,
  onAssign,
}: AssignmentModalProps) {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

        // Filter to field workers (EMPLOYEE, CONTRACTOR roles)
        const fieldWorkers = members.filter(
          (m) => m.role === 'EMPLOYEE' || m.role === 'CONTRACTOR' || m.role === 'PM'
        );
        setTeamMembers(fieldWorkers);
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadTeamMembers();
      // Initialize with existing assignments
      setSelectedIds(event.assignedUserIds || []);
    }
  }, [open, profile?.orgId, event.assignedUserIds]);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return teamMembers;
    const q = searchQuery.toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.displayName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.trade?.toLowerCase().includes(q)
    );
  }, [teamMembers, searchQuery]);

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
    setSaving(true);
    try {
      await onAssign(selectedIds);
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
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

  // Format event date/time
  const eventStartDate = event.startDate instanceof Date
    ? event.startDate
    : new Date(event.startDate);
  const eventEndDate = event.endDate instanceof Date
    ? event.endDate
    : new Date(event.endDate);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Assign Crew"
      size="md"
    >
      <div className="space-y-4">
        {/* Event Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {eventStartDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {!event.allDay && (
              <>
                {' • '}
                {formatTime(eventStartDate)} - {formatTime(eventEndDate)}
              </>
            )}
          </p>
          {event.projectName && (
            <p className="text-sm text-gray-500">{event.projectName}</p>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-700 font-medium"
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
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No team members found</p>
            </div>
          ) : (
            Object.entries(membersByTrade).map(([trade, members]) => (
              <div key={trade}>
                {/* Trade header */}
                <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0">
                  {trade} ({members.length})
                </div>
                {/* Members */}
                {members.map((member) => {
                  const isSelected = selectedIds.includes(member.uid);
                  return (
                    <label
                      key={member.uid}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors',
                        isSelected && 'bg-blue-50 hover:bg-blue-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.uid)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Avatar name={member.displayName || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {member.displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.role}
                          {member.phone && ` • ${member.phone}`}
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
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            icon={saving ? undefined : <UserPlusIcon className="h-4 w-4" />}
          >
            {saving ? 'Saving...' : 'Save Assignment'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

export default AssignmentModal;
