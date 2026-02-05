'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useTeamTimeEntries } from '@/lib/hooks/useTimeEntries';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsGrid } from '@/components/ui/StatsGrid';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import {
  ClockIcon,
  CurrencyDollarIcon,
  FolderIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, addWeeks, subMonths, addMonths } from 'date-fns';
import Link from 'next/link';
import { TimeEntryWithSyncStatus } from '@/lib/hooks/useTimeEntries';

type DateRangePreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

interface ProjectTimeSummary {
  projectId: string;
  projectName: string;
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  totalCost: number;
  userBreakdown: {
    userId: string;
    userName: string;
    minutes: number;
    cost: number;
  }[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return hours.toFixed(1);
}

function groupByProject(entries: TimeEntryWithSyncStatus[]): ProjectTimeSummary[] {
  const projectMap = new Map<string, ProjectTimeSummary>();

  for (const entry of entries) {
    const projectId = entry.projectId || 'unassigned';
    const projectName = entry.projectName || 'Unassigned';
    const minutes = entry.totalMinutes || 0;
    const hourlyRate = entry.hourlyRate || 0;
    const cost = (minutes / 60) * hourlyRate;

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        projectId,
        projectName,
        totalMinutes: 0,
        totalHours: 0,
        entryCount: 0,
        totalCost: 0,
        userBreakdown: [],
      });
    }

    const project = projectMap.get(projectId)!;
    project.totalMinutes += minutes;
    project.totalHours = project.totalMinutes / 60;
    project.entryCount += 1;
    project.totalCost += cost;

    // Track user breakdown
    const existingUser = project.userBreakdown.find(u => u.userId === entry.userId);
    if (existingUser) {
      existingUser.minutes += minutes;
      existingUser.cost += cost;
    } else {
      project.userBreakdown.push({
        userId: entry.userId,
        userName: entry.userName,
        minutes,
        cost,
      });
    }
  }

  return Array.from(projectMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
}

export default function ProjectsTimePage() {
  useAuth();
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_week');
  const [customDateRange, setCustomDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const [selectedCrewMember, setSelectedCrewMember] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case 'this_week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'last_week':
        const lastWeek = subWeeks(now, 1);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      case 'this_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      case 'custom':
        return customDateRange;
      default:
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
  }, [datePreset, customDateRange]);

  // Navigation for custom date ranges
  const navigateRange = (direction: 'prev' | 'next') => {
    if (datePreset === 'this_week' || datePreset === 'last_week') {
      setCustomDateRange(() => ({
        start: direction === 'prev' ? subWeeks(dateRange.start, 1) : addWeeks(dateRange.start, 1),
        end: direction === 'prev' ? subWeeks(dateRange.end, 1) : addWeeks(dateRange.end, 1),
      }));
      setDatePreset('custom');
    } else if (datePreset === 'this_month' || datePreset === 'last_month') {
      setCustomDateRange(() => ({
        start: direction === 'prev' ? startOfMonth(subMonths(dateRange.start, 1)) : startOfMonth(addMonths(dateRange.start, 1)),
        end: direction === 'prev' ? endOfMonth(subMonths(dateRange.start, 1)) : endOfMonth(addMonths(dateRange.start, 1)),
      }));
      setDatePreset('custom');
    }
  };

  // Fetch all time entries for the date range
  const { entries, loading, error } = useTeamTimeEntries({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Fetch projects for linking
  const { data: _projects } = useProjects();

  // Get unique crew members for filter
  const crewMembers = useMemo(() => {
    const uniqueUsers = new Map<string, string>();
    entries.forEach(entry => {
      if (!uniqueUsers.has(entry.userId)) {
        uniqueUsers.set(entry.userId, entry.userName);
      }
    });
    return Array.from(uniqueUsers, ([id, name]) => ({ id, name }));
  }, [entries]);

  // Filter entries by crew member
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (selectedCrewMember !== 'all') {
      filtered = filtered.filter(e => e.userId === selectedCrewMember);
    }
    return filtered;
  }, [entries, selectedCrewMember]);

  // Group entries by project
  const projectSummaries = useMemo(() => {
    let summaries = groupByProject(filteredEntries);

    // Filter by search query
    if (searchQuery) {
      summaries = summaries.filter(s =>
        s.projectName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return summaries;
  }, [filteredEntries, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalMinutes = projectSummaries.reduce((sum, p) => sum + p.totalMinutes, 0);
    const totalCost = projectSummaries.reduce((sum, p) => sum + p.totalCost, 0);
    const totalEntries = projectSummaries.reduce((sum, p) => sum + p.entryCount, 0);
    const projectCount = projectSummaries.filter(p => p.projectId !== 'unassigned').length;

    return {
      totalHours: totalMinutes / 60,
      totalCost,
      totalEntries,
      projectCount,
    };
  }, [projectSummaries]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Time by Project"
          description="Time tracking summary across all projects"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Time by Project"
          description="Time tracking summary across all projects"
        />
        <Card className="p-8">
          <div className="text-center text-red-600">
            <p>Error loading time entries: {error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time by Project"
        description="Time tracking summary across all projects"
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Time Summary' },
        ]}
      />

      {/* Filters Section */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Date Range Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateRange('prev')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center min-w-[180px]">
              <div className="text-sm font-medium text-gray-900">
                {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
              </div>
            </div>
            <button
              onClick={() => navigateRange('next')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Next period"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Date Preset Select */}
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              {datePreset === 'custom' && <option value="custom">Custom Range</option>}
            </select>
          </div>

          {/* Crew Member Filter */}
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCrewMember}
              onChange={(e) => setSelectedCrewMember(e.target.value)}
              className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Crew Members</option>
              {crewMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <StatsGrid
        stats={[
          {
            label: 'Total Hours',
            value: totals.totalHours.toFixed(1),
            icon: ClockIcon,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            description: `${totals.totalEntries} entries`,
          },
          {
            label: 'Total Cost',
            value: formatCurrency(totals.totalCost),
            icon: CurrencyDollarIcon,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            description: 'Based on hourly rates',
          },
          {
            label: 'Projects',
            value: totals.projectCount,
            icon: FolderIcon,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            description: 'With time tracked',
          },
          {
            label: 'Crew Members',
            value: crewMembers.length,
            icon: UserGroupIcon,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            description: 'Active in period',
          },
        ]}
        columns={4}
      />

      {/* Project Breakdown Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Project Breakdown</h3>
          <p className="text-sm text-gray-500">Time and costs grouped by project</p>
        </div>

        {projectSummaries.length === 0 ? (
          <EmptyState
            icon={<ClockIcon className="h-12 w-12" />}
            title="No time entries found"
            description="No time has been tracked for the selected period and filters."
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectSummaries.map((project) => {
                  const percentOfTotal = totals.totalHours > 0
                    ? ((project.totalHours / totals.totalHours) * 100).toFixed(1)
                    : '0';
                  const isExpanded = expandedProject === project.projectId;

                  return (
                    <>
                      <tr
                        key={project.projectId}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedProject(isExpanded ? null : project.projectId)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                              <FolderIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {project.projectId !== 'unassigned' ? (
                                  <Link
                                    href={`/dashboard/projects/${project.projectId}`}
                                    className="hover:text-blue-600 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {project.projectName}
                                  </Link>
                                ) : (
                                  <span className="text-gray-500">{project.projectName}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {project.userBreakdown.length} crew member{project.userBreakdown.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatHours(project.totalMinutes)}h
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">{project.entryCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(project.totalCost)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(parseFloat(percentOfTotal), 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 min-w-[40px]">
                              {percentOfTotal}%
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded crew member breakdown */}
                      {isExpanded && project.userBreakdown.length > 0 && (
                        <tr key={`${project.projectId}-breakdown`}>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="ml-14 space-y-2">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Crew Member Breakdown
                              </div>
                              {project.userBreakdown
                                .sort((a, b) => b.minutes - a.minutes)
                                .map(user => (
                                  <div
                                    key={user.userId}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-600">
                                          {user.userName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </span>
                                      </div>
                                      <span className="text-sm text-gray-900">{user.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                      <span className="text-gray-600">
                                        {formatHours(user.minutes)}h
                                      </span>
                                      <span className="text-gray-900 font-medium min-w-[80px] text-right">
                                        {formatCurrency(user.cost)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {/* Totals row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Total</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{totals.totalHours.toFixed(1)}h</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{totals.totalEntries}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{formatCurrency(totals.totalCost)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">100%</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Mobile View - Cards instead of table */}
      <div className="md:hidden space-y-4">
        {projectSummaries.map((project) => {
          const percentOfTotal = totals.totalHours > 0
            ? ((project.totalHours / totals.totalHours) * 100).toFixed(1)
            : '0';

          return (
            <Card
              key={project.projectId}
              className="p-4"
              onClick={() => setExpandedProject(
                expandedProject === project.projectId ? null : project.projectId
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FolderIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{project.projectName}</div>
                    <div className="text-xs text-gray-500">
                      {project.userBreakdown.length} crew members
                    </div>
                  </div>
                </div>
                <Badge variant="default">{percentOfTotal}%</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatHours(project.totalMinutes)}h
                  </div>
                  <div className="text-xs text-gray-500">Hours</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {project.entryCount}
                  </div>
                  <div className="text-xs text-gray-500">Entries</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(project.totalCost)}
                  </div>
                  <div className="text-xs text-gray-500">Cost</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(percentOfTotal), 100)}%` }}
                  />
                </div>
              </div>

              {/* Expanded crew breakdown */}
              {expandedProject === project.projectId && project.userBreakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase">Crew Breakdown</div>
                  {project.userBreakdown
                    .sort((a, b) => b.minutes - a.minutes)
                    .map(user => (
                      <div key={user.userId} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">{user.userName}</span>
                        <div className="flex gap-3 text-sm">
                          <span className="text-gray-500">{formatHours(user.minutes)}h</span>
                          <span className="font-medium text-gray-900">{formatCurrency(user.cost)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
