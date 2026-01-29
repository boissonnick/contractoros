"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useClients, useClientStats, CLIENT_STATUS_LABELS, CLIENT_SOURCE_LABELS } from '@/lib/hooks/useClients';
import { Client, ClientStatus, ClientSource } from '@/types';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">
            Manage your client relationships and track project history
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <SkeletonList count={5} />
      ) : error ? (
        <Card className="p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
          <p className="text-gray-500">{error.message}</p>
        </Card>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="h-full w-full" />}
          title={searchQuery || statusFilter !== 'all' ? "No matching clients" : "No clients yet"}
          description={
            searchQuery || statusFilter !== 'all'
              ? "Try adjusting your search or filter criteria."
              : "Add your first client to start tracking relationships and projects."
          }
          action={!searchQuery && statusFilter === 'all' ? {
            label: 'Add Client',
            onClick: () => setShowAddModal(true),
          } : undefined}
        />
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

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
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
