"use client";

import React, { useState, useMemo } from 'react';
import { useServiceTickets } from '@/lib/hooks/useLeads';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ServiceTicket, ServiceTicketStatus } from '@/types';
import {
  TicketIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<ServiceTicketStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-500' },
  medium: { label: 'Medium', color: 'text-blue-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
};

export default function ServiceTicketsPage() {
  const { tickets, loading, updateTicket } = useServiceTickets();
  const [statusFilter, setStatusFilter] = useState<ServiceTicketStatus | 'all'>('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    scheduled: tickets.filter((t) => t.status === 'scheduled' || t.status === 'in_progress').length,
    completed: tickets.filter((t) => t.status === 'completed' || t.status === 'closed').length,
  }), [tickets]);

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
          <h1 className="text-2xl font-bold text-gray-900">Service Tickets</h1>
          <p className="text-gray-500 mt-1">Manage post-project service requests</p>
        </div>
        <Button variant="primary" size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <TicketIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Tickets</p>
        </Card>
        <Card className="p-4 text-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          <p className="text-xs text-gray-500">Open</p>
        </Card>
        <Card className="p-4 text-center">
          <ClockIcon className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          <p className="text-xs text-gray-500">Scheduled / In Progress</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircleIcon className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {(['all', 'open', 'scheduled', 'in_progress', 'completed', 'closed'] as const).map((s) => (
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

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <TicketIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No service tickets found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{ticket.title}</p>
                    <Badge className={STATUS_CONFIG[ticket.status].color}>
                      {STATUS_CONFIG[ticket.status].label}
                    </Badge>
                    <span className={cn('text-xs font-medium', PRIORITY_CONFIG[ticket.priority].color)}>
                      {PRIORITY_CONFIG[ticket.priority].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{ticket.clientName}</span>
                    {ticket.projectName && <span>&bull; {ticket.projectName}</span>}
                    {ticket.assignedToName && <span>&bull; Assigned to {ticket.assignedToName}</span>}
                  </div>
                </div>
                <div className="text-right ml-4 text-xs text-gray-400">
                  <p>{format(ticket.createdAt, 'MMM d, yyyy')}</p>
                  {ticket.scheduledDate && (
                    <p className="text-blue-600 mt-1">
                      Scheduled: {format(ticket.scheduledDate, 'MMM d')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
