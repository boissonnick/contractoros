/**
 * @fileoverview Unit tests for useScheduleEvents hook
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useScheduleEvents: Schedule event CRUD, conflict detection, filtering
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useScheduleEvents } from '@/lib/hooks/schedule/useScheduleEvents';
import { ScheduleEvent, ScheduleEventStatus, ScheduleEventType } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock useAuth
const mockUser = { uid: 'user-123', email: 'test@example.com' };
const mockProfile = {
  uid: 'user-123',
  orgId: 'org-123',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    profile: mockProfile,
  })),
}));

// Mock toast
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Firestore
const _mockOnSnapshot = jest.fn();
const _mockAddDoc = jest.fn();
const _mockUpdateDoc = jest.fn();
const _mockDeleteDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((d) => ({ toDate: () => d })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'org-123';
const mockUserId = 'user-123';

const createMockEvent = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: `event-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  title: 'Test Event',
  description: 'Test description',
  type: 'work' as ScheduleEventType,
  status: 'scheduled' as ScheduleEventStatus,
  startDate: new Date('2024-01-15T09:00:00'),
  endDate: new Date('2024-01-15T17:00:00'),
  allDay: false,
  recurrence: 'none',
  assignedUserIds: [mockUserId],
  createdAt: new Date('2024-01-10'),
  createdBy: mockUserId,
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Reset useAuth mock
  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
  });

  // Default mock for onSnapshot
  (onSnapshot as jest.Mock).mockImplementation((_query, onNext, _onError) => {
    setTimeout(() => {
      onNext({
        docs: [],
      });
    }, 0);
    return jest.fn(); // Unsubscribe function
  });

  // Default mock implementations
  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-event-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (deleteDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// BASIC FUNCTIONALITY TESTS
// =============================================================================

describe('useScheduleEvents', () => {
  describe('basic functionality', () => {
    it('should return empty events when no data', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should return events from Firestore', async () => {
      const mockEvents = [
        createMockEvent({ id: 'event-1', title: 'Event 1' }),
        createMockEvent({ id: 'event-2', title: 'Event 2' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockEvents.map((event) => ({
              id: event.id,
              data: () => ({
                ...event,
                startDate: { toDate: () => event.startDate },
                endDate: { toDate: () => event.endDate },
                createdAt: { toDate: () => event.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(2);
      });

      expect(result.current.events[0].title).toBe('Event 1');
    });

    it('should handle Firestore errors', async () => {
      const error = new Error('Firestore error');

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        setTimeout(() => onError(error), 0);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Firestore error');
      consoleSpy.mockRestore();
    });

    it('should not fetch without orgId', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useScheduleEvents());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('filtering options', () => {
    it('should filter by projectId', () => {
      renderHook(() => useScheduleEvents({ projectId: 'project-1' }));

      const { where } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('projectId', '==', 'project-1');
    });

    it('should filter by type', () => {
      renderHook(() => useScheduleEvents({ type: 'meeting' }));

      const { where } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('type', '==', 'meeting');
    });

    it('should filter by status', () => {
      renderHook(() => useScheduleEvents({ status: 'completed' }));

      const { where } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('status', '==', 'completed');
    });

    it('should apply client-side date filtering', async () => {
      const event1 = createMockEvent({
        id: 'event-1',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-10'),
      });
      const event2 = createMockEvent({
        id: 'event-2',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-20'),
      });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [event1, event2].map((event) => ({
              id: event.id,
              data: () => ({
                ...event,
                startDate: { toDate: () => event.startDate },
                endDate: { toDate: () => event.endDate },
                createdAt: { toDate: () => event.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useScheduleEvents({
          startDate: new Date('2024-01-15'),
        })
      );

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      expect(result.current.events[0].id).toBe('event-2');
    });

    it('should apply client-side user filtering', async () => {
      const event1 = createMockEvent({
        id: 'event-1',
        assignedUserIds: ['user-123'],
      });
      const event2 = createMockEvent({
        id: 'event-2',
        assignedUserIds: ['user-456'],
      });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [event1, event2].map((event) => ({
              id: event.id,
              data: () => ({
                ...event,
                startDate: { toDate: () => event.startDate },
                endDate: { toDate: () => event.endDate },
                createdAt: { toDate: () => event.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useScheduleEvents({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      expect(result.current.events[0].id).toBe('event-1');
    });
  });

  describe('createEvent', () => {
    it('should create event and return id', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const eventData = {
        title: 'New Event',
        type: 'work' as ScheduleEventType,
        startDate: new Date('2024-01-20T09:00:00'),
        endDate: new Date('2024-01-20T17:00:00'),
      };

      let createdId: string;
      await act(async () => {
        createdId = await result.current.createEvent(eventData);
      });

      expect(addDoc).toHaveBeenCalled();
      expect(createdId!).toBe('new-event-id');
      expect(toast.success).toHaveBeenCalledWith('Event created');
    });

    it('should throw error when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useScheduleEvents());

      await expect(
        result.current.createEvent({
          title: 'Test',
          type: 'work',
          startDate: new Date(),
          endDate: new Date(),
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateEvent', () => {
    it('should update event', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEvent('event-1', { title: 'Updated Title' });
      });

      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Event updated');
    });

    it('should not update without profile', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useScheduleEvents());

      await act(async () => {
        await result.current.updateEvent('event-1', { title: 'Updated' });
      });

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('should delete event', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteEvent('event-1');
      });

      expect(deleteDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Event deleted');
    });
  });

  describe('updateStatus', () => {
    it('should update event status', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateStatus('event-1', 'completed');
      });

      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Event marked as completed');
    });
  });

  describe('duplicateEvent', () => {
    it('should duplicate event with new date', async () => {
      const existingEvent = createMockEvent({ id: 'event-1', title: 'Original Event' });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: existingEvent.id,
                data: () => ({
                  ...existingEvent,
                  startDate: { toDate: () => existingEvent.startDate },
                  endDate: { toDate: () => existingEvent.endDate },
                  createdAt: { toDate: () => existingEvent.createdAt },
                }),
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      let duplicatedId: string;
      await act(async () => {
        duplicatedId = await result.current.duplicateEvent('event-1', new Date('2024-02-01'));
      });

      expect(addDoc).toHaveBeenCalled();
      expect(duplicatedId!).toBe('new-event-id');
      expect(toast.success).toHaveBeenCalledWith('Event duplicated');
    });

    it('should throw error when event not found', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.duplicateEvent('non-existent')).rejects.toThrow('Event not found');
    });
  });

  describe('moveEvent', () => {
    it('should move event to new dates', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.moveEvent(
          'event-1',
          new Date('2024-01-20T09:00:00'),
          new Date('2024-01-20T17:00:00')
        );
      });

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('assignCrew', () => {
    it('should assign crew to event', async () => {
      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.assignCrew('event-1', ['user-1', 'user-2']);
      });

      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Crew assigned');
    });
  });

  describe('conflict detection', () => {
    it('should detect crew overlap conflicts', async () => {
      const event1 = createMockEvent({
        id: 'event-1',
        title: 'Existing Event',
        startDate: new Date('2024-01-15T09:00:00'),
        endDate: new Date('2024-01-15T17:00:00'),
        assignedUserIds: ['user-123'],
      });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: event1.id,
                data: () => ({
                  ...event1,
                  startDate: { toDate: () => event1.startDate },
                  endDate: { toDate: () => event1.endDate },
                  createdAt: { toDate: () => event1.createdAt },
                }),
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      const newEvent = {
        id: 'event-2',
        title: 'New Event',
        startDate: new Date('2024-01-15T10:00:00'),
        endDate: new Date('2024-01-15T14:00:00'),
        assignedUserIds: ['user-123'],
      };

      const conflicts = result.current.checkConflicts(newEvent);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('crew_overlap');
      expect(conflicts[0].affectedUserIds).toContain('user-123');
    });

    it('should not detect conflicts when no time overlap', async () => {
      const event1 = createMockEvent({
        id: 'event-1',
        startDate: new Date('2024-01-15T09:00:00'),
        endDate: new Date('2024-01-15T12:00:00'),
        assignedUserIds: ['user-123'],
      });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: event1.id,
                data: () => ({
                  ...event1,
                  startDate: { toDate: () => event1.startDate },
                  endDate: { toDate: () => event1.endDate },
                  createdAt: { toDate: () => event1.createdAt },
                }),
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      const newEvent = {
        startDate: new Date('2024-01-15T13:00:00'),
        endDate: new Date('2024-01-15T17:00:00'),
        assignedUserIds: ['user-123'],
      };

      const conflicts = result.current.checkConflicts(newEvent);

      expect(conflicts).toHaveLength(0);
    });

    it('should return empty conflicts when no assigned users', () => {
      const { result } = renderHook(() => useScheduleEvents());

      const conflicts = result.current.checkConflicts({
        startDate: new Date(),
        endDate: new Date(),
        assignedUserIds: [],
      });

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('filtering helpers', () => {
    const setupEventsForFiltering = () => {
      const events = [
        createMockEvent({
          id: 'event-1',
          startDate: new Date('2024-01-15T09:00:00'),
          endDate: new Date('2024-01-15T17:00:00'),
          projectId: 'project-1',
          assignedUserIds: ['user-123'],
        }),
        createMockEvent({
          id: 'event-2',
          startDate: new Date('2024-01-16T09:00:00'),
          endDate: new Date('2024-01-16T17:00:00'),
          projectId: 'project-2',
          assignedUserIds: ['user-456'],
        }),
        createMockEvent({
          id: 'event-3',
          startDate: new Date('2024-01-17T09:00:00'),
          endDate: new Date('2024-01-17T17:00:00'),
          projectId: 'project-1',
          assignedUserIds: ['user-123', 'user-456'],
        }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: events.map((event) => ({
              id: event.id,
              data: () => ({
                ...event,
                startDate: { toDate: () => event.startDate },
                endDate: { toDate: () => event.endDate },
                createdAt: { toDate: () => event.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      return events;
    };

    it('should filter events by date', async () => {
      setupEventsForFiltering();

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(3);
      });

      // Use the same date as event-1's startDate to avoid timezone issues
      const event1Date = result.current.events.find((e) => e.id === 'event-1')?.startDate;
      if (!event1Date) throw new Error('Event 1 not found');

      const eventsOnDate = result.current.getEventsByDate(event1Date);

      expect(eventsOnDate).toHaveLength(1);
      expect(eventsOnDate[0].id).toBe('event-1');
    });

    it('should filter events by date range', async () => {
      setupEventsForFiltering();

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(3);
      });

      // Get the actual date range from events to avoid timezone issues
      const event1 = result.current.events.find((e) => e.id === 'event-1');
      const event2 = result.current.events.find((e) => e.id === 'event-2');
      if (!event1 || !event2) throw new Error('Events not found');

      const eventsInRange = result.current.getEventsByDateRange(
        event1.startDate,
        event2.endDate
      );

      expect(eventsInRange).toHaveLength(2);
    });

    it('should filter events by project', async () => {
      setupEventsForFiltering();

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(3);
      });

      const projectEvents = result.current.getEventsByProject('project-1');

      expect(projectEvents).toHaveLength(2);
      expect(projectEvents.every((e) => e.projectId === 'project-1')).toBe(true);
    });

    it('should filter events by user', async () => {
      setupEventsForFiltering();

      const { result } = renderHook(() => useScheduleEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(3);
      });

      const userEvents = result.current.getEventsByUser('user-123');

      expect(userEvents).toHaveLength(2);
      expect(userEvents.every((e) => e.assignedUserIds?.includes('user-123'))).toBe(true);
    });
  });
});
