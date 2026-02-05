"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from 'firebase/firestore';
import { Button, Card, Badge, EmptyState, PageHeader } from '@/components/ui';
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
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { format, differenceInDays } from 'date-fns';

// Pagination settings
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

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

  // Pagination state
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const parseInvoiceDoc = (doc: QueryDocumentSnapshot<DocumentData>): Invoice => {
    const data = doc.data();
    const now = new Date();
    let status = data.status as InvoiceStatus;

    // Check for overdue
    if (['sent', 'viewed', 'partial'].includes(status)) {
      const dueDate = data.dueDate?.toDate();
      if (dueDate && dueDate < now) {
        status = 'overdue';
      }
    }

    return {
      id: doc.id,
      ...data,
      status,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      dueDate: data.dueDate?.toDate(),
      sentAt: data.sentAt?.toDate(),
      paidAt: data.paidAt?.toDate(),
    } as Invoice;
  };

  const loadInvoices = useCallback(async (direction: 'first' | 'next' | 'prev' = 'first') => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);

      // Get total count
      const countQuery = query(
        collection(db, 'invoices'),
        where('orgId', '==', profile.orgId)
      );
      const countSnapshot = await getCountFromServer(countQuery);
      setTotalCount(countSnapshot.data().count);

      // Build paginated query
      let q = query(
        collection(db, 'invoices'),
        where('orgId', '==', profile.orgId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (direction === 'next' && lastDoc) {
        q = query(
          collection(db, 'invoices'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else if (direction === 'prev' && pageHistory.length >= 2) {
        // Go back to previous page start
        const prevPageStart = pageHistory[pageHistory.length - 2];
        q = query(
          collection(db, 'invoices'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc'),
          startAfter(prevPageStart),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(parseInvoiceDoc);

      setInvoices(items);

      // Update pagination cursors
      if (snapshot.docs.length > 0) {
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

        if (direction === 'next') {
          setPageHistory(prev => [...prev, firstDoc!]);
        } else if (direction === 'prev') {
          setPageHistory(prev => prev.slice(0, -1));
        } else {
          setPageHistory([]);
        }
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId, pageSize, lastDoc, firstDoc, pageHistory]);

  useEffect(() => {
    if (profile?.orgId) {
      setCurrentPage(1);
      loadInvoices('first');
    }
  }, [profile?.orgId, pageSize, loadInvoices]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      loadInvoices('next');
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      loadInvoices('prev');
    }
  };

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setPageHistory([]);
  };

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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title="Invoices"
          description="Manage invoices and track payments"
          actions={
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/invoices/new')}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          }
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold font-heading tracking-tight text-gray-900">Invoices</h1>
        <p className="text-xs text-gray-500">Manage invoices and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-blue-600">
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{formatCurrency(stats.outstandingAmount)}</p>
              <p className="text-xs text-gray-500">Outstanding ({stats.outstandingCount})</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-red-600">
              <ExclamationCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{formatCurrency(stats.overdueAmount)}</p>
              <p className="text-xs text-gray-500">Overdue ({stats.overdueCount})</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-green-600">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{formatCurrency(stats.paidThisMonth)}</p>
              <p className="text-xs text-gray-500">Paid This Month</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-gray-600">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading tracking-tight text-gray-900">{stats.total}</p>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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

      {/* Pagination Controls */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value) as PageSize)}
              className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} invoices
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile FAB for New Invoice */}
      <button
        onClick={() => router.push('/dashboard/invoices/new')}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="New Invoice"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
