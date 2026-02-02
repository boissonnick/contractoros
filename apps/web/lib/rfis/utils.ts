import type { RFI, RFIStatus, RFIPriority } from '@/types';

export const RFI_STATUS_LABELS: Record<RFIStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  pending_response: 'Pending Response',
  answered: 'Answered',
  closed: 'Closed',
};

export const RFI_STATUS_COLORS: Record<RFIStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-blue-100 text-blue-800',
  pending_response: 'bg-yellow-100 text-yellow-800',
  answered: 'bg-green-100 text-green-800',
  closed: 'bg-purple-100 text-purple-800',
};

export const RFI_PRIORITY_LABELS: Record<RFIPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const RFI_PRIORITY_COLORS: Record<RFIPriority, string> = {
  low: 'bg-gray-400 text-white',
  medium: 'bg-blue-500 text-white',
  high: 'bg-orange-500 text-white',
  urgent: 'bg-red-600 text-white',
};

export function calculateDaysOpen(rfi: RFI): number {
  const start = new Date(rfi.submittedAt || rfi.createdAt);
  const end = rfi.closedAt ? new Date(rfi.closedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(rfi: RFI): boolean {
  if (!rfi.dueDate || rfi.status === 'closed') return false;
  return new Date(rfi.dueDate) < new Date();
}

export function sortRFIs(rfis: RFI[], sortBy: 'date' | 'priority' | 'status' = 'date'): RFI[] {
  const priorityOrder: Record<RFIPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const statusOrder: Record<RFIStatus, number> = {
    open: 0,
    pending_response: 1,
    draft: 2,
    answered: 3,
    closed: 4,
  };

  return [...rfis].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'status') {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return 0;
  });
}

export function filterRFIs(
  rfis: RFI[],
  filters: {
    status?: RFIStatus[];
    priority?: RFIPriority[];
    assignedTo?: string;
    search?: string;
    overdueOnly?: boolean;
  }
): RFI[] {
  return rfis.filter(rfi => {
    if (filters.status?.length && !filters.status.includes(rfi.status)) return false;
    if (filters.priority?.length && !filters.priority.includes(rfi.priority)) return false;
    if (filters.assignedTo && rfi.assignedTo !== filters.assignedTo) return false;
    if (filters.overdueOnly && !isOverdue(rfi)) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        rfi.number.toLowerCase().includes(search) ||
        rfi.subject.toLowerCase().includes(search) ||
        (rfi.question?.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });
}

export function generateRFINumber(existingRFIs: RFI[]): string {
  const maxNum = existingRFIs.reduce((max, rfi) => {
    const num = parseInt(rfi.number.replace('RFI-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `RFI-${String(maxNum + 1).padStart(3, '0')}`;
}

export function getRFISummary(rfis: RFI[]) {
  return {
    total: rfis.length,
    byStatus: {
      draft: rfis.filter(r => r.status === 'draft').length,
      open: rfis.filter(r => r.status === 'open').length,
      pending_response: rfis.filter(r => r.status === 'pending_response').length,
      answered: rfis.filter(r => r.status === 'answered').length,
      closed: rfis.filter(r => r.status === 'closed').length,
    },
    byPriority: {
      urgent: rfis.filter(r => r.priority === 'urgent').length,
      high: rfis.filter(r => r.priority === 'high').length,
      medium: rfis.filter(r => r.priority === 'medium').length,
      low: rfis.filter(r => r.priority === 'low').length,
    },
    overdue: rfis.filter(r => isOverdue(r)).length,
    avgDaysOpen: rfis.length > 0
      ? Math.round(rfis.reduce((sum, r) => sum + calculateDaysOpen(r), 0) / rfis.length)
      : 0,
  };
}
