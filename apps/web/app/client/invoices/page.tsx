"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format, isAfter, isBefore } from 'date-fns';

interface ClientInvoice {
  id: string;
  number: string;
  projectId: string;
  projectName: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentToken?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: DocumentTextIcon },
  sent: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  viewed: { label: 'Viewed', color: 'bg-blue-100 text-blue-700', icon: DocumentTextIcon },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: ExclamationCircleIcon },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: DocumentTextIcon },
};

export default function ClientInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadInvoices() {
      if (!user?.uid) return;

      try {
        const invoicesSnap = await getDocs(
          query(
            collection(db, 'invoices'),
            where('clientId', '==', user.uid),
            orderBy('issueDate', 'desc')
          )
        );

        const invoicesData = invoicesSnap.docs.map((d) => {
          const data = d.data();
          const issueDate = data.issueDate?.toDate() || new Date();
          const dueDate = data.dueDate?.toDate() || new Date();
          const total = data.total || 0;
          const amountPaid = data.amountPaid || 0;

          // Auto-update status if overdue
          let status = data.status || 'sent';
          if (status !== 'paid' && status !== 'cancelled' && isBefore(dueDate, new Date())) {
            status = 'overdue';
          }

          return {
            id: d.id,
            number: data.number || data.invoiceNumber || d.id.slice(0, 8).toUpperCase(),
            projectId: data.projectId || '',
            projectName: data.projectName || 'Project',
            status,
            issueDate,
            dueDate,
            subtotal: data.subtotal || total,
            tax: data.tax || 0,
            total,
            amountPaid,
            balance: total - amountPaid,
            paymentToken: data.paymentToken,
            items: data.items || [],
          } as ClientInvoice;
        });

        setInvoices(invoicesData);
      } catch (err) {
        console.error('Error loading invoices:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [user?.uid]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    if (statusFilter === 'unpaid') {
      return invoices.filter((i) => ['sent', 'viewed', 'overdue'].includes(i.status));
    }
    return invoices.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const totalPending = useMemo(() => {
    return invoices
      .filter((i) => ['sent', 'viewed', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.balance, 0);
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-500 mt-1">View and pay your project invoices</p>
      </div>

      {/* Summary Card */}
      {totalPending > 0 && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Balance Due</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalPending)}</p>
              <p className="text-blue-100 text-sm mt-2">
                {invoices.filter((i) => ['sent', 'viewed', 'overdue'].includes(i.status)).length} unpaid invoice(s)
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <CurrencyDollarIcon className="h-8 w-8" />
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {[
          { key: 'all', label: 'All' },
          { key: 'unpaid', label: 'Unpaid' },
          { key: 'paid', label: 'Paid' },
          { key: 'overdue', label: 'Overdue' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              statusFilter === key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No invoices found</p>
          <p className="text-sm text-gray-400 mt-1">
            {invoices.length === 0
              ? 'Invoices will appear here when your contractor sends them.'
              : 'Try adjusting your filter.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.sent;
            const StatusIcon = config.icon;
            const canPay = ['sent', 'viewed', 'overdue'].includes(invoice.status) && invoice.balance > 0;

            return (
              <Card
                key={invoice.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={cn('p-3 rounded-lg flex-shrink-0', config.color)}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">Invoice #{invoice.number}</p>
                        <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{invoice.projectName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due {format(invoice.dueDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                    {invoice.amountPaid > 0 && invoice.status !== 'paid' && (
                      <p className="text-sm text-gray-500">
                        {formatCurrency(invoice.balance)} remaining
                      </p>
                    )}
                    {canPay && invoice.paymentToken && (
                      <Link
                        href={`/pay/${invoice.paymentToken}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        Pay Now
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSelectedInvoice(null)}
            />
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Invoice #{selectedInvoice.number}
              </h2>

              <div className="space-y-4">
                {/* Status & Dates */}
                <div className="flex items-center justify-between">
                  <Badge className={cn('text-sm', STATUS_CONFIG[selectedInvoice.status]?.color)}>
                    {STATUS_CONFIG[selectedInvoice.status]?.label}
                  </Badge>
                  <div className="text-right text-sm text-gray-500">
                    <p>Issued: {format(selectedInvoice.issueDate, 'MMM d, yyyy')}</p>
                    <p>Due: {format(selectedInvoice.dueDate, 'MMM d, yyyy')}</p>
                  </div>
                </div>

                {/* Project */}
                <div className="py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Project</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.projectName}</p>
                </div>

                {/* Line Items */}
                {selectedInvoice.items.length > 0 && (
                  <div className="py-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.description}
                            {item.quantity > 1 && ` (x${item.quantity})`}
                          </span>
                          <span className="font-medium">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="py-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span>{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                  {selectedInvoice.amountPaid > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Paid</span>
                        <span>-{formatCurrency(selectedInvoice.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-600">
                        <span>Balance Due</span>
                        <span>{formatCurrency(selectedInvoice.balance)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Close
                  </Button>
                  {['sent', 'viewed', 'overdue'].includes(selectedInvoice.status) &&
                    selectedInvoice.balance > 0 &&
                    selectedInvoice.paymentToken && (
                      <Link
                        href={`/pay/${selectedInvoice.paymentToken}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        Pay {formatCurrency(selectedInvoice.balance)}
                      </Link>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
