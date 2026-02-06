"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Card, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { Organization, Payment } from '@/types';
import { useInvoice, INVOICE_TYPE_LABELS } from '@/lib/hooks/useInvoices';
import { formatCurrency } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  NoSymbolIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { logger } from '@/lib/utils/logger';

// Status configuration for invoice badges
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <PencilSquareIcon className="h-4 w-4" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: <EnvelopeIcon className="h-4 w-4" /> },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: <EyeIcon className="h-4 w-4" /> },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700', icon: <BanknotesIcon className="h-4 w-4" /> },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: <ClockIcon className="h-4 w-4" /> },
  void: { label: 'Void', color: 'bg-gray-100 text-gray-500', icon: <NoSymbolIcon className="h-4 w-4" /> },
};

// Payment method labels
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  check: 'Check',
  credit_card: 'Credit Card',
  ach: 'ACH Transfer',
  cash: 'Cash',
  wire: 'Wire Transfer',
  other: 'Other',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const invoiceId = params.id as string;

  const {
    invoice,
    loading,
    sendInvoice,
    markAsPaid,
    voidInvoice,
    deleteInvoice,
  } = useInvoice(invoiceId, profile?.orgId || '');

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Load organization for PDF generation branding
  useEffect(() => {
    async function loadOrg() {
      if (!profile?.orgId) return;
      const orgDoc = await getDoc(doc(db, 'organizations', profile.orgId));
      if (orgDoc.exists()) {
        setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization);
      }
    }
    loadOrg();
  }, [profile?.orgId]);

  // --- Action Handlers ---

  const handleDownloadPdf = async () => {
    if (!invoice || !organization) return;
    setDownloadingPdf(true);
    try {
      const { generateAndUploadInvoicePdf } = await import('@/lib/esignature/pdf-service');
      const result = await generateAndUploadInvoicePdf(invoice, organization);
      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoice.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
      } else {
        toast.error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      logger.error('Error generating PDF', { error, page: 'invoice-detail' });
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    setSendingInvoice(true);
    try {
      await sendInvoice();
      toast.success('Invoice sent');
    } catch (error) {
      logger.error('Error sending invoice', { error, page: 'invoice-detail' });
      toast.error('Failed to send invoice');
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice || !user || !profile) return;
    try {
      await markAsPaid({
        amount: invoice.amountDue,
        method: 'other',
        notes: 'Marked as paid manually',
        receivedAt: new Date(),
        recordedBy: user.uid,
        recordedByName: profile.displayName || 'Unknown',
      });
      toast.success('Invoice marked as paid');
    } catch (error) {
      logger.error('Error marking as paid', { error, page: 'invoice-detail' });
      toast.error('Failed to mark as paid');
    }
  };

  const handleVoidInvoice = async () => {
    if (!invoice) return;
    const reason = prompt('Reason for voiding this invoice:');
    if (reason === null) return; // User cancelled
    try {
      await voidInvoice(reason);
      toast.success('Invoice voided');
    } catch (error) {
      logger.error('Error voiding invoice', { error, page: 'invoice-detail' });
      toast.error('Failed to void invoice');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    try {
      await deleteInvoice();
      toast.success('Invoice deleted');
      router.push('/dashboard/invoices');
    } catch (error) {
      logger.error('Error deleting invoice', { error, page: 'invoice-detail' });
      toast.error('Failed to delete invoice');
    }
  };

  // --- Helpers ---

  const safeFormatDate = (date: Date | string | undefined | null): string => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const isOverdue = invoice?.status !== 'paid' && invoice?.status !== 'void' && invoice?.dueDate && new Date(invoice.dueDate) < new Date();

  // --- Loading State ---

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded-2xl" />
              <div className="h-64 bg-gray-200 rounded-2xl" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-2xl" />
              <div className="h-32 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center py-20">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h2>
        <p className="text-gray-500 mb-6">This invoice may have been deleted or you don&apos;t have access.</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/invoices')}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const canSend = invoice.status === 'draft';
  const canMarkPaid = ['sent', 'viewed', 'partial', 'overdue'].includes(invoice.status);
  const canVoid = invoice.status !== 'void' && invoice.status !== 'paid';
  const canEdit = invoice.status === 'draft';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/invoices')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Invoices
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Invoice #{invoice.number}
            </h1>
            <Badge className={statusConfig[invoice.status]?.color || 'bg-gray-100 text-gray-700'}>
              {statusConfig[invoice.status]?.icon}
              <span className="ml-1">{statusConfig[invoice.status]?.label || invoice.status}</span>
            </Badge>
            {isOverdue && invoice.status !== 'overdue' && (
              <Badge className="bg-red-100 text-red-700">
                <ClockIcon className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {INVOICE_TYPE_LABELS[invoice.type] || invoice.type} Invoice
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
            >
              <PencilSquareIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !organization}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {downloadingPdf ? 'Generating...' : 'Download PDF'}
          </Button>
          {canSend && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendInvoice}
              disabled={sendingInvoice}
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
              {sendingInvoice ? 'Sending...' : 'Send Invoice'}
            </Button>
          )}
        </div>
      </div>

      {/* Amount Due Highlight Box */}
      {invoice.amountDue > 0 && invoice.status !== 'void' && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Amount Due</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(invoice.amountDue)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm font-medium">Due Date</p>
              <p className={cn(
                "text-lg font-semibold mt-1",
                isOverdue ? "text-red-200" : "text-white"
              )}>
                {safeFormatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm text-white/80">
                <span>Total: {formatCurrency(invoice.total)}</span>
                <span>Paid: {formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="mt-2 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(100, (invoice.amountPaid / invoice.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paid Banner */}
      {invoice.status === 'paid' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4">
          <CheckCircleIcon className="h-10 w-10 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-semibold text-lg">Paid in Full</p>
            <p className="text-green-600 text-sm">
              {formatCurrency(invoice.total)} received
              {invoice.paidAt && ` on ${safeFormatDate(invoice.paidAt)}`}
            </p>
          </div>
        </div>
      )}

      {/* Void Banner */}
      {invoice.status === 'void' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex items-center gap-4">
          <NoSymbolIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-gray-700 font-semibold text-lg">Invoice Voided</p>
            <p className="text-gray-500 text-sm">
              {invoice.voidReason && `Reason: ${invoice.voidReason}`}
              {invoice.voidedAt && ` - Voided on ${safeFormatDate(invoice.voidedAt)}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{invoice.clientName}</p>
              </div>
              {invoice.clientEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{invoice.clientEmail}</p>
                </div>
              )}
              {invoice.clientPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{invoice.clientPhone}</p>
                </div>
              )}
              {invoice.billingAddress && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Billing Address</p>
                  <p className="font-medium text-gray-900 whitespace-pre-line">{invoice.billingAddress}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              Line Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Unit Price</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.description}</p>
                            {item.unit && (
                              <p className="text-sm text-gray-500 mt-0.5">{item.unit}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right text-gray-700 tabular-nums">{item.quantity}</td>
                        <td className="py-3 px-2 text-right text-gray-700 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-2 text-right font-medium text-gray-900 tabular-nums">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discount && invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount
                    {invoice.discountType === 'percent' ? ` (${invoice.discount}%)` : ''}
                  </span>
                  <span className="tabular-nums">
                    -{formatCurrency(
                      invoice.discountType === 'percent'
                        ? invoice.subtotal * (invoice.discount / 100)
                        : invoice.discount
                    )}
                  </span>
                </div>
              )}

              {invoice.taxRate && invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
                  <span className="font-medium tabular-nums">{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>
              )}

              {invoice.retainage && invoice.retainage > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Retainage ({invoice.retainage}%)</span>
                  <span className="tabular-nums">-{formatCurrency(invoice.retainageAmount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-brand-primary tabular-nums">{formatCurrency(invoice.total)}</span>
              </div>

              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-medium tabular-nums">{formatCurrency(invoice.amountPaid)}</span>
                </div>
              )}

              {invoice.amountDue > 0 && invoice.status !== 'void' && (
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed">
                  <span>Amount Due</span>
                  <span className={cn(
                    "tabular-nums",
                    isOverdue ? "text-red-600" : "text-brand-primary"
                  )}>
                    {formatCurrency(invoice.amountDue)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </Card>
          )}

          {/* Internal Notes (only visible to team) */}
          {invoice.internalNotes && (
            <Card className="p-6 border-l-4 border-l-yellow-400">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-yellow-500" />
                Internal Notes
              </h2>
              <p className="text-xs text-gray-400 mb-3">Only visible to your team</p>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.internalNotes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Invoice #</span>
                <span className="font-medium text-sm">{invoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Created</span>
                <span className="font-medium text-sm">{safeFormatDate(invoice.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Due Date</span>
                <span className={cn(
                  "font-medium text-sm",
                  isOverdue && "text-red-600"
                )}>
                  {safeFormatDate(invoice.dueDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Payment Terms</span>
                <span className="font-medium text-sm">{invoice.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Created By</span>
                <span className="font-medium text-sm">{invoice.createdByName}</span>
              </div>

              {/* Status Dates */}
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Sent</span>
                  <span className="font-medium text-sm">{safeFormatDate(invoice.sentAt)}</span>
                </div>
              )}
              {invoice.viewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Viewed</span>
                  <span className="font-medium text-sm">{safeFormatDate(invoice.viewedAt)}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Paid</span>
                  <span className="font-medium text-sm text-green-600">{safeFormatDate(invoice.paidAt)}</span>
                </div>
              )}

              {/* Linked Estimate */}
              {invoice.estimateId && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">From Estimate</span>
                  <span className="font-medium text-sm">
                    <button
                      onClick={() => router.push(`/dashboard/estimates/${invoice.estimateId}`)}
                      className="text-brand-primary hover:underline"
                    >
                      View Estimate
                    </button>
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Project Card */}
          {invoice.projectName && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                Project
              </h3>
              <p className="font-medium text-gray-900">{invoice.projectName}</p>
              {invoice.projectAddress && (
                <p className="text-sm text-gray-500 mt-1">{invoice.projectAddress}</p>
              )}
              {invoice.projectId && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`/dashboard/projects/${invoice.projectId}`)}
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                  View Project
                </Button>
              )}
            </Card>
          )}

          {/* Payment History Card */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                Payment History
              </h3>
              <div className="space-y-3">
                {invoice.payments.map((payment: Payment) => (
                  <div key={payment.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                        {payment.reference && ` - ${payment.reference}`}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{payment.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {safeFormatDate(payment.receivedAt)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Total Paid</span>
                  <span className="text-sm font-bold text-green-600 tabular-nums">
                    {formatCurrency(invoice.amountPaid)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Actions Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || !organization}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
              </Button>

              {canSend && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSendInvoice}
                  disabled={sendingInvoice}
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  {sendingInvoice ? 'Sending...' : 'Send Invoice'}
                </Button>
              )}

              {canMarkPaid && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start text-green-600 hover:bg-green-50"
                  onClick={handleMarkAsPaid}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}

              {canVoid && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start text-orange-600 hover:bg-orange-50"
                  onClick={handleVoidInvoice}
                >
                  <NoSymbolIcon className="h-4 w-4 mr-2" />
                  Void Invoice
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
