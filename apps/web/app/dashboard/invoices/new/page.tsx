"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Button, Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { Invoice, InvoiceLineItem, InvoiceType } from '@/types';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { addDays, format } from 'date-fns';
import { reserveNumber, getNextNumber } from '@/lib/utils/auto-number';

const invoiceTypeOptions: { value: InvoiceType; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard Invoice', description: 'Simple line-item invoice' },
  { value: 'progress', label: 'Progress Billing', description: 'Bill for work completed to date' },
  { value: 'aia_g702', label: 'AIA G702/G703', description: 'Standard contractor billing format' },
  { value: 'deposit', label: 'Deposit Invoice', description: 'Request upfront payment' },
  { value: 'final', label: 'Final Invoice', description: 'Project completion billing' },
  { value: 'change_order', label: 'Change Order', description: 'Additional work billing' },
];

const paymentTermsOptions = [
  { value: 'Due on Receipt', days: 0 },
  { value: 'Net 15', days: 15 },
  { value: 'Net 30', days: 30 },
  { value: 'Net 45', days: 45 },
  { value: 'Net 60', days: 60 },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [numberLoading, setNumberLoading] = useState(true);
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    type: 'standard',
    status: 'draft',
    clientName: '',
    clientEmail: '',
    projectName: '',
    paymentTerms: 'Net 30',
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    retainage: 0,
    retainageAmount: 0,
    total: 0,
    amountDue: 0,
    amountPaid: 0,
    notes: '',
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Load the next invoice number on mount
  useEffect(() => {
    if (!profile?.orgId) return;

    const loadInvoiceNumber = async () => {
      try {
        const nextNum = await getNextNumber(profile.orgId, 'invoice');
        setInvoiceNumber(nextNum);
      } catch (error) {
        console.error('Failed to load invoice number:', error);
        // Fallback to timestamp-based number
        setInvoiceNumber(`INV-${String(Date.now()).slice(-6)}`);
      } finally {
        setNumberLoading(false);
      }
    };

    loadInvoiceNumber();
  }, [profile?.orgId]);

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: generateId(),
      sortOrder: lineItems.length,
      description: '',
      quantity: 1,
      unit: 'each',
      unitPrice: 0,
      amount: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].amount = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    }
    setLineItems(updated);
  };

  const deleteLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((invoice.taxRate || 0) / 100);
  const retainageAmount = subtotal * ((invoice.retainage || 0) / 100);
  const total = subtotal + taxAmount - retainageAmount;
  const amountDue = total - (invoice.amountPaid || 0);

  // Calculate due date based on payment terms
  const getDueDate = () => {
    const term = paymentTermsOptions.find((t) => t.value === invoice.paymentTerms);
    return addDays(new Date(), term?.days || 30);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    if (!invoice.clientName?.trim()) {
      toast.error('Please enter client name');
      return;
    }

    if (lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    setSaving(true);
    try {
      // Reserve the number atomically to prevent duplicates
      const number = await reserveNumber(profile.orgId, 'invoice');

      const newInvoice = {
        ...invoice,
        number,
        orgId: profile.orgId,
        lineItems,
        subtotal,
        taxAmount,
        retainageAmount,
        total,
        amountDue,
        dueDate: Timestamp.fromDate(getDueDate()),
        createdBy: user.uid,
        createdByName: profile.displayName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
      toast.success('Invoice created');
      router.push(`/dashboard/invoices/${docRef.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">New Invoice</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Save Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Invoice Type */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {invoiceTypeOptions.map((type) => (
              <button
                key={type.value}
                onClick={() => setInvoice({ ...invoice, type: type.value })}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  invoice.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Client & Project Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill To</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={numberLoading ? 'Loading...' : invoiceNumber}
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
                Client Name *
              </label>
              <input
                type="text"
                value={invoice.clientName || ''}
                onChange={(e) => setInvoice({ ...invoice, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Email
              </label>
              <input
                type="email"
                value={invoice.clientEmail || ''}
                onChange={(e) => setInvoice({ ...invoice, clientEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={invoice.projectName || ''}
                onChange={(e) => setInvoice({ ...invoice, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Address
              </label>
              <input
                type="text"
                value={invoice.billingAddress || ''}
                onChange={(e) => setInvoice({ ...invoice, billingAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <Button variant="outline" size="sm" onClick={addLineItem}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="mb-4">No line items yet</p>
              <Button variant="outline" onClick={addLineItem}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-2">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1" />
              </div>

              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-right"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => deleteLineItem(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <Button variant="ghost" size="sm" onClick={addLineItem} className="w-full">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Line Item
              </Button>
            </div>
          )}
        </Card>

        {/* Totals & Payment Terms */}
        <div className="grid grid-cols-2 gap-6">
          {/* Payment Terms */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={invoice.paymentTerms || 'Net 30'}
                  onChange={(e) => setInvoice({ ...invoice, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {paymentTermsOptions.map((term) => (
                    <option key={term.value} value={term.value}>{term.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="text"
                  value={format(getDueDate(), 'MMMM d, yyyy')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={invoice.notes || ''}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Totals */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totals</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center gap-2 py-2">
                <span className="text-gray-600 flex-1">Tax</span>
                <input
                  type="number"
                  value={invoice.taxRate || 0}
                  onChange={(e) => setInvoice({ ...invoice, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                />
                <span className="text-gray-500 text-sm">%</span>
                <span className="w-24 text-right">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center gap-2 py-2">
                <span className="text-gray-600 flex-1">Retainage</span>
                <input
                  type="number"
                  value={invoice.retainage || 0}
                  onChange={(e) => setInvoice({ ...invoice, retainage: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                />
                <span className="text-gray-500 text-sm">%</span>
                <span className="w-24 text-right text-red-600">-${retainageAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-3 border-t-2 border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-2 bg-blue-50 px-3 rounded-lg">
                <span className="font-medium text-blue-800">Amount Due</span>
                <span className="text-xl font-bold text-blue-800">
                  ${amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
