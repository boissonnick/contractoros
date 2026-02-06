/**
 * @fileoverview Unit tests for useLeads and useServiceTickets hooks
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useLeads: Lead CRUD operations
 * - useServiceTickets: Service ticket management with optional client filtering
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeads, useServiceTickets } from '@/lib/hooks/useLeads';
import { Lead, ServiceTicket } from '@/types';

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
import { onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'org-123';

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: `lead-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  name: 'John Smith',
  email: 'john@example.com',
  phone: '555-0123',
  source: 'website',
  status: 'new',
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockTicket = (overrides: Partial<ServiceTicket> = {}): ServiceTicket => ({
  id: `ticket-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  clientId: 'client-123',
  title: 'Warranty Repair',
  description: 'Fixing a leak',
  status: 'open',
  priority: 'medium',
  createdAt: new Date('2024-01-15'),
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

  // Default mock for onSnapshot
  (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
    setTimeout(() => {
      onNext({ docs: [] });
    }, 0);
    return jest.fn(); // Unsubscribe function
  });

  // Default mock implementations
  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-doc-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (deleteDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// useLeads TESTS
// =============================================================================

describe('useLeads', () => {
  describe('basic functionality', () => {
    it('should return empty leads when no data', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.leads).toEqual([]);
    });

    it('should return leads from Firestore', async () => {
      const mockLeads = [
        createMockLead({ id: 'lead-1', name: 'Alice' }),
        createMockLead({ id: 'lead-2', name: 'Bob' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockLeads.map((lead) => ({
              id: lead.id,
              data: () => ({
                ...lead,
                createdAt: { toDate: () => lead.createdAt },
                lastContactDate: lead.lastContactDate
                  ? { toDate: () => lead.lastContactDate }
                  : undefined,
                nextFollowUpDate: lead.nextFollowUpDate
                  ? { toDate: () => lead.nextFollowUpDate }
                  : undefined,
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.leads).toHaveLength(2);
      });

      expect(result.current.leads[0].name).toBe('Alice');
      expect(result.current.leads[1].name).toBe('Bob');
    });

    it('should not fetch without orgId', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useLeads());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should convert Timestamps to Dates', async () => {
      const lead = createMockLead({
        id: 'lead-1',
        lastContactDate: new Date('2024-01-10'),
        nextFollowUpDate: new Date('2024-01-20'),
      });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: lead.id,
                data: () => ({
                  ...lead,
                  createdAt: { toDate: () => lead.createdAt },
                  lastContactDate: { toDate: () => lead.lastContactDate },
                  nextFollowUpDate: { toDate: () => lead.nextFollowUpDate },
                }),
              },
            ],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.leads).toHaveLength(1);
      });

      expect(result.current.leads[0].lastContactDate).toBeInstanceOf(Date);
      expect(result.current.leads[0].nextFollowUpDate).toBeInstanceOf(Date);
    });
  });

  describe('addLead', () => {
    it('should add a new lead', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addLead({
          name: 'New Lead',
          email: 'new@example.com',
          phone: '555-9999',
          source: 'referral',
          status: 'new',
        });
      });

      expect(addDoc).toHaveBeenCalled();
      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg).toMatchObject({
        name: 'New Lead',
        email: 'new@example.com',
        orgId: mockOrgId,
        status: 'new',
      });
    });

    it('should default status to new', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addLead({
          name: 'Test Lead',
          email: 'test@example.com',
          phone: '555-0000',
          source: 'website',
        } as Omit<Lead, 'id' | 'orgId' | 'createdAt'>);
      });

      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.status).toBe('new');
    });

    it('should convert dates to Timestamps', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addLead({
          name: 'Test Lead',
          email: 'test@example.com',
          phone: '555-0000',
          source: 'website',
          status: 'contacted',
          lastContactDate: new Date('2024-01-15'),
          nextFollowUpDate: new Date('2024-01-20'),
        });
      });

      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.lastContactDate).toBeDefined();
      expect(callArg.nextFollowUpDate).toBeDefined();
    });

    it('should throw error without organization', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useLeads());

      await expect(
        result.current.addLead({
          name: 'Test',
          email: 'test@test.com',
          phone: '555-0000',
          source: 'website',
          status: 'new',
        })
      ).rejects.toThrow('No organization');
    });
  });

  describe('updateLead', () => {
    it('should update a lead', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateLead('lead-1', {
          name: 'Updated Name',
          status: 'qualified',
        });
      });

      expect(updateDoc).toHaveBeenCalled();
      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg).toMatchObject({
        name: 'Updated Name',
        status: 'qualified',
      });
    });

    it('should remove id and createdAt from updates', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateLead('lead-1', {
          id: 'should-be-removed',
          name: 'Test',
          createdAt: new Date(),
        } as Partial<Lead>);
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.id).toBeUndefined();
      expect(callArg.createdAt).toBeUndefined();
    });

    it('should convert date fields to Timestamps', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateLead('lead-1', {
          lastContactDate: new Date('2024-02-01'),
          nextFollowUpDate: new Date('2024-02-15'),
        });
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.lastContactDate).toBeDefined();
      expect(callArg.nextFollowUpDate).toBeDefined();
    });
  });

  describe('deleteLead', () => {
    it('should delete a lead', async () => {
      const { result } = renderHook(() => useLeads());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteLead('lead-1');
      });

      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// useServiceTickets TESTS
// =============================================================================

describe('useServiceTickets', () => {
  describe('basic functionality', () => {
    it('should return empty tickets when no data', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tickets).toEqual([]);
    });

    it('should return tickets from Firestore', async () => {
      const mockTickets = [
        createMockTicket({ id: 'ticket-1', title: 'AC Repair' }),
        createMockTicket({ id: 'ticket-2', title: 'Plumbing Fix' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockTickets.map((ticket) => ({
              id: ticket.id,
              data: () => ({
                ...ticket,
                createdAt: { toDate: () => ticket.createdAt },
                scheduledDate: ticket.scheduledDate
                  ? { toDate: () => ticket.scheduledDate }
                  : undefined,
                completedDate: ticket.completedDate
                  ? { toDate: () => ticket.completedDate }
                  : undefined,
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(2);
      });
    });

    it('should filter by clientId when provided', async () => {
      const { where } = require('firebase/firestore');

      renderHook(() => useServiceTickets('client-456'));

      await waitFor(() => {
        expect(where).toHaveBeenCalledWith('clientId', '==', 'client-456');
      });
    });

    it('should not filter by clientId when not provided', async () => {
      const { where } = require('firebase/firestore');

      renderHook(() => useServiceTickets());

      await waitFor(() => {
        // Should only call where for orgId, not clientId
        const clientIdCalls = (where as jest.Mock).mock.calls.filter(
          (call: unknown[]) => call[0] === 'clientId'
        );
        expect(clientIdCalls).toHaveLength(0);
      });
    });

    it('should not fetch without orgId', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useServiceTickets());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('addTicket', () => {
    it('should add a new ticket', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addTicket({
          clientId: 'client-123',
          title: 'New Service Request',
          description: 'Need maintenance',
          status: 'open',
          priority: 'high',
        });
      });

      expect(addDoc).toHaveBeenCalled();
      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg).toMatchObject({
        title: 'New Service Request',
        orgId: mockOrgId,
        status: 'open',
      });
    });

    it('should default status to open', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addTicket({
          clientId: 'client-123',
          title: 'Test Ticket',
          description: 'Test',
          priority: 'medium',
        } as Omit<ServiceTicket, 'id' | 'orgId' | 'createdAt'>);
      });

      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.status).toBe('open');
    });

    it('should convert scheduledDate to Timestamp', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addTicket({
          clientId: 'client-123',
          title: 'Scheduled Service',
          description: 'Scheduled repair',
          status: 'scheduled',
          priority: 'medium',
          scheduledDate: new Date('2024-02-01'),
        });
      });

      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.scheduledDate).toBeDefined();
    });

    it('should throw error without organization', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useServiceTickets());

      await expect(
        result.current.addTicket({
          clientId: 'client-123',
          title: 'Test',
          description: 'Test',
          status: 'open',
          priority: 'medium',
        })
      ).rejects.toThrow('No organization');
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTicket('ticket-1', {
          status: 'completed',
          completedDate: new Date(),
        });
      });

      expect(updateDoc).toHaveBeenCalled();
      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.status).toBe('completed');
    });

    it('should remove id and createdAt from updates', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTicket('ticket-1', {
          id: 'should-be-removed',
          title: 'Updated',
          createdAt: new Date(),
        } as Partial<ServiceTicket>);
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.id).toBeUndefined();
      expect(callArg.createdAt).toBeUndefined();
    });

    it('should convert date fields to Timestamps', async () => {
      const { result } = renderHook(() => useServiceTickets());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTicket('ticket-1', {
          scheduledDate: new Date('2024-02-01'),
          completedDate: new Date('2024-02-05'),
        });
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.scheduledDate).toBeDefined();
      expect(callArg.completedDate).toBeDefined();
    });
  });
});
