'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, Button, Avatar, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Project, ProjectStatus, UserProfile, UserRole, ScheduleEvent } from '@/types';
import { useScheduleEvents } from '@/lib/hooks/useSchedule';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

// Team roles that we consider "crew" (excludes SUB and CLIENT)
const CREW_ROLES: UserRole[] = ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR'];

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-700' },
  bidding: { label: 'Bidding', color: 'bg-yellow-100 text-yellow-700' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
  PM: { label: 'PM', color: 'bg-blue-100 text-blue-700' },
  EMPLOYEE: { label: 'Employee', color: 'bg-green-100 text-green-700' },
  CONTRACTOR: { label: 'Contractor', color: 'bg-orange-100 text-orange-700' },
  SUB: { label: 'Sub', color: 'bg-yellow-100 text-yellow-700' },
  CLIENT: { label: 'Client', color: 'bg-gray-100 text-gray-700' },
};

type TimeRange = 'this_week' | 'next_week' | 'this_month';

export default function ProjectsCrewPage() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('this_week');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'active' | 'all'>('active');

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
      },
      next_week: {
        start: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
        end: new Date(startOfWeek.getTime() + 13 * 24 * 60 * 60 * 1000),
      },
      this_month: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      },
    };
    return ranges[selectedTimeRange];
  }, [selectedTimeRange]);

  // Fetch schedule events for selected time range
  const { events: scheduleEvents, loading: eventsLoading } = useScheduleEvents({
    startDate: dateRanges.start,
    endDate: dateRanges.end,
  });

  // Load team members and projects
  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load team members (only internal team roles)
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
        // Deduplicate and filter to crew roles only
        const uniqueMembers = Array.from(
          new Map(membersData.map(m => [m.uid, m])).values()
        ).filter(m => CREW_ROLES.includes(m.role as UserRole));
        setMembers(uniqueMembers);

        // Load projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId)
        );
        const projectsSnap = await getDocs(projectsQuery);
        const projectsData = projectsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.(),
            startDate: data.startDate?.toDate?.(),
            estimatedEndDate: data.estimatedEndDate?.toDate?.(),
          } as Project;
        });
        setProjects(projectsData);
      } catch (error) {
        logger.error('Error loading data', { error: error, page: 'projects-crew' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.orgId]);

  // Filter projects based on status filter
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (projectStatusFilter === 'active') {
      filtered = filtered.filter(p =>
        p.status === 'active' || p.status === 'planning'
      );
    }

    // Don't show archived projects
    filtered = filtered.filter(p => !p.isArchived);

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, projectStatusFilter]);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    return members.filter(m =>
      m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  // Calculate crew assignments - which members are assigned to which projects
  const getCrewAssignments = (memberId: string, projectId: string): {
    isAssigned: boolean;
    hours: number;
    events: ScheduleEvent[];
  } => {
    const memberEvents = scheduleEvents.filter(
      event =>
        event.assignedUserIds?.includes(memberId) &&
        event.projectId === projectId
    );

    let totalHours = 0;
    memberEvents.forEach(event => {
      if (event.estimatedHours) {
        totalHours += event.estimatedHours;
      } else if (!event.allDay && event.startDate && event.endDate) {
        const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
        const end = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
        totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      } else if (event.allDay) {
        totalHours += 8;
      }
    });

    return {
      isAssigned: memberEvents.length > 0,
      hours: Math.round(totalHours * 10) / 10,
      events: memberEvents,
    };
  };

  // Calculate total hours per member across all projects
  const getMemberTotalHours = (memberId: string): number => {
    let total = 0;
    filteredProjects.forEach(project => {
      total += getCrewAssignments(memberId, project.id).hours;
    });
    return Math.round(total * 10) / 10;
  };

  // Calculate total hours per project
  const getProjectTotalHours = (projectId: string): number => {
    let total = 0;
    filteredMembers.forEach(member => {
      total += getCrewAssignments(member.uid, projectId).hours;
    });
    return Math.round(total * 10) / 10;
  };

  // Find members with no assignments (availability gap)
  const unassignedMembers = filteredMembers.filter(m => getMemberTotalHours(m.uid) === 0);

  // Find projects with no crew assigned
  const unstaffedProjects = filteredProjects.filter(p => getProjectTotalHours(p.id) === 0);

  const timeRangeLabels: Record<TimeRange, string> = {
    this_week: 'This Week',
    next_week: 'Next Week',
    this_month: 'This Month',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (members.length === 0 || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Crew Assignments"
            description="View team member assignments across projects"
          />
          <div className="mt-8">
            <EmptyState
              icon={<UserGroupIcon className="h-full w-full" />}
              title={members.length === 0 ? "No team members" : "No projects"}
              description={
                members.length === 0
                  ? "Add team members to view crew assignments"
                  : "Create projects to assign crew members"
              }
              action={{
                label: members.length === 0 ? "Add Team Member" : "Create Project",
                href: members.length === 0 ? "/dashboard/team/invite" : "/dashboard/projects/new",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Crew Assignments"
          description="View team member assignments across projects"
          actions={
            <Link href="/dashboard/schedule">
              <Button variant="primary" icon={<CalendarDaysIcon className="h-5 w-5" />}>
                View Schedule
              </Button>
            </Link>
          }
        />

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="this_week">This Week</option>
              <option value="next_week">Next Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* Project Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value as 'active' | 'all')}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="active">Active Projects</option>
              <option value="all">All Projects</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-brand-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{filteredMembers.length}</p>
                <p className="text-xs text-gray-500">Team Members</p>
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BuildingOffice2Icon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{filteredProjects.length}</p>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
            </div>
          </Card>
          <Card className={cn(
            "border-l-4",
            unassignedMembers.length > 0 ? "border-l-yellow-500" : "border-l-green-500"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                unassignedMembers.length > 0 ? "bg-yellow-50" : "bg-green-50"
              )}>
                {unassignedMembers.length > 0 ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  unassignedMembers.length > 0 ? "text-yellow-600" : "text-green-600"
                )}>
                  {unassignedMembers.length}
                </p>
                <p className="text-xs text-gray-500">Unassigned Crew</p>
              </div>
            </div>
          </Card>
          <Card className={cn(
            "border-l-4",
            unstaffedProjects.length > 0 ? "border-l-red-500" : "border-l-green-500"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                unstaffedProjects.length > 0 ? "bg-red-50" : "bg-green-50"
              )}>
                {unstaffedProjects.length > 0 ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  unstaffedProjects.length > 0 ? "text-red-600" : "text-green-600"
                )}>
                  {unstaffedProjects.length}
                </p>
                <p className="text-xs text-gray-500">Unstaffed Projects</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Loading indicator for events */}
        {eventsLoading && (
          <div className="mt-4 flex items-center justify-center py-2">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-gray-500">Loading schedule data...</span>
          </div>
        )}

        {/* Assignment Grid */}
        <Card className="mt-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold tracking-tight text-gray-900">
              Crew vs Project Matrix ({timeRangeLabels[selectedTimeRange]})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Hours scheduled per crew member for each project
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[200px] sticky left-0 bg-gray-50 z-10">
                    Crew Member
                  </th>
                  {filteredProjects.map(project => (
                    <th
                      key={project.id}
                      className="text-center py-3 px-2 text-xs font-medium text-gray-700 min-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="truncate max-w-[110px]" title={project.name}>
                          {project.name}
                        </span>
                        <span className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                          statusConfig[project.status]?.color || 'bg-gray-100 text-gray-700'
                        )}>
                          {statusConfig[project.status]?.label || project.status}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[80px] bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, idx) => {
                  const totalHours = getMemberTotalHours(member.uid);
                  return (
                    <tr
                      key={member.uid}
                      className={cn(
                        "border-b border-gray-50 hover:bg-gray-50",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      <td className={cn(
                        "py-3 px-4 sticky left-0 z-10",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}>
                        <div className="flex items-center gap-3">
                          <Avatar name={member.displayName || ''} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
                              {member.displayName}
                            </p>
                            <span className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                              roleLabels[member.role || 'EMPLOYEE'].color
                            )}>
                              {roleLabels[member.role || 'EMPLOYEE'].label}
                            </span>
                          </div>
                        </div>
                      </td>
                      {filteredProjects.map(project => {
                        const assignment = getCrewAssignments(member.uid, project.id);
                        return (
                          <td
                            key={project.id}
                            className="text-center py-3 px-2"
                          >
                            {assignment.isAssigned ? (
                              <Link
                                href={`/dashboard/schedule?userId=${member.uid}&projectId=${project.id}`}
                                className="inline-flex items-center justify-center"
                              >
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium cursor-pointer hover:ring-2 hover:ring-brand-primary/30 transition-all",
                                    assignment.hours >= 20 ? "bg-green-100 text-green-700" :
                                    assignment.hours >= 8 ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-700"
                                  )}
                                  title={`${assignment.events.length} scheduled event(s)`}
                                >
                                  {assignment.hours}h
                                </span>
                              </Link>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center py-3 px-4 bg-blue-50/50">
                        <span className={cn(
                          "font-semibold text-sm",
                          totalHours === 0 ? "text-yellow-600" :
                          totalHours >= 40 ? "text-green-600" :
                          "text-gray-700"
                        )}>
                          {totalHours}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Project totals row */}
                <tr className="bg-blue-50/50 border-t-2 border-blue-100">
                  <td className="py-3 px-4 sticky left-0 z-10 bg-blue-50/80">
                    <span className="font-semibold text-gray-700 text-sm">Project Totals</span>
                  </td>
                  {filteredProjects.map(project => {
                    const totalHours = getProjectTotalHours(project.id);
                    return (
                      <td key={project.id} className="text-center py-3 px-2">
                        <span className={cn(
                          "font-semibold text-sm",
                          totalHours === 0 ? "text-red-600" : "text-gray-700"
                        )}>
                          {totalHours}h
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center py-3 px-4 bg-blue-100/50">
                    <span className="font-bold text-gray-900">
                      {Math.round(filteredMembers.reduce((sum, m) => sum + getMemberTotalHours(m.uid), 0) * 10) / 10}h
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Availability Gaps Section */}
        {(unassignedMembers.length > 0 || unstaffedProjects.length > 0) && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unassigned Crew */}
            {unassignedMembers.length > 0 && (
              <Card>
                <div className="px-4 py-3 border-b border-gray-100 bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Unassigned Crew ({unassignedMembers.length})
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Team members with no scheduled work for {timeRangeLabels[selectedTimeRange].toLowerCase()}
                  </p>
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {unassignedMembers.map(member => (
                    <div
                      key={member.uid}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={member.displayName || ''} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{member.displayName}</p>
                          <span className={cn(
                            'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                            roleLabels[member.role || 'EMPLOYEE'].color
                          )}>
                            {roleLabels[member.role || 'EMPLOYEE'].label}
                          </span>
                        </div>
                      </div>
                      <Link href={`/dashboard/schedule?assignUser=${member.uid}`}>
                        <Button variant="outline" size="sm" icon={<ArrowRightIcon className="h-3.5 w-3.5" />}>
                          Assign
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Unstaffed Projects */}
            {unstaffedProjects.length > 0 && (
              <Card>
                <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Unstaffed Projects ({unstaffedProjects.length})
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Projects with no crew scheduled for {timeRangeLabels[selectedTimeRange].toLowerCase()}
                  </p>
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {unstaffedProjects.map(project => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                        <span className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5',
                          statusConfig[project.status]?.color || 'bg-gray-100 text-gray-700'
                        )}>
                          {statusConfig[project.status]?.label || project.status}
                        </span>
                      </div>
                      <Link href={`/dashboard/schedule?projectId=${project.id}`}>
                        <Button variant="outline" size="sm" icon={<ArrowRightIcon className="h-3.5 w-3.5" />}>
                          Schedule
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Click on hours in the grid to view schedule details. Use the{' '}
            <Link href="/dashboard/schedule" className="text-brand-600 hover:underline">
              Schedule
            </Link>{' '}
            page to create new assignments.
          </p>
        </div>
      </div>
    </div>
  );
}
