import type { Submittal, SubmittalStatus, SubmittalType } from '@/types';

export const SUBMITTAL_STATUS_LABELS: Record<SubmittalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  approved_as_noted: 'Approved as Noted',
  revision_required: 'Revision Required',
  rejected: 'Rejected',
};

export const SUBMITTAL_STATUS_COLORS: Record<SubmittalStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  approved_as_noted: 'bg-green-50 text-green-700',
  revision_required: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
};

export const SUBMITTAL_TYPE_LABELS: Record<SubmittalType, string> = {
  shop_drawing: 'Shop Drawing',
  product_data: 'Product Data',
  sample: 'Sample',
  mock_up: 'Mock-Up',
  design_data: 'Design Data',
  test_report: 'Test Report',
  certificate: 'Certificate',
  manufacturer_instructions: 'Manufacturer Instructions',
  closeout: 'Closeout',
  other: 'Other',
};

export const SUBMITTAL_TYPE_ICONS: Record<SubmittalType, string> = {
  shop_drawing: 'DocumentTextIcon',
  product_data: 'ClipboardDocumentListIcon',
  sample: 'SwatchIcon',
  mock_up: 'CubeIcon',
  design_data: 'DocumentChartBarIcon',
  test_report: 'BeakerIcon',
  certificate: 'DocumentCheckIcon',
  manufacturer_instructions: 'BookOpenIcon',
  closeout: 'ArchiveBoxIcon',
  other: 'DocumentIcon',
};

export function calculateReviewDays(submittal: Submittal): number {
  if (!submittal.submittedAt) return 0;
  const start = new Date(submittal.submittedAt);
  const end = submittal.reviewedAt ? new Date(submittal.reviewedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function isApproved(submittal: Submittal): boolean {
  return submittal.status === 'approved' || submittal.status === 'approved_as_noted';
}

export function needsAction(submittal: Submittal): boolean {
  return submittal.status === 'submitted' || submittal.status === 'under_review';
}

export function sortSubmittals(
  submittals: Submittal[],
  sortBy: 'date' | 'status' | 'type' = 'date'
): Submittal[] {
  const statusOrder: Record<SubmittalStatus, number> = {
    submitted: 0,
    under_review: 1,
    revision_required: 2,
    draft: 3,
    approved_as_noted: 4,
    approved: 5,
    rejected: 6,
  };

  return [...submittals].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'status') {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type);
    }
    return 0;
  });
}

export function filterSubmittals(
  submittals: Submittal[],
  filters: {
    status?: SubmittalStatus[];
    type?: SubmittalType[];
    specSection?: string;
    submittedBy?: string;
    search?: string;
    needsActionOnly?: boolean;
  }
): Submittal[] {
  return submittals.filter(submittal => {
    if (filters.status?.length && !filters.status.includes(submittal.status)) return false;
    if (filters.type?.length && !filters.type.includes(submittal.type)) return false;
    if (filters.specSection && submittal.specSection !== filters.specSection) return false;
    if (filters.submittedBy && submittal.submittedBy !== filters.submittedBy) return false;
    if (filters.needsActionOnly && !needsAction(submittal)) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        submittal.number.toLowerCase().includes(search) ||
        submittal.title.toLowerCase().includes(search) ||
        (submittal.description?.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });
}

export function generateSubmittalNumber(existingSubmittals: Submittal[]): string {
  const maxNum = existingSubmittals.reduce((max, sub) => {
    const num = parseInt(sub.number.replace('SUB-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `SUB-${String(maxNum + 1).padStart(3, '0')}`;
}

export function getSubmittalSummary(submittals: Submittal[]) {
  return {
    total: submittals.length,
    byStatus: {
      draft: submittals.filter(s => s.status === 'draft').length,
      submitted: submittals.filter(s => s.status === 'submitted').length,
      under_review: submittals.filter(s => s.status === 'under_review').length,
      approved: submittals.filter(s => s.status === 'approved').length,
      approved_as_noted: submittals.filter(s => s.status === 'approved_as_noted').length,
      revision_required: submittals.filter(s => s.status === 'revision_required').length,
      rejected: submittals.filter(s => s.status === 'rejected').length,
    },
    byType: {
      shop_drawing: submittals.filter(s => s.type === 'shop_drawing').length,
      product_data: submittals.filter(s => s.type === 'product_data').length,
      sample: submittals.filter(s => s.type === 'sample').length,
      other: submittals.filter(s => !['shop_drawing', 'product_data', 'sample'].includes(s.type)).length,
    },
    needsAction: submittals.filter(s => needsAction(s)).length,
    approvalRate: submittals.length > 0
      ? Math.round((submittals.filter(s => isApproved(s)).length / submittals.length) * 100)
      : 0,
    avgReviewDays: submittals.filter(s => s.reviewedAt).length > 0
      ? Math.round(
          submittals
            .filter(s => s.reviewedAt)
            .reduce((sum, s) => sum + calculateReviewDays(s), 0) /
          submittals.filter(s => s.reviewedAt).length
        )
      : 0,
  };
}
