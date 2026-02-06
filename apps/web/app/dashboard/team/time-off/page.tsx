"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useTimeOffRequests } from '@/lib/hooks/schedule/useTimeOffRequests';
import { Button, Card, Badge, EmptyState, PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import TimeOffRequestModal from '@/components/team/TimeOffRequestModal';
import TimeOffApprovalCard from '@/components/team/TimeOffApprovalCard';
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  SunIcon,
  HeartIcon,
  BriefcaseIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { TimeOffRequest } from '@/types';

// =============================================================================
// Tab definitions
// =============================================================================

type Tab = 'my-requests' | 'team-requests' | 'calendar';

const TAB_LABELS: Record<Tab, string> = {
  'my-requests': 'My Requests',
  'team-requests': 'Team Requests',
  calendar: 'Calendar',
};

// =============================================================================
// Status helpers
// =============================================================================

const STATUS_BADGE_VARIANT: Record<TimeOffRequest['status'], 'warning' | 'success' | 'danger' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
  cancelled: 'default',
};

const STATUS_LABELS: Record<TimeOffRequest['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

const TYPE_LABELS: Record<TimeOffRequest['type'], string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  personal: 'Personal',
  bereavement: 'Bereavement',
  jury_duty: 'Jury Duty',
  other: 'Other',
};

const TYPE_BADGE_VARIANT: Record<TimeOffRequest['type'], 'primary' | 'warning' | 'info' | 'default'> = {
  vacation: 'primary',
  sick: 'warning',
  personal: 'info',
  bereavement: 'default',
  jury_duty: 'default',
  other: 'default',
};

// =============================================================================
// Calendar helpers
// =============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun

  const days: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d <= e;
}

// Color assignment for calendar chips
const CALENDAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-yellow-100 text-yellow-700',
];

function getUserColor(userId: string, colorMap: Map<string, string>): string {
  if (!colorMap.has(userId)) {
    colorMap.set(userId, CALENDAR_COLORS[colorMap.size % CALENDAR_COLORS.length]);
  }
  return colorMap.get(userId)!;
}

// =============================================================================
// Main page
// =============================================================================

export default function TimeOffPage() {
  const { profile } = useAuth();
  const {
    requests,
    loading,
    submitRequest,
    cancelRequest,
    approveRequest,
    denyRequest,
    getPendingRequests,
    getBalances,
  } = useTimeOffRequests();

  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';
  const userId = profile?.uid || '';
  const userName = profile?.displayName || profile?.email || '';

  const [activeTab, setActiveTab] = useState<Tab>('my-requests');
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const balances = useMemo(
    () => (userId ? getBalances(userId) : null),
    [userId, getBalances]
  );

  const myRequests = useMemo(
    () => requests.filter((r) => r.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [requests, userId]
  );

  const pendingRequests = useMemo(() => getPendingRequests(), [getPendingRequests]);

  const approvedRequests = useMemo(
    () => requests.filter((r) => r.status === 'approved'),
    [requests]
  );

  // Calendar data
  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const colorMap = useMemo(() => new Map<string, string>(), []);

  const calendarEventsForDay = useMemo(() => {
    return (day: Date) =>
      approvedRequests.filter((r) => isDateInRange(day, r.startDate, r.endDate));
  }, [approvedRequests]);

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  const tabs: Tab[] = isAdmin
    ? ['my-requests', 'team-requests', 'calendar']
    : ['my-requests', 'calendar'];

  // ---------------------------------------------------------------------------
  // Calendar navigation
  // ---------------------------------------------------------------------------

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Time Off"
        description="Request and manage paid time off"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Team', href: '/dashboard/team' },
          { label: 'Time Off' },
        ]}
        actions={
          <Button
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowRequestModal(true)}
          >
            Request Time Off
          </Button>
        }
      />

      {/* PTO Balance Cards */}
      {balances && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BalanceCard
            label="Vacation"
            icon={<SunIcon className="h-5 w-5 text-blue-500" />}
            used={balances.vacation.used}
            total={balances.vacation.accrued}
            unit="hrs"
            color="blue"
          />
          <BalanceCard
            label="Sick"
            icon={<HeartIcon className="h-5 w-5 text-orange-500" />}
            used={balances.sick.used}
            total={balances.sick.accrued}
            unit="hrs"
            color="orange"
          />
          <BalanceCard
            label="Personal"
            icon={<BriefcaseIcon className="h-5 w-5 text-purple-500" />}
            used={balances.personal.used}
            total={balances.personal.total}
            unit="hrs"
            color="purple"
          />
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px" aria-label="Time off tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {TAB_LABELS[tab]}
              {tab === 'team-requests' && pendingRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {activeTab === 'my-requests' && (
            <MyRequestsTab
              requests={myRequests}
              onCancel={cancelRequest}
            />
          )}

          {activeTab === 'team-requests' && isAdmin && (
            <TeamRequestsTab
              requests={pendingRequests}
              onApprove={approveRequest}
              onDeny={denyRequest}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab
              calendarDays={calendarDays}
              calYear={calYear}
              calMonth={calMonth}
              prevMonth={prevMonth}
              nextMonth={nextMonth}
              getEventsForDay={calendarEventsForDay}
              colorMap={colorMap}
            />
          )}
        </>
      )}

      {/* Request modal */}
      <TimeOffRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={submitRequest}
        userId={userId}
        userName={userName}
      />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function BalanceCard({
  label,
  icon,
  used,
  total,
  unit,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  used: number;
  total: number;
  unit: string;
  color: 'blue' | 'orange' | 'purple';
}) {
  const balance = Math.round((total - used) * 100) / 100;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  const barColors = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };

  const bgColors = {
    blue: 'bg-blue-50',
    orange: 'bg-orange-50',
    purple: 'bg-purple-50',
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', bgColors[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-900">
            {balance} <span className="text-sm font-normal text-gray-500">/ {total} {unit}</span>
          </p>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {used} {unit} used
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// My Requests
// ---------------------------------------------------------------------------

function MyRequestsTab({
  requests,
  onCancel,
}: {
  requests: TimeOffRequest[];
  onCancel: (id: string) => Promise<void>;
}) {
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await onCancel(id);
    } finally {
      setCancelling(null);
    }
  };

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDaysIcon className="h-12 w-12 text-gray-400" />}
        title="No time-off requests"
        description="You haven't submitted any time-off requests yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={TYPE_BADGE_VARIANT[req.type]} size="sm">
                  {TYPE_LABELS[req.type]}
                </Badge>
                <Badge variant={STATUS_BADGE_VARIANT[req.status]} size="sm" dot>
                  {STATUS_LABELS[req.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                <span>
                  {formatDate(req.startDate)}
                  {!isSameDay(req.startDate, req.endDate) && ` - ${formatDate(req.endDate)}`}
                  {req.halfDay && ` (${req.halfDay === 'morning' ? 'Morning' : 'Afternoon'})`}
                </span>
              </div>
              {req.reason && (
                <p className="text-sm text-gray-500">{req.reason}</p>
              )}
              {req.status === 'denied' && req.denialReason && (
                <p className="text-sm text-red-600">
                  <span className="font-medium">Denied:</span> {req.denialReason}
                </p>
              )}
            </div>
            {req.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                icon={<XMarkIcon className="h-4 w-4" />}
                onClick={() => handleCancel(req.id)}
                loading={cancelling === req.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start"
              >
                Cancel
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team Requests
// ---------------------------------------------------------------------------

function TeamRequestsTab({
  requests,
  onApprove,
  onDeny,
}: {
  requests: TimeOffRequest[];
  onApprove: (id: string) => Promise<void>;
  onDeny: (id: string, reason: string) => Promise<void>;
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon className="h-12 w-12 text-gray-400" />}
        title="No pending requests"
        description="There are no time-off requests waiting for approval."
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <TimeOffApprovalCard
          key={req.id}
          request={req}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

function CalendarTab({
  calendarDays,
  calYear,
  calMonth,
  prevMonth,
  nextMonth,
  getEventsForDay,
  colorMap,
}: {
  calendarDays: (Date | null)[];
  calYear: number;
  calMonth: number;
  prevMonth: () => void;
  nextMonth: () => void;
  getEventsForDay: (day: Date) => TimeOffRequest[];
  colorMap: Map<string, string>;
}) {
  const today = new Date();

  return (
    <Card padding="none">
      {/* Month header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {MONTH_NAMES[calMonth]} {calYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50" />;
          }

          const events = getEventsForDay(day);
          const isToday = isSameDay(day, today);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50 p-1',
                isWeekend && 'bg-gray-50/50'
              )}
            >
              <div
                className={cn(
                  'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  isToday
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-700'
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      'text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate font-medium',
                      getUserColor(ev.userId, colorMap)
                    )}
                    title={`${ev.userName} - ${TYPE_LABELS[ev.type]}`}
                  >
                    <span className="hidden sm:inline">{ev.userName.split(' ')[0]}</span>
                    <span className="sm:hidden">{(ev.userName.split(' ')[0] || '').slice(0, 3)}</span>
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-[10px] text-gray-400 px-1">
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-20 h-5 bg-gray-200 rounded-full" />
            <div className="w-16 h-5 bg-gray-200 rounded-full" />
          </div>
          <div className="mt-3 w-48 h-4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}
