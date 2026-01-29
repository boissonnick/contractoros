'use client';

import { useState, useMemo } from 'react';
import {
  ClockIcon,
  PlusIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import {
  TimeClockWidget,
  TimeEntryCard,
  TimeEntryFormModal,
  TimesheetSummary,
} from '@/components/timetracking';
import { useTimeEntries, useTeamTimeEntries } from '@/lib/hooks/useTimeEntries';
import { useAuth } from '@/lib/auth';
import { TimeEntry, TimeEntryStatus } from '@/types';

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
    error,
    createManualEntry,
    updateEntry,
    deleteEntry,
    approveEntry,
    rejectEntry,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your work hours, breaks, and timesheets
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('timesheet')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'timesheet'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CalendarDaysIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
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
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
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
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
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
    </div>
  );
}
