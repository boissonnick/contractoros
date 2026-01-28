"use client";

import React, { useState, useMemo } from 'react';
import { useTools } from '@/lib/hooks/useTools';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Tool, ToolStatus } from '@/types';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<ToolStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700' },
  checked_out: { label: 'Checked Out', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
  retired: { label: 'Retired', color: 'bg-gray-100 text-gray-500' },
};

export default function ToolsPage() {
  const { tools, loading, checkoutTool, returnTool } = useTools();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      if (search && !tool.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && tool.status !== statusFilter) return false;
      return true;
    });
  }, [tools, search, statusFilter]);

  const stats = useMemo(() => ({
    total: tools.length,
    available: tools.filter((t) => t.status === 'available').length,
    checkedOut: tools.filter((t) => t.status === 'checked_out').length,
    maintenance: tools.filter((t) => t.status === 'maintenance').length,
  }), [tools]);

  const handleCheckout = async (toolId: string) => {
    try {
      await checkoutTool(toolId);
      toast.success('Tool checked out');
    } catch {
      toast.error('Failed to check out tool');
    }
  };

  const handleReturn = async (toolId: string) => {
    try {
      await returnTool(toolId);
      toast.success('Tool returned');
    } catch {
      toast.error('Failed to return tool');
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
          <h1 className="text-2xl font-bold text-gray-900">Tools & Equipment</h1>
          <p className="text-gray-500 mt-1">Track and manage your tool inventory</p>
        </div>
        <Button variant="primary" size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Tool
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Tools</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.available}</p>
          <p className="text-xs text-gray-500">Available</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.checkedOut}</p>
          <p className="text-xs text-gray-500">Checked Out</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
          <p className="text-xs text-gray-500">Maintenance</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'available', 'checked_out', 'maintenance'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                statusFilter === s ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tools List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tools found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <Card key={tool.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tool.name}</p>
                    <p className="text-xs text-gray-400">{tool.category}</p>
                  </div>
                </div>
                <Badge className={STATUS_CONFIG[tool.status].color}>
                  {STATUS_CONFIG[tool.status].label}
                </Badge>
              </div>

              {tool.serialNumber && (
                <p className="text-xs text-gray-500 mb-2">S/N: {tool.serialNumber}</p>
              )}

              {tool.assignedToName && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                  <UserIcon className="h-4 w-4" />
                  {tool.assignedToName}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {tool.status === 'available' && (
                  <Button size="sm" variant="outline" onClick={() => handleCheckout(tool.id)}>
                    Check Out
                  </Button>
                )}
                {tool.status === 'checked_out' && (
                  <Button size="sm" variant="outline" onClick={() => handleReturn(tool.id)}>
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Return
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
