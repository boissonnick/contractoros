"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Card,
  Button,
  Input,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  ResponsiveTableWrapper,
  MobileTableCard,
  MobileTableRow,
} from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import { useLineItems } from '@/lib/hooks/useLineItems';
import {
  LineItem,
  LineItemTrade,
  LineItemUnit,
  LINE_ITEM_TRADES,
  LINE_ITEM_UNITS,
} from '@/types';
import { toast } from '@/components/ui/Toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface LineItemFormData {
  name: string;
  description: string;
  trade: LineItemTrade;
  category: string;
  unit: LineItemUnit;
  materialCost: number;
  laborCost: number;
  defaultMarkup: number;
  sku: string;
  supplier: string;
  supplierSku: string;
  tags: string;
}

const DEFAULT_FORM_DATA: LineItemFormData = {
  name: '',
  description: '',
  trade: 'general',
  category: '',
  unit: 'each',
  materialCost: 0,
  laborCost: 0,
  defaultMarkup: 20,
  sku: '',
  supplier: '',
  supplierSku: '',
  tags: '',
};

export default function LineItemsPage() {
  const { profile } = useAuth();
  const {
    lineItems,
    loading,
    createLineItem,
    updateLineItem,
    deleteLineItem,
    toggleFavorite,
    duplicateLineItem,
    bulkUpdatePricing,
  } = useLineItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<LineItemTrade | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'trade' | 'price' | 'usage'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [formData, setFormData] = useState<LineItemFormData>(DEFAULT_FORM_DATA);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LineItem | null>(null);

  const [bulkPricingOpen, setBulkPricingOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPriceChange, setBulkPriceChange] = useState(0);
  const [bulkPriceReason, setBulkPriceReason] = useState('');

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let items = lineItems;

    // Filter by trade
    if (selectedTrade !== 'all') {
      items = items.filter((item) => item.trade === selectedTrade);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.supplier?.toLowerCase().includes(q)
      );
    }

    // Sort
    items = [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'trade':
          comparison = a.trade.localeCompare(b.trade);
          break;
        case 'price':
          comparison = a.unitPrice - b.unitPrice;
          break;
        case 'usage':
          comparison = (b.usageCount || 0) - (a.usageCount || 0);
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [lineItems, selectedTrade, searchQuery, sortBy, sortDir]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getUnitAbbr = (unit: string) => {
    const found = LINE_ITEM_UNITS.find((u) => u.value === unit);
    return found?.abbr || unit;
  };

  const handleOpenModal = (item?: LineItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        trade: item.trade,
        category: item.category || '',
        unit: item.unit,
        materialCost: item.materialCost,
        laborCost: item.laborCost,
        defaultMarkup: item.defaultMarkup,
        sku: item.sku || '',
        supplier: item.supplier || '',
        supplierSku: item.supplierSku || '',
        tags: item.tags?.join(', ') || '',
      });
    } else {
      setEditingItem(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      trade: formData.trade,
      category: formData.category.trim() || undefined,
      unit: formData.unit,
      materialCost: formData.materialCost,
      laborCost: formData.laborCost,
      defaultMarkup: formData.defaultMarkup,
      sku: formData.sku.trim() || undefined,
      supplier: formData.supplier.trim() || undefined,
      supplierSku: formData.supplierSku.trim() || undefined,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    };

    try {
      if (editingItem) {
        await updateLineItem(editingItem.id, data);
      } else {
        await createLineItem(data);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving line item:', err);
      toast.error('Failed to save line item');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteLineItem(itemToDelete.id);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting line item:', err);
      toast.error('Failed to delete line item');
    }
  };

  const handleBulkPricing = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      await bulkUpdatePricing(selectedIds, bulkPriceChange, bulkPriceReason);
      setBulkPricingOpen(false);
      setSelectedIds([]);
      setBulkPriceChange(0);
      setBulkPriceReason('');
    } catch (err) {
      console.error('Error updating pricing:', err);
      toast.error('Failed to update pricing');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Line Item Library</h2>
          <p className="text-gray-500 mt-1">
            Manage your reusable line items for estimates and quotes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="secondary" onClick={() => setBulkPricingOpen(true)}>
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Adjust Pricing ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search line items..."
            className="pl-9"
          />
        </div>

        <select
          value={selectedTrade}
          onChange={(e) => setSelectedTrade(e.target.value as LineItemTrade | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Trades</option>
          {LINE_ITEM_TRADES.map((trade) => (
            <option key={trade.value} value={trade.value}>
              {trade.label}
            </option>
          ))}
        </select>

        <div className="text-sm text-gray-500">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Items table with mobile cards */}
      <Card className="overflow-hidden">
        <ResponsiveTableWrapper
          mobileCards={
            filteredItems.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                {searchQuery || selectedTrade !== 'all'
                  ? 'No items match your filters'
                  : 'No line items yet. Create your first one!'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <MobileTableCard key={item.id} onClick={() => handleOpenModal(item)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="p-0.5"
                      >
                        {item.isFavorite ? (
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {LINE_ITEM_TRADES.find((t) => t.value === item.trade)?.label || item.trade}
                    </span>
                  </div>
                  <MobileTableRow label="Unit Price">
                    {formatPrice(item.unitPrice)}
                  </MobileTableRow>
                  <MobileTableRow label="Unit">{getUnitAbbr(item.unit)}</MobileTableRow>
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLineItem(item.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </MobileTableCard>
              ))
            )
          }
        >
          <Table stickyFirstColumn>
            <TableHead>
              <TableRow hover={false}>
                <TableHeader className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                </TableHeader>
                <TableHeader sortable sortDirection={sortBy === 'name' ? sortDir : null} onSort={() => toggleSort('name')}>
                  Name
                </TableHeader>
                <TableHeader sortable sortDirection={sortBy === 'trade' ? sortDir : null} onSort={() => toggleSort('trade')} priority="medium">
                  Trade
                </TableHeader>
                <TableHeader align="right" sortable sortDirection={sortBy === 'price' ? sortDir : null} onSort={() => toggleSort('price')}>
                  Unit Price
                </TableHeader>
                <TableHeader align="center" priority="medium">Unit</TableHeader>
                <TableHeader align="center" sortable sortDirection={sortBy === 'usage' ? sortDir : null} onSort={() => toggleSort('usage')} priority="low">
                  Usage
                </TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  message={
                    searchQuery || selectedTrade !== 'all'
                      ? 'No items match your filters'
                      : 'No line items yet. Create your first one!'
                  }
                />
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="p-0.5"
                        >
                          {item.isFavorite ? (
                            <StarIconSolid className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <StarIcon className="h-4 w-4 text-gray-300 hover:text-yellow-500" />
                          )}
                        </button>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                          )}
                          {item.sku && (
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell priority="medium">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {LINE_ITEM_TRADES.find((t) => t.value === item.trade)?.label || item.trade}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-medium text-gray-900">{formatPrice(item.unitPrice)}</span>
                      <div className="text-xs text-gray-500">
                        M: {formatPrice(item.materialCost)} + L: {formatPrice(item.laborCost)}
                      </div>
                    </TableCell>
                    <TableCell align="center" priority="medium">
                      <span className="text-gray-700">{getUnitAbbr(item.unit)}</span>
                    </TableCell>
                    <TableCell align="center" priority="low">
                      <span className="text-gray-700">{item.usageCount || 0}</span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => duplicateLineItem(item.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveTableWrapper>
      </Card>

      {/* Create/Edit Modal */}
      <BaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Line Item' : 'Add Line Item'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Create Line Item'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Standard Interior Paint"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional description..."
            />
          </div>

          {/* Trade and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData((p) => ({ ...p, trade: e.target.value as LineItemTrade }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {LINE_ITEM_TRADES.map((trade) => (
                  <option key={trade.value} value={trade.value}>
                    {trade.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value as LineItemUnit }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {LINE_ITEM_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label} ({unit.abbr})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={formData.materialCost}
                  onChange={(e) => setFormData((p) => ({ ...p, materialCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={formData.laborCost}
                  onChange={(e) => setFormData((p) => ({ ...p, laborCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Markup</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.defaultMarkup}
                  onChange={(e) => setFormData((p) => ({ ...p, defaultMarkup: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  className="w-full pr-7 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* Calculated price */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Calculated Unit Price:</span>
              <span className="font-medium text-brand-primary">
                {formatPrice(
                  (formData.materialCost + formData.laborCost) * (1 + formData.defaultMarkup / 100)
                )}
              </span>
            </div>
          </div>

          {/* SKU and Supplier */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))}
                placeholder="Internal SKU"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData((p) => ({ ...p, supplier: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier SKU</label>
              <Input
                value={formData.supplierSku}
                onChange={(e) => setFormData((p) => ({ ...p, supplierSku: e.target.value }))}
                placeholder="Supplier's SKU"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
              placeholder="Comma-separated tags"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., premium, exterior, residential</p>
          </div>
        </div>
      </BaseModal>

      {/* Delete Confirmation */}
      <BaseModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        title="Delete Line Item"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
        </p>
      </BaseModal>

      {/* Bulk Pricing Modal */}
      <BaseModal
        open={bulkPricingOpen}
        onClose={() => {
          setBulkPricingOpen(false);
          setBulkPriceChange(0);
          setBulkPriceReason('');
        }}
        title="Bulk Pricing Adjustment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setBulkPricingOpen(false);
                setBulkPriceChange(0);
                setBulkPriceReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkPricing}>
              Apply to {selectedIds.length} Items
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Adjust pricing for {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Change (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={bulkPriceChange}
                onChange={(e) => setBulkPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-7"
                placeholder="e.g., 5 for 5% increase, -10 for 10% decrease"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Positive value for increase, negative for decrease
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <Input
              value={bulkPriceReason}
              onChange={(e) => setBulkPriceReason(e.target.value)}
              placeholder="e.g., Material cost increase Q1 2026"
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
