"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Subcontractor } from '@/types';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { Button, PageHeader, EmptyState } from '@/components/ui';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { SkeletonSubcontractorsList } from '@/components/ui/Skeleton';
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  StarIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import SubList from '@/components/subcontractors/SubList';
import SubForm from '@/components/subcontractors/SubForm';
import { toast } from '@/components/ui/Toast';

export default function SubcontractorsPage() {
  const router = useRouter();
  const { subs, loading, addSub, updateSub } = useSubcontractors();
  const [showAdd, setShowAdd] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Calculate performance stats
  const stats = useMemo(() => {
    if (subs.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        avgRating: 0,
        expiringInsurance: 0,
        expiringSubNames: [] as string[],
      };
    }

    const active = subs.filter(s => s.isActive).length;
    const inactive = subs.length - active;

    // Calculate average rating (only count subs with ratings)
    const ratedSubs = subs.filter(s => s.metrics.avgRating > 0);
    const avgRating = ratedSubs.length > 0
      ? ratedSubs.reduce((sum, s) => sum + s.metrics.avgRating, 0) / ratedSubs.length
      : 0;

    // Check for expiring insurance (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringInsuranceSubs = subs.filter(s => {
      if (!s.insuranceExpiry) return false;
      const expiry = new Date(s.insuranceExpiry);
      return expiry <= thirtyDaysFromNow && expiry >= now;
    });

    return {
      total: subs.length,
      active,
      inactive,
      avgRating: Math.round(avgRating * 10) / 10,
      expiringInsurance: expiringInsuranceSubs.length,
      expiringSubNames: expiringInsuranceSubs.map(s => s.companyName),
    };
  }, [subs]);

  const handleAdd = useCallback(
    async (data: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
      await addSub(data);
      setShowAdd(false);
    },
    [addSub]
  );

  const handleSubClick = (sub: Subcontractor) => {
    router.push(`/dashboard/subcontractors/${sub.id}`);
  };

  // Bulk actions
  const handleBulkActivate = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => updateSub(id, { isActive: true })));
      toast.success(`${selectedIds.length} subcontractor(s) activated`);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch {
      toast.error('Failed to activate subcontractors');
    }
  }, [selectedIds, updateSub]);

  const handleBulkDeactivate = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => updateSub(id, { isActive: false })));
      toast.success(`${selectedIds.length} subcontractor(s) deactivated`);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch {
      toast.error('Failed to deactivate subcontractors');
    }
  }, [selectedIds, updateSub]);

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  if (loading) {
    return <SkeletonSubcontractorsList />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Subcontractors"
          description="Manage your subcontractor network and track performance"
          actions={
            selectionMode ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelSelection}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CheckCircleIcon className="h-4 w-4" />}
                  onClick={handleBulkActivate}
                  disabled={selectedIds.length === 0}
                >
                  Activate ({selectedIds.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<XCircleIcon className="h-4 w-4" />}
                  onClick={handleBulkDeactivate}
                  disabled={selectedIds.length === 0}
                >
                  Deactivate
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                >
                  Select
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => setShowAdd(true)}
                >
                  Add Subcontractor
                </Button>
              </div>
            )
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Subcontractors</h1>
            <p className="text-xs text-gray-500">Manage your network</p>
          </div>
          {selectionMode ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSelection}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectionMode(true)}
            >
              Select
            </Button>
          )}
        </div>
        {selectionMode && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={handleBulkActivate}
              className="flex-1"
            >
              Activate ({selectedIds.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<XCircleIcon className="h-4 w-4" />}
              onClick={handleBulkDeactivate}
              className="flex-1"
            >
              Deactivate
            </Button>
          </div>
        )}
      </div>

      {/* Performance Dashboard Stats */}
      <StatsGrid
        stats={[
          {
            label: 'Total Subcontractors',
            value: stats.total,
            icon: WrenchScrewdriverIcon,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Active',
            value: stats.active,
            icon: CheckCircleIcon,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            description: stats.inactive > 0 ? `${stats.inactive} inactive` : undefined,
          },
          {
            label: 'Average Rating',
            value: stats.avgRating > 0 ? `${stats.avgRating}/5` : 'N/A',
            icon: StarIcon,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
          },
          {
            label: 'Insurance Alerts',
            value: stats.expiringInsurance,
            icon: ExclamationTriangleIcon,
            iconBg: stats.expiringInsurance > 0 ? 'bg-red-100' : 'bg-gray-100',
            iconColor: stats.expiringInsurance > 0 ? 'text-red-600' : 'text-gray-400',
            description: stats.expiringInsurance > 0
              ? `Expiring within 30 days`
              : 'All insurance current',
          },
        ]}
        columns={4}
      />

      {/* Insurance Alert Banner */}
      {stats.expiringInsurance > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Insurance Expiring Soon</h3>
              <p className="text-sm text-amber-700 mt-1">
                The following subcontractors have insurance expiring within 30 days:{' '}
                <span className="font-medium">{stats.expiringSubNames.join(', ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subcontractor List */}
      {subs.length === 0 ? (
        <EmptyState
          icon={<WrenchScrewdriverIcon className="h-full w-full" />}
          title="No subcontractors yet"
          description="Build your network by adding subcontractors. Track their performance, manage insurance, and invite them to bid on projects."
          action={{
            label: 'Add Subcontractor',
            onClick: () => setShowAdd(true),
          }}
          secondaryAction={{
            label: 'Learn More',
            href: '/help/subcontractors',
          }}
        />
      ) : (
        <SubList
          subs={subs}
          onSubClick={handleSubClick}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Subcontractor</h3>
            <SubForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
          </div>
        </div>
      )}

      {/* Mobile FAB for Add Subcontractor */}
      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="Add Subcontractor"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
