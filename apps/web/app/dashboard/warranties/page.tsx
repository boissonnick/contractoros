'use client';

import { useState, useMemo } from 'react';
import { useWarranties } from '@/lib/hooks/useWarranties';
import { WarrantyItem, WarrantyStatus } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import StatsGrid from '@/components/ui/StatsGrid';
import FilterBar from '@/components/ui/FilterBar';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  ShieldCheckIcon,
  PlusIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { format, differenceInDays } from 'date-fns';
import AddWarrantyModal from '@/components/warranties/AddWarrantyModal';
import EditWarrantyModal from '@/components/warranties/EditWarrantyModal';
import WarrantyClaimsModal from '@/components/warranties/WarrantyClaimsModal';

const STATUS_CONFIG: Record<WarrantyStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  active: { label: 'Active', variant: 'success' },
  expiring_soon: { label: 'Expiring Soon', variant: 'warning' },
  expired: { label: 'Expired', variant: 'danger' },
  claimed: { label: 'Claimed', variant: 'info' },
};

export default function WarrantiesPage() {
  const { warranties, loading, stats, deleteWarranty } = useWarranties();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<WarrantyItem | null>(null);
  const [claimsWarranty, setClaimsWarranty] = useState<WarrantyItem | null>(null);

  // Filter warranties
  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          w.itemName.toLowerCase().includes(searchLower) ||
          w.manufacturer?.toLowerCase().includes(searchLower) ||
          w.category?.toLowerCase().includes(searchLower) ||
          w.projectName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && w.status !== statusFilter) return false;

      return true;
    });
  }, [warranties, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this warranty?')) {
      await deleteWarranty(id);
    }
  };

  const getDaysRemaining = (endDate: Date) => {
    const days = differenceInDays(endDate, new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
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
        title="Warranty Tracking"
        description="Monitor product and labor warranties across all your projects"
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Warranty
          </Button>
        }
      />

      {/* Stats */}
      <StatsGrid
        stats={[
          {
            label: 'Active',
            value: stats.active,
            icon: ShieldCheckIcon,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
          },
          {
            label: 'Expiring Soon',
            value: stats.expiringSoon,
            icon: ClockIcon,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
          },
          {
            label: 'Expired',
            value: stats.expired,
            icon: XCircleIcon,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
          },
          {
            label: 'Claims Filed',
            value: stats.claimed,
            icon: ClipboardDocumentListIcon,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
        ]}
      />

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search warranties..."
        searchValue={search}
        onSearch={setSearch}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'expired', label: 'Expired' },
              { value: 'claimed', label: 'Claimed' },
            ],
          },
        ]}
        filterValues={{ status: statusFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') setStatusFilter(value);
        }}
      />

      {/* Warranties List */}
      {filteredWarranties.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="h-12 w-12 text-gray-400" />}
          title={search || statusFilter ? 'No warranties found' : 'No warranties yet'}
          description={
            search || statusFilter
              ? 'Try adjusting your filters'
              : 'Add your first warranty to start tracking coverage dates and claims.'
          }
          action={
            !search && !statusFilter
              ? {
                  label: 'Add Warranty',
                  onClick: () => setIsAddModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredWarranties.map((warranty) => (
            <Card key={warranty.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {warranty.itemName}
                    </h3>
                    <Badge variant={STATUS_CONFIG[warranty.status].variant}>
                      {STATUS_CONFIG[warranty.status].label}
                    </Badge>
                    {warranty.claimHistory.length > 0 && (
                      <Badge variant="default">
                        {warranty.claimHistory.length} claim{warranty.claimHistory.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {/* Category & Manufacturer */}
                    <div className="space-y-1">
                      {warranty.category && (
                        <p className="text-gray-500">
                          <span className="font-medium text-gray-700">Category:</span> {warranty.category}
                        </p>
                      )}
                      {warranty.manufacturer && (
                        <p className="text-gray-500">
                          <span className="font-medium text-gray-700">Manufacturer:</span> {warranty.manufacturer}
                        </p>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 text-gray-500">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {format(warranty.startDate, 'MMM d, yyyy')} - {format(warranty.endDate, 'MMM d, yyyy')}
                        </span>
                      </p>
                      <p className={`text-sm font-medium ${
                        warranty.status === 'expired' ? 'text-red-600' :
                        warranty.status === 'expiring_soon' ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {getDaysRemaining(warranty.endDate)}
                      </p>
                    </div>

                    {/* Project */}
                    {warranty.projectName && (
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-gray-500">
                          <BuildingOfficeIcon className="h-4 w-4" />
                          <span>{warranty.projectName}</span>
                        </p>
                      </div>
                    )}

                    {/* Contact */}
                    {(warranty.contactPhone || warranty.contactEmail) && (
                      <div className="space-y-1">
                        {warranty.contactPhone && (
                          <p className="flex items-center gap-1.5 text-gray-500">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{warranty.contactPhone}</span>
                          </p>
                        )}
                        {warranty.contactEmail && (
                          <p className="flex items-center gap-1.5 text-gray-500">
                            <EnvelopeIcon className="h-4 w-4" />
                            <span className="truncate">{warranty.contactEmail}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Document Info */}
                  {(warranty.warrantyNumber || warranty.documentURL) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm">
                      {warranty.warrantyNumber && (
                        <p className="text-gray-500">
                          <span className="font-medium text-gray-700">Warranty #:</span> {warranty.warrantyNumber}
                        </p>
                      )}
                      {warranty.documentURL && (
                        <a
                          href={warranty.documentURL}
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

                  {/* Notes */}
                  {warranty.notes && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{warranty.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClaimsWarranty(warranty)}
                    title="Manage Claims"
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingWarranty(warranty)}
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(warranty.id)}
                    title="Delete"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddWarrantyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {editingWarranty && (
        <EditWarrantyModal
          isOpen={!!editingWarranty}
          onClose={() => setEditingWarranty(null)}
          warranty={editingWarranty}
        />
      )}

      {claimsWarranty && (
        <WarrantyClaimsModal
          isOpen={!!claimsWarranty}
          onClose={() => setClaimsWarranty(null)}
          warranty={claimsWarranty}
        />
      )}
    </div>
  );
}
