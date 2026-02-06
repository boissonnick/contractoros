"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useClients, useClientStats, CLIENT_STATUS_LABELS, CLIENT_SOURCE_LABELS } from '@/lib/hooks/useClients';
import { usePagination } from '@/lib/hooks/usePagination';
import { Client, ClientStatus } from '@/types';
import { Button, Card, Badge, EmptyState, PageHeader } from '@/components/ui';
import { CompactPagination } from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import { AddClientModal } from '@/components/clients';
import { cn } from '@/lib/utils';
import {
  collection,
  query,
  where,
  getCountFromServer,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const statusFilters: { value: ClientStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Clients' },
  { value: 'active', label: 'Active' },
  { value: 'potential', label: 'Potential' },
  { value: 'past', label: 'Past' },
  { value: 'inactive', label: 'Inactive' },
];

const statusColors: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-700',
  potential: 'bg-blue-100 text-blue-700',
  past: 'bg-gray-100 text-gray-700',
  inactive: 'bg-red-100 text-red-700',
};

const CLIENT_DATE_FIELDS = ['createdAt', 'updatedAt', 'firstContactDate', 'lastContactDate'] as const;

export default function ClientsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const orgId = profile?.orgId || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const isSearching = !!searchQuery;

  // Pagination filters (memoized to prevent re-fetches)
  const paginationFilters = useMemo(() => {
    const f: QueryConstraint[] = [];
    if (statusFilter !== 'all') f.push(where('status', '==', statusFilter));
    return f;
  }, [statusFilter]);

  // Paginated clients (when not searching)
  const {
    items: paginatedClients,
    loading: paginatedLoading,
    error: paginatedError,
    hasMore,
    hasPrevious,
    loadMore,
    loadPrevious,
    currentPage,
    pageSize,
    setPageSize,
  } = usePagination<Client>(profile?.orgId, 'clients', {
    pageSize: 25,
    orderByField: 'displayName',
    orderDirection: 'asc',
    filters: paginationFilters,
    enabled: !!orgId && !isSearching,
    dateFields: CLIENT_DATE_FIELDS,
  });

  // Full-text search results (when searching — loads all for client-side filtering)
  const { clients: searchResults, loading: searchLoading, error: searchError } = useClients({
    orgId: isSearching ? orgId : '',
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
  });

  // Stats (always active for dashboard cards)
  const { stats } = useClientStats(orgId);

  // Total count for pagination display
  useEffect(() => {
    if (!orgId || isSearching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
      setTotalCount(0);
      return;
    }
    const countConstraints: QueryConstraint[] = [];
    if (statusFilter !== 'all') countConstraints.push(where('status', '==', statusFilter));
    const q = query(collection(db, `organizations/${orgId}/clients`), ...countConstraints);
    getCountFromServer(q)
      .then((snap) => setTotalCount(snap.data().count))
      .catch(() => setTotalCount(0));
  }, [orgId, statusFilter, isSearching]);

  // Display logic — paginated by default, full list when searching
  const displayClients = isSearching ? searchResults : paginatedClients;
  const isLoading = isSearching ? searchLoading : paginatedLoading;
  const displayError = isSearching ? searchError : paginatedError;
  const totalPages = Math.ceil(totalCount / pageSize);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Clients"
          description="Manage your client relationships and track project history"
          actions={
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Clients</h1>
        <p className="text-xs text-gray-500">Manage relationships & projects</p>
      </div>

      {/* Mobile Stats - Horizontal Scroll */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex-shrink-0 bg-gradient-to-br from-gray-500/10 to-gray-600/5 rounded-xl border border-gray-200/50 p-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-black/5">
              <UserGroupIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-gray-900">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-200/50 p-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-black/5">
              <BriefcaseIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-gray-900">{stats.active}</p>
              <p className="text-[10px] text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-200/50 p-3 min-w-[140px]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-black/5">
              <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-gray-900">{formatCurrency(stats.totalLifetimeValue)}</p>
              <p className="text-[10px] text-gray-500">Revenue</p>
            </div>
          </div>
        </div>
        {stats.totalOutstanding > 0 && (
          <div className="flex-shrink-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-200/50 p-3 min-w-[140px]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                <ExclamationCircleIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-orange-600">{formatCurrency(stats.totalOutstanding)}</p>
                <p className="text-[10px] text-orange-700">Outstanding</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Stats */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <UserGroupIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Clients</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <BriefcaseIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active Clients</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(stats.totalLifetimeValue)}</p>
              <p className="text-xs text-gray-500">Lifetime Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ExclamationCircleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(stats.totalOutstanding)}</p>
              <p className="text-xs text-gray-500">Outstanding Balance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Filter Chips */}
      <div className="md:hidden space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent min-h-[48px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[40px]',
                statusFilter === filter.value
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : displayError ? (
        <Card className="p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium tracking-tight text-gray-900 mb-2">Error Loading Clients</h3>
          <p className="text-gray-500">{displayError.message}</p>
        </Card>
      ) : displayClients.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="h-full w-full" />}
          title={searchQuery || statusFilter !== 'all' ? "No matching clients" : "No clients yet"}
          description={
            searchQuery || statusFilter !== 'all'
              ? "Try adjusting your search or filter."
              : "Add your first client to get started."
          }
          action={
            !searchQuery && statusFilter === 'all'
              ? { label: 'Add Client', onClick: () => setShowAddModal(true) }
              : undefined
          }
        />
      ) : (
        <>
          {/* Search result count */}
          {isSearching && (
            <p className="text-sm text-gray-500">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Pagination info bar */}
          {!isSearching && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-600">
              <span>
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' – '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span>
                {' of '}
                <span className="font-medium">{totalCount}</span> clients
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor="client-page-size" className="text-gray-500">Show:</label>
                <select
                  id="client-page-size"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white py-1 pl-2 pr-8 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {displayClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {!isSearching && (hasPrevious || hasMore) && (
            <CompactPagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasMore}
              hasPreviousPage={hasPrevious}
              onNextPage={loadMore}
              onPreviousPage={loadPrevious}
              loading={paginatedLoading}
              className="pt-2"
            />
          )}
        </>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        orgId={profile?.orgId || ''}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(clientId) => router.push(`/dashboard/clients/${clientId}`)}
      />

      {/* Mobile FAB for Add Client */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="Add Client"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}

// Client Card Component
interface ClientCardProps {
  client: Client;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}

function ClientCard({ client, onClick, formatCurrency }: ClientCardProps) {
  const hasOutstanding = (client.financials?.outstandingBalance || 0) > 0;

  // Handle phone/email clicks without triggering card click
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${client.phone}`;
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${client.email}`;
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
      onClick={onClick}
    >
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{client.displayName}</h3>
            {client.companyName && client.companyName !== client.displayName && (
              <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0" />
                {client.companyName}
              </p>
            )}
          </div>
          <Badge className={cn(statusColors[client.status], 'flex-shrink-0')}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
        </div>

        {/* Mobile Quick Stats */}
        <div className="flex items-center gap-3 text-sm mb-3">
          <span className="text-gray-600">
            {client.financials?.totalProjects || 0} projects
          </span>
          <span className="text-green-600 font-medium">
            {formatCurrency(client.financials?.lifetimeValue || 0)}
          </span>
          {hasOutstanding && (
            <span className="text-orange-600">
              {formatCurrency(client.financials?.outstandingBalance || 0)} due
            </span>
          )}
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex gap-2">
          {client.phone && (
            <button
              onClick={handlePhoneClick}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg active:bg-green-100 transition-colors min-h-[44px]"
            >
              <PhoneIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Call</span>
            </button>
          )}
          {client.email && (
            <button
              onClick={handleEmailClick}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg active:bg-blue-100 transition-colors min-h-[44px]"
            >
              <EnvelopeIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Email</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={statusColors[client.status]}>
              {CLIENT_STATUS_LABELS[client.status]}
            </Badge>
            {client.source && (
              <span className="text-xs text-gray-500">
                via {CLIENT_SOURCE_LABELS[client.source]}
              </span>
            )}
          </div>

          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            {client.displayName}
            {client.companyName && client.companyName !== client.displayName && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <BuildingOfficeIcon className="h-4 w-4" />
                {client.companyName}
              </span>
            )}
          </h3>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
            {client.email && (
              <span className="flex items-center gap-1">
                <EnvelopeIcon className="h-4 w-4" />
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1">
                <PhoneIcon className="h-4 w-4" />
                {client.phone}
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <BriefcaseIcon className="h-4 w-4" />
              {client.financials?.totalProjects || 0} projects
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              {formatCurrency(client.financials?.lifetimeValue || 0)}
            </span>
            {hasOutstanding && (
              <span className="flex items-center gap-1 text-orange-600">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formatCurrency(client.financials?.outstandingBalance || 0)} due
              </span>
            )}
          </div>

          {client.lastContactDate && (
            <p className="text-xs text-gray-400 mt-2">
              Last contact {formatDistanceToNow(new Date(client.lastContactDate), { addSuffix: true })}
            </p>
          )}
        </div>

        <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </div>
    </Card>
  );
}
