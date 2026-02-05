/**
 * @fileoverview Tests for useCompanyStats hook
 *
 * Tests the company-wide financial statistics hook including:
 * - Revenue MTD/YTD computation from paid invoices
 * - Average margin from active project profitability
 * - Pipeline value from open estimates
 * - Active project count
 * - AR aging buckets
 * - Monthly trends (revenue, expenses, profit, margin)
 * - Error handling and refresh
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCompanyStats } from '@/lib/hooks/useCompanyStats';

// ============================================
// Mocks
// ============================================

const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({ db: {} }));

const mockProfile = {
  uid: 'user-1',
  orgId: 'org-1',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

const mockUseAuth = jest.fn(() => ({
  user: { uid: 'user-1', email: 'test@test.com' },
  profile: mockProfile,
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestamps: jest.fn((data) => data),
  convertTimestampsDeep: jest.fn((data) => data),
}));

// We need to mock date-fns so tests are deterministic.
// Fix "now" to 2024-06-15 for reproducible date math.
const FIXED_NOW = new Date('2024-06-15T12:00:00Z');

// next.config.js uses modularizeImports which transforms
// `import { startOfMonth } from 'date-fns'` into `import startOfMonth from 'date-fns/startOfMonth'`
// So we must mock each submodule individually with a default export.
// Note: jest.mock factories are hoisted, so we inline the implementations.

jest.mock('date-fns/startOfMonth', () => ({
  __esModule: true,
  default: (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1),
}));
jest.mock('date-fns/endOfMonth', () => ({
  __esModule: true,
  default: (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
}));
jest.mock('date-fns/subMonths', () => ({
  __esModule: true,
  default: (d: Date, n: number) => {
    const result = new Date(d);
    result.setMonth(result.getMonth() - n);
    return result;
  },
}));
jest.mock('date-fns/format', () => ({
  __esModule: true,
  default: (_d: Date, fmt: string) => {
    if (fmt === 'MMM') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[_d.getMonth()];
    }
    return '';
  },
}));
jest.mock('date-fns/differenceInDays', () => ({
  __esModule: true,
  default: (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86400000),
}));

// Also mock the main module in case anything imports from there directly
jest.mock('date-fns', () => ({
  startOfMonth: (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1),
  endOfMonth: (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
  subMonths: (d: Date, n: number) => {
    const result = new Date(d);
    result.setMonth(result.getMonth() - n);
    return result;
  },
  format: (_d: Date, fmt: string) => {
    if (fmt === 'MMM') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[_d.getMonth()];
    }
    return '';
  },
  differenceInDays: (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86400000),
}));

// ============================================
// Helpers
// ============================================

/**
 * Build a mock Firestore query snapshot from an array of document objects.
 */
function buildQuerySnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
}

/**
 * Set up mockGetDocs to return different results for each parallel call.
 * The hook issues 5 getDocs calls via Promise.all:
 *   [invoices, profitability, estimates, projects, expenses]
 */
function setupGetDocs(options: {
  invoices?: Array<{ id: string; data: Record<string, unknown> }>;
  profitability?: Array<{ id: string; data: Record<string, unknown> }>;
  estimates?: Array<{ id: string; data: Record<string, unknown> }>;
  projects?: Array<{ id: string; data: Record<string, unknown> }>;
  expenses?: Array<{ id: string; data: Record<string, unknown> }>;
}) {
  const invoicesSnap = buildQuerySnapshot(options.invoices || []);
  const profitabilitySnap = buildQuerySnapshot(options.profitability || []);
  const estimatesSnap = buildQuerySnapshot(options.estimates || []);
  const projectsSnap = buildQuerySnapshot(options.projects || []);
  const expensesSnap = buildQuerySnapshot(options.expenses || []);

  // getDocs is called 5 times in order via Promise.all
  mockGetDocs
    .mockResolvedValueOnce(invoicesSnap)
    .mockResolvedValueOnce(profitabilitySnap)
    .mockResolvedValueOnce(estimatesSnap)
    .mockResolvedValueOnce(projectsSnap)
    .mockResolvedValueOnce(expensesSnap);
}

// ============================================
// Tests
// ============================================

describe('useCompanyStats', () => {
  const RealDate = global.Date;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile },
    });

    // Override Date constructor so `new Date()` returns FIXED_NOW
    // but `new Date(arg)` still works normally.
    const MockDate = function (this: Date, ...args: unknown[]) {
      if (args.length === 0) {
        return new RealDate(FIXED_NOW);
      }
      // @ts-ignore - forwarding args to real Date constructor
      return new RealDate(...args);
    } as unknown as DateConstructor;
    MockDate.prototype = RealDate.prototype;
    MockDate.now = () => FIXED_NOW.getTime();
    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    global.Date = MockDate;
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it('returns loading=true initially, then stats after fetch', async () => {
    setupGetDocs({});

    const { result } = renderHook(() => useCompanyStats());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After fetch, stats should exist (even if empty data produces zeroes)
    expect(result.current.stats).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns null stats when no orgId', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: null,
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('computes revenueMTD from paid invoices in current month', async () => {
    // Invoice paid in current month (June 2024 since FIXED_NOW is June 15)
    const invoiceThisMonth = {
      id: 'inv-1',
      data: {
        status: 'paid',
        amountPaid: 15000,
        createdAt: new Date('2024-06-10T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // Invoice paid last month — should NOT count for MTD
    const invoiceLastMonth = {
      id: 'inv-2',
      data: {
        status: 'paid',
        amountPaid: 8000,
        createdAt: new Date('2024-05-15T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // Invoice unpaid — should NOT count
    const invoiceUnpaid = {
      id: 'inv-3',
      data: {
        status: 'sent',
        amountPaid: 0,
        amountDue: 5000,
        createdAt: new Date('2024-06-12T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    setupGetDocs({
      invoices: [invoiceThisMonth, invoiceLastMonth, invoiceUnpaid],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats!.revenueMTD).toBe(15000);
  });

  it('computes revenueYTD from paid invoices year-to-date', async () => {
    const invoiceJan = {
      id: 'inv-1',
      data: {
        status: 'paid',
        amountPaid: 10000,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        orgId: 'org-1',
      },
    };
    const invoiceMar = {
      id: 'inv-2',
      data: {
        status: 'paid',
        amountPaid: 20000,
        createdAt: new Date('2024-03-10T10:00:00Z'),
        orgId: 'org-1',
      },
    };
    const invoiceJun = {
      id: 'inv-3',
      data: {
        status: 'paid',
        amountPaid: 5000,
        createdAt: new Date('2024-06-01T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // Last year — should NOT count
    const invoiceLastYear = {
      id: 'inv-4',
      data: {
        status: 'paid',
        amountPaid: 50000,
        createdAt: new Date('2023-12-20T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    setupGetDocs({
      invoices: [invoiceJan, invoiceMar, invoiceJun, invoiceLastYear],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 10000 + 20000 + 5000 = 35000
    expect(result.current.stats!.revenueYTD).toBe(35000);
  });

  it('computes avgMargin from active project profitability', async () => {
    const activeProject1 = {
      id: 'proj-1',
      data: { status: 'active', orgId: 'org-1' },
    };
    const activeProject2 = {
      id: 'proj-2',
      data: { status: 'active', orgId: 'org-1' },
    };
    const completedProject = {
      id: 'proj-3',
      data: { status: 'completed', orgId: 'org-1' },
    };

    const profitability1 = {
      id: 'proj-1',
      data: { projectId: 'proj-1', grossMargin: 25 },
    };
    const profitability2 = {
      id: 'proj-2',
      data: { projectId: 'proj-2', grossMargin: 15 },
    };
    const profitability3 = {
      id: 'proj-3',
      data: { projectId: 'proj-3', grossMargin: 30 },
    };

    setupGetDocs({
      projects: [activeProject1, activeProject2, completedProject],
      profitability: [profitability1, profitability2, profitability3],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Only active projects (proj-1, proj-2) → (25 + 15) / 2 = 20.0
    expect(result.current.stats!.avgMargin).toBe(20);
  });

  it('computes pipelineValue from sent/viewed estimates', async () => {
    const sentEstimate = {
      id: 'est-1',
      data: { status: 'sent', total: 25000, orgId: 'org-1' },
    };
    const viewedEstimate = {
      id: 'est-2',
      data: { status: 'viewed', total: 40000, orgId: 'org-1' },
    };
    const acceptedEstimate = {
      id: 'est-3',
      data: { status: 'accepted', total: 100000, orgId: 'org-1' },
    };
    const draftEstimate = {
      id: 'est-4',
      data: { status: 'draft', total: 15000, orgId: 'org-1' },
    };

    setupGetDocs({
      estimates: [sentEstimate, viewedEstimate, acceptedEstimate, draftEstimate],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Only sent + viewed: 25000 + 40000 = 65000
    expect(result.current.stats!.pipelineValue).toBe(65000);
  });

  it('computes activeProjectCount from active projects', async () => {
    setupGetDocs({
      projects: [
        { id: 'p-1', data: { status: 'active', orgId: 'org-1' } },
        { id: 'p-2', data: { status: 'active', orgId: 'org-1' } },
        { id: 'p-3', data: { status: 'completed', orgId: 'org-1' } },
        { id: 'p-4', data: { status: 'active', orgId: 'org-1' } },
        { id: 'p-5', data: { status: 'on_hold', orgId: 'org-1' } },
      ],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats!.activeProjectCount).toBe(3);
  });

  it('AR aging buckets: current, 31-60, 61-90, over 90 days', async () => {
    // FIXED_NOW = June 15, 2024
    // Invoice due in the future (not yet due) → current
    const invoiceCurrent = {
      id: 'inv-1',
      data: {
        status: 'sent',
        amountDue: 1000,
        dueDate: new Date('2024-06-20T00:00:00Z'), // 5 days in future
        orgId: 'org-1',
      },
    };

    // Invoice due 15 days ago → current (0-30)
    const invoice15DaysPast = {
      id: 'inv-2',
      data: {
        status: 'overdue',
        amountDue: 2000,
        dueDate: new Date('2024-05-31T00:00:00Z'), // 15 days past
        orgId: 'org-1',
      },
    };

    // Invoice due 45 days ago → 31-60
    const invoice45DaysPast = {
      id: 'inv-3',
      data: {
        status: 'overdue',
        amountDue: 3000,
        dueDate: new Date('2024-05-01T00:00:00Z'), // ~45 days past
        orgId: 'org-1',
      },
    };

    // Invoice due 75 days ago → 61-90
    const invoice75DaysPast = {
      id: 'inv-4',
      data: {
        status: 'overdue',
        amountDue: 4000,
        dueDate: new Date('2024-04-01T00:00:00Z'), // ~75 days past
        orgId: 'org-1',
      },
    };

    // Invoice due 120 days ago → over 90
    const invoice120DaysPast = {
      id: 'inv-5',
      data: {
        status: 'overdue',
        amountDue: 5000,
        dueDate: new Date('2024-02-16T00:00:00Z'), // ~120 days past
        orgId: 'org-1',
      },
    };

    // Paid invoice — should NOT be counted in AR
    const paidInvoice = {
      id: 'inv-6',
      data: {
        status: 'paid',
        amountDue: 0,
        amountPaid: 10000,
        dueDate: new Date('2024-06-01T00:00:00Z'),
        orgId: 'org-1',
      },
    };

    setupGetDocs({
      invoices: [invoiceCurrent, invoice15DaysPast, invoice45DaysPast, invoice75DaysPast, invoice120DaysPast, paidInvoice],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const arAging = result.current.stats!.arAging;
    // current: future (1000) + 15 days past (2000) = 3000
    expect(arAging.current).toBe(3000);
    // 31-60: 45 days (3000)
    expect(arAging.days31to60).toBe(3000);
    // 61-90: 75 days (4000)
    expect(arAging.days61to90).toBe(4000);
    // over 90: 120 days (5000)
    expect(arAging.over90).toBe(5000);

    // arTotal: sum of all outstanding
    expect(result.current.stats!.arTotal).toBe(15000);
  });

  it('monthly trends: revenue, expenses, profit, margin for last 6 months', async () => {
    // A paid invoice in June (current month) — revenue
    const juneInvoice = {
      id: 'inv-jun',
      data: {
        status: 'paid',
        amountPaid: 20000,
        createdAt: new Date('2024-06-05T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // A paid invoice in May — revenue
    const mayInvoice = {
      id: 'inv-may',
      data: {
        status: 'paid',
        amountPaid: 12000,
        createdAt: new Date('2024-05-10T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // An expense in June
    const juneExpense = {
      id: 'exp-jun',
      data: {
        status: 'approved',
        amount: 8000,
        date: new Date('2024-06-02T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // An expense in May
    const mayExpense = {
      id: 'exp-may',
      data: {
        status: 'approved',
        amount: 5000,
        date: new Date('2024-05-15T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    // A rejected expense in June — should NOT be counted
    const rejectedExpense = {
      id: 'exp-rej',
      data: {
        status: 'rejected',
        amount: 9999,
        date: new Date('2024-06-10T10:00:00Z'),
        orgId: 'org-1',
      },
    };

    setupGetDocs({
      invoices: [juneInvoice, mayInvoice],
      expenses: [juneExpense, mayExpense, rejectedExpense],
    });

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const trends = result.current.stats!.monthlyTrends;
    // Should have 6 months of data
    expect(trends).toHaveLength(6);

    // Find June (last entry, since we go from 5 months ago to current)
    const juneTrend = trends[trends.length - 1];
    expect(juneTrend.month).toBe('Jun');
    expect(juneTrend.revenue).toBe(20000);
    expect(juneTrend.expenses).toBe(8000);
    expect(juneTrend.profit).toBe(12000);
    // margin = (12000/20000) * 100 = 60.0
    expect(juneTrend.margin).toBe(60);

    // Find May (second to last)
    const mayTrend = trends[trends.length - 2];
    expect(mayTrend.month).toBe('May');
    expect(mayTrend.revenue).toBe(12000);
    expect(mayTrend.expenses).toBe(5000);
    expect(mayTrend.profit).toBe(7000);
    // margin = (7000/12000) * 100 = 58.3
    expect(mayTrend.margin).toBe(58.3);
  });

  it('error handling: sets error on getDocs failure', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore permission denied'));

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Firestore permission denied');
    expect(result.current.stats).toBeNull();
  });

  it('refresh triggers re-fetch', async () => {
    // First fetch: empty data
    setupGetDocs({});

    const { result } = renderHook(() => useCompanyStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetDocs).toHaveBeenCalledTimes(5); // 5 parallel calls

    // Set up next round of data
    setupGetDocs({
      invoices: [
        {
          id: 'inv-1',
          data: {
            status: 'paid',
            amountPaid: 99000,
            createdAt: new Date('2024-06-10T10:00:00Z'),
            orgId: 'org-1',
          },
        },
      ],
    });

    // Trigger refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      // After refresh, getDocs should be called 10 total (5 + 5)
      // and new stats should be reflected
      expect(mockGetDocs).toHaveBeenCalledTimes(10);
      expect(result.current.stats!.revenueMTD).toBe(99000);
    });
  });
});
