"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import {
  SubInvoice,
  SubInvoiceStatus,
  SubInvoiceLineItem,
  SubAssignment,
  SUB_INVOICE_STATUS_LABELS,
} from '@/types';
import {
  Button,
  Card,
  Badge,
  EmptyState,
  PageHeader,
  FormModal,
} from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { FirestoreError } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  EyeIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ChevronRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Status configuration with icons
const statusConfig: Record<SubInvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: <PaperAirplaneIcon className="h-4 w-4" /> },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: <EyeIcon className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: <BanknotesIcon className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
};

// Firestore conversion helpers
function fromFirestore(id: string, data: Record<string, unknown>): SubInvoice {
  const payments = ((data.payments as unknown[]) || []).map((p: unknown) => {
    const payment = p as Record<string, unknown>;
    return {
      ...payment,
      date: payment.date ? (payment.date as Timestamp).toDate() : new Date(),
      recordedAt: payment.recordedAt ? (payment.recordedAt as Timestamp).toDate() : new Date(),
    };
  });

  const lineItems = ((data.lineItems as unknown[]) || []).map((li: unknown) => li as SubInvoiceLineItem);

  return {
    id,
    orgId: data.orgId as string,
    subId: data.subId as string,
    subName: data.subName as string | undefined,
    subCompanyName: data.subCompanyName as string | undefined,
    projectId: data.projectId as string | undefined,
    projectName: data.projectName as string | undefined,
    assignmentId: data.assignmentId as string | undefined,
    bidId: data.bidId as string | undefined,
    number: data.number as string,
    status: data.status as SubInvoiceStatus,
    periodStart: data.periodStart ? (data.periodStart as Timestamp).toDate() : undefined,
    periodEnd: data.periodEnd ? (data.periodEnd as Timestamp).toDate() : undefined,
    lineItems,
    laborHours: data.laborHours as number | undefined,
    laborRate: data.laborRate as number | undefined,
    laborTotal: data.laborTotal as number | undefined,
    materialsTotal: data.materialsTotal as number | undefined,
    subtotal: (data.subtotal as number) || 0,
    retainage: data.retainage as number | undefined,
    retainageAmount: data.retainageAmount as number | undefined,
    total: (data.total as number) || 0,
    amountPaid: (data.amountPaid as number) || 0,
    amountDue: (data.amountDue as number) || 0,
    payments: payments as SubInvoice['payments'],
    notes: data.notes as string | undefined,
    attachments: data.attachments as string[] | undefined,
    submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
    reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : undefined,
    reviewedBy: data.reviewedBy as string | undefined,
    approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate() : undefined,
    approvedBy: data.approvedBy as string | undefined,
    rejectedAt: data.rejectedAt ? (data.rejectedAt as Timestamp).toDate() : undefined,
    rejectedBy: data.rejectedBy as string | undefined,
    rejectionReason: data.rejectionReason as string | undefined,
    paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function toFirestore(invoice: Partial<SubInvoice>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...invoice };
  delete data.id;

  // Convert dates to Timestamps
  const dateFields = ['periodStart', 'periodEnd', 'submittedAt', 'reviewedAt', 'approvedAt', 'rejectedAt', 'paidAt', 'createdAt', 'updatedAt'];
  dateFields.forEach(field => {
    if (data[field] instanceof Date) {
      data[field] = Timestamp.fromDate(data[field] as Date);
    }
  });

  // Convert payment dates
  if (Array.isArray(data.payments)) {
    data.payments = (data.payments as SubInvoice['payments']).map(p => ({
      ...p,
      date: p.date instanceof Date ? Timestamp.fromDate(p.date) : p.date,
      recordedAt: p.recordedAt instanceof Date ? Timestamp.fromDate(p.recordedAt) : p.recordedAt,
    }));
  }

  // Remove undefined values
  Object.keys(data).forEach(k => {
    if (data[k] === undefined) delete data[k];
  });

  return data;
}

// Format currency helper
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `SUB-INV-${timestamp}`;
}

// Create Invoice Modal Component
interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignments: SubAssignment[];
  userId: string;
  userName: string;
  orgId: string;
}

function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  assignments,
  userId,
  userName,
  orgId,
}: CreateInvoiceModalProps) {
  const [saving, setSaving] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [lineItems, setLineItems] = useState<SubInvoiceLineItem[]>([
    { id: '1', description: '', quantity: 1, unit: 'hours', unitPrice: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState('');

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal;

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: String(Date.now()), description: '', quantity: 1, unit: 'hours', unitPrice: 0, amount: 0 },
    ]);
  };

  const updateLineItem = (index: number, field: keyof SubInvoiceLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].amount = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    }
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (lineItems.some(item => !item.description.trim())) {
      toast.error('Please fill in all line item descriptions');
      return;
    }

    if (total <= 0) {
      toast.error('Invoice total must be greater than zero');
      return;
    }

    setSaving(true);
    try {
      const invoiceData: Omit<SubInvoice, 'id'> = {
        orgId,
        subId: userId,
        subName: userName,
        projectId: selectedAssignment?.projectId,
        assignmentId: selectedAssignmentId || undefined,
        number: generateInvoiceNumber(),
        status: 'draft',
        lineItems,
        subtotal,
        total,
        amountPaid: 0,
        amountDue: total,
        payments: [],
        notes: notes || undefined,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'sub_invoices'), toFirestore(invoiceData));
      toast.success('Invoice created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      description="Create a new invoice for your work"
      submitLabel="Create Invoice"
      onSubmit={handleSubmit}
      loading={saving}
      size="lg"
    >
      <div className="space-y-4">
        {/* Assignment Selection */}
        {assignments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Assignment (Optional)
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAssignmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="">No assignment linked</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.type === 'phase' ? 'Phase' : 'Task'} - {formatCurrency(assignment.agreedAmount)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Line Items */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Line Items
          </label>
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 text-right"
                  />
                </div>
                <div className="w-20">
                  <select
                    value={item.unit}
                    onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20"
                  >
                    <option value="hours">hrs</option>
                    <option value="each">ea</option>
                    <option value="sqft">sqft</option>
                    <option value="lf">lf</option>
                  </select>
                </div>
                <div className="w-24">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 text-right"
                    />
                  </div>
                </div>
                <div className="w-24 text-right py-1.5 font-medium">
                  {formatCurrency(item.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600"
                  disabled={lineItems.length === 1}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLineItem}
              className="w-full py-2 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4 inline mr-1" />
              Add Line Item
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-semibold border-t">
            <span>Total</span>
            <span className="text-brand-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Additional notes or comments..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
      </div>
    </FormModal>
  );
}

// Invoice Detail Modal Component
interface InvoiceDetailModalProps {
  invoice: SubInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceId: string) => Promise<void>;
}

function InvoiceDetailModal({ invoice, isOpen, onClose, onSubmit }: InvoiceDetailModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!invoice) return null;

  const handleSubmitInvoice = async () => {
    setSubmitting(true);
    try {
      await onSubmit(invoice.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice ${invoice.number}`}
      size="lg"
      hideFooter={invoice.status !== 'draft'}
      submitLabel="Submit Invoice"
      onSubmit={handleSubmitInvoice}
      loading={submitting}
      disabled={invoice.status !== 'draft'}
    >
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={statusConfig[invoice.status].color}>
            {statusConfig[invoice.status].icon}
            <span className="ml-1">{statusConfig[invoice.status].label}</span>
          </Badge>
          <span className="text-sm text-gray-500">
            Created {formatDate(invoice.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Project Info */}
        {invoice.projectName && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Project</p>
            <p className="font-medium">{invoice.projectName}</p>
          </div>
        )}

        {/* Line Items */}
        <div>
          <h4 className="font-medium tracking-tight text-gray-900 mb-2">Line Items</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm">{item.description}</td>
                    <td className="px-3 py-2 text-sm text-right">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Amount Paid</span>
              <span>{formatCurrency(invoice.amountPaid)}</span>
            </div>
          )}
          {invoice.amountDue > 0 && invoice.status !== 'paid' && (
            <div className="flex justify-between text-brand-primary font-medium">
              <span>Amount Due</span>
              <span>{formatCurrency(invoice.amountDue)}</span>
            </div>
          )}
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <div>
            <h4 className="font-medium tracking-tight text-gray-900 mb-2">Payment History</h4>
            <div className="space-y-2">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-green-600">
                      {formatDate(payment.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {payment.method && ` via ${payment.method.toUpperCase()}`}
                    </p>
                  </div>
                  {payment.reference && (
                    <span className="text-sm text-green-600">Ref: {payment.reference}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div>
            <h4 className="font-medium tracking-tight text-gray-900 mb-2">Notes</h4>
            <p className="text-gray-600 text-sm">{invoice.notes}</p>
          </div>
        )}

        {/* Rejection Reason */}
        {invoice.status === 'rejected' && invoice.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
            <p className="text-sm text-red-600">{invoice.rejectionReason}</p>
          </div>
        )}

        {/* Status Timeline */}
        <div>
          <h4 className="font-medium tracking-tight text-gray-900 mb-2">Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Created {formatDate(invoice.createdAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            {invoice.submittedAt && (
              <div className="flex items-center gap-2 text-blue-600">
                <PaperAirplaneIcon className="h-4 w-4" />
                <span>Submitted {formatDate(invoice.submittedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
            {invoice.approvedAt && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Approved {formatDate(invoice.approvedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
            {invoice.paidAt && (
              <div className="flex items-center gap-2 text-emerald-600">
                <BanknotesIcon className="h-4 w-4" />
                <span>Paid {formatDate(invoice.paidAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
            {invoice.rejectedAt && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircleIcon className="h-4 w-4" />
                <span>Rejected {formatDate(invoice.rejectedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}

// Main Page Component
export default function SubInvoicesPage() {
  const { user, profile } = useAuth();

  const [invoices, setInvoices] = useState<SubInvoice[]>([]);
  const [assignments, setAssignments] = useState<SubAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubInvoiceStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SubInvoice | null>(null);

  // Fetch invoices
  useEffect(() => {
    if (!user?.uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    setFetchError(null);

    // Subscribe to invoices where the user is the subcontractor
    const q = query(
      collection(db, 'sub_invoices'),
      where('subId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => fromFirestore(doc.id, doc.data()));
        setInvoices(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching invoices:', error);
        setFetchError('Failed to load invoices. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch assignments for linking
  useEffect(() => {
    if (!user?.uid) return;

    const fetchAssignments = async () => {
      try {
        const q = query(
          collection(db, 'sub_assignments'),
          where('subId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            subId: d.subId,
            projectId: d.projectId,
            type: d.type,
            phaseId: d.phaseId,
            taskId: d.taskId,
            bidId: d.bidId,
            status: d.status,
            agreedAmount: d.agreedAmount || 0,
            paidAmount: d.paidAmount || 0,
            paymentSchedule: d.paymentSchedule || [],
            createdAt: d.createdAt?.toDate() || new Date(),
          } as SubAssignment;
        });
        setAssignments(data);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };

    fetchAssignments();
  }, [user?.uid]);

  // Handle invoice submission
  const handleSubmitInvoice = async (invoiceId: string) => {
    try {
      await updateDoc(doc(db, 'sub_invoices', invoiceId), {
        status: 'submitted',
        submittedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast.success('Invoice submitted successfully');
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast.error('Failed to submit invoice');
      throw error;
    }
  };

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter(inv => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices.length;
    const draft = invoices.filter(i => i.status === 'draft').length;
    const pending = invoices.filter(i => ['submitted', 'under_review', 'approved'].includes(i.status)).length;
    const pendingAmount = invoices
      .filter(i => ['submitted', 'under_review', 'approved'].includes(i.status))
      .reduce((sum, i) => sum + i.amountDue, 0);
    const paidAmount = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    return { total, draft, pending, pendingAmount, paidAmount };
  }, [invoices]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    // The useEffect will handle the actual refresh
  }, []);

  if (fetchError) {
    return <FirestoreError message={fetchError} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Invoices"
        description="Submit and track invoices for your completed work"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Invoices</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ClockIcon className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <BanknotesIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-xs text-gray-500">Pending Amount</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(stats.paidAmount)}</p>
              <p className="text-xs text-gray-500">Total Paid</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'draft', 'submitted', 'under_review', 'approved', 'paid', 'rejected'] as const).map((status) => {
          const isActive = statusFilter === status;
          const count = status === 'all' ? invoices.length : invoices.filter(i => i.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {status === 'all' ? 'All' : SUB_INVOICE_STATUS_LABELS[status].label}
              {count > 0 && (
                <span className={cn(
                  'ml-2 px-1.5 py-0.5 rounded-full text-xs',
                  isActive ? 'bg-brand-500' : 'bg-gray-200'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Invoice List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title={invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
          description={
            invoices.length === 0
              ? "Create your first invoice to get paid for your work."
              : "Try adjusting your filter to see more invoices."
          }
          action={
            invoices.length === 0
              ? {
                  label: 'Create Invoice',
                  onClick: () => setShowCreateModal(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{invoice.number}</span>
                    <Badge className={statusConfig[invoice.status].color}>
                      {statusConfig[invoice.status].icon}
                      <span className="ml-1">{statusConfig[invoice.status].label}</span>
                    </Badge>
                  </div>
                  {invoice.projectName && (
                    <h3 className="font-medium tracking-tight text-gray-900">{invoice.projectName}</h3>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{invoice.lineItems.length} line item{invoice.lineItems.length !== 1 ? 's' : ''}</span>
                    <span>Created {formatDate(invoice.createdAt, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 tracking-tight">
                      {formatCurrency(invoice.total)}
                    </p>
                    {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
                      <p className="text-sm text-green-600">
                        {formatCurrency(invoice.amountPaid)} paid
                      </p>
                    )}
                    {invoice.amountDue > 0 && invoice.status !== 'paid' && (
                      <p className="text-sm text-brand-primary">
                        {formatCurrency(invoice.amountDue)} due
                      </p>
                    )}
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      {user && profile && (
        <CreateInvoiceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
          assignments={assignments}
          userId={user.uid}
          userName={profile.displayName || 'Unknown'}
          orgId={profile.orgId}
        />
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSubmit={handleSubmitInvoice}
      />

      {/* Mobile FAB for New Invoice */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center transition-all z-30"
        aria-label="Create Invoice"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
