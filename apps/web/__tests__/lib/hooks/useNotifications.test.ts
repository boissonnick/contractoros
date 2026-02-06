/**
 * @fileoverview Unit tests for useNotifications and useNotificationPreferences hooks
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useNotifications: Notification list, mark as read, mark all as read
 * - useNotificationPreferences: Preferences CRUD, quiet hours
 * - isQuietHoursActive: Quiet hours utility function
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useNotifications,
  useNotificationPreferences,
  isQuietHoursActive,
} from '@/lib/hooks/useNotifications';
import { AppNotification, QuietHoursConfig } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

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

// Mock Firestore
const mockWriteBatch = {
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  limit: jest.fn((n) => ({ n, _type: 'limit' })),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  writeBatch: jest.fn(() => mockWriteBatch),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules
import { useAuth } from '@/lib/auth';
import { onSnapshot, updateDoc, setDoc, writeBatch } from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'org-123';
const mockUserId = 'user-123';

const createMockNotification = (overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: `notif-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  userId: mockUserId,
  type: 'taskAssigned',
  title: 'New Task Assigned',
  body: 'You have been assigned a new task',
  isRead: false,
  createdAt: new Date('2024-01-15T10:00:00'),
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
  });

  // Reset writeBatch mock
  mockWriteBatch.update.mockClear();
  mockWriteBatch.commit.mockClear();
  mockWriteBatch.commit.mockResolvedValue(undefined);

  // Default mock for onSnapshot
  (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
    setTimeout(() => {
      onNext({ docs: [], empty: true });
    }, 0);
    return jest.fn(); // Unsubscribe function
  });

  // Default mock implementations
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (setDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// useNotifications TESTS
// =============================================================================

describe('useNotifications', () => {
  describe('basic functionality', () => {
    it('should return empty notifications when no data', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should return notifications from Firestore', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', title: 'Task 1', isRead: false }),
        createMockNotification({ id: 'notif-2', title: 'Task 2', isRead: true }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockNotifications.map((notif) => ({
              id: notif.id,
              data: () => ({
                ...notif,
                createdAt: { toDate: () => notif.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      expect(result.current.notifications[0].title).toBe('Task 1');
      expect(result.current.notifications[1].title).toBe('Task 2');
    });

    it('should calculate unread count correctly', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
        createMockNotification({ id: 'notif-3', isRead: true }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockNotifications.map((notif) => ({
              id: notif.id,
              data: () => ({
                ...notif,
                createdAt: { toDate: () => notif.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });
    });

    it('should not fetch without user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should query with limit of 50', () => {
      renderHook(() => useNotifications());

      const { limit } = require('firebase/firestore');
      expect(limit).toHaveBeenCalledWith(50);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(updateDoc).toHaveBeenCalled();
      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg).toEqual({ isRead: true });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
        createMockNotification({ id: 'notif-3', isRead: true }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockNotifications.map((notif) => ({
              id: notif.id,
              data: () => ({
                ...notif,
                createdAt: { toDate: () => notif.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(3);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(writeBatch).toHaveBeenCalled();
      // Should update only unread notifications (2 out of 3)
      expect(mockWriteBatch.update).toHaveBeenCalledTimes(2);
      expect(mockWriteBatch.commit).toHaveBeenCalled();
    });

    it('should not call batch if no unread notifications', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: true }),
        createMockNotification({ id: 'notif-2', isRead: true }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockNotifications.map((notif) => ({
              id: notif.id,
              data: () => ({
                ...notif,
                createdAt: { toDate: () => notif.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(writeBatch).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// isQuietHoursActive TESTS
// =============================================================================

describe('isQuietHoursActive', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return false when config is undefined', () => {
    expect(isQuietHoursActive(undefined)).toBe(false);
  });

  it('should return false when quiet hours is disabled', () => {
    const config: QuietHoursConfig = {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(false);
  });

  it('should return false when current day is not in scheduled days', () => {
    // Set to Monday
    jest.setSystemTime(new Date('2024-01-15T23:00:00')); // Monday, 11pm

    const config: QuietHoursConfig = {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      days: ['tue', 'wed', 'thu', 'fri'], // Not Monday
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(false);
  });

  it('should return true during overnight quiet hours (after start)', () => {
    // Set to Monday 11pm
    jest.setSystemTime(new Date('2024-01-15T23:00:00')); // Monday

    const config: QuietHoursConfig = {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(true);
  });

  it('should return true during overnight quiet hours (before end)', () => {
    // Set to Tuesday 5am
    jest.setSystemTime(new Date('2024-01-16T05:00:00')); // Tuesday

    const config: QuietHoursConfig = {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(true);
  });

  it('should return false outside overnight quiet hours', () => {
    // Set to Monday 2pm
    jest.setSystemTime(new Date('2024-01-15T14:00:00')); // Monday

    const config: QuietHoursConfig = {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(false);
  });

  it('should return true during same-day quiet hours', () => {
    // Set to Monday 1:30pm
    jest.setSystemTime(new Date('2024-01-15T13:30:00')); // Monday

    const config: QuietHoursConfig = {
      enabled: true,
      startTime: '13:00',
      endTime: '14:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(true);
  });

  it('should return false outside same-day quiet hours', () => {
    // Set to Monday 2:30pm (after quiet hours)
    jest.setSystemTime(new Date('2024-01-15T14:30:00')); // Monday

    const config: QuietHoursConfig = {
      enabled: true,
      startTime: '13:00',
      endTime: '14:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      allowHighPriority: true,
    };
    expect(isQuietHoursActive(config)).toBe(false);
  });
});

// =============================================================================
// useNotificationPreferences TESTS
// =============================================================================

describe('useNotificationPreferences', () => {
  describe('basic functionality', () => {
    it('should return default preferences when no data', async () => {
      const { result } = renderHook(() => useNotificationPreferences());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.preferences).toBeDefined();
      expect(result.current.preferences?.email.enabled).toBe(true);
      expect(result.current.preferences?.push.enabled).toBe(true);
    });

    it('should return preferences from Firestore', async () => {
      const mockPrefs = {
        userId: mockUserId,
        orgId: mockOrgId,
        email: {
          enabled: false,
          taskAssigned: true,
          taskDueSoon: false,
        },
        push: {
          enabled: true,
          taskAssigned: false,
        },
        quietHours: {
          enabled: true,
          startTime: '21:00',
          endTime: '08:00',
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          allowHighPriority: false,
        },
        projectSettings: [],
      };

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            empty: false,
            docs: [
              {
                id: 'prefs-1',
                data: () => mockPrefs,
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotificationPreferences());

      await waitFor(() => {
        expect(result.current.preferences?.email.enabled).toBe(false);
      });

      expect(result.current.preferences?.quietHours?.enabled).toBe(true);
      expect(result.current.preferences?.quietHours?.startTime).toBe('21:00');
    });

    it('should not fetch without user or profile', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('updatePreference', () => {
    it('should update existing preference', async () => {
      const mockPrefs = {
        userId: mockUserId,
        orgId: mockOrgId,
        email: { enabled: true, taskAssigned: true },
        push: { enabled: true, taskAssigned: true },
        quietHours: null,
        projectSettings: [],
      };

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            empty: false,
            docs: [{ id: 'prefs-1', data: () => mockPrefs }],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotificationPreferences());

      // Wait for preferences to be loaded with the specific id
      await waitFor(() => {
        expect(result.current.preferences?.id).toBe('prefs-1');
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.updatePreference('email', 'taskAssigned', false);
      });

      expect(success!).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should create new preference document if none exists', async () => {
      // Default empty snapshot returns default preferences with id: ''
      const { result } = renderHook(() => useNotificationPreferences());

      await waitFor(() => {
        expect(result.current.preferences).toBeDefined();
        expect(result.current.preferences?.id).toBe('');
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.updatePreference('email', 'taskAssigned', false);
      });

      expect(success!).toBe(true);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should return false without authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useNotificationPreferences());

      const success = await result.current.updatePreference('email', 'taskAssigned', false);
      expect(success).toBe(false);
    });
  });

  describe('updateQuietHours', () => {
    it('should update quiet hours', async () => {
      const mockPrefs = {
        userId: mockUserId,
        orgId: mockOrgId,
        email: { enabled: true },
        push: { enabled: true },
        quietHours: null,
        projectSettings: [],
      };

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            empty: false,
            docs: [{ id: 'prefs-1', data: () => mockPrefs }],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useNotificationPreferences());

      // Wait for preferences to be loaded with the specific id
      await waitFor(() => {
        expect(result.current.preferences?.id).toBe('prefs-1');
      });

      const newQuietHours: QuietHoursConfig = {
        enabled: true,
        startTime: '20:00',
        endTime: '06:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        allowHighPriority: true,
      };

      let success: boolean;
      await act(async () => {
        success = await result.current.updateQuietHours(newQuietHours);
      });

      expect(success!).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.quietHours).toEqual(newQuietHours);
    });

    it('should return false without authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useNotificationPreferences());

      const success = await result.current.updateQuietHours({
        enabled: true,
        startTime: '20:00',
        endTime: '06:00',
        days: ['mon'],
        allowHighPriority: true,
      });
      expect(success).toBe(false);
    });
  });
});
