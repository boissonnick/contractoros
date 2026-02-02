"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useClients, useClientStats, CLIENT_STATUS_LABELS, CLIENT_SOURCE_LABELS } from '@/lib/hooks/useClients';
import { Client, ClientStatus, ClientSource } from '@/types';
import { Button, Card, Badge, EmptyState, PageHeader } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import Skeleton from '@/components/ui/Skeleton';
import { AddClientModal } from '@/components/clients';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';

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

export default function ClientsPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const { clients, loading, error } = useClients({
    orgId: profile?.orgId || '',
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
  });

  const { stats, loading: statsLoading } = useClientStats(profile?.orgId || '');

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
        <h1 className="text-xl font-bold text-gray-900">Clients</h1>
        <p className="text-xs text-gray-500">Manage relationships & projects</p>
      </div>

      {/* Mobile Stats - Horizontal Scroll */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <UserGroupIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <BriefcaseIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.active}</p>
              <p className="text-[10px] text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-3 min-w-[140px]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalLifetimeValue)}</p>
              <p className="text-[10px] text-gray-500">Revenue</p>
            </div>
          </div>
        </div>
        {stats.totalOutstanding > 0 && (
          <div className="flex-shrink-0 bg-orange-50 rounded-xl border border-orange-200 p-3 min-w-[140px]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <ExclamationCircleIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.totalOutstanding)}</p>
                <p className="text-[10px] text-orange-700">Outstanding</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Stats */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Clients</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BriefcaseIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active Clients</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalLifetimeValue)}</p>
              <p className="text-xs text-gray-500">Lifetime Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalOutstanding)}</p>
              <p className="text-xs text-gray-500">Outstanding Balance</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Filter Chips */}
      <div className="md:hidden space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                  ? 'bg-blue-600 text-white'
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
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
          <p className="text-gray-500">{error.message}</p>
        </Card>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' ? "No matching clients" : "No clients yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? "Try adjusting your search or filter."
              : "Add your first client to get started."}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium active:scale-95 transition-transform"
            >
              <PlusIcon className="h-5 w-5" />
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
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
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center transition-all z-30"
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
