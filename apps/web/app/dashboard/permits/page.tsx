'use client';

import { useState, useMemo } from 'react';
import { usePermits, PERMIT_STATUS_LABELS, PERMIT_TYPE_LABELS } from '@/lib/hooks/usePermits';
import { Permit, PermitStatus, PermitType } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import StatsGrid from '@/components/ui/StatsGrid';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  DocumentCheckIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format, differenceInDays } from 'date-fns';
import AddPermitModal from '@/components/permits/AddPermitModal';
import EditPermitModal from '@/components/permits/EditPermitModal';
import PermitInspectionsModal from '@/components/permits/PermitInspectionsModal';

const STATUS_CONFIG: Record<PermitStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  denied: { label: 'Denied', variant: 'danger' },
  expired: { label: 'Expired', variant: 'danger' },
  closed: { label: 'Closed', variant: 'default' },
};

export default function PermitsPage() {
  const { permits, loading, stats, deletePermit } = usePermits();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);
  const [inspectionsPermit, setInspectionsPermit] = useState<Permit | null>(null);

  // Filter permits
  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          p.description.toLowerCase().includes(searchLower) ||
          p.permitNumber?.toLowerCase().includes(searchLower) ||
          p.jurisdiction.toLowerCase().includes(searchLower) ||
          p.projectName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && p.status !== statusFilter) return false;

      // Type filter
      if (typeFilter && p.permitType !== typeFilter) return false;

      return true;
    });
  }, [permits, search, statusFilter, typeFilter]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this permit?')) {
      await deletePermit(id);
    }
  };

  const getExpirationInfo = (permit: Permit) => {
    if (!permit.expirationDate) return null;
    const days = differenceInDays(permit.expirationDate, new Date());
    if (days < 0) return { text: `Expired ${Math.abs(days)} days ago`, color: 'text-red-600' };
    if (days === 0) return { text: 'Expires today', color: 'text-red-600' };
    if (days <= 30) return { text: `Expires in ${days} days`, color: 'text-amber-600' };
    return { text: `Expires ${format(permit.expirationDate, 'MMM d, yyyy')}`, color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <PageHeader
        title="Permit Tracking"
        description="Manage construction permits and inspections"
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Permit
          </Button>
        }
      />

      {/* Stats */}
      <StatsGrid
        stats={[
          {
            label: 'Submitted',
            value: stats.submitted + stats.underReview,
            icon: ClockIcon,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Under Review',
            value: stats.underReview,
            icon: ExclamationTriangleIcon,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
          },
          {
            label: 'Approved',
            value: stats.approved,
            icon: CheckCircleIcon,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
          },
          {
            label: 'Denied/Expired',
            value: stats.denied + stats.expired,
            icon: XCircleIcon,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
          },
        ]}
      />

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search permits..."
        searchValue={search}
        onSearch={setSearch}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'denied', label: 'Denied' },
              { value: 'expired', label: 'Expired' },
            ],
          },
          {
            key: 'type',
            label: 'Type',
            options: [
              { value: '', label: 'All Types' },
              ...Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ],
          },
        ]}
        filterValues={{ status: statusFilter, type: typeFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') setStatusFilter(value);
          if (key === 'type') setTypeFilter(value);
        }}
      />

      {/* Permits List */}
      {filteredPermits.length === 0 ? (
        <EmptyState
          icon={<DocumentCheckIcon className="h-12 w-12 text-gray-400" />}
          title={search || statusFilter || typeFilter ? 'No permits found' : 'No permits yet'}
          description={
            search || statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'Add your first permit to start tracking approvals and inspections.'
          }
          action={
            !search && !statusFilter && !typeFilter
              ? {
                  label: 'Add Permit',
                  onClick: () => setIsAddModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredPermits.map((permit) => {
            const expirationInfo = getExpirationInfo(permit);
            return (
              <Card key={permit.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {permit.description}
                      </h3>
                      <Badge variant={STATUS_CONFIG[permit.status].variant}>
                        {STATUS_CONFIG[permit.status].label}
                      </Badge>
                      <Badge variant="default">
                        {PERMIT_TYPE_LABELS[permit.permitType]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Permit Info */}
                      <div className="space-y-1">
                        {permit.permitNumber && (
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">Permit #:</span> {permit.permitNumber}
                          </p>
                        )}
                        <p className="text-gray-500">
                          <span className="font-medium text-gray-700">Jurisdiction:</span> {permit.jurisdiction}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="space-y-1">
                        {permit.submittedDate && (
                          <p className="flex items-center gap-1.5 text-gray-500">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Submitted: {format(permit.submittedDate, 'MMM d, yyyy')}</span>
                          </p>
                        )}
                        {permit.approvedDate && (
                          <p className="flex items-center gap-1.5 text-green-600">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Approved: {format(permit.approvedDate, 'MMM d, yyyy')}</span>
                          </p>
                        )}
                        {expirationInfo && (
                          <p className={`text-sm font-medium ${expirationInfo.color}`}>
                            {expirationInfo.text}
                          </p>
                        )}
                      </div>

                      {/* Project */}
                      {permit.projectName && (
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-gray-500">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <span>{permit.projectName}</span>
                          </p>
                        </div>
                      )}

                      {/* Fees & Contact */}
                      <div className="space-y-1">
                        {permit.fees !== undefined && permit.fees > 0 && (
                          <p className="flex items-center gap-1.5 text-gray-500">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>${permit.fees.toLocaleString()}</span>
                            {permit.feePaidDate && (
                              <span className="text-green-600">(Paid)</span>
                            )}
                          </p>
                        )}
                        {permit.contactName && (
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">Contact:</span> {permit.contactName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Inspections Summary */}
                    {permit.inspections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm">
                        <p className="text-gray-500">
                          <span className="font-medium text-gray-700">Inspections:</span>{' '}
                          {permit.inspections.filter((i) => i.result === 'passed').length} passed,{' '}
                          {permit.inspections.filter((i) => i.result === 'failed').length} failed,{' '}
                          {permit.inspections.filter((i) => !i.result).length} pending
                        </p>
                      </div>
                    )}

                    {/* Document & Notes */}
                    {(permit.documentURL || permit.notes) && (
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        {permit.documentURL && (
                          <a
                            href={permit.documentURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-brand-primary hover:underline"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            View Document
                          </a>
                        )}
                      </div>
                    )}

                    {permit.notes && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{permit.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectionsPermit(permit)}
                      title="Manage Inspections"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPermit(permit)}
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(permit.id)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddPermitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {editingPermit && (
        <EditPermitModal
          isOpen={!!editingPermit}
          onClose={() => setEditingPermit(null)}
          permit={editingPermit}
        />
      )}

      {inspectionsPermit && (
        <PermitInspectionsModal
          isOpen={!!inspectionsPermit}
          onClose={() => setInspectionsPermit(null)}
          permit={inspectionsPermit}
        />
      )}
    </div>
  );
}
