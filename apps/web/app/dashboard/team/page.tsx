"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Button, Card, Avatar, Badge, EmptyState, toast, useConfirmDialog } from '@/components/ui';
import { RouteGuard } from '@/components/auth';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { UserProfile, UserRole, ScheduleEvent, ScheduleAssignment, CONSTRUCTION_TRADES } from '@/types';
import Link from 'next/link';
import { useScheduleEvents } from '@/lib/hooks/useSchedule';
import { useScheduleAssignments } from '@/lib/hooks/useScheduleAssignments';

// Utilization thresholds as per requirements
const UTILIZATION_THRESHOLDS = {
  available: 60,  // <60% = green/available
  busy: 80,       // 60-80% = yellow/busy
  // >80% = red/overloaded
};

interface Invite {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
  PM: { label: 'Project Manager', color: 'bg-blue-100 text-blue-700' },
  EMPLOYEE: { label: 'Employee', color: 'bg-green-100 text-green-700' },
  CONTRACTOR: { label: 'Contractor', color: 'bg-orange-100 text-orange-700' },
  SUB: { label: 'Subcontractor', color: 'bg-yellow-100 text-yellow-700' },
  CLIENT: { label: 'Client', color: 'bg-gray-100 text-gray-700' },
};

export default function TeamPage() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'availability'>('members');
  const [memberFilter, setMemberFilter] = useState<'employees' | 'all'>('employees');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'this_week' | 'next_week' | 'this_month'>('this_week');
  const { confirm, DialogComponent } = useConfirmDialog();

  const timeRangeLabels = {
    this_week: 'This Week',
    next_week: 'Next Week',
    this_month: 'This Month',
  };

  // Use CONSTRUCTION_TRADES constant for comprehensive filtering
  // Also show trades that team members have even if not in the constant
  const memberTrades = Array.from(new Set(members.filter(m => m.trade).map(m => m.trade as string)));
  const allTrades = Array.from(new Set([...Array.from(CONSTRUCTION_TRADES), ...memberTrades])).sort();

  // Calculate date ranges based on selected time range
  const dateRanges = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday

    const ranges = {
      this_week: {
        start: startOfWeek,
        end: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        workHours: 40,
      },
      next_week: {
        start: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
        end: new Date(startOfWeek.getTime() + 13 * 24 * 60 * 60 * 1000),
        workHours: 40,
      },
      this_month: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        workHours: Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7) * 40),
      },
    };
    return ranges[selectedTimeRange];
  }, [selectedTimeRange]);

  // Fetch schedule events for selected time range
  const { events: scheduleEvents, loading: eventsLoading } = useScheduleEvents({
    startDate: dateRanges.start,
    endDate: dateRanges.end,
  });

  // Fetch schedule assignments for selected time range
  const { assignments: scheduleAssignments, loading: assignmentsLoading } = useScheduleAssignments({
    startDate: dateRanges.start,
    endDate: dateRanges.end,
  });

  // Calculate utilization from real schedule data
  const getMemberUtilization = (member: UserProfile) => {
    const userId = member.uid;
    const totalAvailableHours = dateRanges.workHours;

    // Calculate hours from schedule events (where user is assigned)
    let hoursFromEvents = 0;
    scheduleEvents.forEach(event => {
      if (event.assignedUserIds?.includes(userId)) {
        if (event.estimatedHours) {
          hoursFromEvents += event.estimatedHours;
        } else if (!event.allDay && event.startDate && event.endDate) {
          // Calculate hours from start/end time
          const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
          const end = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
          hoursFromEvents += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        } else if (event.allDay) {
          hoursFromEvents += 8; // Assume 8 hours for all-day events
        }
      }
    });

    // Calculate hours from assignments
    let hoursFromAssignments = 0;
    scheduleAssignments.forEach(assignment => {
      if (assignment.userId === userId) {
        // Parse time strings and calculate hours
        const [startHour, startMin] = (assignment.startTime || '09:00').split(':').map(Number);
        const [endHour, endMin] = (assignment.endTime || '17:00').split(':').map(Number);
        const hours = (endHour + endMin / 60) - (startHour + startMin / 60);
        hoursFromAssignments += hours;
      }
    });

    const totalHoursAssigned = hoursFromEvents + hoursFromAssignments;
    const utilization = totalAvailableHours > 0
      ? Math.round((totalHoursAssigned / totalAvailableHours) * 100)
      : 0;

    return {
      utilization: Math.min(utilization, 150), // Cap at 150% for display
      hoursAssigned: Math.round(totalHoursAssigned * 10) / 10,
      totalHours: totalAvailableHours
    };
  };

  // Get upcoming assignments for a member
  const getMemberAssignments = (member: UserProfile) => {
    const userId = member.uid;
    const assignments: Array<{
      id: string;
      title: string;
      date: Date;
      hours: number;
      projectName?: string;
      type: 'event' | 'assignment';
    }> = [];

    // From schedule events
    scheduleEvents.forEach(event => {
      if (event.assignedUserIds?.includes(userId)) {
        let hours = event.estimatedHours || 8;
        if (!event.allDay && event.startDate && event.endDate) {
          const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
          const end = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
          hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        assignments.push({
          id: event.id,
          title: event.title,
          date: event.startDate instanceof Date ? event.startDate : new Date(event.startDate),
          hours: Math.round(hours * 10) / 10,
          projectName: event.projectName,
          type: 'event',
        });
      }
    });

    // From assignments
    scheduleAssignments.forEach(assignment => {
      if (assignment.userId === userId) {
        const [startHour, startMin] = (assignment.startTime || '09:00').split(':').map(Number);
        const [endHour, endMin] = (assignment.endTime || '17:00').split(':').map(Number);
        const hours = (endHour + endMin / 60) - (startHour + startMin / 60);
        assignments.push({
          id: assignment.id,
          title: assignment.notes || assignment.projectName || 'Scheduled Work',
          date: assignment.date instanceof Date ? assignment.date : new Date(assignment.date),
          hours: Math.round(hours * 10) / 10,
          projectName: assignment.projectName,
          type: 'assignment',
        });
      }
    });

    // Sort by date
    return assignments.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  };

  // Get team utilization stats using configurable thresholds
  const teamStats = useMemo(() => {
    if (members.length === 0) return { available: 0, busy: 0, overloaded: 0, total: 0, avgUtilization: 0 };

    let available = 0;
    let busy = 0;
    let overloaded = 0;
    let totalUtilization = 0;

    members.forEach(member => {
      const { utilization } = getMemberUtilization(member);
      totalUtilization += utilization;
      if (utilization < UTILIZATION_THRESHOLDS.available) available++;
      else if (utilization < UTILIZATION_THRESHOLDS.busy) busy++;
      else overloaded++;
    });

    return {
      available,
      busy,
      overloaded,
      total: members.length,
      avgUtilization: Math.round(totalUtilization / members.length),
    };
  }, [members, scheduleEvents, scheduleAssignments, dateRanges]);

  // Get week days for weekly view
  const getWeekDays = (startDate: Date) => {
    const days: Date[] = [];
    const start = new Date(startDate);
    // Adjust to Monday
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = useMemo(() => getWeekDays(dateRanges.start), [dateRanges.start]);

  // Get daily breakdown for a member
  const getMemberDailyBreakdown = (member: UserProfile, day: Date) => {
    const userId = member.uid;
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    let hoursForDay = 0;
    const conflicts: string[] = [];
    const assignmentsForDay: string[] = [];

    // Check schedule events
    scheduleEvents.forEach(event => {
      if (event.assignedUserIds?.includes(userId)) {
        const eventDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
        const eventDayStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        if (eventDayStart.getTime() === dayStart.getTime()) {
          let hours = event.estimatedHours || 8;
          if (!event.allDay && event.startDate && event.endDate) {
            const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
            const end = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
            hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
          hoursForDay += hours;
          assignmentsForDay.push(event.title);
        }
      }
    });

    // Check schedule assignments
    scheduleAssignments.forEach(assignment => {
      if (assignment.userId === userId) {
        const assignmentDate = assignment.date instanceof Date ? assignment.date : new Date(assignment.date);
        const assignmentDayStart = new Date(assignmentDate.getFullYear(), assignmentDate.getMonth(), assignmentDate.getDate());

        if (assignmentDayStart.getTime() === dayStart.getTime()) {
          const [startHour, startMin] = (assignment.startTime || '09:00').split(':').map(Number);
          const [endHour, endMin] = (assignment.endTime || '17:00').split(':').map(Number);
          const hours = (endHour + endMin / 60) - (startHour + startMin / 60);
          hoursForDay += hours;
          assignmentsForDay.push(assignment.notes || assignment.projectName || 'Scheduled Work');
        }
      }
    });

    // Check for conflicts (more than 10 hours in a day)
    if (hoursForDay > 10) {
      conflicts.push('Overbooked');
    }

    // Check for double-booking (multiple overlapping events)
    if (assignmentsForDay.length > 2) {
      conflicts.push('Multiple assignments');
    }

    return {
      hours: Math.round(hoursForDay * 10) / 10,
      hasConflict: conflicts.length > 0,
      conflicts,
      assignments: assignmentsForDay,
    };
  };

  // Team roles - excludes SUB (subcontractors) and CLIENT (handled in separate modules)
  const TEAM_ROLES: UserRole[] = ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR'];

  useEffect(() => {
    if (profile?.orgId) {
      loadTeamData();
    }
  }, [profile?.orgId]);

  const loadTeamData = async () => {
    if (!profile?.orgId) return;

    setLoading(true);
    try {
      // Load team members - only internal team roles (not SUB or CLIENT)
      const membersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', profile.orgId),
        where('isActive', '==', true)
      );
      const membersSnap = await getDocs(membersQuery);
      const membersData = membersSnap.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      })) as UserProfile[];
      // Deduplicate by uid and filter to only team roles (exclude SUB and CLIENT)
      const uniqueMembers = Array.from(
        new Map(membersData.map(m => [m.uid, m])).values()
      ).filter(m => TEAM_ROLES.includes(m.role as UserRole));
      setMembers(uniqueMembers);

      // Load pending invites
      const invitesQuery = query(
        collection(db, 'invites'),
        where('orgId', '==', profile.orgId),
        where('status', '==', 'pending')
      );
      const invitesSnap = await getDocs(invitesQuery);
      const invitesData = invitesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date(),
        };
      }) as Invite[];
      setInvites(invitesData);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelInvite = async (inviteId: string, inviteName: string) => {
    const confirmed = await confirm({
      title: 'Cancel Invitation',
      message: `Are you sure you want to cancel the invitation for ${inviteName}? They will no longer be able to join your team using this invite link.`,
      confirmLabel: 'Cancel Invitation',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'invites', inviteId));
      setInvites(invites.filter(i => i.id !== inviteId));
      toast.success('Invitation cancelled');
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const resendInvite = async (invite: Invite) => {
    try {
      await updateDoc(doc(db, 'invites', invite.id), {
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      });
      toast.success('Invitation resent successfully!');
      loadTeamData();
    } catch (error) {
      console.error('Error resending invite:', error);
      toast.error('Failed to resend invitation.');
    }
  };

  // Filter members by employee/contractor type and search query
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Apply employee/contractor filter
    if (memberFilter === 'employees') {
      filtered = filtered.filter(m => m.role !== 'CONTRACTOR');
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [members, memberFilter, searchQuery]);

  const filteredInvites = invites.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RouteGuard
      allowedRoles={['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR']}
      redirectTo="/dashboard"
    >
    <div className="min-h-screen bg-gray-50">
      <DialogComponent />
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team</h1>
              <p className="text-gray-500 mt-1">
                {members.length} members • {invites.length} pending invites
              </p>
            </div>
            <Link href="/dashboard/team/invite">
              <Button variant="primary" icon={<UserPlusIcon className="h-5 w-5" />}>
                Invite Team Member
              </Button>
            </Link>
          </div>

          {/* Search and Tabs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('members')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'members'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Members ({members.length})
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'availability'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Availability
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'invites'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Pending ({invites.length})
              </button>
            </div>
          </div>

          {/* Employee/Contractor Filter and Subcontractors Link */}
          {activeTab === 'members' && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setMemberFilter('employees')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      memberFilter === 'employees'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Employees Only
                  </button>
                  <button
                    onClick={() => setMemberFilter('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      memberFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    All Team
                  </button>
                </div>
                {memberFilter === 'employees' && members.some(m => m.role === 'CONTRACTOR') && (
                  <span className="text-xs text-gray-400">
                    ({members.filter(m => m.role === 'CONTRACTOR').length} contractors hidden)
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/subcontractors"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Subcontractors
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'members' ? (
          filteredMembers.length === 0 ? (
            <EmptyState
              icon={<UserGroupIcon className="h-full w-full" />}
              title="No team members yet"
              description="Start by inviting your employees and contractors. Subcontractors are managed separately."
              action={{
                label: 'Invite Team Member',
                href: '/dashboard/team/invite',
              }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <Card key={member.uid} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <Avatar name={member.displayName || ''} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {member.displayName}
                        </h3>
                        {member.uid === user?.uid && (
                          <span className="text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                        roleLabels[member.role || 'EMPLOYEE'].color
                      )}>
                        {roleLabels[member.role || 'EMPLOYEE'].label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.trade && (
                      <div className="text-sm text-gray-500">
                        Trade: {member.trade}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'availability' ? (
          /* Availability Tab */
          <div className="space-y-6">
            {/* Filters and Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Trades</option>
                    {allTrades.map((trade) => (
                      <option key={trade} value={trade}>{trade}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value as typeof selectedTimeRange)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="this_week">This Week</option>
                    <option value="next_week">Next Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>
              </div>
              <Link href="/dashboard/schedule">
                <Button variant="outline" size="sm" icon={<CalendarDaysIcon className="h-4 w-4" />}>
                  View Schedule
                </Button>
              </Link>
            </div>

            {/* Team Summary Stats - Horizontal Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Card className="bg-white border-l-4 border-l-blue-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teamStats.total}</p>
                    <p className="text-xs text-gray-500">Team Members</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-l-4 border-l-green-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{teamStats.available}</p>
                    <p className="text-xs text-gray-500">Available (&lt;{UTILIZATION_THRESHOLDS.available}%)</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-l-4 border-l-yellow-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <BriefcaseIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{teamStats.busy}</p>
                    <p className="text-xs text-gray-500">Busy ({UTILIZATION_THRESHOLDS.available}-{UTILIZATION_THRESHOLDS.busy}%)</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-l-4 border-l-red-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{teamStats.overloaded}</p>
                    <p className="text-xs text-gray-500">Overloaded (&gt;{UTILIZATION_THRESHOLDS.busy}%)</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-l-4 border-l-purple-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{teamStats.avgUtilization}%</p>
                    <p className="text-xs text-gray-500">Avg Utilization</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Weekly View - Day by Day Breakdown */}
            {selectedTimeRange === 'this_week' && members.filter(m => selectedTrade === 'all' || m.trade === selectedTrade).length > 0 && (
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Weekly Availability Overview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Hours scheduled per day - red indicates conflicts</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 min-w-[160px]">Team Member</th>
                        {weekDays.map((day, i) => {
                          const isToday = new Date().toDateString() === day.toDateString();
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          return (
                            <th
                              key={i}
                              className={cn(
                                'text-center py-2 px-2 text-xs font-medium min-w-[70px]',
                                isToday ? 'bg-blue-50 text-blue-700' : isWeekend ? 'bg-gray-100 text-gray-400' : 'text-gray-500'
                              )}
                            >
                              <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}</div>
                              <div className="text-xs">{day.getDate()}</div>
                            </th>
                          );
                        })}
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 min-w-[80px]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .filter(m => selectedTrade === 'all' || m.trade === selectedTrade)
                        .map((member) => {
                          const { utilization, hoursAssigned, totalHours } = getMemberUtilization(member);
                          return (
                            <tr key={member.uid} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 px-4">
                                <div className="flex items-center gap-2">
                                  <Avatar name={member.displayName || ''} size="sm" />
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate text-sm">{member.displayName}</p>
                                    {member.trade && (
                                      <span className="inline-flex items-center text-xs text-gray-500">
                                        <WrenchScrewdriverIcon className="h-3 w-3 mr-0.5" />
                                        {member.trade}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {weekDays.map((day, i) => {
                                const breakdown = getMemberDailyBreakdown(member, day);
                                const isToday = new Date().toDateString() === day.toDateString();
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                  <td
                                    key={i}
                                    className={cn(
                                      'text-center py-2 px-2',
                                      isToday ? 'bg-blue-50/50' : isWeekend ? 'bg-gray-50' : ''
                                    )}
                                  >
                                    {breakdown.hours > 0 ? (
                                      <div
                                        className={cn(
                                          'inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium',
                                          breakdown.hasConflict
                                            ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                                            : breakdown.hours >= 8
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                        )}
                                        title={breakdown.assignments.join(', ')}
                                      >
                                        {breakdown.hours}h
                                        {breakdown.hasConflict && (
                                          <ExclamationTriangleIcon className="h-3 w-3 ml-0.5" />
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="text-center py-2 px-3">
                                <div className="flex flex-col items-center">
                                  <span className={cn(
                                    'font-semibold text-sm',
                                    utilization >= UTILIZATION_THRESHOLDS.busy ? 'text-red-600' : utilization >= UTILIZATION_THRESHOLDS.available ? 'text-yellow-600' : 'text-green-600'
                                  )}>
                                    {hoursAssigned}h
                                  </span>
                                  <span className="text-xs text-gray-400">/ {totalHours}h</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Loading state for schedule data */}
            {(eventsLoading || assignmentsLoading) && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading schedule data...</span>
              </div>
            )}

            {/* Team Availability Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members
                .filter(m => selectedTrade === 'all' || m.trade === selectedTrade)
                .map((member) => {
                  const { utilization, hoursAssigned, totalHours } = getMemberUtilization(member);
                  const assignments = getMemberAssignments(member);
                  // Use configurable thresholds
                  const utilizationColor = utilization >= UTILIZATION_THRESHOLDS.busy ? 'bg-red-500' : utilization >= UTILIZATION_THRESHOLDS.available ? 'bg-yellow-500' : 'bg-green-500';
                  const utilizationBgColor = utilization >= UTILIZATION_THRESHOLDS.busy ? 'bg-red-100' : utilization >= UTILIZATION_THRESHOLDS.available ? 'bg-yellow-100' : 'bg-green-100';
                  const statusLabel = utilization >= UTILIZATION_THRESHOLDS.busy ? 'Overloaded' : utilization >= UTILIZATION_THRESHOLDS.available ? 'Busy' : 'Available';
                  // Check for conflicts
                  const hasAnyConflict = weekDays.some(day => getMemberDailyBreakdown(member, day).hasConflict);

                  return (
                    <Card key={member.uid} className="hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar name={member.displayName || ''} size="lg" />
                          {/* Status indicator dot */}
                          <div className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white',
                            utilization >= UTILIZATION_THRESHOLDS.busy ? 'bg-red-500' : utilization >= UTILIZATION_THRESHOLDS.available ? 'bg-yellow-500' : 'bg-green-500'
                          )} />
                          {/* Conflict indicator */}
                          {hasAnyConflict && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center" title="Has scheduling conflicts">
                              <ExclamationTriangleIcon className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {member.displayName}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {member.trade && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <WrenchScrewdriverIcon className="h-3 w-3" />
                                <span>{member.trade}</span>
                              </div>
                            )}
                            {member.role && (
                              <span className={cn(
                                'inline-block px-1.5 py-0.5 rounded text-xs font-medium',
                                roleLabels[member.role || 'EMPLOYEE'].color
                              )}>
                                {roleLabels[member.role || 'EMPLOYEE'].label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Utilization Section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Utilization</span>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-xs font-medium',
                              utilizationBgColor,
                              utilization >= 90 ? 'text-red-700' : utilization >= 70 ? 'text-yellow-700' : 'text-green-700'
                            )}>
                              {statusLabel}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">{utilization}%</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-300', utilizationColor)}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {hoursAssigned}h scheduled / {totalHours}h available
                        </p>
                      </div>

                      {/* Upcoming Assignments */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Upcoming ({timeRangeLabels[selectedTimeRange]})
                          </p>
                          {assignments.length > 0 && (
                            <span className="text-xs text-gray-400">{assignments.length} tasks</span>
                          )}
                        </div>
                        {assignments.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No assignments scheduled</p>
                        ) : (
                          <div className="space-y-2">
                            {assignments.slice(0, 3).map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1.5"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-700 truncate font-medium">{assignment.title}</p>
                                  <p className="text-xs text-gray-400">
                                    {assignment.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    {assignment.projectName && ` - ${assignment.projectName}`}
                                  </p>
                                </div>
                                <span className="text-xs font-medium text-gray-500 ml-2 whitespace-nowrap">
                                  {assignment.hours}h
                                </span>
                              </div>
                            ))}
                            {assignments.length > 3 && (
                              <p className="text-xs text-gray-400 text-center">
                                +{assignments.length - 3} more
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                        <Link
                          href={`/dashboard/schedule?assignUser=${member.uid}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            icon={<PlusIcon className="h-3.5 w-3.5" />}
                          >
                            Assign Work
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/schedule?userId=${member.uid}`}
                          className="flex-1"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            icon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                          >
                            View Schedule
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
            </div>

            {/* Empty state if no members after filter */}
            {members.filter(m => selectedTrade === 'all' || m.trade === selectedTrade).length === 0 && (
              <EmptyState
                icon={<WrenchScrewdriverIcon className="h-full w-full" />}
                title={selectedTrade === 'all' ? 'No team members' : `No ${selectedTrade} workers`}
                description={selectedTrade === 'all'
                  ? 'Invite team members to see their availability'
                  : `No team members with the ${selectedTrade} trade`
                }
                action={selectedTrade !== 'all' ? {
                  label: 'Clear Filter',
                  onClick: () => setSelectedTrade('all'),
                } : undefined}
              />
            )}
          </div>
        ) : (
          filteredInvites.length === 0 ? (
            <EmptyState
              icon={<EnvelopeIcon className="h-full w-full" />}
              title="No pending invitations"
              description="All invitations have been accepted or there are no pending invites."
              action={{
                label: 'Send New Invitation',
                href: '/dashboard/team/invite',
              }}
              size="sm"
            />
          ) : (
            <div className="space-y-4">
              {filteredInvites.map((invite) => (
                <Card key={invite.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={invite.name} size="md" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{invite.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">{invite.email}</span>
                          <span className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                            roleLabels[invite.role].color
                          )}>
                            {roleLabels[invite.role].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>Sent {formatRelativeTime(invite.createdAt)}</span>
                          <span className="mx-1">•</span>
                          <span>Expires {formatRelativeTime(invite.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvite(invite)}
                        icon={<ArrowPathIcon className="h-4 w-4" />}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelInvite(invite.id, invite.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        icon={<XMarkIcon className="h-4 w-4" />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
    </RouteGuard>
  );
}
