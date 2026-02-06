"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { Estimate, EstimateLineItem } from '@/types';
import { createEstimate } from '@/lib/hooks/useEstimates';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { getNextNumber } from '@/lib/utils/auto-number';
import { logger } from '@/lib/utils/logger';

const unitOptions = [
  { value: 'each', label: 'Each' },
  { value: 'sqft', label: 'Sq Ft' },
  { value: 'lf', label: 'Linear Ft' },
  { value: 'hr', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'job', label: 'Job/Lump Sum' },
  { value: 'lot', label: 'Lot' },
  { value: 'unit', label: 'Unit' },
];

const categoryOptions = [
  'General Conditions',
  'Site Work',
  'Concrete',
  'Masonry',
  'Metals',
  'Wood & Plastics',
  'Thermal & Moisture',
  'Doors & Windows',
  'Finishes',
  'Specialties',
  'Equipment',
  'Furnishings',
  'Special Construction',
  'Conveying Equipment',
  'Mechanical',
  'Electrical',
  'Labor',
  'Materials',
  'Permits & Fees',
  'Other',
];

interface LineItemRowProps {
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function LineItemRow({ item, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: LineItemRowProps) {
  const updateField = (field: keyof EstimateLineItem, value: any) => {
    const updated = { ...item, [field]: value };
    // Recalculate total
    if (field === 'quantity' || field === 'unitCost') {
      updated.totalCost = (updated.quantity || 0) * (updated.unitCost || 0);
    }
    onChange(updated);
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex flex-col gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className={cn(
            "p-1 rounded hover:bg-gray-200",
            isFirst && "opacity-30 cursor-not-allowed"
          )}
        >
          <ChevronUpIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className={cn(
            "p-1 rounded hover:bg-gray-200",
            isLast && "opacity-30 cursor-not-allowed"
          )}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <input
            type="text"
            value={item.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Item name"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20"
          />
          <input
            type="text"
            value={item.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded mt-1 text-gray-600"
          />
        </div>
        <div className="col-span-2">
          <select
            value={item.category || ''}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20"
          >
            <option value="">Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
            placeholder="Qty"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 text-right"
          />
        </div>
        <div className="col-span-1">
          <select
            value={item.unit}
            onChange={(e) => updateField('unit', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20"
          >
            {unitOptions.map((unit) => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={item.unitCost}
              onChange={(e) => updateField('unitCost', parseFloat(e.target.value) || 0)}
              placeholder="Unit cost"
              step="0.01"
              className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 text-right"
            />
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewEstimatePage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [estimateNumber, setEstimateNumber] = useState<string>('');
  const [numberLoading, setNumberLoading] = useState(true);
  const [estimate, setEstimate] = useState<Partial<Estimate>>({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectName: '',
    projectAddress: '',
    status: 'draft',
    lineItems: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 0,
    markupPercent: 0,
    revisionNumber: 0,
    paymentTerms: 'Net 30',
    scopeOfWork: '',
    exclusions: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);

  // Load the next estimate number on mount
  useEffect(() => {
    if (!profile?.orgId) return;

    const loadEstimateNumber = async () => {
      try {
        const nextNum = await getNextNumber(profile.orgId, 'estimate');
        setEstimateNumber(nextNum);
      } catch (error) {
        logger.error('Failed to load estimate number', { error, page: 'new-estimate' });
        // Fallback to timestamp-based number
        setEstimateNumber(`EST-${String(Date.now()).slice(-6)}`);
      } finally {
        setNumberLoading(false);
      }
    };

    loadEstimateNumber();
  }, [profile?.orgId]);

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addLineItem = () => {
    const newItem: EstimateLineItem = {
      id: generateId(),
      sortOrder: lineItems.length,
      name: '',
      quantity: 1,
      unit: 'each',
      unitCost: 0,
      totalCost: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, item: EstimateLineItem) => {
    const updated = [...lineItems];
    updated[index] = item;
    setLineItems(updated);
  };

  const deleteLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const moveLineItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lineItems.length) return;
    const updated = [...lineItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setLineItems(updated.map((item, i) => ({ ...item, sortOrder: i })));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
  const markupAmount = subtotal * ((estimate.markupPercent || 0) / 100);
  const subtotalWithMarkup = subtotal + markupAmount;
  const taxAmount = subtotalWithMarkup * ((estimate.taxRate || 0) / 100);
  const total = subtotalWithMarkup + taxAmount;

  const handleSave = async () => {
    if (!user || !profile) return;

    if (!estimate.name?.trim()) {
      toast.error('Please enter an estimate name');
      return;
    }

    if (!estimate.clientName?.trim()) {
      toast.error('Please enter client name');
      return;
    }

    if (lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    setSaving(true);
    try {
      const estimateId = await createEstimate(
        {
          name: estimate.name || '',
          clientName: estimate.clientName || '',
          clientEmail: estimate.clientEmail,
          clientPhone: estimate.clientPhone,
          clientAddress: estimate.clientAddress,
          projectName: estimate.projectName,
          projectAddress: estimate.projectAddress,
          lineItems,
          taxRate: estimate.taxRate,
          markupPercent: estimate.markupPercent,
          paymentTerms: estimate.paymentTerms,
          depositPercent: estimate.depositPercent,
          validUntil: estimate.validUntil,
          scopeOfWork: estimate.scopeOfWork,
          exclusions: estimate.exclusions,
          notes: estimate.notes,
        },
        profile.orgId,
        user.uid,
        profile.displayName
      );
      toast.success('Estimate created');
      router.push(`/dashboard/estimates/${estimateId}`);
    } catch (error) {
      logger.error('Error creating estimate', { error, page: 'new-estimate' });
      toast.error('Failed to create estimate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">New Estimate</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Save Estimate
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Estimate Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimate Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={numberLoading ? 'Loading...' : estimateNumber}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      Auto-generated
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimate Name *
                  </label>
                  <input
                    type="text"
                    value={estimate.name || ''}
                    onChange={(e) => setEstimate({ ...estimate, name: e.target.value })}
                    placeholder="e.g., Kitchen Remodel - Smith Residence"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={estimate.projectName || ''}
                    onChange={(e) => setEstimate({ ...estimate, projectName: e.target.value })}
                    placeholder="Project name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Address
                  </label>
                  <input
                    type="text"
                    value={estimate.projectAddress || ''}
                    onChange={(e) => setEstimate({ ...estimate, projectAddress: e.target.value })}
                    placeholder="Address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
              </div>
            </Card>

            {/* Client Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={estimate.clientName || ''}
                    onChange={(e) => setEstimate({ ...estimate, clientName: e.target.value })}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={estimate.clientEmail || ''}
                    onChange={(e) => setEstimate({ ...estimate, clientEmail: e.target.value })}
                    placeholder="client@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={estimate.clientPhone || ''}
                    onChange={(e) => setEstimate({ ...estimate, clientPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={estimate.clientAddress || ''}
                    onChange={(e) => setEstimate({ ...estimate, clientAddress: e.target.value })}
                    placeholder="123 Main St, City, State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
              </div>
            </Card>

            {/* Line Items */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">Line Items</h2>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {lineItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalculatorIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="mb-4">No line items yet</p>
                  <Button variant="outline" onClick={addLineItem}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-3 text-xs font-medium text-gray-500 uppercase">
                    <div className="w-8" />
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      <div className="col-span-4">Item</div>
                      <div className="col-span-2">Category</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-1">Unit</div>
                      <div className="col-span-2">Unit Cost</div>
                      <div className="col-span-2">Total</div>
                    </div>
                  </div>

                  {lineItems.map((item, index) => (
                    <LineItemRow
                      key={item.id}
                      item={item}
                      onChange={(updated) => updateLineItem(index, updated)}
                      onDelete={() => deleteLineItem(index)}
                      onMoveUp={() => moveLineItem(index, 'up')}
                      onMoveDown={() => moveLineItem(index, 'down')}
                      isFirst={index === 0}
                      isLast={index === lineItems.length - 1}
                    />
                  ))}

                  <Button variant="ghost" size="sm" onClick={addLineItem} className="w-full">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Line Item
                  </Button>
                </div>
              )}
            </Card>

            {/* Scope of Work */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Scope & Terms</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scope of Work
                  </label>
                  <textarea
                    value={estimate.scopeOfWork || ''}
                    onChange={(e) => setEstimate({ ...estimate, scopeOfWork: e.target.value })}
                    placeholder="Describe the work to be performed..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exclusions
                  </label>
                  <textarea
                    value={estimate.exclusions || ''}
                    onChange={(e) => setEstimate({ ...estimate, exclusions: e.target.value })}
                    placeholder="Items not included in this estimate..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={estimate.notes || ''}
                    onChange={(e) => setEstimate({ ...estimate, notes: e.target.value })}
                    placeholder="Additional notes or clarifications..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Totals */}
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5" />
                Pricing
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-gray-600 text-sm flex-1">Markup %</label>
                  <input
                    type="number"
                    value={estimate.markupPercent || 0}
                    onChange={(e) => setEstimate({ ...estimate, markupPercent: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                  />
                  <span className="text-gray-500 text-sm">=</span>
                  <span className="text-sm w-20 text-right">${markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-gray-600 text-sm flex-1">Tax %</label>
                  <input
                    type="number"
                    value={estimate.taxRate || 0}
                    onChange={(e) => setEstimate({ ...estimate, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                  />
                  <span className="text-gray-500 text-sm">=</span>
                  <span className="text-sm w-20 text-right">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-t-2 border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={estimate.paymentTerms || 'Net 30'}
                  onChange={(e) => setEstimate({ ...estimate, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="50/50">50% Deposit, 50% on Completion</option>
                  <option value="Progress">Progress Billing</option>
                </select>
              </div>

              {/* Deposit */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Deposit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={estimate.depositPercent || ''}
                    onChange={(e) => setEstimate({
                      ...estimate,
                      depositPercent: parseFloat(e.target.value) || 0,
                      depositRequired: total * (parseFloat(e.target.value) || 0) / 100
                    })}
                    placeholder="0"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                  <span className="text-gray-500">%</span>
                  <span className="text-gray-500">=</span>
                  <span className="font-medium">
                    ${((estimate.depositPercent || 0) * total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Valid Until */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={estimate.validUntil ? new Date(estimate.validUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEstimate({ ...estimate, validUntil: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
