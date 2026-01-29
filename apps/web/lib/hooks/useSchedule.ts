"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  ScheduleEvent,
  ScheduleEventStatus,
  ScheduleEventType,
  CrewAvailability,
  TimeOffRequest,
  ScheduleConflict,
  WeatherForecast,
  ScheduleViewPreferences,
} from '@/types';
import { toast } from '@/components/ui/Toast';

// =============================================================================
// SCHEDULE EVENTS HOOK
// =============================================================================

interface UseScheduleEventsOptions {
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  userId?: string;
  type?: ScheduleEventType;
  status?: ScheduleEventStatus;
}

interface UseScheduleEventsReturn {
  events: ScheduleEvent[];
  loading: boolean;
  error: Error | null;

  // CRUD
  createEvent: (data: CreateEventData) => Promise<string>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Actions
  updateStatus: (id: string, status: ScheduleEventStatus) => Promise<void>;
  duplicateEvent: (id: string, newDate?: Date) => Promise<string>;
  moveEvent: (id: string, newStart: Date, newEnd: Date) => Promise<void>;
  assignCrew: (id: string, userIds: string[]) => Promise<void>;

  // Conflict detection
  checkConflicts: (event: Partial<ScheduleEvent>) => ScheduleConflict[];
  getConflictsForEvent: (eventId: string) => ScheduleConflict[];

  // Filtering
  getEventsByDate: (date: Date) => ScheduleEvent[];
  getEventsByDateRange: (start: Date, end: Date) => ScheduleEvent[];
  getEventsByProject: (projectId: string) => ScheduleEvent[];
  getEventsByUser: (userId: string) => ScheduleEvent[];
}

interface CreateEventData {
  title: string;
  description?: string;
  type: ScheduleEventType;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  estimatedHours?: number;
  location?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  projectId?: string;
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  taskIds?: string[];
  clientId?: string;
  clientName?: string;
  assignedUserIds?: string[];
  leadUserId?: string;
  weatherSensitive?: boolean;
  notifyAssignees?: boolean;
  notifyClient?: boolean;
  reminderMinutes?: number[];
  internalNotes?: string;
  clientVisibleNotes?: string;
  color?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: Date;
}

interface UpdateEventData extends Partial<CreateEventData> {
  status?: ScheduleEventStatus;
}

export function useScheduleEvents(
  options: UseScheduleEventsOptions = {}
): UseScheduleEventsReturn {
  const { profile } = useAuth();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  // Subscribe to events
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    // Build query constraints
    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('startDate', 'asc'),
    ];

    if (options.projectId) {
      constraints.push(where('projectId', '==', options.projectId));
    }

    if (options.type) {
      constraints.push(where('type', '==', options.type));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    const q = query(collection(db, 'scheduleEvents'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            recurrenceEndDate: data.recurrenceEndDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
          } as ScheduleEvent;
        });

        // Client-side date filtering
        if (options.startDate) {
          items = items.filter((e) => e.startDate >= options.startDate!);
        }
        if (options.endDate) {
          items = items.filter((e) => e.startDate <= options.endDate!);
        }
        if (options.userId) {
          items = items.filter((e) => e.assignedUserIds?.includes(options.userId!));
        }

        setEvents(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading schedule events:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.startDate, options.endDate, options.projectId, options.userId, options.type, options.status]);

  // Create event
  const createEvent = useCallback(
    async (data: CreateEventData): Promise<string> => {
      if (!orgId || !profile?.uid) {
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, 'scheduleEvents'), {
        orgId,
        ...data,
        status: 'scheduled',
        recurrence: data.recurrence || 'none',
        weatherSensitive: data.weatherSensitive ?? false,
        notifyAssignees: data.notifyAssignees ?? true,
        notifyClient: data.notifyClient ?? false,
        allDay: data.allDay ?? false,
        assignedUserIds: data.assignedUserIds || [],
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        recurrenceEndDate: data.recurrenceEndDate
          ? Timestamp.fromDate(data.recurrenceEndDate)
          : null,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Event created');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  // Update event
  const updateEvent = useCallback(
    async (id: string, data: UpdateEventData): Promise<void> => {
      if (!profile?.uid) return;

      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      };

      // Convert dates to Timestamps
      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }
      if (data.recurrenceEndDate) {
        updateData.recurrenceEndDate = Timestamp.fromDate(data.recurrenceEndDate);
      }

      await updateDoc(doc(db, 'scheduleEvents', id), updateData);
      toast.success('Event updated');
    },
    [profile?.uid]
  );

  // Delete event
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'scheduleEvents', id));
    toast.success('Event deleted');
  }, []);

  // Update status
  const updateStatus = useCallback(
    async (id: string, status: ScheduleEventStatus): Promise<void> => {
      if (!profile?.uid) return;

      await updateDoc(doc(db, 'scheduleEvents', id), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      toast.success(`Event marked as ${status}`);
    },
    [profile?.uid]
  );

  // Duplicate event
  const duplicateEvent = useCallback(
    async (id: string, newDate?: Date): Promise<string> => {
      const event = events.find((e) => e.id === id);
      if (!event || !orgId || !profile?.uid) {
        throw new Error('Event not found');
      }

      // Calculate duration
      const duration = event.endDate.getTime() - event.startDate.getTime();
      const startDate = newDate || new Date(event.startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + duration);

      const docRef = await addDoc(collection(db, 'scheduleEvents'), {
        orgId,
        title: `${event.title} (Copy)`,
        description: event.description,
        type: event.type,
        status: 'scheduled',
        color: event.color,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        allDay: event.allDay,
        estimatedHours: event.estimatedHours,
        recurrence: 'none',
        location: event.location,
        address: event.address,
        coordinates: event.coordinates,
        projectId: event.projectId,
        projectName: event.projectName,
        phaseId: event.phaseId,
        phaseName: event.phaseName,
        clientId: event.clientId,
        clientName: event.clientName,
        assignedUserIds: event.assignedUserIds,
        leadUserId: event.leadUserId,
        weatherSensitive: event.weatherSensitive,
        notifyAssignees: event.notifyAssignees,
        notifyClient: event.notifyClient,
        reminderMinutes: event.reminderMinutes,
        internalNotes: event.internalNotes,
        clientVisibleNotes: event.clientVisibleNotes,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Event duplicated');
      return docRef.id;
    },
    [events, orgId, profile?.uid]
  );

  // Move event (drag & drop)
  const moveEvent = useCallback(
    async (id: string, newStart: Date, newEnd: Date): Promise<void> => {
      if (!profile?.uid) return;

      await updateDoc(doc(db, 'scheduleEvents', id), {
        startDate: Timestamp.fromDate(newStart),
        endDate: Timestamp.fromDate(newEnd),
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });
    },
    [profile?.uid]
  );

  // Assign crew
  const assignCrew = useCallback(
    async (id: string, userIds: string[]): Promise<void> => {
      if (!profile?.uid) return;

      await updateDoc(doc(db, 'scheduleEvents', id), {
        assignedUserIds: userIds,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      toast.success('Crew assigned');
    },
    [profile?.uid]
  );

  // Check for conflicts
  const checkConflicts = useCallback(
    (event: Partial<ScheduleEvent>): ScheduleConflict[] => {
      const conflicts: ScheduleConflict[] = [];

      if (!event.startDate || !event.endDate || !event.assignedUserIds?.length) {
        return conflicts;
      }

      // Check for crew overlap
      events.forEach((existing) => {
        if (existing.id === event.id) return;

        // Check time overlap
        const hasTimeOverlap =
          event.startDate! < existing.endDate && event.endDate! > existing.startDate;

        if (!hasTimeOverlap) return;

        // Check crew overlap
        const overlappingUsers = event.assignedUserIds!.filter((userId) =>
          existing.assignedUserIds?.includes(userId)
        );

        if (overlappingUsers.length > 0) {
          conflicts.push({
            id: `conflict-${event.id || 'new'}-${existing.id}`,
            orgId: orgId || '',
            type: 'crew_overlap',
            severity: 'error',
            eventIds: [event.id || 'new', existing.id],
            eventTitles: [event.title || 'New Event', existing.title],
            affectedUserIds: overlappingUsers,
            description: `Crew member(s) already assigned to "${existing.title}" during this time`,
            suggestedResolution: 'Assign different crew members or adjust the schedule',
            resolved: false,
            detectedAt: new Date(),
          });
        }
      });

      return conflicts;
    },
    [events, orgId]
  );

  // Get conflicts for a specific event
  const getConflictsForEvent = useCallback(
    (eventId: string): ScheduleConflict[] => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return [];
      return checkConflicts(event);
    },
    [events, checkConflicts]
  );

  // Filter helpers
  const getEventsByDate = useCallback(
    (date: Date): ScheduleEvent[] => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return events.filter(
        (e) => e.startDate <= endOfDay && e.endDate >= startOfDay
      );
    },
    [events]
  );

  const getEventsByDateRange = useCallback(
    (start: Date, end: Date): ScheduleEvent[] => {
      return events.filter((e) => e.startDate <= end && e.endDate >= start);
    },
    [events]
  );

  const getEventsByProject = useCallback(
    (projectId: string): ScheduleEvent[] => {
      return events.filter((e) => e.projectId === projectId);
    },
    [events]
  );

  const getEventsByUser = useCallback(
    (userId: string): ScheduleEvent[] => {
      return events.filter((e) => e.assignedUserIds?.includes(userId));
    },
    [events]
  );

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
    duplicateEvent,
    moveEvent,
    assignCrew,
    checkConflicts,
    getConflictsForEvent,
    getEventsByDate,
    getEventsByDateRange,
    getEventsByProject,
    getEventsByUser,
  };
}

// =============================================================================
// CREW AVAILABILITY HOOK
// =============================================================================

interface UseCrewAvailabilityOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UseCrewAvailabilityReturn {
  availability: CrewAvailability[];
  loading: boolean;

  setAvailability: (data: SetAvailabilityData) => Promise<string>;
  updateAvailability: (id: string, data: Partial<SetAvailabilityData>) => Promise<void>;
  deleteAvailability: (id: string) => Promise<void>;

  isUserAvailable: (userId: string, date: Date, startTime?: string, endTime?: string) => boolean;
  getAvailableUsers: (date: Date, startTime?: string, endTime?: string) => string[];
}

interface SetAvailabilityData {
  userId: string;
  userName: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  status: 'available' | 'unavailable' | 'limited';
  reason?: 'time_off' | 'sick' | 'training' | 'other_job' | 'personal' | 'other';
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: Date;
}

export function useCrewAvailability(
  options: UseCrewAvailabilityOptions = {}
): UseCrewAvailabilityReturn {
  const { profile } = useAuth();
  const [availability, setAvailabilityState] = useState<CrewAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('date', 'asc'),
    ];

    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }

    const q = query(collection(db, 'crewAvailability'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            recurrenceEndDate: data.recurrenceEndDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as CrewAvailability;
        });

        // Client-side date filtering
        if (options.startDate) {
          items = items.filter((a) => a.date >= options.startDate!);
        }
        if (options.endDate) {
          items = items.filter((a) => a.date <= options.endDate!);
        }

        setAvailabilityState(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading crew availability:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.userId, options.startDate, options.endDate]);

  const setAvailability = useCallback(
    async (data: SetAvailabilityData): Promise<string> => {
      if (!orgId || !profile?.uid) {
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, 'crewAvailability'), {
        orgId,
        ...data,
        allDay: data.allDay ?? true,
        isRecurring: data.isRecurring ?? false,
        recurrencePattern: data.recurrencePattern || 'none',
        date: Timestamp.fromDate(data.date),
        recurrenceEndDate: data.recurrenceEndDate
          ? Timestamp.fromDate(data.recurrenceEndDate)
          : null,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Availability updated');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  const updateAvailability = useCallback(
    async (id: string, data: Partial<SetAvailabilityData>): Promise<void> => {
      const updateData: Record<string, unknown> = { ...data };

      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
      }
      if (data.recurrenceEndDate) {
        updateData.recurrenceEndDate = Timestamp.fromDate(data.recurrenceEndDate);
      }

      await updateDoc(doc(db, 'crewAvailability', id), updateData);
      toast.success('Availability updated');
    },
    []
  );

  const deleteAvailability = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'crewAvailability', id));
    toast.success('Availability removed');
  }, []);

  const isUserAvailable = useCallback(
    (userId: string, date: Date, startTime?: string, endTime?: string): boolean => {
      const dateStr = date.toDateString();

      const userAvailability = availability.filter(
        (a) => a.userId === userId && a.date.toDateString() === dateStr
      );

      // If no availability records, assume available
      if (userAvailability.length === 0) return true;

      // Check each availability record
      for (const record of userAvailability) {
        if (record.status === 'unavailable') {
          if (record.allDay) return false;

          // Check time overlap if times are specified
          if (startTime && endTime && record.startTime && record.endTime) {
            if (startTime < record.endTime && endTime > record.startTime) {
              return false;
            }
          }
        }
      }

      return true;
    },
    [availability]
  );

  const getAvailableUsers = useCallback(
    (date: Date, startTime?: string, endTime?: string): string[] => {
      // This would need a list of all users - for now, return users not marked unavailable
      const dateStr = date.toDateString();
      const unavailableUserIds = new Set<string>();

      availability
        .filter((a) => a.date.toDateString() === dateStr && a.status === 'unavailable')
        .forEach((a) => {
          if (a.allDay) {
            unavailableUserIds.add(a.userId);
          } else if (startTime && endTime && a.startTime && a.endTime) {
            if (startTime < a.endTime && endTime > a.startTime) {
              unavailableUserIds.add(a.userId);
            }
          }
        });

      // Return users who are not unavailable
      const allUserIds = Array.from(new Set(availability.map((a) => a.userId)));
      return allUserIds.filter((id) => !unavailableUserIds.has(id));
    },
    [availability]
  );

  return {
    availability,
    loading,
    setAvailability,
    updateAvailability,
    deleteAvailability,
    isUserAvailable,
    getAvailableUsers,
  };
}

// =============================================================================
// TIME OFF REQUESTS HOOK
// =============================================================================

interface UseTimeOffRequestsOptions {
  userId?: string;
  status?: TimeOffRequest['status'];
}

interface UseTimeOffRequestsReturn {
  requests: TimeOffRequest[];
  loading: boolean;

  submitRequest: (data: SubmitTimeOffData) => Promise<string>;
  updateRequest: (id: string, data: Partial<SubmitTimeOffData>) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  denyRequest: (id: string, reason: string) => Promise<void>;

  getPendingRequests: () => TimeOffRequest[];
  getUpcomingTimeOff: (userId?: string) => TimeOffRequest[];
}

interface SubmitTimeOffData {
  userId: string;
  userName: string;
  type: TimeOffRequest['type'];
  startDate: Date;
  endDate: Date;
  halfDay?: 'morning' | 'afternoon';
  reason?: string;
}

export function useTimeOffRequests(
  options: UseTimeOffRequestsOptions = {}
): UseTimeOffRequestsReturn {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const constraints: any[] = [
      where('orgId', '==', orgId),
      orderBy('startDate', 'desc'),
    ];

    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    const q = query(collection(db, 'timeOffRequests'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            approvedAt: data.approvedAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
          } as TimeOffRequest;
        });

        setRequests(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading time off requests:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.userId, options.status]);

  const submitRequest = useCallback(
    async (data: SubmitTimeOffData): Promise<string> => {
      if (!orgId) {
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, 'timeOffRequests'), {
        orgId,
        ...data,
        status: 'pending',
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        createdAt: serverTimestamp(),
      });

      toast.success('Time off request submitted');
      return docRef.id;
    },
    [orgId]
  );

  const updateRequest = useCallback(
    async (id: string, data: Partial<SubmitTimeOffData>): Promise<void> => {
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }

      await updateDoc(doc(db, 'timeOffRequests', id), updateData);
      toast.success('Request updated');
    },
    []
  );

  const cancelRequest = useCallback(async (id: string): Promise<void> => {
    await updateDoc(doc(db, 'timeOffRequests', id), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    toast.success('Request cancelled');
  }, []);

  const approveRequest = useCallback(
    async (id: string): Promise<void> => {
      if (!profile?.uid) return;

      const request = requests.find((r) => r.id === id);
      if (!request || !orgId) return;

      const batch = writeBatch(db);

      // Update request
      batch.update(doc(db, 'timeOffRequests', id), {
        status: 'approved',
        approvedBy: profile.uid,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create availability records for each day
      const currentDate = new Date(request.startDate);
      while (currentDate <= request.endDate) {
        const availRef = doc(collection(db, 'crewAvailability'));
        batch.set(availRef, {
          orgId,
          userId: request.userId,
          userName: request.userName,
          date: Timestamp.fromDate(new Date(currentDate)),
          allDay: !request.halfDay,
          startTime: request.halfDay === 'afternoon' ? '12:00' : null,
          endTime: request.halfDay === 'morning' ? '12:00' : null,
          status: 'unavailable',
          reason: 'time_off',
          notes: `${request.type}: ${request.reason || 'Approved time off'}`,
          isRecurring: false,
          createdAt: serverTimestamp(),
          createdBy: profile.uid,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      await batch.commit();
      toast.success('Time off approved');
    },
    [requests, orgId, profile?.uid]
  );

  const denyRequest = useCallback(
    async (id: string, reason: string): Promise<void> => {
      if (!profile?.uid) return;

      await updateDoc(doc(db, 'timeOffRequests', id), {
        status: 'denied',
        denialReason: reason,
        approvedBy: profile.uid,
        updatedAt: serverTimestamp(),
      });

      toast.success('Request denied');
    },
    [profile?.uid]
  );

  const getPendingRequests = useCallback((): TimeOffRequest[] => {
    return requests.filter((r) => r.status === 'pending');
  }, [requests]);

  const getUpcomingTimeOff = useCallback(
    (userId?: string): TimeOffRequest[] => {
      const now = new Date();
      return requests.filter(
        (r) =>
          r.status === 'approved' &&
          r.endDate >= now &&
          (!userId || r.userId === userId)
      );
    },
    [requests]
  );

  return {
    requests,
    loading,
    submitRequest,
    updateRequest,
    cancelRequest,
    approveRequest,
    denyRequest,
    getPendingRequests,
    getUpcomingTimeOff,
  };
}

// =============================================================================
// SCHEDULE VIEW PREFERENCES HOOK
// =============================================================================

export function useSchedulePreferences() {
  const { profile } = useAuth();
  const [preferences, setPreferences] = useState<ScheduleViewPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = profile?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'schedulePreferences', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          setPreferences(snapshot.data() as ScheduleViewPreferences);
        } else {
          // Default preferences
          setPreferences({
            userId,
            defaultView: 'week',
            showWeekends: true,
            startOfWeek: 1,
            workingHoursStart: '07:00',
            workingHoursEnd: '18:00',
            showWeather: true,
            showConflicts: true,
            colorBy: 'type',
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading schedule preferences:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const updatePreferences = useCallback(
    async (data: Partial<ScheduleViewPreferences>): Promise<void> => {
      if (!userId) return;

      await updateDoc(doc(db, 'schedulePreferences', userId), data);
    },
    [userId]
  );

  return { preferences, loading, updatePreferences };
}
