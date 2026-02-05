"use client";

import React, { useState, useMemo } from 'react';
import { useLeads } from '@/lib/hooks/useLeads';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { LeadStatus } from '@/types';
import {
  UserPlusIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  FunnelIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { AddLeadModal } from '@/components/leads';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-700' },
  qualified: { label: 'Qualified', color: 'bg-yellow-100 text-yellow-700' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700' },
  won: { label: 'Won', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Lost', color: 'bg-gray-100 text-gray-500' },
};

export default function LeadsPage() {
  const { leads, loading, updateLead } = useLeads();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return leads;
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

  const stats = useMemo(() => {
    const pipeline = leads.filter((l) => !['won', 'lost'].includes(l.status));
    const pipelineValue = pipeline.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const won = leads.filter((l) => l.status === 'won');
    const wonValue = won.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    return {
      total: leads.length,
      pipeline: pipeline.length,
      pipelineValue,
      won: won.length,
      wonValue,
    };
  }, [leads]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const _handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateLead(id, { status });
      toast.success('Lead status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline</h1>
          <p className="text-gray-500 mt-1">Track and convert potential customers</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UserPlusIcon className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Leads</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FunnelIcon className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pipeline}</p>
              <p className="text-xs text-gray-500">In Pipeline</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</p>
              <p className="text-xs text-gray-500">Pipeline Value</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.wonValue)}</p>
              <p className="text-xs text-gray-500">{stats.won} Won</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {(['all', 'new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              statusFilter === s ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <UserPlusIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No leads found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card key={lead.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                    <Badge className={STATUS_CONFIG[lead.status].color}>
                      {STATUS_CONFIG[lead.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {lead.company && <span>{lead.company}</span>}
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        {lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" />
                        {lead.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  {lead.estimatedValue && (
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(lead.estimatedValue)}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {lead.source} &bull; {format(lead.createdAt, 'MMM d')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
