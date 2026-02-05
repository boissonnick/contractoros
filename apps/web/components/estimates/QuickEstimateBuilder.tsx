"use client";

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import LineItemPicker from './LineItemPicker';
import EstimateLineItemRow from './EstimateLineItemRow';
import { useLineItems, useEstimateTemplates } from '@/lib/hooks/useLineItems';
import {
  LineItem,
  BuilderLineItem,
  EstimateTemplate,
} from '@/types';
import {
  PlusIcon,
  DocumentDuplicateIcon,
  BookmarkIcon,
  CalculatorIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { v4 as uuid } from 'uuid';

export interface QuickEstimateBuilderProps {
  projectId?: string;
  clientId?: string;
  initialItems?: BuilderLineItem[];
  onChange?: (items: BuilderLineItem[]) => void;
  onSave?: (items: BuilderLineItem[], totals: EstimateTotals) => Promise<void>;
  className?: string;
}

export interface EstimateTotals {
  subtotal: number;
  markupTotal: number;
  taxTotal: number;
  grandTotal: number;
  itemCount: number;
}

/**
 * QuickEstimateBuilder - Fast estimate creation with line item library
 *
 * Features:
 * - Add items from library
 * - Quick manual item entry
 * - Template application
 * - Drag-and-drop reordering
 * - Running totals
 * - Markup and tax calculations
 */
export default function QuickEstimateBuilder({
  projectId: _projectId,
  clientId: _clientId,
  initialItems = [],
  onChange,
  onSave,
  className,
}: QuickEstimateBuilderProps) {
  const { recordUsage } = useLineItems();
  const { templates, recordUsage: recordTemplateUsage } = useEstimateTemplates();

  const [items, setItems] = useState<BuilderLineItem[]>(initialItems);
  const [showPicker, setShowPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultMarkup, setDefaultMarkup] = useState(20);
  const [defaultTaxable, setDefaultTaxable] = useState(true);

  // Calculate totals
  const calculateTotals = useCallback((lineItems: BuilderLineItem[]): EstimateTotals => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const markupTotal = lineItems.reduce((sum, item) => sum + item.markupAmount, 0);
    const taxTotal = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

    return {
      subtotal,
      markupTotal,
      taxTotal,
      grandTotal,
      itemCount: lineItems.length,
    };
  }, []);

  const totals = calculateTotals(items);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Update items and notify parent
  const updateItems = useCallback(
    (newItems: BuilderLineItem[]) => {
      setItems(newItems);
      onChange?.(newItems);
    },
    [onChange]
  );

  // Create estimate line item from library item
  const createFromLibraryItem = useCallback(
    (libraryItem: LineItem, sortOrder: number): BuilderLineItem => {
      const subtotal = libraryItem.unitPrice;
      const markupAmount = subtotal * (defaultMarkup / 100);
      const taxAmount = defaultTaxable ? (subtotal + markupAmount) * 0 : 0; // Tax rate would come from org

      return {
        id: uuid(),
        lineItemId: libraryItem.id,
        name: libraryItem.name,
        description: libraryItem.description,
        trade: libraryItem.trade,
        quantity: 1,
        unit: libraryItem.unit,
        materialCost: libraryItem.materialCost,
        laborCost: libraryItem.laborCost,
        unitPrice: libraryItem.unitPrice,
        subtotal,
        markupPercent: defaultMarkup,
        markupAmount,
        taxable: defaultTaxable,
        taxAmount,
        total: subtotal + markupAmount + taxAmount,
        sortOrder,
      };
    },
    [defaultMarkup, defaultTaxable]
  );

  // Create blank estimate line item
  const createBlankItem = useCallback(
    (sortOrder: number): BuilderLineItem => ({
      id: uuid(),
      name: '',
      quantity: 1,
      unit: 'each',
      materialCost: 0,
      laborCost: 0,
      unitPrice: 0,
      subtotal: 0,
      markupPercent: defaultMarkup,
      markupAmount: 0,
      taxable: defaultTaxable,
      taxAmount: 0,
      total: 0,
      sortOrder,
    }),
    [defaultMarkup, defaultTaxable]
  );

  // Add item from library
  const handleAddFromLibrary = useCallback(
    (libraryItem: LineItem) => {
      const newItem = createFromLibraryItem(libraryItem, items.length);
      updateItems([...items, newItem]);
      recordUsage(libraryItem.id);
    },
    [items, createFromLibraryItem, updateItems, recordUsage]
  );

  // Add blank item
  const handleAddBlankItem = useCallback(() => {
    const newItem = createBlankItem(items.length);
    updateItems([...items, newItem]);
  }, [items, createBlankItem, updateItems]);

  // Update item
  const handleUpdateItem = useCallback(
    (index: number, updatedItem: BuilderLineItem) => {
      const newItems = [...items];
      newItems[index] = updatedItem;
      updateItems(newItems);
    },
    [items, updateItems]
  );

  // Remove item
  const handleRemoveItem = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      // Update sort orders
      newItems.forEach((item, i) => {
        item.sortOrder = i;
      });
      updateItems(newItems);
    },
    [items, updateItems]
  );

  // Move item up
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      newItems.forEach((item, i) => {
        item.sortOrder = i;
      });
      updateItems(newItems);
    },
    [items, updateItems]
  );

  // Move item down
  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === items.length - 1) return;
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      newItems.forEach((item, i) => {
        item.sortOrder = i;
      });
      updateItems(newItems);
    },
    [items, updateItems]
  );

  // Apply template
  const handleApplyTemplate = useCallback(
    (template: EstimateTemplate) => {
      const newItems = template.lineItems.map((templateItem, index) => {
        const subtotal = templateItem.defaultQuantity * templateItem.unitPrice;
        const markupAmount = subtotal * (templateItem.markupPercent / 100);
        const taxAmount = templateItem.taxable ? (subtotal + markupAmount) * 0 : 0;

        return {
          id: uuid(),
          lineItemId: templateItem.lineItemId,
          name: templateItem.name,
          description: templateItem.description,
          trade: templateItem.trade,
          quantity: templateItem.defaultQuantity,
          unit: templateItem.unit,
          materialCost: templateItem.materialCost,
          laborCost: templateItem.laborCost,
          unitPrice: templateItem.unitPrice,
          subtotal,
          markupPercent: templateItem.markupPercent,
          markupAmount,
          taxable: templateItem.taxable,
          taxAmount,
          total: subtotal + markupAmount + taxAmount,
          phaseId: templateItem.phaseId,
          sortOrder: items.length + index,
        } as BuilderLineItem;
      });

      updateItems([...items, ...newItems]);
      recordTemplateUsage(template.id);
      setShowTemplates(false);
    },
    [items, updateItems, recordTemplateUsage]
  );

  // Save estimate
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(items, totals);
    } finally {
      setSaving(false);
    }
  }, [items, totals, onSave]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowPicker(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add from Library
          </Button>
          <Button variant="secondary" onClick={handleAddBlankItem}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Manual Item
          </Button>
          <Button variant="secondary" onClick={() => setShowTemplates(true)}>
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Default markup */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Default Markup</label>
            <div className="relative w-20">
              <input
                type="number"
                value={defaultMarkup}
                onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>

          {/* Taxable default */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={defaultTaxable}
              onChange={(e) => setDefaultTaxable(e.target.checked)}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-gray-500">Taxable by default</span>
          </label>
        </div>
      </div>

      {/* Line items */}
      <Card className="overflow-hidden">
        {/* Header row */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase">
            <div className="w-8" /> {/* Drag handle space */}
            <div className="flex-1">Description</div>
            <div className="w-20 text-center">Qty</div>
            <div className="w-20 text-center">Unit</div>
            <div className="w-28 text-center">Unit Price</div>
            <div className="w-28 text-right">Total</div>
            <div className="w-16" /> {/* Actions space */}
          </div>
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100">
          {items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CalculatorIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No line items yet</p>
              <p className="text-sm mt-1">
                Add items from your library or create manual entries
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button onClick={() => setShowPicker(true)} size="sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add from Library
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAddBlankItem}>
                  Add Manual Item
                </Button>
              </div>
            </div>
          ) : (
            items.map((item, index) => (
              <EstimateLineItemRow
                key={item.id}
                item={item}
                onChange={(updated) => handleUpdateItem(index, updated)}
                onRemove={() => handleRemoveItem(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                canMoveUp={index > 0}
                canMoveDown={index < items.length - 1}
                showCostBreakdown
              />
            ))
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({totals.itemCount} items)</span>
                  <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Markup</span>
                  <span className="font-medium">{formatPrice(totals.markupTotal)}</span>
                </div>
                {totals.taxTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-medium">{formatPrice(totals.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Grand Total</span>
                  <span className="text-brand-primary">{formatPrice(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Save button */}
      {onSave && items.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Save Estimate
          </Button>
        </div>
      )}

      {/* Line item picker modal */}
      <BaseModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title="Add Line Items"
        size="lg"
      >
        <div className="h-[60vh]">
          <LineItemPicker
            onSelect={(item) => {
              handleAddFromLibrary(item);
            }}
            selectedIds={items.filter((i) => i.lineItemId).map((i) => i.lineItemId!)}
            className="h-full"
          />
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={() => setShowPicker(false)}>
            Done
          </Button>
        </div>
      </BaseModal>

      {/* Templates modal */}
      <BaseModal
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Apply Template"
        size="md"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No templates yet</p>
              <p className="text-sm mt-1">Create templates from the settings page</p>
            </div>
          ) : (
            templates.filter((t) => t.isActive).map((template) => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{template.name}</p>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {template.lineItems.length} items
                  </span>
                </div>
                {(template.projectType || template.trade) && (
                  <div className="flex gap-2 mt-2">
                    {template.projectType && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {template.projectType}
                      </span>
                    )}
                    {template.trade && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {template.trade}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </BaseModal>
    </div>
  );
}

export type { BuilderLineItem };
