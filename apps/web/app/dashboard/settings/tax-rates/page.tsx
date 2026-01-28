"use client";

import React, { useState } from 'react';
import { useTaxRates } from '@/lib/hooks/useTaxRates';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

export default function TaxRatesPage() {
  const { taxRates, loading, addTaxRate, updateTaxRate, deleteTaxRate, setDefault } = useTaxRates();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    rate: '',
    description: '',
    appliesTo: ['invoices', 'estimates'] as ('estimates' | 'invoices')[],
  });

  const resetForm = () => {
    setForm({ name: '', rate: '', description: '', appliesTo: ['invoices', 'estimates'] });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rate: typeof taxRates[number]) => {
    setForm({
      name: rate.name,
      rate: rate.rate.toString(),
      description: rate.description || '',
      appliesTo: rate.appliesTo,
    });
    setEditingId(rate.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.rate) {
      toast.error('Name and rate are required');
      return;
    }

    const rateNum = parseFloat(form.rate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      toast.error('Rate must be between 0 and 100');
      return;
    }

    try {
      if (editingId) {
        await updateTaxRate(editingId, {
          name: form.name,
          rate: rateNum,
          description: form.description,
          appliesTo: form.appliesTo,
        });
        toast.success('Tax rate updated');
      } else {
        await addTaxRate({
          name: form.name,
          rate: rateNum,
          description: form.description,
          appliesTo: form.appliesTo,
        });
        toast.success('Tax rate added');
      }
      resetForm();
    } catch {
      toast.error('Failed to save tax rate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tax rate?')) return;
    try {
      await deleteTaxRate(id);
      toast.success('Tax rate deleted');
    } catch {
      toast.error('Failed to delete tax rate');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault(id);
      toast.success('Default tax rate updated');
    } catch {
      toast.error('Failed to set default');
    }
  };

  const toggleAppliesTo = (type: 'estimates' | 'invoices') => {
    setForm((prev) => ({
      ...prev,
      appliesTo: prev.appliesTo.includes(type)
        ? prev.appliesTo.filter((t) => t !== type)
        : [...prev.appliesTo, type],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tax Rates</h2>
          <p className="text-sm text-gray-500">Configure tax rates for estimates and invoices</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Tax Rate
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Tax Rate' : 'New Tax Rate'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., Sales Tax, State Tax"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., 8.25"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., California state + county sales tax"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleAppliesTo('estimates')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    form.appliesTo.includes('estimates')
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-500'
                  )}
                >
                  Estimates
                </button>
                <button
                  onClick={() => toggleAppliesTo('invoices')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    form.appliesTo.includes('invoices')
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-500'
                  )}
                >
                  Invoices
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingId ? 'Save Changes' : 'Add Tax Rate'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tax Rates List */}
      {taxRates.length === 0 ? (
        <Card className="p-8 text-center">
          <ReceiptPercentIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tax rates configured</p>
          <p className="text-sm text-gray-400 mt-1">Add a tax rate to automatically calculate taxes on estimates and invoices.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {taxRates.map((rate) => (
            <Card key={rate.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {rate.isDefault && (
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{rate.name}</p>
                      <Badge className={cn(
                        'text-xs',
                        rate.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {rate.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {rate.description && (
                        <span className="text-xs text-gray-400">{rate.description}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        Applies to: {rate.appliesTo.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">{rate.rate}%</span>
                  <div className="flex gap-1">
                    {!rate.isDefault && (
                      <button
                        onClick={() => handleSetDefault(rate.id)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 rounded"
                        title="Set as default"
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(rate)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
