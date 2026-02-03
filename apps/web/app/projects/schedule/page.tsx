'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Project, ProjectStatus, ProjectCategory } from '@/types';
import { PageHeader, Card, Button, Badge, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  differenceInDays,
  isToday,
  isSameMonth,
  addDays,
  isBefore,
  isAfter,
} from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

type ZoomLevel = 'day' | 'week' | 'month';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  lead: { label: 'Lead', color: 'text-gray-700', bgColor: 'bg-gray-200' },
  bidding: { label: 'Bidding', color: 'text-yellow-700', bgColor: 'bg-yellow-300' },
  planning: { label: 'Planning', color: 'text-blue-700', bgColor: 'bg-blue-300' },
  active: { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-400' },
  on_hold: { label: 'On Hold', color: 'text-orange-700', bgColor: 'bg-orange-300' },
  completed: { label: 'Completed', color: 'text-purple-700', bgColor: 'bg-purple-300' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-300' },
};

const categoryConfig: Record<ProjectCategory, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  renovation: 'Renovation',
  new_construction: 'New Construction',
  addition: 'Addition',
  repair: 'Repair',
  maintenance: 'Maintenance',
  other: 'Other',
};

export default function ProjectsSchedulePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [viewStartDate, setViewStartDate] = useState(() => startOfMonth(new Date()));
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('orgId', '==', profile.orgId)
      );
      const snapshot = await getDocs(q);
      const projectsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.(),
          startDate: data.startDate?.toDate?.(),
          estimatedEndDate: data.estimatedEndDate?.toDate?.(),
          actualEndDate: data.actualEndDate?.toDate?.(),
          archivedAt: data.archivedAt?.toDate?.(),
        } as Project;
      });
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId]);

  useEffect(() => {
    if (profile?.orgId) {
      fetchProjects();
    }
  }, [profile?.orgId, fetchProjects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Skip archived projects
      if (project.isArchived) return false;

      // Must have at least a start date to show on timeline
      if (!project.startDate) return false;

      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && project.category !== categoryFilter) return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(search) ||
          project.address.city.toLowerCase().includes(search) ||
          project.address.street.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchTerm]);

  // Calculate visible date range based on zoom level
  const { columns, columnWidth, viewEndDate } = useMemo(() => {
    let cols: { date: Date; label: string; isToday: boolean; isCurrentMonth: boolean }[] = [];
    let width: number;

    if (zoom === 'day') {
      // Show 14 days
      const days = eachDayOfInterval({
        start: viewStartDate,
        end: addDays(viewStartDate, 13),
      });
      cols = days.map((date) => ({
        date,
        label: format(date, 'd'),
        isToday: isToday(date),
        isCurrentMonth: isSameMonth(date, viewStartDate),
      }));
      width = 60;
    } else if (zoom === 'week') {
      // Show 8 weeks
      const weeks = eachWeekOfInterval(
        {
          start: viewStartDate,
          end: addDays(viewStartDate, 55),
        },
        { weekStartsOn: 0 }
      );
      cols = weeks.map((weekStart) => ({
        date: weekStart,
        label: format(weekStart, 'MMM d'),
        isToday: isToday(weekStart),
        isCurrentMonth: isSameMonth(weekStart, viewStartDate),
      }));
      width = 100;
    } else {
      // Month view - show 6 months
      const months: Date[] = [];
      for (let i = 0; i < 6; i++) {
        months.push(addMonths(viewStartDate, i));
      }
      cols = months.map((month) => ({
        date: month,
        label: format(month, 'MMM yyyy'),
        isToday: isSameMonth(month, new Date()),
        isCurrentMonth: isSameMonth(month, new Date()),
      }));
      width = 150;
    }

    return {
      columns: cols,
      columnWidth: width,
      viewEndDate: cols[cols.length - 1]?.date || viewStartDate,
    };
  }, [viewStartDate, zoom]);

  // Calculate position and width of project bars
  const getProjectBarStyle = (project: Project) => {
    const projectStart = project.startDate!;
    const projectEnd = project.estimatedEndDate || project.actualEndDate || addDays(projectStart, 30);

    // Calculate total visible days
    const totalVisibleDays = differenceInDays(viewEndDate, viewStartDate) + 1;

    // Calculate project position relative to view
    const daysFromStart = Math.max(0, differenceInDays(projectStart, viewStartDate));
    const projectDuration = Math.max(1, differenceInDays(projectEnd, projectStart) + 1);

    // Calculate if project extends beyond view
    const visibleStart = isBefore(projectStart, viewStartDate) ? viewStartDate : projectStart;
    const visibleEnd = isAfter(projectEnd, viewEndDate) ? viewEndDate : projectEnd;
    const visibleDays = Math.max(1, differenceInDays(visibleEnd, visibleStart) + 1);

    // Convert to percentage
    const left = (differenceInDays(visibleStart, viewStartDate) / totalVisibleDays) * 100;
    const width = (visibleDays / totalVisibleDays) * 100;

    // Check if project is visible in current view
    const isVisible = isBefore(projectStart, viewEndDate) && isAfter(projectEnd, viewStartDate);

    return {
      left: `${left}%`,
      width: `${width}%`,
      isVisible,
      startsBeforeView: isBefore(projectStart, viewStartDate),
      endsAfterView: isAfter(projectEnd, viewEndDate),
    };
  };

  // Calculate today indicator position
  const getTodayPosition = () => {
    const today = new Date();
    if (isBefore(today, viewStartDate) || isAfter(today, viewEndDate)) {
      return null;
    }
    const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1;
    const daysFromStart = differenceInDays(today, viewStartDate);
    return `${(daysFromStart / totalDays) * 100}%`;
  };

  const todayPosition = getTodayPosition();

  // Navigation
  const navigateTimeline = (direction: 'prev' | 'next') => {
    const amount = zoom === 'day' ? 7 : zoom === 'week' ? 28 : 1;
    if (direction === 'prev') {
      setViewStartDate((d) => (zoom === 'month' ? subMonths(d, 1) : addDays(d, -amount)));
    } else {
      setViewStartDate((d) => (zoom === 'month' ? addMonths(d, 1) : addDays(d, amount)));
    }
  };

  const goToToday = () => {
    setViewStartDate(startOfMonth(new Date()));
  };

  // Stats for projects without dates
  const projectsWithoutDates = projects.filter((p) => !p.isArchived && !p.startDate).length;

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        title="Project Schedule"
        description={`Timeline view of ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Schedule' },
        ]}
      />

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProjectCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateTimeline('prev')}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTimeline('next')}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden ml-2">
            {(['day', 'week', 'month'] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={cn(
                  'px-3 py-1.5 text-sm capitalize transition-colors',
                  zoom === level
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner for projects without dates */}
      {projectsWithoutDates > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <CalendarIcon className="h-5 w-5 text-amber-600" />
          <span>
            {projectsWithoutDates} project{projectsWithoutDates !== 1 ? 's' : ''} without dates not shown.
          </span>
        </div>
      )}

      {/* Timeline */}
      {filteredProjects.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Timeline Header */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {/* Project Name Column */}
                <div className="w-64 min-w-[256px] p-3 font-medium text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                  Project
                </div>
                {/* Date Columns */}
                <div className="flex-1 flex">
                  {columns.map((col, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-shrink-0 p-2 text-center text-sm font-medium border-r border-gray-100 last:border-r-0',
                        col.isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                      )}
                      style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Rows */}
              <div className="relative">
                {/* Today indicator line */}
                {todayPosition && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                    style={{ left: `calc(256px + (100% - 256px) * ${parseFloat(todayPosition) / 100})` }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                )}

                {filteredProjects.map((project) => {
                  const barStyle = getProjectBarStyle(project);
                  if (!barStyle.isVisible) return null;

                  return (
                    <div
                      key={project.id}
                      className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Project Info */}
                      <div
                        className="w-64 min-w-[256px] p-3 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 z-10 cursor-pointer"
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                      >
                        <div className="font-medium text-gray-900 truncate text-sm">
                          {project.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={cn(
                              'text-xs',
                              statusConfig[project.status].bgColor,
                              statusConfig[project.status].color
                            )}
                          >
                            {statusConfig[project.status].label}
                          </Badge>
                          <span className="text-xs text-gray-500 truncate">
                            {project.address.city}
                          </span>
                        </div>
                      </div>

                      {/* Timeline Bar Area */}
                      <div className="flex-1 relative h-16">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {columns.map((col, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex-shrink-0 border-r border-gray-100 last:border-r-0',
                                col.isToday && 'bg-blue-50/30'
                              )}
                              style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                            />
                          ))}
                        </div>

                        {/* Project Bar */}
                        <div
                          className={cn(
                            'absolute top-3 h-10 rounded-md cursor-pointer transition-all hover:scale-y-110 hover:shadow-md group/bar',
                            statusConfig[project.status].bgColor,
                            barStyle.startsBeforeView && 'rounded-l-none',
                            barStyle.endsAfterView && 'rounded-r-none'
                          )}
                          style={{
                            left: barStyle.left,
                            width: barStyle.width,
                            minWidth: '24px',
                          }}
                          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                        >
                          <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                            <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                              {project.name}
                            </span>
                          </div>

                          {/* Tooltip on hover */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/bar:block z-30">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-gray-300 mt-1">
                                {project.startDate && format(project.startDate, 'MMM d, yyyy')}
                                {project.estimatedEndDate && (
                                  <>
                                    {' - '}
                                    {format(project.estimatedEndDate, 'MMM d, yyyy')}
                                  </>
                                )}
                              </div>
                              {project.budget && (
                                <div className="text-gray-300">
                                  Budget: ${project.budget.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<CalendarDaysIcon className="h-full w-full" />}
          title="No projects to display"
          description={
            projects.length === 0
              ? 'Create your first project to see it on the timeline.'
              : 'No projects match your current filters, or projects are missing start dates.'
          }
          action={
            projects.length === 0
              ? {
                  label: 'New Project',
                  onClick: () => router.push('/dashboard/projects/new'),
                }
              : undefined
          }
        />
      )}

      {/* Legend */}
      {filteredProjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 font-medium">Status Legend:</span>
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('w-4 h-4 rounded', config.bgColor)} />
              <span className="text-gray-600">{config.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-4">
            <div className="w-0.5 h-4 bg-red-500 rounded" />
            <span className="text-gray-600">Today</span>
          </div>
        </div>
      )}
    </div>
  );
}
