/**
 * @fileoverview Unit tests for usePayments and useSavedPaymentMethods hooks
 * Sprint 80: Unit Test Coverage — Payments
 *
 * Tests cover:
 * - usePayments: Real-time subscriptions, filters, createPaymentIntent, createPaymentLink, cancelPaymentLink, processRefund, getStats
 * - useSavedPaymentMethods: Real-time subscription, setDefaultMethod, deleteMethod, defaultMethod
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePayments, useSavedPaymentMethods } from '@/lib/hooks/usePayments';

// =============================================================================
// MOCKS
// =============================================================================

const mockUser = { uid: 'user-123', email: 'test@example.com' };
const mockProfile = { orgId: 'org-123', role: 'OWNER' };

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({ user: mockUser, profile: mockProfile })),
}));

jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/payments/paymentUtils', () => ({
  generatePaymentLinkToken: jest.fn(() => 'mock-token-abc'),
  getPaymentLinkExpiration: jest.fn(() => new Date('2025-12-31')),
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
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import {
  onSnapshot,
  addDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const mockOrgId = 'org-123';

function createMockPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: `pay-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    invoiceId: 'inv-1',
    projectId: 'proj-1',
    clientId: 'client-1',
    amount: 5000,
    currency: 'USD',
    paymentMethod: 'card',
    stripePaymentIntentId: 'pi_123',
    status: 'completed',
    description: 'Payment for invoice #1',
    createdAt: new Date(),
    ...overrides,
  };
}

function toFirestoreDoc(item: Record<string, unknown>) {
  return {
    id: item.id,
    data: () => {
      const raw: Record<string, unknown> = { ...item };
      delete raw.id;
      // Convert Date fields to Firestore Timestamp-like objects
      for (const key of ['createdAt', 'processedAt', 'completedAt', 'refundedAt', 'receiptSentAt', 'expiresAt', 'usedAt', 'updatedAt', 'deletedAt']) {
        if (raw[key] instanceof Date) {
          const d = raw[key] as Date;
          raw[key] = { toDate: () => d };
        }
      }
      return raw;
    },
  };
}

function _createMockPaymentLink(overrides: Record<string, unknown> = {}) {
  return {
    id: `link-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    invoiceId: 'inv-1',
    projectId: 'proj-1',
    clientId: 'client-1',
    token: 'tok-abc',
    amount: 1500,
    currency: 'USD',
    status: 'active',
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockSavedMethod(overrides: Record<string, unknown> = {}) {
  return {
    id: `method-${Math.random().toString(36).slice(2, 8)}`,
    orgId: mockOrgId,
    clientId: 'client-1',
    stripePaymentMethodId: 'pm_123',
    stripeCustomerId: 'cus_123',
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expMonth: 12,
    expYear: 2026,
    isDefault: false,
    createdAt: new Date(),
    ...overrides,
  };
}

// =============================================================================
// SETUP / TEARDOWN
// =============================================================================

let _paymentsCallback: ((snap: { docs: unknown[] }) => void) | null = null;
let _paymentsErrorCallback: ((err: Error) => void) | null = null;
let _linksCallback: ((snap: { docs: unknown[] }) => void) | null = null;

const mockFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  _paymentsCallback = null;
  _paymentsErrorCallback = null;
  _linksCallback = null;

  global.fetch = mockFetch as unknown as typeof fetch;

  (useAuth as jest.Mock).mockReturnValue({ user: mockUser, profile: mockProfile });

  // Track onSnapshot calls — first call is payments, second is payment links
  let snapshotCallCount = 0;
  (onSnapshot as jest.Mock).mockImplementation(
    (_q: unknown, onNext: (snap: { docs: unknown[] }) => void, onError?: (err: Error) => void) => {
      snapshotCallCount++;
      if (snapshotCallCount === 1) {
        _paymentsCallback = onNext;
        _paymentsErrorCallback = onError || null;
        setTimeout(() => onNext({ docs: [] }), 0);
      } else {
        _linksCallback = onNext;
        setTimeout(() => onNext({ docs: [] }), 0);
      }
      return jest.fn();
    }
  );

  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-link-1' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  delete (global as Record<string, unknown>).fetch;
});

// =============================================================================
// usePayments
// =============================================================================

describe('usePayments', () => {
  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() => usePayments());
      expect(result.current.loading).toBe(true);
      expect(result.current.payments).toEqual([]);
      expect(result.current.paymentLinks).toEqual([]);
    });

    it('should set loading=false after snapshot', async () => {
      const { result } = renderHook(() => usePayments());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.payments).toEqual([]);
    });

    it('should set loading=false when no orgId', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => usePayments());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching payments', () => {
    it('should fetch payments from Firestore snapshot', async () => {
      const mockPayments = [
        createMockPayment({ id: 'pay-1', amount: 5000 }),
        createMockPayment({ id: 'pay-2', amount: 3000, status: 'pending' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: mockPayments.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => usePayments());

      await waitFor(() => {
        expect(result.current.payments).toHaveLength(2);
      });

      expect(result.current.payments[0].id).toBe('pay-1');
      expect(result.current.payments[0].amount).toBe(5000);
    });

    it('should apply invoiceId filter', () => {
      renderHook(() => usePayments({ invoiceId: 'inv-42' }));
      expect(where).toHaveBeenCalledWith('invoiceId', '==', 'inv-42');
    });

    it('should apply projectId filter', () => {
      renderHook(() => usePayments({ projectId: 'proj-42' }));
      expect(where).toHaveBeenCalledWith('projectId', '==', 'proj-42');
    });

    it('should apply clientId filter', () => {
      renderHook(() => usePayments({ clientId: 'client-42' }));
      expect(where).toHaveBeenCalledWith('clientId', '==', 'client-42');
    });
  });

  describe('createPaymentIntent', () => {
    it('should call fetch API and return data', async () => {
      const mockResponse = { clientSecret: 'cs_123', paymentIntentId: 'pi_456' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let data: unknown;
      await act(async () => {
        data = await result.current.createPaymentIntent({
          invoiceId: 'inv-1',
          projectId: 'proj-1',
          clientId: 'client-1',
          amount: 5000,
          description: 'Test payment',
        });
      });

      expect(data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    it('should return null and show error toast on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Stripe error' }),
      });

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let data: unknown;
      await act(async () => {
        data = await result.current.createPaymentIntent({
          invoiceId: 'inv-1',
          projectId: 'proj-1',
          clientId: 'client-1',
          amount: 5000,
          description: 'Test',
        });
      });

      expect(data).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Stripe error');
    });

    it('should return null when no user', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, profile: mockProfile });

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let data: unknown;
      await act(async () => {
        data = await result.current.createPaymentIntent({
          invoiceId: 'inv-1',
          projectId: 'proj-1',
          clientId: 'client-1',
          amount: 5000,
          description: 'Test',
        });
      });

      expect(data).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('You must be logged in to create payments');
    });
  });

  describe('createPaymentLink', () => {
    it('should create payment link in Firestore and return link data', async () => {
      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let linkData: unknown;
      await act(async () => {
        linkData = await result.current.createPaymentLink({
          invoiceId: 'inv-1',
          projectId: 'proj-1',
          clientId: 'client-1',
          amount: 1500,
        });
      });

      expect(addDoc).toHaveBeenCalled();
      expect(linkData).toMatchObject({
        id: 'new-link-1',
        token: 'mock-token-abc',
      });
      expect(toast.success).toHaveBeenCalledWith('Payment link created');
    });

    it('should return null and toast error on Firestore failure', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Firestore write failed'));

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let linkData: unknown;
      await act(async () => {
        linkData = await result.current.createPaymentLink({
          invoiceId: 'inv-1',
          projectId: 'proj-1',
          clientId: 'client-1',
          amount: 1500,
        });
      });

      expect(linkData).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to create payment link');
    });
  });

  describe('cancelPaymentLink', () => {
    it('should update link status to cancelled', async () => {
      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.cancelPaymentLink('link-1');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        undefined, // doc() returns undefined in mock
        expect.objectContaining({ status: 'cancelled' })
      );
      expect(toast.success).toHaveBeenCalledWith('Payment link cancelled');
    });

    it('should show error toast on failure', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.cancelPaymentLink('link-1');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to cancel payment link');
    });
  });

  describe('processRefund', () => {
    it('should call refund API and return true on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.processRefund('pay-1', 50, 'Customer request');
      });

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/pay-1/refund',
        expect.objectContaining({ method: 'POST' })
      );
      expect(toast.success).toHaveBeenCalledWith('Refund processed successfully');
    });

    it('should return false on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Refund limit exceeded' }),
      });

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.processRefund('pay-1');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Refund limit exceeded');
    });

    it('should return false when no user', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, profile: mockProfile });

      const { result } = renderHook(() => usePayments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.processRefund('pay-1');
      });

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('You must be logged in to process refunds');
    });
  });

  describe('getStats', () => {
    it('should compute stats from payments', async () => {
      const payments = [
        createMockPayment({ id: 'p1', status: 'completed', amount: 5000 }),
        createMockPayment({ id: 'p2', status: 'completed', amount: 3000 }),
        createMockPayment({ id: 'p3', status: 'pending', amount: 2000 }),
        createMockPayment({ id: 'p4', status: 'failed', amount: 1000 }),
        createMockPayment({ id: 'p5', status: 'refunded', amount: 500, refundAmount: 500 }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: payments.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => usePayments());

      await waitFor(() => {
        expect(result.current.payments).toHaveLength(5);
      });

      const stats = result.current.getStats();
      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.totalCollected).toBe(8000);
      expect(stats.totalPending).toBe(2000);
      expect(stats.totalRefunded).toBe(500);
    });
  });

  describe('error handling', () => {
    it('should handle snapshot error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, _onNext: unknown, onError: (err: Error) => void) => {
          setTimeout(() => onError(new Error('Permission denied')), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => usePayments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('usePayments error'), expect.anything());
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsub = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: [] }), 0);
          return mockUnsub;
        }
      );

      const { unmount } = renderHook(() => usePayments());
      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });
      unmount();
      // Both payments and links subscriptions should unsubscribe
      expect(mockUnsub).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// useSavedPaymentMethods
// =============================================================================

describe('useSavedPaymentMethods', () => {
  beforeEach(() => {
    // Reset onSnapshot for single-subscription hook
    (onSnapshot as jest.Mock).mockImplementation(
      (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
        setTimeout(() => onNext({ docs: [] }), 0);
        return jest.fn();
      }
    );
  });

  describe('loading and initial state', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());
      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));
      expect(result.current.loading).toBe(true);
      expect(result.current.methods).toEqual([]);
    });

    it('should set loading=false when no orgId', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: mockUser, profile: null });
      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should set loading=false when no clientId', async () => {
      const { result } = renderHook(() => useSavedPaymentMethods(''));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching methods', () => {
    it('should fetch saved payment methods', async () => {
      const methods = [
        createMockSavedMethod({ id: 'method-1', last4: '4242', isDefault: true }),
        createMockSavedMethod({ id: 'method-2', last4: '1234', isDefault: false }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: methods.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));

      await waitFor(() => {
        expect(result.current.methods).toHaveLength(2);
      });

      expect(result.current.methods[0].last4).toBe('4242');
      expect(result.current.loading).toBe(false);
    });

    it('should filter with orgId, clientId, and deletedAt==null', () => {
      renderHook(() => useSavedPaymentMethods('client-1'));
      expect(where).toHaveBeenCalledWith('orgId', '==', mockOrgId);
      expect(where).toHaveBeenCalledWith('clientId', '==', 'client-1');
      expect(where).toHaveBeenCalledWith('deletedAt', '==', null);
    });
  });

  describe('defaultMethod', () => {
    it('should return the default method', async () => {
      const methods = [
        createMockSavedMethod({ id: 'method-1', isDefault: false }),
        createMockSavedMethod({ id: 'method-2', isDefault: true }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: methods.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));

      await waitFor(() => {
        expect(result.current.methods).toHaveLength(2);
      });

      expect(result.current.defaultMethod?.id).toBe('method-2');
    });

    it('should fallback to first method if none is default', async () => {
      const methods = [
        createMockSavedMethod({ id: 'method-1', isDefault: false }),
        createMockSavedMethod({ id: 'method-2', isDefault: false }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: methods.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));

      await waitFor(() => {
        expect(result.current.methods).toHaveLength(2);
      });

      expect(result.current.defaultMethod?.id).toBe('method-1');
    });
  });

  describe('setDefaultMethod', () => {
    it('should unset old default and set new default', async () => {
      const methods = [
        createMockSavedMethod({ id: 'method-1', isDefault: true }),
        createMockSavedMethod({ id: 'method-2', isDefault: false }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: methods.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));

      await waitFor(() => {
        expect(result.current.methods).toHaveLength(2);
      });

      await act(async () => {
        await result.current.setDefaultMethod('method-2');
      });

      // Should be called twice: unset old + set new
      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith('Default payment method updated');
    });

    it('should handle error when setting default', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('fail'));

      const methods = [
        createMockSavedMethod({ id: 'method-1', isDefault: true }),
      ];

      (onSnapshot as jest.Mock).mockImplementation(
        (_q: unknown, onNext: (snap: { docs: unknown[] }) => void) => {
          setTimeout(() => onNext({ docs: methods.map(toFirestoreDoc) }), 0);
          return jest.fn();
        }
      );

      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));
      await waitFor(() => expect(result.current.methods).toHaveLength(1));

      await act(async () => {
        await result.current.setDefaultMethod('method-2');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to update default payment method');
    });
  });

  describe('deleteMethod', () => {
    it('should soft-delete a payment method', async () => {
      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMethod('method-1');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        undefined, // doc() returns undefined in mock
        expect.objectContaining({ deletedAt: expect.anything() })
      );
      expect(toast.success).toHaveBeenCalledWith('Payment method removed');
    });

    it('should show error toast on delete failure', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useSavedPaymentMethods('client-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMethod('method-1');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to remove payment method');
    });
  });
});
