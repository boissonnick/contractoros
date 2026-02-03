/**
 * useInvoices Hook Tests
 *
 * Comprehensive tests for invoice management hooks including:
 * - useInvoices: List and filter invoices
 * - useInvoice: Single invoice with CRUD operations
 * - useInvoiceStats: Aggregate invoice statistics
 * - createInvoice: Invoice creation
 * - calculateInvoiceTotals: Total calculation utility
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useInvoices,
  useInvoice,
  useInvoiceStats,
  createInvoice,
  calculateInvoiceTotals,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
} from '@/lib/hooks/useInvoices';
import { Invoice, InvoiceLineItem, InvoiceStatus } from '@/types';

// Mock Firestore functions
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockGetCountFromServer = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getCountFromServer: (...args: unknown[]) => mockGetCountFromServer(...args),
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

// Mock auto-number utility
jest.mock('@/lib/utils/auto-number', () => ({
  reserveNumber: jest.fn().mockResolvedValue('INV-001'),
  getNextNumber: jest.fn().mockResolvedValue('INV-001'),
}));

// Mock useFirestoreCollection
const mockUseFirestoreCollection = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCollection', () => ({
  useFirestoreCollection: (...args: unknown[]) => mockUseFirestoreCollection(...args),
  createConverter: (fn: Function) => fn,
}));

// Mock useFirestoreCrud
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockCreate = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCrud', () => ({
  useFirestoreCrud: () => ({
    update: mockUpdate,
    remove: mockRemove,
    create: mockCreate,
  }),
}));

// Helper to create mock invoice data
const createMockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'inv-1',
  number: 'INV-001',
  orgId: 'org-123',
  type: 'standard',
  status: 'draft',
  clientId: 'client-1',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  projectId: 'project-1',
  projectName: 'Home Renovation',
  lineItems: [
    {
      id: 'item-1',
      sortOrder: 0,
      description: 'Labor',
      quantity: 10,
      unit: 'hours',
      unitPrice: 50,
      amount: 500,
    },
  ],
  subtotal: 500,
  taxRate: 10,
  taxAmount: 50,
  retainage: 0,
  retainageAmount: 0,
  total: 550,
  amountDue: 550,
  amountPaid: 0,
  paymentTerms: 'Net 30',
  dueDate: new Date('2024-02-15'),
  createdBy: 'user-1',
  createdByName: 'Admin User',
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockLineItem = (overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem => ({
  id: 'item-1',
  sortOrder: 0,
  description: 'Test Item',
  quantity: 1,
  unit: 'each',
  unitPrice: 100,
  amount: 100,
  ...overrides,
});

describe('useInvoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return empty array when no orgId is provided', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 0,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: '' })
      );

      expect(result.current.invoices).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should return invoices for organization', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', number: 'INV-001' }),
        createMockInvoice({ id: 'inv-2', number: 'INV-002' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 2,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123' })
      );

      expect(result.current.invoices).toHaveLength(2);
      expect(result.current.invoices[0].number).toBe('INV-001');
      expect(result.current.totalCount).toBe(2);
    });

    it('should handle loading state correctly', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
        count: 0,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123' })
      );

      expect(result.current.loading).toBe(true);
    });

    it('should handle error state', () => {
      const mockError = new Error('Firestore error');
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
        count: 0,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123' })
      );

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('Filtering', () => {
    it('should filter by status (draft)', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', status: 'draft' }),
        createMockInvoice({ id: 'inv-2', status: 'sent' }),
      ];

      // When status filter is applied, useFirestoreCollection is called with constraints
      mockUseFirestoreCollection.mockReturnValue({
        items: [mockInvoices[0]], // Only draft returned from Firestore
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 1,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', status: 'draft' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].status).toBe('draft');
    });

    it('should filter by status (sent)', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', status: 'sent' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 1,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', status: 'sent' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].status).toBe('sent');
    });

    it('should filter by status (paid)', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', status: 'paid', paidAt: new Date() }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 1,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', status: 'paid' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].status).toBe('paid');
    });

    it('should filter by overdue status (client-side)', () => {
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 10);

      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', status: 'overdue', dueDate: pastDueDate }),
        createMockInvoice({ id: 'inv-2', status: 'draft' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 2,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', status: 'overdue' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].status).toBe('overdue');
    });

    it('should filter by client', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', clientId: 'client-1', clientName: 'John' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 1,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', clientId: 'client-1' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].clientId).toBe('client-1');
    });

    it('should filter by projectId', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', projectId: 'project-1' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 1,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', projectId: 'project-1' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].projectId).toBe('project-1');
    });

    it('should filter by search term (invoice number)', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', number: 'INV-001' }),
        createMockInvoice({ id: 'inv-2', number: 'INV-002' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 2,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', search: 'INV-001' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].number).toBe('INV-001');
    });

    it('should filter by search term (client name)', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', clientName: 'John Doe' }),
        createMockInvoice({ id: 'inv-2', clientName: 'Jane Smith' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 2,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', search: 'john' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].clientName).toBe('John Doe');
    });

    it('should filter by search term (project name)', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', projectName: 'Kitchen Remodel' }),
        createMockInvoice({ id: 'inv-2', projectName: 'Bathroom Renovation' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 2,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', search: 'kitchen' })
      );

      expect(result.current.invoices).toHaveLength(1);
      expect(result.current.invoices[0].projectName).toBe('Kitchen Remodel');
    });

    it('should return all invoices when status is "all"', () => {
      const mockInvoices = [
        createMockInvoice({ id: 'inv-1', status: 'draft' }),
        createMockInvoice({ id: 'inv-2', status: 'sent' }),
        createMockInvoice({ id: 'inv-3', status: 'paid' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockInvoices,
        loading: false,
        error: null,
        refetch: jest.fn(),
        count: 3,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123', status: 'all' })
      );

      expect(result.current.invoices).toHaveLength(3);
    });
  });

  describe('Refresh functionality', () => {
    it('should provide refresh function', () => {
      const mockRefetch = jest.fn();
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
        count: 0,
      });

      const { result } = renderHook(() =>
        useInvoices({ orgId: 'org-123' })
      );

      expect(typeof result.current.refresh).toBe('function');
      result.current.refresh();
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});

describe('useInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation((ref, onNext) => {
      // Return empty by default
      onNext({
        exists: () => false,
        data: () => null,
        id: 'inv-1',
      });
      return jest.fn(); // unsubscribe
    });
  });

  describe('Basic functionality', () => {
    it('should return null when no invoiceId', () => {
      const { result } = renderHook(() =>
        useInvoice(undefined, 'org-123')
      );

      expect(result.current.invoice).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should return null when no orgId', () => {
      const { result } = renderHook(() =>
        useInvoice('inv-1', '')
      );

      expect(result.current.invoice).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should fetch invoice by ID', async () => {
      const mockInvoice = createMockInvoice();
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            ...mockInvoice,
            dueDate: { toDate: () => mockInvoice.dueDate },
            createdAt: { toDate: () => mockInvoice.createdAt },
          }),
          id: 'inv-1',
        });
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.invoice).not.toBeNull();
      expect(result.current.invoice?.id).toBe('inv-1');
    });

    it('should handle loading state', () => {
      mockOnSnapshot.mockImplementation(() => {
        // Never call the callback to simulate loading
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      expect(result.current.loading).toBe(true);
    });

    it('should handle invoice not found', async () => {
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => false,
          data: () => null,
          id: 'inv-1',
        });
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.invoice).toBeNull();
    });

    it('should handle error state', async () => {
      const mockError = new Error('Firestore error');
      mockOnSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(mockError);
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('CRUD operations', () => {
    beforeEach(() => {
      const mockInvoice = createMockInvoice();
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            ...mockInvoice,
            payments: [],
            dueDate: { toDate: () => mockInvoice.dueDate },
            createdAt: { toDate: () => mockInvoice.createdAt },
          }),
          id: 'inv-1',
        });
        return jest.fn();
      });
    });

    it('should update invoice', async () => {
      mockUpdate.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.updateInvoice({ notes: 'Updated note' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('inv-1', { notes: 'Updated note' });
    });

    it('should delete invoice', async () => {
      mockRemove.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.deleteInvoice();
      });

      expect(mockRemove).toHaveBeenCalledWith('inv-1');
    });

    it('should mark invoice as paid', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.markAsPaid({
          amount: 550,
          method: 'check',
          reference: 'CHK-123',
          receivedAt: new Date(),
          recordedBy: 'user-1',
          recordedByName: 'Admin',
        });
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.status).toBe('paid');
      expect(updateData.amountPaid).toBe(550);
      expect(updateData.amountDue).toBe(0);
    });

    it('should mark invoice as partial when not fully paid', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.markAsPaid({
          amount: 200, // Less than total (550)
          method: 'check',
          reference: 'CHK-123',
          receivedAt: new Date(),
          recordedBy: 'user-1',
          recordedByName: 'Admin',
        });
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.status).toBe('partial');
      expect(updateData.amountPaid).toBe(200);
      expect(updateData.amountDue).toBe(350);
    });

    it('should send invoice', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.sendInvoice();
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.status).toBe('sent');
      expect(updateData.sentAt).toBeDefined();
    });

    it('should void invoice with reason', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.voidInvoice('Duplicate invoice');
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.status).toBe('void');
      expect(updateData.voidReason).toBe('Duplicate invoice');
      expect(updateData.voidedAt).toBeDefined();
    });

    it('should add payment (alias for markAsPaid)', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useInvoice('inv-1', 'org-123')
      );

      await waitFor(() => {
        expect(result.current.invoice).not.toBeNull();
      });

      await act(async () => {
        await result.current.addPayment({
          amount: 100,
          method: 'credit_card',
          receivedAt: new Date(),
          recordedBy: 'user-1',
          recordedByName: 'Admin',
        });
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('Error handling for operations', () => {
    it('should throw error when updating without invoiceId', async () => {
      const { result } = renderHook(() =>
        useInvoice(undefined, 'org-123')
      );

      await expect(
        result.current.updateInvoice({ notes: 'test' })
      ).rejects.toThrow('Invoice ID and Org ID required');
    });

    it('should throw error when deleting without invoiceId', async () => {
      const { result } = renderHook(() =>
        useInvoice(undefined, 'org-123')
      );

      await expect(result.current.deleteInvoice()).rejects.toThrow(
        'Invoice ID and Org ID required'
      );
    });
  });
});

describe('useInvoiceStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return zero stats when no invoices', () => {
    mockUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      count: 0,
    });

    const { result } = renderHook(() => useInvoiceStats('org-123'));

    expect(result.current.stats).toEqual({
      total: 0,
      outstandingCount: 0,
      outstandingAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      paidThisMonth: 0,
      draftCount: 0,
      sentCount: 0,
    });
  });

  it('should calculate stats correctly', () => {
    const now = new Date();
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 10);

    const mockInvoices = [
      createMockInvoice({ id: 'inv-1', status: 'draft', amountDue: 100 }),
      createMockInvoice({ id: 'inv-2', status: 'sent', amountDue: 200 }),
      createMockInvoice({ id: 'inv-3', status: 'overdue', amountDue: 300, dueDate: pastDueDate }),
      createMockInvoice({
        id: 'inv-4',
        status: 'paid',
        amountPaid: 400,
        amountDue: 0,
        paidAt: now,
      }),
    ];

    mockUseFirestoreCollection.mockReturnValue({
      items: mockInvoices,
      loading: false,
      error: null,
      refetch: jest.fn(),
      count: 4,
    });

    const { result } = renderHook(() => useInvoiceStats('org-123'));

    expect(result.current.stats.total).toBe(4);
    expect(result.current.stats.draftCount).toBe(1);
    expect(result.current.stats.sentCount).toBe(1);
    expect(result.current.stats.overdueCount).toBe(1);
    expect(result.current.stats.overdueAmount).toBe(300);
    expect(result.current.stats.outstandingCount).toBe(2); // sent + overdue
    expect(result.current.stats.outstandingAmount).toBe(500); // 200 + 300
    expect(result.current.stats.paidThisMonth).toBe(400);
  });

  it('should handle loading state', () => {
    mockUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
      count: 0,
    });

    const { result } = renderHook(() => useInvoiceStats('org-123'));

    expect(result.current.loading).toBe(true);
  });

  it('should only count paid invoices from current month', () => {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const mockInvoices = [
      createMockInvoice({
        id: 'inv-1',
        status: 'paid',
        amountPaid: 100,
        paidAt: now,
      }),
      createMockInvoice({
        id: 'inv-2',
        status: 'paid',
        amountPaid: 200,
        paidAt: lastMonth,
      }),
    ];

    mockUseFirestoreCollection.mockReturnValue({
      items: mockInvoices,
      loading: false,
      error: null,
      refetch: jest.fn(),
      count: 2,
    });

    const { result } = renderHook(() => useInvoiceStats('org-123'));

    expect(result.current.stats.paidThisMonth).toBe(100);
  });
});

describe('createInvoice', () => {
  const { reserveNumber } = require('@/lib/utils/auto-number');

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-inv-id' });
    reserveNumber.mockResolvedValue('INV-001');
  });

  it('should create invoice with auto-generated number', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      lineItems: [createMockLineItem({ amount: 100 })],
      paymentTerms: 'Net 30',
    };

    const id = await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin User');

    expect(id).toBe('new-inv-id');
    expect(reserveNumber).toHaveBeenCalledWith('org-123', 'invoice');
    expect(mockAddDoc).toHaveBeenCalled();

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];
    expect(invoiceDoc.number).toBe('INV-001');
    expect(invoiceDoc.status).toBe('draft');
    expect(invoiceDoc.orgId).toBe('org-123');
  });

  it('should calculate totals correctly with line items', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      lineItems: [
        createMockLineItem({ amount: 100 }),
        createMockLineItem({ id: 'item-2', amount: 200 }),
      ],
      paymentTerms: 'Net 30',
      taxRate: 10,
    };

    await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin');

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];
    expect(invoiceDoc.subtotal).toBe(300);
    expect(invoiceDoc.taxAmount).toBe(30);
    expect(invoiceDoc.total).toBe(330);
    expect(invoiceDoc.amountDue).toBe(330);
    expect(invoiceDoc.amountPaid).toBe(0);
  });

  it('should calculate due date based on payment terms', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      lineItems: [createMockLineItem()],
      paymentTerms: 'Net 15',
    };

    await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin');

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];

    // Due date should be 15 days from now
    const expectedDueDate = new Date();
    expectedDueDate.setDate(expectedDueDate.getDate() + 15);
    const actualDueDate = invoiceDoc.dueDate.toDate();

    // Compare dates (within 1 day tolerance for test timing)
    const daysDiff = Math.abs(actualDueDate.getDate() - expectedDueDate.getDate());
    expect(daysDiff).toBeLessThanOrEqual(1);
  });

  it('should handle "Due on Receipt" payment terms', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      lineItems: [createMockLineItem()],
      paymentTerms: 'Due on Receipt',
    };

    await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin');

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];
    const dueDate = invoiceDoc.dueDate.toDate();
    const now = new Date();

    // Due date should be today
    expect(dueDate.toDateString()).toBe(now.toDateString());
  });

  it('should throw error when orgId is not provided', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      lineItems: [createMockLineItem()],
      paymentTerms: 'Net 30',
    };

    await expect(
      createInvoice(invoiceData, '', 'user-1', 'Admin')
    ).rejects.toThrow('Organization ID required');
  });

  it('should apply retainage correctly', async () => {
    const invoiceData = {
      type: 'progress' as const,
      clientName: 'John Doe',
      lineItems: [createMockLineItem({ amount: 1000 })],
      paymentTerms: 'Net 30',
      retainage: 10, // 10% retainage
    };

    await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin');

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];
    expect(invoiceDoc.subtotal).toBe(1000);
    expect(invoiceDoc.retainageAmount).toBe(100);
    expect(invoiceDoc.total).toBe(900); // 1000 - 100
  });

  it('should apply percent discount correctly', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      lineItems: [createMockLineItem({ amount: 1000 })],
      paymentTerms: 'Net 30',
      discount: 10, // 10%
      discountType: 'percent' as const,
    };

    await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin');

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];
    expect(invoiceDoc.total).toBe(900); // 1000 - 100
  });

  it('should apply fixed discount correctly', async () => {
    const invoiceData = {
      type: 'standard' as const,
      clientName: 'John Doe',
      lineItems: [createMockLineItem({ amount: 1000 })],
      paymentTerms: 'Net 30',
      discount: 50, // $50
      discountType: 'fixed' as const,
    };

    await createInvoice(invoiceData, 'org-123', 'user-1', 'Admin');

    const addDocCall = mockAddDoc.mock.calls[0];
    const invoiceDoc = addDocCall[1];
    expect(invoiceDoc.total).toBe(950); // 1000 - 50
  });
});

describe('calculateInvoiceTotals', () => {
  it('should calculate subtotal from line items', () => {
    const lineItems = [
      createMockLineItem({ amount: 100 }),
      createMockLineItem({ id: 'item-2', amount: 200 }),
      createMockLineItem({ id: 'item-3', amount: 300 }),
    ];

    const totals = calculateInvoiceTotals(lineItems);

    expect(totals.subtotal).toBe(600);
  });

  it('should calculate tax correctly', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    const totals = calculateInvoiceTotals(lineItems, 8.5); // 8.5% tax

    expect(totals.subtotal).toBe(1000);
    expect(totals.taxAmount).toBe(85);
    expect(totals.total).toBe(1085);
  });

  it('should calculate retainage correctly', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    const totals = calculateInvoiceTotals(lineItems, 0, 10); // 10% retainage

    expect(totals.subtotal).toBe(1000);
    expect(totals.retainageAmount).toBe(100);
    expect(totals.total).toBe(900);
  });

  it('should calculate percent discount correctly', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    const totals = calculateInvoiceTotals(lineItems, 0, 0, 15, 'percent');

    expect(totals.discountAmount).toBe(150);
    expect(totals.total).toBe(850);
  });

  it('should calculate fixed discount correctly', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    const totals = calculateInvoiceTotals(lineItems, 0, 0, 75, 'fixed');

    expect(totals.discountAmount).toBe(75);
    expect(totals.total).toBe(925);
  });

  it('should calculate amount due with amount paid', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    const totals = calculateInvoiceTotals(lineItems, 0, 0, 0, 'percent', 400);

    expect(totals.total).toBe(1000);
    expect(totals.amountDue).toBe(600);
  });

  it('should not return negative amount due', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    const totals = calculateInvoiceTotals(lineItems, 0, 0, 0, 'percent', 1500);

    expect(totals.amountDue).toBe(0);
  });

  it('should handle all modifiers together', () => {
    const lineItems = [createMockLineItem({ amount: 1000 })];

    // Subtotal: 1000
    // Tax (10%): +100 = 1100
    // Retainage (5%): -50 = 1050
    // Discount (10%): -100 = 950
    // Amount paid: 200
    // Amount due: 750
    const totals = calculateInvoiceTotals(lineItems, 10, 5, 10, 'percent', 200);

    expect(totals.subtotal).toBe(1000);
    expect(totals.taxAmount).toBe(100);
    expect(totals.retainageAmount).toBe(50);
    expect(totals.discountAmount).toBe(100);
    expect(totals.total).toBe(950);
    expect(totals.amountDue).toBe(750);
  });

  it('should handle empty line items', () => {
    const totals = calculateInvoiceTotals([]);

    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.amountDue).toBe(0);
  });
});

describe('Status and Type Labels', () => {
  it('should have labels for all invoice statuses', () => {
    const statuses: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void'];

    statuses.forEach((status) => {
      expect(INVOICE_STATUS_LABELS[status]).toBeDefined();
      expect(typeof INVOICE_STATUS_LABELS[status]).toBe('string');
    });
  });

  it('should have labels for all invoice types', () => {
    const types: Invoice['type'][] = ['standard', 'progress', 'aia_g702', 'deposit', 'final', 'change_order'];

    types.forEach((type) => {
      expect(INVOICE_TYPE_LABELS[type]).toBeDefined();
      expect(typeof INVOICE_TYPE_LABELS[type]).toBe('string');
    });
  });

  it('should have correct label values', () => {
    expect(INVOICE_STATUS_LABELS.draft).toBe('Draft');
    expect(INVOICE_STATUS_LABELS.sent).toBe('Sent');
    expect(INVOICE_STATUS_LABELS.paid).toBe('Paid');
    expect(INVOICE_STATUS_LABELS.overdue).toBe('Overdue');

    expect(INVOICE_TYPE_LABELS.standard).toBe('Standard');
    expect(INVOICE_TYPE_LABELS.progress).toBe('Progress');
    expect(INVOICE_TYPE_LABELS.aia_g702).toBe('AIA G702/G703');
  });
});
