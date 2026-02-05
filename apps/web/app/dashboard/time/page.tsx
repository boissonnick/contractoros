'use client';

import { useState, useMemo } from 'react';
import {
  ClockIcon,
  PlusIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import {
  TimeClockWidget,
  TimeEntryCard,
  TimeEntryFormModal,
  TimesheetSummary,
} from '@/components/timetracking';
import { useTimeEntries, useTeamTimeEntries } from '@/lib/hooks/useTimeEntries';
import { useAuth } from '@/lib/auth';
import { TimeEntry, TimeEntryStatus } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'timesheet' | 'list' | 'team';
type FilterStatus = 'all' | TimeEntryStatus;

export default function TimeTrackingPage() {
  const { profile: userProfile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('timesheet');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  // Calculate date range for queries
  const dateRange = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { startDate: currentWeekStart, endDate: weekEnd };
  }, [currentWeekStart]);

  // Fetch user's entries
  const {
    entries,
    loading,
    createManualEntry,
    deleteEntry,
    getWeeklySummary,
  } = useTimeEntries({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  // Fetch team entries (for managers)
  const {
    entries: teamEntries,
    loading: teamLoading,
    approveEntry: approveTeamEntry,
    rejectEntry: rejectTeamEntry,
  } = useTeamTimeEntries({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    status: ['pending_approval'],
  });

  // Get weekly summary
  const weeklySummary = useMemo(() => {
    if (loading) return null;
    return getWeeklySummary(currentWeekStart);
  }, [getWeeklySummary, currentWeekStart, loading]);

  // Check if user can approve (PM or Owner)
  const canApprove = userProfile?.role === 'OWNER' || userProfile?.role === 'PM';

  // Handle manual entry submission
  const handleCreateManualEntry = async (entryData: Omit<TimeEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'userRole' | 'type' | 'status' | 'createdAt' | 'updatedAt'>) => {
    await createManualEntry(entryData);
    setShowAddModal(false);
  };

  // Handle edit
  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = async (entryId: string) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      await deleteEntry(entryId);
    }
  };

  // Pending approvals count
  const pendingApprovalsCount = teamEntries.filter(e => e.status === 'pending_approval').length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Time Tracking"
          description="Track your work hours, breaks, and timesheets"
          actions={
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('timesheet')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'timesheet'
                      ? 'bg-brand-50 text-brand-primary border-brand-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CalendarDaysIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium border-t border-b ${
                    viewMode === 'list'
                      ? 'bg-brand-50 text-brand-primary border-brand-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                {canApprove && (
                  <button
                    onClick={() => setViewMode('team')}
                    className={`px-3 py-2 text-sm font-medium rounded-r-md border relative ${
                      viewMode === 'team'
                        ? 'bg-brand-50 text-brand-primary border-brand-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <UserGroupIcon className="h-5 w-5" />
                    {pendingApprovalsCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <Button onClick={() => setShowAddModal(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Entry
              </Button>
            </div>
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-gray-900">Time Tracking</h1>
        <p className="text-xs text-gray-500">Track hours and timesheets</p>
      </div>

      {/* Mobile View Tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {[
          { key: 'timesheet', label: 'Timesheet', icon: CalendarDaysIcon },
          { key: 'list', label: 'Entries', icon: ListBulletIcon },
          ...(canApprove ? [{ key: 'team', label: 'Approvals', icon: UserGroupIcon, badge: pendingApprovalsCount }] : []),
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setViewMode(key as ViewMode)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[40px]',
              viewMode === key
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge && badge > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                viewMode === key ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile Clock Widget - Hero Section */}
      <div className="md:hidden">
        <TimeClockWidget showProjectSelector />
      </div>

      {/* Desktop Main Content Grid */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Clock Widget */}
        <div className="lg:col-span-1">
          <TimeClockWidget showProjectSelector />
        </div>

        {/* Right Column - Content based on view mode */}
        <div className="lg:col-span-2">
          {viewMode === 'timesheet' && (
            <TimesheetSummary
              weeklySummary={weeklySummary}
              currentWeekStart={currentWeekStart}
              onWeekChange={setCurrentWeekStart}
              overtimeThreshold={40}
            />
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* Filters */}
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="rounded-md border-gray-300 text-sm focus:border-brand-primary focus:ring-brand-primary/20"
                  >
                    <option value="all">All Entries</option>
                    <option value="completed">Completed</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </Card>

              {/* Entry List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={<ClockIcon className="h-12 w-12" />}
                  title="No time entries"
                  description="Start tracking your time by clocking in or adding a manual entry."
                  action={{
                    label: 'Add Entry',
                    onClick: () => setShowAddModal(true),
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <TimeEntryCard
                      key={entry.id}
                      entry={entry}
                      showProject
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      canEdit={entry.status === 'completed' || entry.status === 'rejected'}
                      canDelete={entry.status !== 'approved' && entry.status !== 'active'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'team' && canApprove && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-gray-500" />
                  Team Time Entries - Pending Approval
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review and approve time entries from your team members
                </p>
              </Card>

              {teamLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : teamEntries.filter(e => e.status === 'pending_approval').length === 0 ? (
                <EmptyState
                  icon={<ClockIcon className="h-12 w-12" />}
                  title="No pending approvals"
                  description="All team time entries have been reviewed."
                />
              ) : (
                <div className="space-y-4">
                  {teamEntries
                    .filter(e => e.status === 'pending_approval')
                    .map((entry) => (
                      <TimeEntryCard
                        key={entry.id}
                        entry={entry}
                        showUser
                        showProject
                        canApprove
                        onApprove={approveTeamEntry}
                        onReject={rejectTeamEntry}
                        canEdit={false}
                        canDelete={false}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Content based on view mode */}
      <div className="md:hidden space-y-4">
        {viewMode === 'timesheet' && (
          <div className="space-y-4">
            {/* Mobile Week Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3">
              <button
                onClick={() => {
                  const prev = new Date(currentWeekStart);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeekStart(prev);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 active:bg-gray-100 rounded-lg"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                  {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {weeklySummary && (
                  <div className="text-xs text-gray-500">
                    {weeklySummary.totalHours.toFixed(1)} hrs total
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const next = new Date(currentWeekStart);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeekStart(next);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 active:bg-gray-100 rounded-lg"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Weekly Summary Cards */}
            {weeklySummary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-gray-900">{weeklySummary.totalHours.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Total Hours</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-gray-900">{weeklySummary.regularHours.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Regular Hours</div>
                </div>
                {weeklySummary.overtimeHours > 0 && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 col-span-2">
                    <div className="text-2xl font-bold text-amber-600">{weeklySummary.overtimeHours.toFixed(1)}</div>
                    <div className="text-xs text-amber-700">Overtime Hours</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Mobile Filters */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full min-h-[44px] rounded-xl border-gray-300 text-sm focus:border-brand-primary focus:ring-brand-primary/20"
            >
              <option value="all">All Entries</option>
              <option value="completed">Completed</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Mobile Entry List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-500 mb-4">No time entries</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 active:scale-95 transition-transform"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleEdit(entry)}
                    className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {entry.projectName || 'No Project'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {entry.clockIn?.toLocaleDateString?.('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) || 'No date'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {((entry.totalMinutes || 0) / 60).toFixed(1)}h
                        </div>
                        <Badge
                          variant={
                            entry.status === 'approved' ? 'success' :
                            entry.status === 'pending_approval' ? 'warning' :
                            entry.status === 'rejected' ? 'danger' : 'default'
                          }
                          className="mt-1"
                        >
                          {entry.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'team' && canApprove && (
          <div className="space-y-4">
            {teamLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : teamEntries.filter(e => e.status === 'pending_approval').length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamEntries
                  .filter(e => e.status === 'pending_approval')
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-yellow-50 rounded-xl border border-yellow-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{entry.userName}</div>
                          <div className="text-sm text-gray-600 truncate">{entry.projectName || 'No Project'}</div>
                          <div className="text-sm text-gray-500">
                            {entry.clockIn?.toLocaleDateString?.() || 'No date'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {((entry.totalMinutes || 0) / 60).toFixed(1)}h
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveTeamEntry(entry.id)}
                          className="flex-1 min-h-[44px] px-4 py-2 bg-green-600 text-white rounded-lg font-medium active:scale-95 transition-transform"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectTeamEntry(entry.id, 'Needs correction')}
                          className="flex-1 min-h-[44px] px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium active:scale-95 transition-transform"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <TimeEntryFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntry(null);
        }}
        onSubmit={handleCreateManualEntry}
        entry={editingEntry || undefined}
        mode={editingEntry ? 'edit' : 'create'}
      />

      {/* Mobile FAB for Add Entry */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="Add Time Entry"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
