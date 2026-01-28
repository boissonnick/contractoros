"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Invoice, InvoiceStatus, InvoiceType } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format, differenceInDays } from 'date-fns';

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: <ClockIcon className="h-4 w-4" /> },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: <ClockIcon className="h-4 w-4" /> },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700', icon: <ReceiptPercentIcon className="h-4 w-4" /> },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: <ExclamationCircleIcon className="h-4 w-4" /> },
  void: { label: 'Void', color: 'bg-gray-100 text-gray-500', icon: <DocumentTextIcon className="h-4 w-4" /> },
};

const typeConfig: Record<InvoiceType, string> = {
  standard: 'Standard',
  progress: 'Progress',
  aia_g702: 'AIA G702/G703',
  deposit: 'Deposit',
  final: 'Final',
  change_order: 'Change Order',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const loadInvoices = async () => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'invoices'),
        where('orgId', '==', profile.orgId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        sentAt: doc.data().sentAt?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
      })) as Invoice[];

      // Check for overdue invoices
      const now = new Date();
      const updatedItems = items.map((inv) => {
        if (inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'partial') {
          if (inv.dueDate && new Date(inv.dueDate) < now) {
            return { ...inv, status: 'overdue' as InvoiceStatus };
          }
        }
        return inv;
      });

      setInvoices(updatedItems);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.orgId) {
      loadInvoices();
    }
  }, [profile?.orgId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices.length;
    const outstanding = invoices.filter((i) =>
      ['sent', 'viewed', 'partial', 'overdue'].includes(i.status)
    );
    const outstandingCount = outstanding.length;
    const outstandingAmount = outstanding.reduce((sum, i) => sum + i.amountDue, 0);
    const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
    const overdueAmount = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((sum, i) => sum + i.amountDue, 0);
    const paidThisMonth = invoices
      .filter((i) => {
        if (i.status !== 'paid' || !i.paidAt) return false;
        const paidDate = new Date(i.paidAt);
        const now = new Date();
        return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, i) => sum + i.amountPaid, 0);
    return { total, outstandingCount, outstandingAmount, overdueCount, overdueAmount, paidThisMonth };
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysOverdue = (dueDate: Date) => {
    return differenceInDays(new Date(), new Date(dueDate));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">
            Manage invoices and track payments
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/dashboard/invoices/new')}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.outstandingAmount)}</p>
              <p className="text-xs text-gray-500">Outstanding ({stats.outstandingCount})</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overdueAmount)}</p>
              <p className="text-xs text-gray-500">Overdue ({stats.overdueCount})</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.paidThisMonth)}</p>
              <p className="text-xs text-gray-500">Paid This Month</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Invoices</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title={invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
          description={invoices.length === 0
            ? "Create your first invoice to start getting paid."
            : "Try adjusting your search or filter criteria."
          }
          action={invoices.length === 0 ? {
            label: 'New Invoice',
            onClick: () => router.push('/dashboard/invoices/new'),
          } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const isOverdue = invoice.status === 'overdue';
            const daysOverdue = isOverdue && invoice.dueDate ? getDaysOverdue(invoice.dueDate) : 0;

            return (
              <Card
                key={invoice.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">{invoice.number}</span>
                      <Badge className={statusConfig[invoice.status].color}>
                        {statusConfig[invoice.status].icon}
                        <span className="ml-1">{statusConfig[invoice.status].label}</span>
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-600">
                        {typeConfig[invoice.type]}
                      </Badge>
                      {isOverdue && daysOverdue > 0 && (
                        <span className="text-xs text-red-600 font-medium">
                          {daysOverdue} days overdue
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">{invoice.clientName}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {invoice.projectName && <span>{invoice.projectName}</span>}
                      <span>Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </p>
                    {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
                      <p className="text-sm text-green-600">
                        {formatCurrency(invoice.amountPaid)} paid
                      </p>
                    )}
                    {invoice.amountDue > 0 && invoice.status !== 'paid' && (
                      <p className={cn(
                        "text-sm",
                        isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                      )}>
                        {formatCurrency(invoice.amountDue)} due
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
