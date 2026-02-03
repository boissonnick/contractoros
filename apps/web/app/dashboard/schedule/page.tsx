"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useScheduleEvents, useCrewAvailability, useTimeOffRequests } from '@/lib/hooks/useSchedule';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile, Project, ScheduleEvent } from '@/types';
import {
  EventCard,
  EventFormModal,
  CrewAvailabilityPanel,
  WeatherWidget,
  ConflictAlert,
  DayView,
  AssignmentModal,
} from '@/components/schedule';
import { getWeatherForecast, WeatherData } from '@/lib/services/weather';
import { Card, Button, Badge, PageHeader } from '@/components/ui';
import { SkeletonSchedule } from '@/components/ui/Skeleton';
import BaseModal from '@/components/ui/BaseModal';
import {
  PlusIcon,
  CalendarDaysIcon,
  UsersIcon,
  CloudIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type View = 'day' | 'week' | 'month' | 'timeline';
type Tab = 'calendar' | 'crew' | 'time-off';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SchedulePage() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [tab, setTab] = useState<Tab>('calendar');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');

  // Mobile-specific state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const mobileDateScrollRef = useRef<HTMLDivElement>(null);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [eventToAssign, setEventToAssign] = useState<ScheduleEvent | null>(null);

  // Hooks
  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
    checkConflicts,
  } = useScheduleEvents();

  const {
    availability,
    loading: availLoading,
    setAvailability,
  } = useCrewAvailability();

  const {
    requests: timeOffRequests,
    loading: timeOffLoading,
    submitRequest,
    approveRequest,
    denyRequest,
  } = useTimeOffRequests();

  // Team and projects
  const [team, setTeam] = useState<{ id: string; name: string; role?: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; phases?: { id: string; name: string }[] }[]>([]);

  // Fetch weather data
  useEffect(() => {
    // Default to San Francisco coordinates (can be updated based on project location)
    getWeatherForecast(37.7749, -122.4194, 7).then(setWeatherData);
  }, []);

  useEffect(() => {
    if (!profile?.orgId) return;

    // Fetch team members
    getDocs(query(collection(db, 'users'), where('orgId', '==', profile.orgId))).then((snap) => {
      setTeam(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.displayName || data.email || 'Unknown',
            role: data.role,
          };
        })
      );
    });

    // Fetch projects with phases
    getDocs(query(collection(db, 'projects'), where('orgId', '==', profile.orgId))).then((snap) => {
      setProjects(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Unnamed Project',
          phases: d.data().phases || [],
        }))
      );
    });
  }, [profile?.orgId]);

  // Date helpers
  const getWeekDates = useCallback((date: Date) => {
    const dates: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const weekDates = getWeekDates(selectedDate);

  // Mobile date range - get 2 weeks of dates for horizontal scroll
  const getMobileDateRange = useCallback(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 7 days ago to 14 days ahead
    const start = new Date(today);
    start.setDate(start.getDate() - 7);

    for (let i = 0; i < 21; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const mobileDates = getMobileDateRange();

  // Scroll to selected date on mount
  useEffect(() => {
    if (mobileDateScrollRef.current) {
      const todayIndex = 7; // Today is at index 7 (7 days from start)
      const scrollAmount = todayIndex * 60 - 100; // 60px per date item, center it
      mobileDateScrollRef.current.scrollLeft = scrollAmount;
    }
  }, []);

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(selectedDate);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  // Header text
  const getHeaderText = () => {
    if (view === 'day') {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (view === 'week') {
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filterType && event.type !== filterType) return false;
    if (filterProject && event.projectId !== filterProject) return false;
    return true;
  });

  // Get events for a date
  const getEventsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return filteredEvents.filter(
      (e) => e.startDate <= endOfDay && e.endDate >= startOfDay
    );
  };

  // Event handlers
  const handleCreateEvent = async (data: any) => {
    await createEvent(data);
    setShowEventModal(false);
  };

  const handleUpdateEvent = async (data: any) => {
    if (!selectedEvent) return;
    await updateEvent(selectedEvent.id, data);
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleEditEvent = () => {
    setShowEventDetail(false);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    await deleteEvent(selectedEvent.id);
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  const handleSlotClick = (date: Date) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Crew availability handlers
  const handleSetAvailability = async (userId: string, status: 'available' | 'unavailable' | 'limited') => {
    const user = team.find((u) => u.id === userId);
    if (!user) return;

    await setAvailability({
      userId,
      userName: user.name,
      date: selectedDate,
      status,
      allDay: true,
    });
  };

  // Conflicts
  const allConflicts = events.flatMap((event) => checkConflicts(event));

  // Get weather for a specific date
  const getWeatherForDate = (date: Date): WeatherData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return weatherData.find((w) => w.date === dateStr);
  };

  // Handle crew assignment
  const handleAssignCrew = (event: ScheduleEvent) => {
    setEventToAssign(event);
    setShowAssignmentModal(true);
  };

  const handleSaveAssignment = async (userIds: string[]) => {
    if (!eventToAssign) return;
    await updateEvent(eventToAssign.id, { assignedUserIds: userIds });
    setShowAssignmentModal(false);
    setEventToAssign(null);
  };

  // Handle slot click for DayView
  const handleDayViewSlotClick = (date: Date, hour: number) => {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    setSelectedDate(start);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-200px)] space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Schedule"
          description="Manage jobs, inspections, and crew assignments"
          actions={
            <Button onClick={() => { setSelectedEvent(null); setShowEventModal(true); }}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Schedule</h1>
            <p className="text-xs text-gray-500">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={cn(
              'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors',
              showMobileFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Date Picker - Horizontal Scroll */}
        <div
          ref={mobileDateScrollRef}
          className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mobileDates.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const hasEvents = getEventsForDate(date).length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[52px] h-[68px] rounded-xl transition-all',
                  isSelected
                    ? 'bg-brand-primary text-white shadow-md'
                    : isToday
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 active:bg-gray-100'
                )}
              >
                <span className={cn('text-[10px] font-medium', isSelected ? 'text-blue-100' : 'text-gray-500')}>
                  {DAYS_OF_WEEK[date.getDay()]}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                {hasEvents && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
                )}
                {hasEvents && isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Panel */}
        {showMobileFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full min-h-[44px] text-sm border border-gray-300 rounded-lg px-3"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex items-center gap-1 border-b border-gray-200 -mx-6 px-6">
        {[
          { key: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
          { key: 'crew', label: 'Crew Availability', icon: UsersIcon },
          { key: 'time-off', label: 'Time Off Requests', icon: CalendarDaysIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {key === 'time-off' && timeOffRequests.filter((r) => r.status === 'pending').length > 0 && (
              <Badge variant="danger" className="ml-1">
                {timeOffRequests.filter((r) => r.status === 'pending').length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Mobile Tab Selector */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {[
          { key: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
          { key: 'crew', label: 'Crew', icon: UsersIcon },
          { key: 'time-off', label: 'Time Off', icon: CalendarDaysIcon, badge: timeOffRequests.filter((r) => r.status === 'pending').length },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[40px]',
              tab === key
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge && badge > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                tab === key ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {tab === 'calendar' && (
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Conflict alerts */}
          {allConflicts.length > 0 && (
            <ConflictAlert
              conflicts={allConflicts}
              onViewEvent={(eventId) => {
                const event = events.find((e) => e.id === eventId);
                if (event) handleEventClick(event);
              }}
            />
          )}

          {/* Desktop Calendar toolbar */}
          <Card className="p-4 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" onClick={navigatePrev}>
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={navigateNext}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-lg font-semibold ml-2">{getHeaderText()}</h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Weather Widget (compact) */}
                {weatherData.length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-lg">
                    {weatherData.slice(0, 5).map((day) => (
                      <button
                        key={day.date}
                        onClick={() => {
                          setSelectedDate(new Date(day.date));
                          setView('day');
                        }}
                        className="flex flex-col items-center px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        title={`${day.dayOfWeek}: ${day.high}°/${day.low}°`}
                      >
                        <span className="text-[10px] text-gray-500">{day.dayOfWeek}</span>
                        <span className="text-sm">{day.conditions === 'sunny' ? '☀️' : day.conditions === 'rain' ? '🌧️' : day.conditions === 'cloudy' ? '☁️' : '⛅'}</span>
                        <span className="text-[10px] font-medium">{day.high}°</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* View switcher */}
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {(['day', 'week', 'month'] as View[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-md transition-colors capitalize',
                        view === v
                          ? 'bg-white shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Mobile Day View - Always show day view on mobile */}
          <div className="md:hidden flex-1 space-y-3">
            {eventsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-16 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="h-5 w-3/4 bg-gray-200 rounded" />
                          <div className="h-5 w-16 bg-gray-200 rounded-full" />
                        </div>
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-500 mb-4">No events scheduled</p>
                <button
                  onClick={() => handleSlotClick(selectedDate)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 active:scale-95 transition-transform"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-1 self-stretch rounded-full',
                        event.type === 'job' ? 'bg-blue-500' :
                        event.type === 'inspection' ? 'bg-amber-500' :
                        event.type === 'delivery' ? 'bg-green-500' :
                        event.type === 'meeting' ? 'bg-purple-500' : 'bg-gray-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                          <Badge
                            variant={
                              event.status === 'completed' ? 'success' :
                              event.status === 'in_progress' ? 'primary' :
                              event.status === 'cancelled' ? 'danger' : 'default'
                            }
                            className="flex-shrink-0"
                          >
                            {event.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {event.startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {' - '}
                          {event.endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1 truncate">📍 {event.location}</p>
                        )}
                        {event.assignedUsers && event.assignedUsers.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <UsersIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {event.assignedUsers.length} assigned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Calendar grid - flex-1 to fill available space */}
          <Card className="hidden md:flex flex-1 overflow-hidden flex-col min-h-[500px]">
            {eventsLoading ? (
              <div className="grid grid-cols-7 divide-x divide-gray-200 flex-1 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="p-2 text-center border-b border-gray-200">
                      <div className="h-3 w-8 bg-gray-200 rounded mx-auto mb-1" />
                      <div className="h-6 w-6 bg-gray-200 rounded-full mx-auto" />
                    </div>
                    <div className="flex-1 p-1 space-y-1">
                      {Array.from({ length: Math.max(1, (i % 3) + 1) }).map((_, j) => (
                        <div key={j} className="h-12 w-full bg-gray-200 rounded-md" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : view === 'week' ? (
              /* Week view - uses flex-1 to expand */
              <div className="grid grid-cols-7 divide-x divide-gray-200 flex-1">
                {weekDates.map((date, idx) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayEvents = getEventsForDate(date);

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex flex-col',
                        isToday && 'bg-blue-50/30'
                      )}
                    >
                      {/* Day header */}
                      <div
                        className={cn(
                          'p-2 text-center border-b border-gray-200 cursor-pointer hover:bg-gray-50',
                          isToday && 'bg-blue-100/50'
                        )}
                        onClick={() => handleSlotClick(date)}
                      >
                        <div className="text-xs text-gray-500">{DAYS_OF_WEEK[idx]}</div>
                        <div
                          className={cn(
                            'text-lg font-semibold',
                            isToday && 'text-blue-600'
                          )}
                        >
                          {date.getDate()}
                        </div>
                      </div>

                      {/* Events - flex-1 to fill remaining space */}
                      <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                        {dayEvents.slice(0, 5).map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            compact
                            onClick={() => handleEventClick(event)}
                          />
                        ))}
                        {dayEvents.length > 5 && (
                          <button
                            className="text-xs text-blue-600 hover:underline px-2"
                            onClick={() => {
                              setSelectedDate(date);
                              setView('day');
                            }}
                          >
                            +{dayEvents.length - 5} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : view === 'day' ? (
              /* Day view with hourly grid */
              <DayView
                date={selectedDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onSlotClick={handleDayViewSlotClick}
                weather={getWeatherForDate(selectedDate)}
                className="border-0 shadow-none"
              />
            ) : (
              /* Month view - flex-1 to expand */
              <div className="flex flex-col flex-1">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Month grid */}
                {(() => {
                  const year = selectedDate.getFullYear();
                  const month = selectedDate.getMonth();
                  const firstOfMonth = new Date(year, month, 1);
                  const lastOfMonth = new Date(year, month + 1, 0);
                  const startDay = firstOfMonth.getDay();
                  const daysInMonth = lastOfMonth.getDate();

                  const cells: (Date | null)[] = [];
                  for (let i = 0; i < startDay; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++) {
                    cells.push(new Date(year, month, d));
                  }
                  while (cells.length % 7 !== 0) cells.push(null);

                  const weeks: (Date | null)[][] = [];
                  for (let i = 0; i < cells.length; i += 7) {
                    weeks.push(cells.slice(i, i + 7));
                  }

                  return (
                    <div className="flex-1 flex flex-col">
                      {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0 flex-1">
                          {week.map((date, dayIdx) => {
                            if (!date) {
                              return (
                                <div
                                  key={`empty-${dayIdx}`}
                                  className="min-h-[100px] bg-gray-50 border-r border-gray-200 last:border-r-0"
                                />
                              );
                            }

                            const isToday = date.toDateString() === new Date().toDateString();
                            const dayEvents = getEventsForDate(date);

                            return (
                              <div
                                key={date.getDate()}
                                className={cn(
                                  'min-h-[100px] border-r border-gray-200 last:border-r-0 p-1 cursor-pointer hover:bg-gray-50',
                                  isToday && 'bg-blue-50/30'
                                )}
                                onClick={() => {
                                  setSelectedDate(date);
                                  setView('day');
                                }}
                              >
                                <div
                                  className={cn(
                                    'text-sm mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                                    isToday && 'bg-brand-primary text-white'
                                  )}
                                >
                                  {date.getDate()}
                                </div>
                                <div className="space-y-0.5">
                                  {dayEvents.slice(0, 2).map((event) => (
                                    <EventCard
                                      key={event.id}
                                      event={event}
                                      compact
                                      onClick={() => handleEventClick(event)}
                                    />
                                  ))}
                                  {dayEvents.length > 2 && (
                                    <div className="text-[10px] text-gray-500 px-1">
                                      +{dayEvents.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Crew Availability Tab */}
      {tab === 'crew' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-4">
              <CrewAvailabilityPanel
                users={team.filter((u) => ['EMPLOYEE', 'CONTRACTOR', 'SUB'].includes(u.role || ''))}
                availability={availability}
                timeOffRequests={timeOffRequests}
                selectedDate={selectedDate}
                onSetAvailability={handleSetAvailability}
                onRequestTimeOff={async (data) => {
                  await submitRequest(data);
                }}
                onApproveTimeOff={approveRequest}
                onDenyTimeOff={denyRequest}
              />
            </Card>
          </div>

          <div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Quick Date Select</h3>
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((date, idx) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'p-2 text-center rounded transition-colors',
                        isSelected && 'bg-brand-primary text-white',
                        !isSelected && isToday && 'bg-brand-primary-light',
                        !isSelected && !isToday && 'hover:bg-gray-100'
                      )}
                    >
                      <div className="text-xs">{DAYS_OF_WEEK[idx].slice(0, 1)}</div>
                      <div className="font-semibold">{date.getDate()}</div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Time Off Tab */}
      {tab === 'time-off' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4 hidden md:block">Time Off Requests</h3>

          {timeOffRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No time off requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeOffRequests.map((request) => (
                <div
                  key={request.id}
                  className={cn(
                    'p-4 border rounded-xl',
                    request.status === 'pending' && 'border-yellow-200 bg-yellow-50',
                    request.status === 'approved' && 'border-green-200 bg-green-50',
                    request.status === 'denied' && 'border-red-200 bg-red-50'
                  )}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium">{request.userName}</div>
                      <Badge
                        variant={
                          request.status === 'approved'
                            ? 'success'
                            : request.status === 'denied'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                      {request.halfDay && ` (${request.halfDay} only)`}
                    </div>
                    {request.reason && (
                      <div className="text-sm text-gray-500 mt-1">{request.reason}</div>
                    )}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 min-h-[44px]"
                          onClick={() => approveRequest(request.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1 min-h-[44px]"
                          onClick={() => denyRequest(request.id, 'Scheduling conflict')}
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between">
                    <div>
                      <div className="font-medium">{request.userName}</div>
                      <div className="text-sm text-gray-600">
                        {request.startDate.toLocaleDateString()} -{' '}
                        {request.endDate.toLocaleDateString()}
                        {request.halfDay && ` (${request.halfDay} only)`}
                      </div>
                      {request.reason && (
                        <div className="text-sm text-gray-500 mt-1">{request.reason}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          request.status === 'approved'
                            ? 'success'
                            : request.status === 'denied'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {request.status}
                      </Badge>

                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveRequest(request.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => denyRequest(request.id, 'Scheduling conflict')}
                          >
                            Deny
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Event Form Modal */}
      <EventFormModal
        open={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onSave={selectedEvent ? handleUpdateEvent : handleCreateEvent}
        event={selectedEvent}
        initialDate={selectedDate}
        projects={projects}
        users={team}
      />

      {/* Event Detail Modal */}
      <BaseModal
        open={showEventDetail}
        onClose={() => {
          setShowEventDetail(false);
          setSelectedEvent(null);
        }}
        title="Event Details"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <EventCard
              event={selectedEvent}
              showProject
              showCrew
              showWeather
            />

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button
                variant="danger"
                onClick={handleDeleteEvent}
              >
                Delete Event
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEventDetail(false);
                    handleAssignCrew(selectedEvent);
                  }}
                >
                  <UsersIcon className="h-4 w-4 mr-1" />
                  Assign Crew
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowEventDetail(false)}
                >
                  Close
                </Button>
                <Button onClick={handleEditEvent}>Edit Event</Button>
              </div>
            </div>
          </div>
        )}
      </BaseModal>

      {/* Assignment Modal */}
      {eventToAssign && (
        <AssignmentModal
          event={eventToAssign}
          open={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setEventToAssign(null);
          }}
          onAssign={handleSaveAssignment}
        />
      )}

      {/* Mobile FAB for Add Event */}
      <button
        onClick={() => { setSelectedEvent(null); setShowEventModal(true); }}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="Add Event"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
