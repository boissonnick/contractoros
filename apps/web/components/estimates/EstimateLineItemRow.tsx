"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui';
import {
  BuilderLineItem,
  LineItemUnit,
  LINE_ITEM_UNITS,
} from '@/types';
import {
  TrashIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export interface EstimateLineItemRowProps {
  item: BuilderLineItem;
  onChange: (item: BuilderLineItem) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showCostBreakdown?: boolean;
  className?: string;
}

/**
 * EstimateLineItemRow - Editable line item on an estimate
 */
export default function EstimateLineItemRow({
  item,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  showCostBreakdown = false,
  className,
}: EstimateLineItemRowProps) {
  const [expanded, setExpanded] = useState(false);

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

  // Calculate totals
  const calculateTotals = (updates: Partial<BuilderLineItem>) => {
    const quantity = updates.quantity ?? item.quantity;
    const unitPrice = updates.unitPrice ?? item.unitPrice;
    const markupPercent = updates.markupPercent ?? item.markupPercent;
    const taxable = updates.taxable ?? item.taxable;
    // Tax rate would come from org settings - using 0 for now
    const taxRate = 0;

    const subtotal = quantity * unitPrice;
    const markupAmount = subtotal * (markupPercent / 100);
    const taxAmount = taxable ? (subtotal + markupAmount) * (taxRate / 100) : 0;
    const total = subtotal + markupAmount + taxAmount;

    return { subtotal, markupAmount, taxAmount, total };
  };

  const handleChange = (field: keyof BuilderLineItem, value: unknown) => {
    const updates = { [field]: value } as Partial<BuilderLineItem>;
    const totals = calculateTotals(updates);

    onChange({
      ...item,
      ...updates,
      ...totals,
    });
  };

  const handlePriceChange = (field: 'materialCost' | 'laborCost', value: number) => {
    const materialCost = field === 'materialCost' ? value : item.materialCost;
    const laborCost = field === 'laborCost' ? value : item.laborCost;
    const unitPrice = materialCost + laborCost;

    const totals = calculateTotals({ unitPrice });

    onChange({
      ...item,
      materialCost,
      laborCost,
      unitPrice,
      ...totals,
    });
  };

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
      {/* Main row */}
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={cn(
              'p-0.5 rounded hover:bg-gray-100',
              !canMoveUp && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronUpIcon className="h-3 w-3 text-gray-400" />
          </button>
          <Bars3Icon className="h-4 w-4 text-gray-400" />
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className={cn(
              'p-0.5 rounded hover:bg-gray-100',
              !canMoveDown && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronDownIcon className="h-3 w-3 text-gray-400" />
          </button>
        </div>

        {/* Name and description */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={item.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full font-medium text-gray-900 border-0 p-0 focus:ring-0 bg-transparent"
            placeholder="Item name"
          />
          <input
            type="text"
            value={item.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full text-sm text-gray-500 border-0 p-0 focus:ring-0 bg-transparent"
            placeholder="Description (optional)"
          />
        </div>

        {/* Quantity */}
        <div className="w-20">
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Unit */}
        <div className="w-20">
          <select
            value={item.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
          >
            {LINE_ITEM_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.abbr}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Price */}
        <div className="w-28">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full pl-5 border border-gray-200 rounded px-2 py-1 text-sm text-right"
            />
          </div>
        </div>

        {/* Total */}
        <div className="w-28 text-right">
          <span className="font-medium text-gray-900">{formatPrice(item.total)}</span>
        </div>

        {/* Expand/Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ChevronDownIcon
              className={cn('h-4 w-4 text-gray-400 transition-transform', expanded && 'rotate-180')}
            />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-3">
          {/* Cost breakdown */}
          {showCostBreakdown && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Material Cost</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={item.materialCost}
                    onChange={(e) => handlePriceChange('materialCost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full pl-5 border border-gray-200 rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Labor Cost</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={item.laborCost}
                    onChange={(e) => handlePriceChange('laborCost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full pl-5 border border-gray-200 rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                <div className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                  {formatPrice(item.subtotal)}
                </div>
              </div>
            </div>
          )}

          {/* Markup and tax */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Markup %</label>
              <div className="relative">
                <input
                  type="number"
                  value={item.markupPercent}
                  onChange={(e) => handleChange('markupPercent', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Markup Amount</label>
              <div className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {formatPrice(item.markupAmount)}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Taxable</label>
              <label className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.taxable}
                  onChange={(e) => handleChange('taxable', e.target.checked)}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={item.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm resize-none"
              placeholder="Internal notes for this line item..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
