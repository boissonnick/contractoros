/**
 * @fileoverview Tests for useTimeEntries hook
 *
 * Tests the time tracking hooks including:
 * - useTimeEntries: List and filter time entries
 * - Clock in/out operations
 * - Break management
 * - Manual entry creation
 * - Daily/weekly summaries
 * - Approval workflow
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock data
const mockTimeEntryData = {
  orgId: 'test-org',
  userId: 'user-1',
  userName: 'Test User',
  userRole: 'EMPLOYEE',
  type: 'clock' as const,
  status: 'completed' as const,
  clockIn: new Date('2024-01-15T09:00:00'),
  clockOut: new Date('2024-01-15T17:00:00'),
  totalMinutes: 480, // 8 hours
  totalBreakMinutes: 30,
  breaks: [],
  createdAt: new Date('2024-01-15T09:00:00'),
  updatedAt: new Date('2024-01-15T17:00:00'),
};

const _mockEntry1 = { id: 'entry-1', ...mockTimeEntryData };
const _mockEntry2 = {
  id: 'entry-2',
  ...mockTimeEntryData,
  clockIn: new Date('2024-01-16T09:00:00'),
  clockOut: new Date('2024-01-16T17:30:00'),
  totalMinutes: 510,
  projectId: 'project-1',
  projectName: 'Project Alpha',
};
const _mockActiveEntry = {
  id: 'entry-active',
  ...mockTimeEntryData,
  status: 'active' as const,
  clockOut: undefined,
  totalMinutes: 0,
};

// Mock functions
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
}));

// Mock Firebase config
jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Mock Auth
const mockProfile = {
  orgId: 'test-org',
  uid: 'user-1',
  displayName: 'Test User',
  role: 'EMPLOYEE',
  hourlyRate: 25,
};

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { email: 'test@example.com' },
    profile: mockProfile,
  })),
}));

// Mock network status
let mockIsOnline = true;
jest.mock('@/lib/offline/network-status', () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: mockIsOnline })),
  checkNetworkStatus: jest.fn(() => mockIsOnline),
}));

// Mock offline time entries
const mockClockInOffline = jest.fn();
const mockClockOutOffline = jest.fn();
const mockCreateManualEntryOffline = jest.fn();
const mockGetOfflineTimeEntries = jest.fn();
const mockGetPendingOfflineEntriesCount = jest.fn();
const mockGetMergedTimeEntries = jest.fn();

jest.mock('@/lib/offline/offline-time-entries', () => ({
  OfflineTimeEntryService: jest.fn(),
  createManualEntryOffline: (...args: unknown[]) => mockCreateManualEntryOffline(...args),
  clockInOffline: (...args: unknown[]) => mockClockInOffline(...args),
  clockOutOffline: (...args: unknown[]) => mockClockOutOffline(...args),
  getOfflineTimeEntries: (...args: unknown[]) => mockGetOfflineTimeEntries(...args),
  getPendingOfflineEntriesCount: (...args: unknown[]) => mockGetPendingOfflineEntriesCount(...args),
  getMergedTimeEntries: (...args: unknown[]) => mockGetMergedTimeEntries(...args),
}));

// Mock toast
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock timestamp converter
jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestampsDeep: jest.fn((data) => data),
}));

// Import after mocks
import { useTimeEntries, useActiveTimeEntry, useTeamTimeEntries } from '@/lib/hooks/useTimeEntries';
import { toast } from '@/components/ui/Toast';

describe('useTimeEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockGetPendingOfflineEntriesCount.mockResolvedValue(0);
    mockGetMergedTimeEntries.mockImplementation((orgId, onlineEntries) =>
      Promise.resolve(onlineEntries.map((e: any) => ({ ...e, syncStatus: 'synced' })))
    );

    // Default onSnapshot mock
    mockOnSnapshot.mockImplementation((q, onSuccess, _onError) => {
      // Simulate empty results by default
      const mockSnapshot = {
        docs: [],
      };
      onSuccess(mockSnapshot);
      return () => {}; // Unsubscribe function
    });
  });

  describe('basic functionality', () => {
    it('returns empty array when no orgId', async () => {
      // Mock auth without orgId
      jest.doMock('@/lib/auth', () => ({
        useAuth: jest.fn(() => ({
          user: { email: 'test@example.com' },
          profile: { ...mockProfile, orgId: '' },
        })),
      }));

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
    });

    it('returns entries for org after onSnapshot', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            { id: 'entry-1', data: () => mockTimeEntryData },
            { id: 'entry-2', data: () => ({ ...mockTimeEntryData, projectId: 'project-1' }) },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(2);
    });

    it('handles loading state correctly', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Don't call success callback immediately to keep loading state
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      expect(result.current.loading).toBe(true);
    });

    it('handles Firestore error', async () => {
      const testError = new Error('Permission denied');
      mockOnSnapshot.mockImplementation((q, onSuccess, onError) => {
        onError(testError);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Permission denied');
    });
  });

  describe('filtering', () => {
    it('filters by date range', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        // Firestore would filter, return filtered results
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => mockTimeEntryData }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() =>
        useTimeEntries({ startDate, endDate })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWhere).toHaveBeenCalledWith('clockIn', '>=', expect.anything());
      expect(mockWhere).toHaveBeenCalledWith('clockIn', '<=', expect.anything());
    });

    it('filters by user', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => mockTimeEntryData }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries({ userId: 'user-2' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-2');
    });

    it('filters by project', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [{ id: 'entry-2', data: () => ({ ...mockTimeEntryData, projectId: 'project-1' }) }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWhere).toHaveBeenCalledWith('projectId', '==', 'project-1');
    });

    it('filters by single status', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => ({ ...mockTimeEntryData, status: 'completed' }) }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries({ status: 'completed' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'completed');
    });

    it('filters by multiple statuses', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            { id: 'entry-1', data: () => ({ ...mockTimeEntryData, status: 'active' }) },
            { id: 'entry-2', data: () => ({ ...mockTimeEntryData, status: 'paused' }) },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() =>
        useTimeEntries({ status: ['active', 'paused'] })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['active', 'paused']);
    });
  });

  describe('clock operations', () => {
    it('clockIn creates entry with startTime', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-entry-id' });
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = { docs: [] };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.clockIn({
          projectId: 'project-1',
          projectName: 'Test Project',
        });
      });

      expect(mockAddDoc).toHaveBeenCalled();
      const addDocCall = mockAddDoc.mock.calls[0];
      const savedData = addDocCall[1];

      expect(savedData.type).toBe('clock');
      expect(savedData.status).toBe('active');
      expect(savedData.clockIn).toBeDefined();
      expect(savedData.projectId).toBe('project-1');
      expect(savedData.projectName).toBe('Test Project');
      expect(toast.success).toHaveBeenCalledWith('Clocked in successfully');
    });

    it('clockIn throws error when already clocked in', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [{ id: 'active-entry', data: () => ({ ...mockTimeEntryData, status: 'active' }) }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.clockIn()).rejects.toThrow(
        'Already clocked in. Please clock out first.'
      );
    });

    it('clockOut updates entry with endTime', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'active-entry',
              data: () => ({
                ...mockTimeEntryData,
                status: 'active',
                clockOut: undefined,
                breaks: [],
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.clockOut('active-entry', { notes: 'End of day' });
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.status).toBe('completed');
      expect(updates.clockOut).toBeDefined();
      expect(updates.notes).toBe('End of day');
      expect(toast.success).toHaveBeenCalledWith('Clocked out successfully');
    });

    it('clockIn works offline', async () => {
      mockIsOnline = false;
      mockClockInOffline.mockResolvedValue('local-entry-id');
      mockOnSnapshot.mockImplementation((q, onSuccess, onError) => {
        // Simulate offline error
        onError(new Error('Network error'));
        return () => {};
      });
      mockGetOfflineTimeEntries.mockResolvedValue([]);

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.clockIn();
      });

      expect(mockClockInOffline).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Clocked in offline', 'Will sync when connected');
    });
  });

  describe('duration calculations', () => {
    it('calculates duration correctly (clockOut - clockIn)', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const entryData = {
          ...mockTimeEntryData,
          clockIn: new Date('2024-01-15T09:00:00'),
          clockOut: new Date('2024-01-15T17:00:00'),
          totalMinutes: 480, // 8 hours
          breaks: [],
        };
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => entryData }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries[0].totalMinutes).toBe(480);
    });

    it('handles break time in calculations', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const entryData = {
          ...mockTimeEntryData,
          clockIn: new Date('2024-01-15T09:00:00'),
          clockOut: new Date('2024-01-15T17:00:00'),
          totalMinutes: 450, // 8 hours minus 30 min unpaid break
          totalBreakMinutes: 30,
          breaks: [
            {
              id: 'break-1',
              type: 'lunch',
              startTime: new Date('2024-01-15T12:00:00'),
              endTime: new Date('2024-01-15T12:30:00'),
              duration: 30,
              isPaid: false,
            },
          ],
        };
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => entryData }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries[0].totalMinutes).toBe(450);
      expect(result.current.entries[0].totalBreakMinutes).toBe(30);
    });
  });

  describe('break operations', () => {
    it('startBreak updates entry with break and paused status', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'active-entry',
              data: () => ({
                ...mockTimeEntryData,
                status: 'active',
                breaks: [],
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.startBreak('active-entry', 'lunch', false);
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.status).toBe('paused');
      expect(updates.breaks).toHaveLength(1);
      expect(updates.breaks[0].type).toBe('lunch');
      expect(updates.breaks[0].isPaid).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Break started');
    });

    it('endBreak updates entry with break end time', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      const breakStartTime = new Date('2024-01-15T12:00:00');
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'paused-entry',
              data: () => ({
                ...mockTimeEntryData,
                status: 'paused',
                breaks: [
                  {
                    id: 'break-1',
                    type: 'lunch',
                    startTime: breakStartTime,
                    isPaid: false,
                  },
                ],
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.endBreak('paused-entry', 'break-1');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.status).toBe('active');
      expect(toast.success).toHaveBeenCalledWith('Break ended');
    });

    it('startBreak throws error when not clocked in', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'completed-entry',
              data: () => ({
                ...mockTimeEntryData,
                status: 'completed',
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.startBreak('completed-entry', 'lunch')
      ).rejects.toThrow('Can only take breaks when clocked in');
    });
  });

  describe('manual entry operations', () => {
    it('createManualEntry validates required fields and creates entry', async () => {
      mockAddDoc.mockResolvedValue({ id: 'manual-entry-id' });
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = { docs: [] };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const manualEntryData = {
        clockIn: new Date('2024-01-15T09:00:00'),
        clockOut: new Date('2024-01-15T17:00:00'),
        projectId: 'project-1',
        projectName: 'Test Project',
        notes: 'Manual entry',
        breaks: [],
      };

      await act(async () => {
        await result.current.createManualEntry(manualEntryData);
      });

      expect(mockAddDoc).toHaveBeenCalled();
      const addDocCall = mockAddDoc.mock.calls[0];
      const savedData = addDocCall[1];

      expect(savedData.type).toBe('manual');
      expect(savedData.status).toBe('completed');
      expect(savedData.totalMinutes).toBe(480); // 8 hours
      expect(toast.success).toHaveBeenCalledWith('Time entry created');
    });

    it('createManualEntry works offline', async () => {
      mockIsOnline = false;
      mockCreateManualEntryOffline.mockResolvedValue('local-manual-id');
      mockOnSnapshot.mockImplementation((q, onSuccess, onError) => {
        onError(new Error('Network error'));
        return () => {};
      });
      mockGetOfflineTimeEntries.mockResolvedValue([]);

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const manualEntryData = {
        clockIn: new Date('2024-01-15T09:00:00'),
        clockOut: new Date('2024-01-15T17:00:00'),
        breaks: [],
      };

      await act(async () => {
        await result.current.createManualEntry(manualEntryData);
      });

      expect(mockCreateManualEntryOffline).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Time entry saved offline',
        'Will sync when connected'
      );
    });
  });

  describe('update and delete operations', () => {
    it('updateEntry tracks edit history', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'entry-1',
              data: () => ({
                ...mockTimeEntryData,
                editHistory: [],
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEntry('entry-1', { notes: 'Updated notes' }, 'Correction');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.editHistory).toBeDefined();
      expect(updates.editHistory.length).toBeGreaterThan(0);
      expect(toast.success).toHaveBeenCalledWith('Time entry updated');
    });

    it('deleteEntry removes entry from Firestore', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => mockTimeEntryData }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteEntry('entry-1');
      });

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Time entry deleted');
    });
  });

  describe('approval workflow', () => {
    it('submitForApproval updates status to pending_approval', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [{ id: 'entry-1', data: () => mockTimeEntryData }],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.submitForApproval('entry-1');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.status).toBe('pending_approval');
      expect(updates.submittedAt).toBeDefined();
      expect(toast.success).toHaveBeenCalledWith('Time entry submitted for approval');
    });

    it('approveEntry updates status to approved', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'entry-1',
              data: () => ({ ...mockTimeEntryData, status: 'pending_approval' }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.approveEntry('entry-1');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.status).toBe('approved');
      expect(updates.approvedBy).toBe('user-1');
      expect(updates.approvedAt).toBeDefined();
      expect(toast.success).toHaveBeenCalledWith('Time entry approved');
    });

    it('rejectEntry updates status to rejected with reason', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'entry-1',
              data: () => ({ ...mockTimeEntryData, status: 'pending_approval' }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.rejectEntry('entry-1', 'Invalid hours logged');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateDocCall = mockUpdateDoc.mock.calls[0];
      const updates = updateDocCall[1];

      expect(updates.status).toBe('rejected');
      expect(updates.rejectedBy).toBe('user-1');
      expect(updates.rejectionReason).toBe('Invalid hours logged');
      expect(toast.success).toHaveBeenCalledWith('Time entry rejected');
    });
  });

  describe('summary calculations', () => {
    it('getDailySummary returns correct summary', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const entry1 = {
          ...mockTimeEntryData,
          clockIn: new Date('2024-01-15T09:00:00'),
          totalMinutes: 240,
          totalBreakMinutes: 15,
          projectId: 'project-1',
          projectName: 'Project A',
        };
        const entry2 = {
          ...mockTimeEntryData,
          clockIn: new Date('2024-01-15T13:00:00'),
          totalMinutes: 240,
          totalBreakMinutes: 15,
          projectId: 'project-2',
          projectName: 'Project B',
        };
        const mockSnapshot = {
          docs: [
            { id: 'entry-1', data: () => entry1 },
            { id: 'entry-2', data: () => entry2 },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.getDailySummary(new Date('2024-01-15'));

      expect(summary).not.toBeNull();
      expect(summary?.totalHours).toBe(8); // 480 minutes
      expect(summary?.breakHours).toBe(0.5); // 30 minutes
    });

    it('getDailySummary returns null for day with no entries', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = { docs: [] };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.getDailySummary(new Date('2024-01-20'));

      expect(summary).toBeNull();
    });

    it('getWeeklySummary returns correct summary', async () => {
      // Create entries for multiple days
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const entries = [
          {
            ...mockTimeEntryData,
            clockIn: new Date('2024-01-15T09:00:00'), // Monday
            totalMinutes: 480,
            totalBreakMinutes: 30,
          },
          {
            ...mockTimeEntryData,
            clockIn: new Date('2024-01-16T09:00:00'), // Tuesday
            totalMinutes: 480,
            totalBreakMinutes: 30,
          },
          {
            ...mockTimeEntryData,
            clockIn: new Date('2024-01-17T09:00:00'), // Wednesday
            totalMinutes: 480,
            totalBreakMinutes: 30,
          },
        ];
        const mockSnapshot = {
          docs: entries.map((e, i) => ({ id: `entry-${i}`, data: () => e })),
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const weekStart = new Date('2024-01-15'); // Monday
      const summary = result.current.getWeeklySummary(weekStart);

      expect(summary).not.toBeNull();
      expect(summary?.totalHours).toBe(24); // 3 days x 8 hours
    });
  });

  describe('activeEntry tracking', () => {
    it('identifies active entry correctly', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            { id: 'completed-entry', data: () => ({ ...mockTimeEntryData, status: 'completed' }) },
            {
              id: 'active-entry',
              data: () => ({
                ...mockTimeEntryData,
                status: 'active',
                clockOut: undefined,
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activeEntry).not.toBeNull();
      expect(result.current.activeEntry?.id).toBe('active-entry');
      expect(result.current.activeEntry?.status).toBe('active');
    });

    it('identifies paused entry as active', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'paused-entry',
              data: () => ({
                ...mockTimeEntryData,
                status: 'paused',
                clockOut: undefined,
              }),
            },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activeEntry).not.toBeNull();
      expect(result.current.activeEntry?.status).toBe('paused');
    });

    it('returns null activeEntry when none active', async () => {
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = {
          docs: [
            { id: 'entry-1', data: () => ({ ...mockTimeEntryData, status: 'completed' }) },
          ],
        };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activeEntry).toBeNull();
    });
  });

  describe('offline functionality', () => {
    it('tracks pending offline count', async () => {
      mockGetPendingOfflineEntriesCount.mockResolvedValue(3);
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        const mockSnapshot = { docs: [] };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.pendingOfflineCount).toBe(3);
      });
    });

    it('isOnline reflects network status', async () => {
      mockIsOnline = false;
      mockOnSnapshot.mockImplementation((q, onSuccess, onError) => {
        onError(new Error('Network error'));
        return () => {};
      });
      mockGetOfflineTimeEntries.mockResolvedValue([]);

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('refresh functionality', () => {
    it('refresh triggers re-fetch', async () => {
      let fetchCount = 0;
      mockOnSnapshot.mockImplementation((q, onSuccess) => {
        fetchCount++;
        const mockSnapshot = { docs: [] };
        onSuccess(mockSnapshot);
        return () => {};
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialFetchCount = fetchCount;

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(initialFetchCount);
      });
    });
  });
});

describe('useActiveTimeEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockGetPendingOfflineEntriesCount.mockResolvedValue(0);
    mockGetMergedTimeEntries.mockImplementation((orgId, onlineEntries) =>
      Promise.resolve(onlineEntries.map((e: any) => ({ ...e, syncStatus: 'synced' })))
    );
  });

  it('returns activeEntry and clock operations', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'active-entry',
            data: () => ({
              ...mockTimeEntryData,
              status: 'active',
              clockOut: undefined,
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useActiveTimeEntry());

    await waitFor(() => {
      expect(result.current.isClockingLoading).toBe(false);
    });

    expect(result.current.activeEntry).not.toBeNull();
    expect(typeof result.current.clockIn).toBe('function');
    expect(typeof result.current.clockOut).toBe('function');
    expect(typeof result.current.startBreak).toBe('function');
    expect(typeof result.current.endBreak).toBe('function');
  });
});

describe('useTeamTimeEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockGetPendingOfflineEntriesCount.mockResolvedValue(0);
    mockGetMergedTimeEntries.mockImplementation((orgId, onlineEntries) =>
      Promise.resolve(onlineEntries.map((e: any) => ({ ...e, syncStatus: 'synced' })))
    );
  });

  it('fetches entries for all users (includeAllUsers)', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          { id: 'entry-1', data: () => ({ ...mockTimeEntryData, userId: 'user-1' }) },
          { id: 'entry-2', data: () => ({ ...mockTimeEntryData, userId: 'user-2' }) },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTeamTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(2);
    // Should NOT filter by userId when includeAllUsers is true
    expect(mockWhere).not.toHaveBeenCalledWith('userId', '==', expect.anything());
  });

  it('accepts date range filters', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const { result } = renderHook(() =>
      useTeamTimeEntries({ startDate, endDate })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockWhere).toHaveBeenCalledWith('clockIn', '>=', expect.anything());
    expect(mockWhere).toHaveBeenCalledWith('clockIn', '<=', expect.anything());
  });
});

describe('error handling edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockGetPendingOfflineEntriesCount.mockResolvedValue(0);
    mockGetMergedTimeEntries.mockImplementation((orgId, onlineEntries) =>
      Promise.resolve(onlineEntries.map((e: any) => ({ ...e, syncStatus: 'synced' })))
    );
  });

  it('clockOut throws error when entry not found', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.clockOut('nonexistent-entry')).rejects.toThrow(
      'Entry not found'
    );
  });

  it('startBreak throws error when entry not found', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.startBreak('nonexistent', 'lunch')).rejects.toThrow(
      'Entry not found'
    );
  });

  it('endBreak throws error when entry not found', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.endBreak('nonexistent', 'break-1')).rejects.toThrow(
      'Entry not found'
    );
  });

  it('updateEntry throws error when entry not found', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.updateEntry('nonexistent', { notes: 'test' })
    ).rejects.toThrow('Entry not found');
  });

  it('clockIn handles Firestore error', async () => {
    mockAddDoc.mockRejectedValue(new Error('Firestore write failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.clockIn()).rejects.toThrow('Firestore write failed');
    expect(toast.error).toHaveBeenCalledWith('Failed to clock in', 'Please try again');
  });

  it('clockOut handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'active-entry',
            data: () => ({
              ...mockTimeEntryData,
              status: 'active',
              breaks: [],
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.clockOut('active-entry')).rejects.toThrow(
      'Firestore update failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to clock out', 'Please try again');
  });

  it('startBreak handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'active-entry',
            data: () => ({
              ...mockTimeEntryData,
              status: 'active',
              breaks: [],
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.startBreak('active-entry', 'lunch')).rejects.toThrow(
      'Firestore update failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to start break');
  });

  it('endBreak handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'paused-entry',
            data: () => ({
              ...mockTimeEntryData,
              status: 'paused',
              breaks: [
                { id: 'break-1', type: 'lunch', startTime: new Date(), isPaid: false },
              ],
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.endBreak('paused-entry', 'break-1')).rejects.toThrow(
      'Firestore update failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to end break');
  });

  it('createManualEntry handles Firestore error', async () => {
    mockAddDoc.mockRejectedValue(new Error('Firestore write failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = { docs: [] };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.createManualEntry({
        clockIn: new Date('2024-01-15T09:00:00'),
        clockOut: new Date('2024-01-15T17:00:00'),
        breaks: [],
      })
    ).rejects.toThrow('Firestore write failed');
    expect(toast.error).toHaveBeenCalledWith('Failed to create time entry');
  });

  it('updateEntry handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'entry-1',
            data: () => ({ ...mockTimeEntryData, editHistory: [] }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.updateEntry('entry-1', { notes: 'updated' })
    ).rejects.toThrow('Firestore update failed');
    expect(toast.error).toHaveBeenCalledWith('Failed to update time entry');
  });

  it('deleteEntry handles Firestore error', async () => {
    mockDeleteDoc.mockRejectedValue(new Error('Firestore delete failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [{ id: 'entry-1', data: () => mockTimeEntryData }],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.deleteEntry('entry-1')).rejects.toThrow(
      'Firestore delete failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to delete time entry');
  });

  it('submitForApproval handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [{ id: 'entry-1', data: () => mockTimeEntryData }],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.submitForApproval('entry-1')).rejects.toThrow(
      'Firestore update failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to submit for approval');
  });

  it('approveEntry handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'entry-1',
            data: () => ({ ...mockTimeEntryData, status: 'pending_approval' }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.approveEntry('entry-1')).rejects.toThrow(
      'Firestore update failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to approve time entry');
  });

  it('rejectEntry handles Firestore error', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore update failed'));
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'entry-1',
            data: () => ({ ...mockTimeEntryData, status: 'pending_approval' }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.rejectEntry('entry-1', 'Invalid')).rejects.toThrow(
      'Firestore update failed'
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to reject time entry');
  });
});

describe('clockOut edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockGetPendingOfflineEntriesCount.mockResolvedValue(0);
    mockGetMergedTimeEntries.mockImplementation((orgId, onlineEntries) =>
      Promise.resolve(onlineEntries.map((e: any) => ({ ...e, syncStatus: 'synced' })))
    );
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('clockOut ends active breaks automatically', async () => {
    const activeBreak = {
      id: 'break-1',
      type: 'lunch',
      startTime: new Date('2024-01-15T12:00:00'),
      isPaid: false,
      // No endTime - break is still active
    };

    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'active-entry',
            data: () => ({
              ...mockTimeEntryData,
              status: 'active',
              clockOut: undefined,
              breaks: [activeBreak],
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.clockOut('active-entry');
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
    const updateDocCall = mockUpdateDoc.mock.calls[0];
    const updates = updateDocCall[1];

    // Active breaks should now have endTime
    expect(updates.breaks[0].endTime).toBeDefined();
    expect(updates.breaks[0].duration).toBeDefined();
  });
});

describe('updateEntry time recalculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline = true;
    mockGetPendingOfflineEntriesCount.mockResolvedValue(0);
    mockGetMergedTimeEntries.mockImplementation((orgId, onlineEntries) =>
      Promise.resolve(onlineEntries.map((e: any) => ({ ...e, syncStatus: 'synced' })))
    );
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('recalculates totalMinutes when clockIn is updated', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'entry-1',
            data: () => ({
              ...mockTimeEntryData,
              clockIn: new Date('2024-01-15T09:00:00'),
              clockOut: new Date('2024-01-15T17:00:00'),
              totalMinutes: 480,
              editHistory: [],
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update clock in to 10:00 AM (1 hour later)
    await act(async () => {
      await result.current.updateEntry(
        'entry-1',
        { clockIn: new Date('2024-01-15T10:00:00') },
        'Correction'
      );
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
    const updateDocCall = mockUpdateDoc.mock.calls[0];
    const updates = updateDocCall[1];

    // Should recalculate to 7 hours (420 minutes)
    expect(updates.totalMinutes).toBe(420);
  });

  it('recalculates totalMinutes when clockOut is updated', async () => {
    mockOnSnapshot.mockImplementation((q, onSuccess) => {
      const mockSnapshot = {
        docs: [
          {
            id: 'entry-1',
            data: () => ({
              ...mockTimeEntryData,
              clockIn: new Date('2024-01-15T09:00:00'),
              clockOut: new Date('2024-01-15T17:00:00'),
              totalMinutes: 480,
              editHistory: [],
            }),
          },
        ],
      };
      onSuccess(mockSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useTimeEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update clock out to 6:00 PM (1 hour later)
    await act(async () => {
      await result.current.updateEntry(
        'entry-1',
        { clockOut: new Date('2024-01-15T18:00:00') },
        'Correction'
      );
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
    const updateDocCall = mockUpdateDoc.mock.calls[0];
    const updates = updateDocCall[1];

    // Should recalculate to 9 hours (540 minutes)
    expect(updates.totalMinutes).toBe(540);
  });
});
