"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/schedule';
import { Card, Button, Badge } from '@/components/ui';
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

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-200px)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage jobs, inspections, and crew assignments
          </p>
        </div>
        <Button onClick={() => { setSelectedEvent(null); setShowEventModal(true); }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 -mx-6 px-6">
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

          {/* Calendar toolbar */}
          <Card className="p-4">
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

          {/* Calendar grid - flex-1 to fill available space */}
          <Card className="flex-1 overflow-hidden flex flex-col min-h-[500px]">
            {eventsLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
              /* Day view */
              <div className="p-4 space-y-3">
                <h3 className="font-semibold">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                {getEventsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No events scheduled for this day</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleSlotClick(selectedDate)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => handleEventClick(event)}
                      />
                    ))}
                  </div>
                )}
              </div>
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
                                    isToday && 'bg-blue-600 text-white'
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
                        isSelected && 'bg-blue-600 text-white',
                        !isSelected && isToday && 'bg-blue-100',
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
          <h3 className="font-semibold mb-4">Time Off Requests</h3>

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
                    'flex items-center justify-between p-4 border rounded-lg',
                    request.status === 'pending' && 'border-yellow-200 bg-yellow-50',
                    request.status === 'approved' && 'border-green-200 bg-green-50',
                    request.status === 'denied' && 'border-red-200 bg-red-50'
                  )}
                >
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
    </div>
  );
}
