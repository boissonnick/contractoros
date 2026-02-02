import type { CloseoutChecklistItem } from '@/types';

export const DEFAULT_CLOSEOUT_ITEMS: Omit<CloseoutChecklistItem, 'id' | 'completed' | 'completedAt' | 'completedBy' | 'notes'>[] = [
  // Documentation
  { label: 'All permits closed and finaled', category: 'documentation' },
  { label: 'As-built drawings provided', category: 'documentation' },
  { label: 'Operation manuals delivered', category: 'documentation' },
  { label: 'Warranty documents compiled', category: 'documentation' },
  { label: 'Lien waivers collected', category: 'documentation' },

  // Inspections
  { label: 'Final building inspection passed', category: 'inspection' },
  { label: 'Final walkthrough completed', category: 'inspection' },
  { label: 'Punch list items verified complete', category: 'inspection' },
  { label: 'Systems tested and operational', category: 'inspection' },

  // Client
  { label: 'Client walkthrough scheduled', category: 'client' },
  { label: 'Client punch list reviewed', category: 'client' },
  { label: 'Client sign-off obtained', category: 'client' },
  { label: 'Keys and access provided', category: 'client' },

  // Financial
  { label: 'Final invoice issued', category: 'financial' },
  { label: 'Retainage release requested', category: 'financial' },
  { label: 'All change orders finalized', category: 'financial' },
  { label: 'Subcontractor payments complete', category: 'financial' },

  // Warranty
  { label: 'Warranty start date documented', category: 'warranty' },
  { label: 'Warranty contact info provided', category: 'warranty' },
  { label: 'Maintenance schedule delivered', category: 'warranty' },
];

export function createCloseoutChecklist(projectId: string, orgId: string) {
  return {
    projectId,
    orgId,
    items: DEFAULT_CLOSEOUT_ITEMS.map((item, index) => ({
      ...item,
      id: `item-${index}`,
      completed: false,
    })),
    completedCount: 0,
    totalCount: DEFAULT_CLOSEOUT_ITEMS.length,
  };
}

export function calculateCloseoutProgress(items: CloseoutChecklistItem[]) {
  const completed = items.filter(i => i.completed).length;
  const total = items.length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory: {
      documentation: calculateCategoryProgress(items, 'documentation'),
      inspection: calculateCategoryProgress(items, 'inspection'),
      client: calculateCategoryProgress(items, 'client'),
      financial: calculateCategoryProgress(items, 'financial'),
      warranty: calculateCategoryProgress(items, 'warranty'),
    },
  };
}

function calculateCategoryProgress(items: CloseoutChecklistItem[], category: string) {
  const categoryItems = items.filter(i => i.category === category);
  const completed = categoryItems.filter(i => i.completed).length;
  return {
    completed,
    total: categoryItems.length,
    percentage: categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0,
  };
}
