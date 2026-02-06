/**
 * @fileoverview Unit tests for useSafety hooks
 * Sprint 80: Unit Test Coverage — Safety Management
 *
 * Tests cover:
 * - useSafetyInspections: CRUD for safety inspections, projectId filtering, Timestamp conversions
 * - useSafetyIncidents: CRUD for safety incidents, projectId filtering
 * - useToolboxTalks: CRUD for toolbox talks, date conversions
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useSafetyInspections,
  useSafetyIncidents,
  useToolboxTalks,
} from '@/lib/hooks/useSafety';
import { SafetyInspection, SafetyIncident, ToolboxTalk } from '@/types';

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

jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field: string, dir?: string) => ({ field, dir, _type: 'orderBy' })),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date('2024-06-01T00:00:00Z') })),
    fromDate: jest.fn((d: Date) => ({ toDate: () => d, _type: 'timestamp', _date: d })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules after mock declarations
import { useAuth } from '@/lib/auth';
import {
  onSnapshot,
  addDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const mockOrgId = 'org-123';

function createMockInspection(overrides: Partial<SafetyInspection> = {}): SafetyInspection {
  return {
    id: `insp-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    projectId: 'project-1',
    projectName: 'Test Project',
    inspectorId: 'user-123',
    inspectorName: 'Test Inspector',
    type: 'daily',
    status: 'scheduled',
    scheduledDate: new Date('2024-03-15T09:00:00Z'),
    completedDate: undefined,
    checklist: [
      { id: 'item-1', label: 'PPE Check', category: 'General', passed: true },
    ],
    overallNotes: 'All clear',
    photos: [],
    issuesFound: 0,
    createdAt: new Date('2024-03-10T00:00:00Z'),
    updatedAt: undefined,
    ...overrides,
  };
}

function createMockIncident(overrides: Partial<SafetyIncident> = {}): SafetyIncident {
  return {
    id: `inc-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    projectId: 'project-1',
    projectName: 'Test Project',
    reportedBy: 'user-123',
    reportedByName: 'Test Reporter',
    severity: 'near_miss',
    date: new Date('2024-03-15T14:00:00Z'),
    time: '14:00',
    location: 'Building A, 2nd Floor',
    description: 'Worker slipped on wet surface',
    injuredWorkers: [],
    witnesses: ['user-456'],
    rootCause: 'Wet floor not marked',
    correctiveActions: 'Added wet floor signs',
    photos: [],
    isOshaReportable: false,
    status: 'reported',
    createdAt: new Date('2024-03-15T15:00:00Z'),
    updatedAt: undefined,
    ...overrides,
  };
}

function createMockTalk(overrides: Partial<ToolboxTalk> = {}): ToolboxTalk {
  return {
    id: `talk-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    projectId: 'project-1',
    projectName: 'Test Project',
    conductedBy: 'user-123',
    conductedByName: 'Test Presenter',
    date: new Date('2024-03-15T07:00:00Z'),
    topic: 'Fall Protection',
    content: 'Review of fall protection procedures',
    attendees: [
      { userId: 'user-123', name: 'Worker A' },
      { userId: 'user-456', name: 'Worker B' },
    ],
    duration: 30,
    createdAt: new Date('2024-03-15T07:30:00Z'),
    ...overrides,
  };
}

function toFirestoreDoc(
  item: SafetyInspection | SafetyIncident | ToolboxTalk,
  dateFields: string[]
) {
  return {
    id: item.id,
    data: () => {
      const raw: Record<string, unknown> = { ...item };
      delete raw.id;
      for (const field of dateFields) {
        const val = raw[field];
        if (val instanceof Date) {
          raw[field] = { toDate: () => val };
        }
      }
      return raw;
    },
  };
}

// =============================================================================
// SETUP / TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
  });

  (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
    setTimeout(() => {
      onNext({ docs: [] });
    }, 0);
    return jest.fn();
  });

  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-doc-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// useSafetyInspections
// =============================================================================

describe('useSafetyInspections', () => {
  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() => useSafetyInspections());
      expect(result.current.loading).toBe(true);
      expect(result.current.inspections).toEqual([]);
    });

    it('should return empty inspections when no data', async () => {
      const { result } = renderHook(() => useSafetyInspections());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.inspections).toEqual([]);
    });

    it('should set loading=false when no orgId', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useSafetyInspections());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.inspections).toEqual([]);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching inspections', () => {
    it('should fetch inspections from Firestore and convert timestamps', async () => {
      const mockInspections = [
        createMockInspection({ id: 'insp-1', status: 'scheduled' }),
        createMockInspection({ id: 'insp-2', status: 'passed', completedDate: new Date('2024-03-16T00:00:00Z') }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => {
          onNext({
            docs: mockInspections.map((insp) =>
              toFirestoreDoc(insp, ['scheduledDate', 'completedDate', 'createdAt', 'updatedAt'])
            ),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSafetyInspections());

      await waitFor(() => {
        expect(result.current.inspections).toHaveLength(2);
      });

      expect(result.current.inspections[0].id).toBe('insp-1');
      expect(result.current.inspections[0].scheduledDate).toBeInstanceOf(Date);
      expect(result.current.inspections[1].completedDate).toBeInstanceOf(Date);
      expect(result.current.loading).toBe(false);
    });

    it('should apply projectId filter when provided', () => {
      renderHook(() => useSafetyInspections('project-42'));
      expect(where).toHaveBeenCalledWith('projectId', '==', 'project-42');
    });

    it('should not apply projectId filter when not provided', () => {
      renderHook(() => useSafetyInspections());
      const whereCalls = (where as jest.Mock).mock.calls;
      const projectIdCalls = whereCalls.filter(
        (call: [string, string, unknown]) => call[0] === 'projectId'
      );
      expect(projectIdCalls).toHaveLength(0);
    });
  });

  describe('addInspection', () => {
    it('should call addDoc with correct data including orgId', async () => {
      const { result } = renderHook(() => useSafetyInspections());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      await act(async () => {
        await result.current.addInspection({
          projectId: 'project-1',
          projectName: 'Test Project',
          inspectorId: 'user-123',
          inspectorName: 'Inspector Smith',
          type: 'daily' as const,
          status: 'scheduled' as const,
          scheduledDate: new Date('2024-04-01T09:00:00Z'),
          checklist: [],
          photos: [],
          issuesFound: 0,
        });
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArgs.orgId).toBe('org-123');
      expect(callArgs.projectId).toBe('project-1');
      expect(callArgs.inspectorName).toBe('Inspector Smith');
    });

    it('should convert dates to Timestamps', async () => {
      const { result } = renderHook(() => useSafetyInspections());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      const scheduledDate = new Date('2024-04-01T09:00:00Z');
      const completedDate = new Date('2024-04-01T17:00:00Z');

      await act(async () => {
        await result.current.addInspection({
          projectId: 'project-1',
          inspectorId: 'user-123',
          inspectorName: 'Inspector',
          type: 'daily',
          status: 'passed',
          scheduledDate,
          completedDate,
          checklist: [],
          photos: [],
          issuesFound: 0,
        });
      });

      expect(Timestamp.fromDate).toHaveBeenCalledWith(scheduledDate);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(completedDate);
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('should throw if no orgId', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useSafetyInspections());

      await expect(
        result.current.addInspection({
          projectId: 'project-1',
          inspectorId: 'user-123',
          inspectorName: 'Inspector',
          type: 'daily',
          status: 'scheduled',
          scheduledDate: new Date(),
          checklist: [],
          photos: [],
          issuesFound: 0,
        })
      ).rejects.toThrow('No organization');
    });
  });

  describe('updateInspection', () => {
    it('should call updateDoc with Timestamp conversions', async () => {
      const { result } = renderHook(() => useSafetyInspections());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      await act(async () => {
        await result.current.updateInspection('insp-1', {
          status: 'passed',
          scheduledDate: new Date('2024-04-02T09:00:00Z'),
          completedDate: new Date('2024-04-02T17:00:00Z'),
        });
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const updateData = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateData.status).toBe('passed');
      expect(Timestamp.fromDate).toHaveBeenCalled();
      expect(Timestamp.now).toHaveBeenCalled();
      expect(updateData.id).toBeUndefined();
      expect(updateData.createdAt).toBeUndefined();
    });

    it('should strip id and createdAt from updates', async () => {
      const { result } = renderHook(() => useSafetyInspections());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      await act(async () => {
        await result.current.updateInspection('insp-1', {
          id: 'insp-1',
          createdAt: new Date(),
          status: 'failed',
        } as Partial<SafetyInspection>);
      });

      const updateData = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateData.id).toBeUndefined();
      expect(updateData.createdAt).toBeUndefined();
      expect(updateData.status).toBe('failed');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => onNext({ docs: [] }), 0);
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => useSafetyInspections());
      await waitFor(() => { expect(onSnapshot).toHaveBeenCalled(); });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

// =============================================================================
// useSafetyIncidents
// =============================================================================

describe('useSafetyIncidents', () => {
  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() => useSafetyIncidents());
      expect(result.current.loading).toBe(true);
      expect(result.current.incidents).toEqual([]);
    });

    it('should return empty incidents when no data', async () => {
      const { result } = renderHook(() => useSafetyIncidents());
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.incidents).toEqual([]);
    });

    it('should set loading=false when no orgId', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useSafetyIncidents());
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.incidents).toEqual([]);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching incidents', () => {
    it('should fetch incidents from Firestore and convert timestamps', async () => {
      const mockIncidents = [
        createMockIncident({ id: 'inc-1', severity: 'near_miss' }),
        createMockIncident({ id: 'inc-2', severity: 'medical' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => {
          onNext({
            docs: mockIncidents.map((inc) =>
              toFirestoreDoc(inc, ['date', 'createdAt'])
            ),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSafetyIncidents());
      await waitFor(() => { expect(result.current.incidents).toHaveLength(2); });

      expect(result.current.incidents[0].id).toBe('inc-1');
      expect(result.current.incidents[0].date).toBeInstanceOf(Date);
      expect(result.current.incidents[1].severity).toBe('medical');
      expect(result.current.loading).toBe(false);
    });

    it('should apply projectId filter when provided', () => {
      renderHook(() => useSafetyIncidents('project-99'));
      expect(where).toHaveBeenCalledWith('projectId', '==', 'project-99');
    });
  });

  describe('addIncident', () => {
    it('should call addDoc with correct data including orgId', async () => {
      const { result } = renderHook(() => useSafetyIncidents());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      await act(async () => {
        await result.current.addIncident({
          projectId: 'project-1',
          projectName: 'Test Project',
          reportedBy: 'user-123',
          reportedByName: 'Reporter',
          severity: 'first_aid' as const,
          date: new Date('2024-03-20T10:00:00Z'),
          time: '10:00',
          location: 'Site B',
          description: 'Minor cut on hand',
          injuredWorkers: ['user-456'],
          witnesses: [],
          photos: [],
          isOshaReportable: false,
          status: 'reported' as const,
        });
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArgs.orgId).toBe('org-123');
      expect(callArgs.severity).toBe('first_aid');
      expect(callArgs.location).toBe('Site B');
    });

    it('should convert date to Timestamp', async () => {
      const { result } = renderHook(() => useSafetyIncidents());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      const incidentDate = new Date('2024-03-20T10:00:00Z');

      await act(async () => {
        await result.current.addIncident({
          projectId: 'project-1',
          reportedBy: 'user-123',
          reportedByName: 'Reporter',
          severity: 'near_miss',
          date: incidentDate,
          location: 'Site A',
          description: 'Near miss event',
          injuredWorkers: [],
          witnesses: [],
          photos: [],
          isOshaReportable: false,
          status: 'reported',
        });
      });

      expect(Timestamp.fromDate).toHaveBeenCalledWith(incidentDate);
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('should throw if no orgId', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useSafetyIncidents());

      await expect(
        result.current.addIncident({
          projectId: 'project-1',
          reportedBy: 'user-123',
          reportedByName: 'Reporter',
          severity: 'near_miss',
          date: new Date(),
          location: 'Site A',
          description: 'Test',
          injuredWorkers: [],
          witnesses: [],
          photos: [],
          isOshaReportable: false,
          status: 'reported',
        })
      ).rejects.toThrow('No organization');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => onNext({ docs: [] }), 0);
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => useSafetyIncidents());
      await waitFor(() => { expect(onSnapshot).toHaveBeenCalled(); });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

// =============================================================================
// useToolboxTalks
// =============================================================================

describe('useToolboxTalks', () => {
  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() => useToolboxTalks());
      expect(result.current.loading).toBe(true);
      expect(result.current.talks).toEqual([]);
    });

    it('should return empty talks when no data', async () => {
      const { result } = renderHook(() => useToolboxTalks());
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.talks).toEqual([]);
    });

    it('should set loading=false when no orgId', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useToolboxTalks());
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.talks).toEqual([]);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching talks', () => {
    it('should fetch talks from Firestore and convert timestamps', async () => {
      const mockTalks = [
        createMockTalk({ id: 'talk-1', topic: 'Fall Protection' }),
        createMockTalk({ id: 'talk-2', topic: 'Electrical Safety' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => {
          onNext({
            docs: mockTalks.map((talk) =>
              toFirestoreDoc(talk, ['date', 'createdAt'])
            ),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useToolboxTalks());
      await waitFor(() => { expect(result.current.talks).toHaveLength(2); });

      expect(result.current.talks[0].id).toBe('talk-1');
      expect(result.current.talks[0].topic).toBe('Fall Protection');
      expect(result.current.talks[0].date).toBeInstanceOf(Date);
      expect(result.current.talks[1].topic).toBe('Electrical Safety');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('addTalk', () => {
    it('should call addDoc with correct data including orgId', async () => {
      const { result } = renderHook(() => useToolboxTalks());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      await act(async () => {
        await result.current.addTalk({
          projectId: 'project-1',
          projectName: 'Test Project',
          conductedBy: 'user-123',
          conductedByName: 'Safety Lead',
          date: new Date('2024-03-20T07:00:00Z'),
          topic: 'Scaffolding Safety',
          content: 'Review of scaffolding inspection procedures',
          attendees: [
            { userId: 'user-123', name: 'Worker A' },
            { userId: 'user-456', name: 'Worker B' },
          ],
          duration: 45,
        });
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArgs.orgId).toBe('org-123');
      expect(callArgs.topic).toBe('Scaffolding Safety');
      expect(callArgs.attendees).toHaveLength(2);
      expect(callArgs.duration).toBe(45);
    });

    it('should convert date to Timestamp', async () => {
      const { result } = renderHook(() => useToolboxTalks());
      await waitFor(() => { expect(result.current.loading).toBe(false); });

      const talkDate = new Date('2024-03-20T07:00:00Z');

      await act(async () => {
        await result.current.addTalk({
          conductedBy: 'user-123',
          conductedByName: 'Safety Lead',
          date: talkDate,
          topic: 'Heat Stress',
          content: 'Tips for working in hot conditions',
          attendees: [],
          duration: 15,
        });
      });

      expect(Timestamp.fromDate).toHaveBeenCalledWith(talkDate);
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('should throw if no orgId', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useToolboxTalks());

      await expect(
        result.current.addTalk({
          conductedBy: 'user-123',
          conductedByName: 'Safety Lead',
          date: new Date(),
          topic: 'Test Topic',
          content: 'Test content',
          attendees: [],
          duration: 10,
        })
      ).rejects.toThrow('No organization');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation((_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => onNext({ docs: [] }), 0);
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => useToolboxTalks());
      await waitFor(() => { expect(onSnapshot).toHaveBeenCalled(); });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
