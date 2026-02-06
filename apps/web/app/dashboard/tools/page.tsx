"use client";

import React, { useState, useMemo } from 'react';
import { useTools } from '@/lib/hooks/useTools';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Tool, ToolStatus } from '@/types';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { EquipmentFormModal } from '@/components/equipment/EquipmentFormModal';

const STATUS_CONFIG: Record<ToolStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700' },
  checked_out: { label: 'Checked Out', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
  retired: { label: 'Retired', color: 'bg-gray-100 text-gray-500' },
};

const CATEGORY_CONFIG: Record<string, string> = {
  power_tool: 'Power Tool',
  hand_tool: 'Hand Tool',
  heavy_equipment: 'Heavy Equipment',
  safety: 'Safety',
  measuring: 'Measuring',
  vehicle: 'Vehicle',
  other: 'Other',
};

type ViewMode = 'grid' | 'list';

export default function ToolsPage() {
  const { tools, loading, checkoutTool, returnTool, addTool } = useTools();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    tools.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [tools]);

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      // Search by name or serial number
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = tool.name.toLowerCase().includes(searchLower);
        const matchesSerial = tool.serialNumber?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesSerial) return false;
      }
      if (statusFilter !== 'all' && tool.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && tool.category !== categoryFilter) return false;
      return true;
    });
  }, [tools, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: tools.length,
    available: tools.filter((t) => t.status === 'available').length,
    checkedOut: tools.filter((t) => t.status === 'checked_out').length,
    maintenance: tools.filter((t) => t.status === 'maintenance').length,
  }), [tools]);

  const handleCheckout = async (tool: Tool) => {
    try {
      await checkoutTool(tool.id);
      toast.success('Tool checked out successfully');
    } catch {
      toast.error('Failed to check out tool');
    }
  };

  const handleReturn = async (tool: Tool) => {
    try {
      await returnTool(tool.id);
      toast.success('Tool returned successfully');
    } catch {
      toast.error('Failed to return tool');
    }
  };

  const handleAddEquipment = async (data: any) => {
    try {
      const toolData = {
        name: data.name || '',
        category: data.category || 'other',
        status: 'available' as ToolStatus,
        condition: 'good' as const,
        serialNumber: data.serialNumber,
        purchaseDate: data.purchaseDate,
        purchaseCost: data.purchasePrice || data.purchaseCost,
        currentValue: data.currentValue,
        notes: data.description || data.notes,
      };
      await addTool(toolData);
      toast.success('Equipment added successfully');
    } catch {
      toast.error('Failed to add equipment');
    }
  };

  const handleExport = () => {
    // Create CSV data
    const headers = ['Name', 'Category', 'Status', 'Serial Number', 'Assigned To'];
    const rows = filtered.map((t) => [
      t.name,
      CATEGORY_CONFIG[t.category] || t.category,
      STATUS_CONFIG[t.status].label,
      t.serialNumber || '',
      t.assignedToName || '',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tools & Equipment</h1>
          <p className="text-gray-500 mt-1">Track and manage your tool inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Equipment</p>
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
          <p className="text-xs text-gray-500">In Maintenance</p>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or serial number..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* View Toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ToolStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat] || cat}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Status Filters */}
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

      {/* Equipment Display */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<WrenchScrewdriverIcon className="h-full w-full" />}
          title="No equipment found"
          description="Track your tools and equipment to manage checkouts and maintenance."
          action={{ label: 'Add Equipment', onClick: () => setShowAddModal(true) }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tool) => (
            <EquipmentCard
              key={tool.id}
              equipment={tool as any}
              onCheckOut={() => handleCheckout(tool)}
              onReturn={() => handleReturn(tool)}
              onView={() => {}}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-100 rounded">
                        <WrenchScrewdriverIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tool.name}</p>
                        {tool.serialNumber && (
                          <p className="text-xs text-gray-400">SN: {tool.serialNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {CATEGORY_CONFIG[tool.category] || tool.category}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', STATUS_CONFIG[tool.status].color)}>
                      {STATUS_CONFIG[tool.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tool.assignedToName || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tool.status === 'available' && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckout(tool)}>
                        Check Out
                      </Button>
                    )}
                    {tool.status === 'checked_out' && (
                      <Button size="sm" variant="outline" onClick={() => handleReturn(tool)}>
                        Return
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modals */}
      <EquipmentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEquipment}
      />
    </div>
  );
}
