import type { PunchItem, PunchItemStatus, PunchItemPriority } from '@/types';

export const PUNCH_STATUS_LABELS: Record<PunchItemStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  ready_for_review: 'Ready for Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const PUNCH_STATUS_COLORS: Record<PunchItemStatus, string> = {
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  ready_for_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-orange-100 text-orange-800',
};

export const PUNCH_PRIORITY_LABELS: Record<PunchItemPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PUNCH_PRIORITY_COLORS: Record<PunchItemPriority, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-gray-400 text-white',
};

export const PUNCH_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Framing',
  'Drywall',
  'Paint',
  'Flooring',
  'Trim',
  'Cabinets',
  'Countertops',
  'Appliances',
  'Fixtures',
  'Exterior',
  'Landscaping',
  'Cleanup',
  'Other',
];

export function sortPunchItems(items: PunchItem[], sortBy: 'priority' | 'status' | 'date' = 'priority'): PunchItem[] {
  const priorityOrder: Record<PunchItemPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const statusOrder: Record<PunchItemStatus, number> = {
    open: 0,
    in_progress: 1,
    ready_for_review: 2,
    approved: 3,
    rejected: 4,
  };

  return [...items].sort((a, b) => {
    if (sortBy === 'priority') {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'status') {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function filterPunchItems(
  items: PunchItem[],
  filters: {
    status?: PunchItemStatus[];
    priority?: PunchItemPriority[];
    category?: string[];
    assignedTo?: string;
    search?: string;
  }
): PunchItem[] {
  return items.filter(item => {
    if (filters.status?.length && !filters.status.includes(item.status)) return false;
    if (filters.priority?.length && !filters.priority.includes(item.priority)) return false;
    if (filters.category?.length && !filters.category.includes(item.category)) return false;
    if (filters.assignedTo && item.assignedTo !== filters.assignedTo) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        item.title.toLowerCase().includes(search) ||
        (item.description?.toLowerCase().includes(search) ?? false) ||
        (item.location?.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });
}

export function getPunchListSummary(items: PunchItem[]) {
  return {
    total: items.length,
    byStatus: {
      open: items.filter(i => i.status === 'open').length,
      in_progress: items.filter(i => i.status === 'in_progress').length,
      ready_for_review: items.filter(i => i.status === 'ready_for_review').length,
      approved: items.filter(i => i.status === 'approved').length,
      rejected: items.filter(i => i.status === 'rejected').length,
    },
    byPriority: {
      critical: items.filter(i => i.priority === 'critical').length,
      high: items.filter(i => i.priority === 'high').length,
      medium: items.filter(i => i.priority === 'medium').length,
      low: items.filter(i => i.priority === 'low').length,
    },
    unassigned: items.filter(i => !i.assignedTo).length,
  };
}
