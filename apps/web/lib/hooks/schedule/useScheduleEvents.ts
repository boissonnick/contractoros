"use client";

import { useState, useEffect, useCallback } from 'react';
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  ScheduleEvent,
  ScheduleEventStatus,
  ScheduleEventType,
  ScheduleConflict,
} from '@/types';
import { toast } from '@/components/ui/Toast';

// =============================================================================
// TYPES
// =============================================================================

export interface UseScheduleEventsOptions {
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  userId?: string;
  type?: ScheduleEventType;
  status?: ScheduleEventStatus;
}

export interface UseScheduleEventsReturn {
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

export interface CreateEventData {
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

export interface UpdateEventData extends Partial<CreateEventData> {
  status?: ScheduleEventStatus;
}

// =============================================================================
// HOOK
// =============================================================================

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
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
