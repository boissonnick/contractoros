/**
 * @fileoverview Unit tests for useSubcontractorInvoices hook
 * Sprint 77: Unit Test Coverage
 *
 * Tests cover:
 * - useSubcontractorInvoices: Main hook for AP invoice management
 * - useVendorInvoices: Convenience hook for vendor-specific invoices
 * - usePendingApprovalInvoices: Convenience hook for pending approvals
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useSubcontractorInvoices,
  useVendorInvoices,
  usePendingApprovalInvoices,
} from '@/lib/hooks/useSubcontractorInvoices';
import { SubcontractorInvoice, LienWaiver, APInvoiceStatus } from '@/types';

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
  limit: jest.fn((n) => ({ n, _type: 'limit' })),
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

jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestampsDeep: jest.fn((data) => data),
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

const createMockInvoice = (overrides: Partial<SubcontractorInvoice> = {}): SubcontractorInvoice => ({
  id: `inv-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  vendorId: 'vendor-1',
  vendorName: 'ABC Plumbing',
  projectId: 'project-1',
  projectName: 'Main St Renovation',
  invoiceNumber: 'INV-001',
  invoiceDate: new Date('2024-01-15'),
  dueDate: new Date('2024-02-15'),
  amount: 5000,
  status: 'draft',
  lineItems: [{ description: 'Plumbing work', quantity: 1, unitPrice: 5000, total: 5000 }],
  createdBy: mockUserId,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockLienWaiver = (overrides: Partial<LienWaiver> = {}): LienWaiver => ({
  id: `waiver-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  invoiceId: 'inv-1',
  vendorId: 'vendor-1',
  vendorName: 'ABC Plumbing',
  projectId: 'project-1',
  waiverType: 'conditional_progress',
  amount: 5000,
  status: 'pending',
  requestedAt: new Date('2024-01-15'),
  requestedBy: mockUserId,
  createdAt: new Date('2024-01-15'),
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

  // Default mock for onSnapshot (invoices)
  (onSnapshot as jest.Mock).mockImplementation((_query, onNext, _onError) => {
    // Call with empty data immediately
    setTimeout(() => {
      onNext({
        docs: [],
      });
    }, 0);
    return jest.fn(); // Unsubscribe function
  });

  // Default mock implementations
  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-doc-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (deleteDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// useSubcontractorInvoices TESTS
// =============================================================================

describe('useSubcontractorInvoices', () => {
  describe('basic functionality', () => {
    it('should return empty invoices when no data', async () => {
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.invoices).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should return invoices from Firestore', async () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1' }),
        createMockInvoice({ id: 'inv-2' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockInvoices.map((inv) => ({
              id: inv.id,
              data: () => inv,
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(2);
      });

      expect(result.current.invoices[0].id).toBe('inv-1');
    });

    it('should handle Firestore errors', async () => {
      const error = new Error('Firestore error');

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        setTimeout(() => onError(error), 0);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBe('Firestore error');
      consoleSpy.mockRestore();
    });

    it('should handle index required error', async () => {
      const error = new Error('The query requires an index');

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        setTimeout(() => onError(error), 0);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBe('Database index required. Please deploy Firestore indexes.');
      consoleSpy.mockRestore();
    });

    it('should handle permission denied error', async () => {
      const error = new Error('permission-denied');

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        setTimeout(() => onError(error), 0);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBe('Permission denied. Please check Firestore security rules.');
      consoleSpy.mockRestore();
    });

    it('should not fetch without orgId', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('filtering', () => {
    it('should filter by vendorId', () => {
      renderHook(() => useSubcontractorInvoices({ vendorId: 'vendor-1' }));

      // Check that where was called for vendorId filter
      const { where } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('vendorId', '==', 'vendor-1');
    });

    it('should filter by projectId', () => {
      renderHook(() => useSubcontractorInvoices({ projectId: 'project-1' }));

      const { where } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('projectId', '==', 'project-1');
    });

    it('should filter by status', () => {
      renderHook(() => useSubcontractorInvoices({ status: 'submitted' }));

      const { where } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('status', '==', 'submitted');
    });
  });

  describe('createInvoice', () => {
    it('should create invoice and return id', async () => {
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newInvoice = {
        vendorId: 'vendor-1',
        vendorName: 'ABC Plumbing',
        projectId: 'project-1',
        projectName: 'Test Project',
        invoiceNumber: 'INV-002',
        invoiceDate: new Date(),
        dueDate: new Date(),
        amount: 1000,
        status: 'draft' as APInvoiceStatus,
        lineItems: [],
        updatedAt: new Date(),
      };

      let createdId: string;
      await act(async () => {
        createdId = await result.current.createInvoice(newInvoice);
      });

      expect(addDoc).toHaveBeenCalled();
      expect(createdId!).toBe('new-doc-id');
      expect(toast.success).toHaveBeenCalledWith('Subcontractor invoice created');
    });

    it('should throw error when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      await expect(
        result.current.createInvoice({
          vendorId: 'v1',
          vendorName: 'Test',
          projectId: 'p1',
          projectName: 'Test',
          invoiceNumber: '001',
          invoiceDate: new Date(),
          dueDate: new Date(),
          amount: 100,
          status: 'draft',
          lineItems: [],
          updatedAt: new Date(),
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should handle create error', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Create failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createInvoice({
          vendorId: 'v1',
          vendorName: 'Test',
          projectId: 'p1',
          projectName: 'Test',
          invoiceNumber: '001',
          invoiceDate: new Date(),
          dueDate: new Date(),
          amount: 100,
          status: 'draft',
          lineItems: [],
          updatedAt: new Date(),
        })
      ).rejects.toThrow('Create failed');

      expect(toast.error).toHaveBeenCalledWith('Failed to create invoice');
      consoleSpy.mockRestore();
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice', async () => {
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateInvoice('inv-1', { amount: 2000 });
      });

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      await expect(result.current.updateInvoice('inv-1', { amount: 2000 })).rejects.toThrow(
        'Not authenticated'
      );
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice', async () => {
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteInvoice('inv-1');
      });

      expect(deleteDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Invoice deleted');
    });

    it('should throw error when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      await expect(result.current.deleteInvoice('inv-1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('approval workflow', () => {
    describe('submitInvoice', () => {
      it('should submit invoice for approval', async () => {
        const { result } = renderHook(() => useSubcontractorInvoices());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await act(async () => {
          await result.current.submitInvoice('inv-1');
        });

        expect(updateDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Invoice submitted for approval');
      });
    });

    describe('approveInvoice', () => {
      it('should approve invoice when user is manager', async () => {
        const { result } = renderHook(() => useSubcontractorInvoices());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await act(async () => {
          await result.current.approveInvoice('inv-1');
        });

        expect(updateDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Invoice approved');
      });

      it('should throw error when user is not manager', async () => {
        mockUseAuth.mockReturnValue({
          user: mockUser,
          profile: { ...mockProfile, role: 'WORKER' },
        });

        const { result } = renderHook(() => useSubcontractorInvoices());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await expect(result.current.approveInvoice('inv-1')).rejects.toThrow(
          'Only managers can approve invoices'
        );
      });
    });

    describe('disputeInvoice', () => {
      it('should dispute invoice with reason', async () => {
        const { result } = renderHook(() => useSubcontractorInvoices());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await act(async () => {
          await result.current.disputeInvoice('inv-1', 'Incorrect amount');
        });

        expect(updateDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Invoice marked as disputed');
      });
    });

    describe('markPaid', () => {
      it('should mark invoice as paid when user is manager', async () => {
        const { result } = renderHook(() => useSubcontractorInvoices());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await act(async () => {
          await result.current.markPaid('inv-1', 'check', '12345');
        });

        expect(updateDoc).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Invoice marked as paid');
      });

      it('should throw error when user is not manager', async () => {
        mockUseAuth.mockReturnValue({
          user: mockUser,
          profile: { ...mockProfile, role: 'WORKER' },
        });

        const { result } = renderHook(() => useSubcontractorInvoices());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await expect(result.current.markPaid('inv-1')).rejects.toThrow(
          'Only managers can mark invoices as paid'
        );
      });
    });
  });

  describe('lien waivers', () => {
    it('should fetch lien waivers', async () => {
      const mockWaivers = [createMockLienWaiver({ id: 'waiver-1' })];

      // First call is for invoices, second is for lien waivers
      let callCount = 0;
      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        callCount++;
        if (callCount === 1) {
          // Invoices
          setTimeout(() => onNext({ docs: [] }), 0);
        } else {
          // Lien waivers
          setTimeout(
            () =>
              onNext({
                docs: mockWaivers.map((w) => ({
                  id: w.id,
                  data: () => w,
                })),
              }),
            0
          );
        }
        return jest.fn();
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.lienWaivers).toHaveLength(1);
      });

      expect(result.current.lienWaivers[0].id).toBe('waiver-1');
    });

    it('should request lien waiver', async () => {
      const { result } = renderHook(() => useSubcontractorInvoices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let waiverId: string;
      await act(async () => {
        waiverId = await result.current.requestLienWaiver(
          'inv-1',
          'vendor-1',
          'ABC Plumbing',
          'project-1',
          'conditional_progress',
          5000
        );
      });

      expect(addDoc).toHaveBeenCalled();
      expect(waiverId!).toBe('new-doc-id');
      expect(toast.success).toHaveBeenCalledWith('Lien waiver requested');
    });

    it('should throw error when requesting lien waiver without auth', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useSubcontractorInvoices());

      await expect(
        result.current.requestLienWaiver('inv-1', 'vendor-1', 'Test', 'project-1', 'conditional', 1000)
      ).rejects.toThrow('Not authenticated');
    });
  });
});

// =============================================================================
// CONVENIENCE HOOKS TESTS
// =============================================================================

describe('useVendorInvoices', () => {
  it('should call useSubcontractorInvoices with vendorId', () => {
    renderHook(() => useVendorInvoices('vendor-123'));

    const { where } = require('firebase/firestore');
    expect(where).toHaveBeenCalledWith('vendorId', '==', 'vendor-123');
  });
});

describe('usePendingApprovalInvoices', () => {
  it('should call useSubcontractorInvoices with submitted status', () => {
    renderHook(() => usePendingApprovalInvoices());

    const { where } = require('firebase/firestore');
    expect(where).toHaveBeenCalledWith('status', '==', 'submitted');
  });
});
