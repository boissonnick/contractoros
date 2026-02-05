'use client';

import { useState, useMemo } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import InvoiceApprovalCard from '@/components/subcontractors/InvoiceApprovalCard';
import SubcontractorInvoiceForm from '@/components/subcontractors/SubcontractorInvoiceForm';
import LienWaiverModal from '@/components/subcontractors/LienWaiverModal';
import { useSubcontractorInvoices } from '@/lib/hooks/useSubcontractorInvoices';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { useAuth } from '@/lib/auth';
import {
  SubcontractorInvoice,
  APInvoiceStatus,
  AP_INVOICE_STATUS_LABELS,
  Subcontractor,
  Project,
} from '@/types';
import { formatCurrency } from '@/lib/date-utils';

// Quick filter tabs for AP workflow
type QuickFilter = 'all' | APInvoiceStatus;

const QUICK_FILTERS: {
  value: QuickFilter;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  { value: 'all', label: 'All', icon: DocumentTextIcon },
  { value: 'submitted', label: 'Submitted', icon: ClockIcon },
  { value: 'approved', label: 'Approved', icon: CheckIcon },
  { value: 'paid', label: 'Paid', icon: BanknotesIcon },
  { value: 'disputed', label: 'Disputed', icon: ClipboardDocumentCheckIcon },
];

export default function APInvoicingPage() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { subs, loading: subsLoading } = useSubcontractors();

  // State
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [filterVendorId, setFilterVendorId] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SubcontractorInvoice | null>(null);
  const [lienWaiverInvoice, setLienWaiverInvoice] = useState<SubcontractorInvoice | null>(null);

  // Role gating
  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Fetch invoices
  const {
    invoices: allInvoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    submitInvoice,
    approveInvoice,
    disputeInvoice,
    markPaid,
    requestLienWaiver,
  } = useSubcontractorInvoices({
    vendorId: filterVendorId || undefined,
    projectId: filterProjectId || undefined,
  });

  // Client-side quick filter
  const invoices = useMemo(() => {
    if (quickFilter === 'all') return allInvoices;
    return allInvoices.filter((inv) => inv.status === quickFilter);
  }, [allInvoices, quickFilter]);

  // Compute stats from all invoices
  const stats = useMemo(() => {
    const pending = allInvoices.filter((i) => i.status === 'submitted');
    const approved = allInvoices.filter((i) => i.status === 'approved');
    const paid = allInvoices.filter((i) => i.status === 'paid');
    const pendingWaivers = allInvoices.filter((i) => i.lienWaiverStatus === 'pending');
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
      approvedCount: approved.length,
      approvedAmount: approved.reduce((s, i) => s + i.amount, 0),
      paidAmount: paid.reduce((s, i) => s + i.amount, 0),
      pendingWaiversCount: pendingWaivers.length,
    };
  }, [allInvoices]);

  // Count per quick filter tab
  const getFilterCount = (filter: QuickFilter): number => {
    if (filter === 'all') return allInvoices.length;
    return allInvoices.filter((i) => i.status === filter).length;
  };

  // Handlers
  const handleCreate = async (
    invoiceData: Omit<SubcontractorInvoice, 'id' | 'orgId' | 'createdAt' | 'createdBy'>
  ) => {
    await createInvoice(invoiceData);
    setShowAddModal(false);
  };

  const handleEdit = (invoice: SubcontractorInvoice) => {
    setEditingInvoice(invoice);
    setShowAddModal(true);
  };

  const handleUpdate = async (
    invoiceData: Omit<SubcontractorInvoice, 'id' | 'orgId' | 'createdAt' | 'createdBy'>
  ) => {
    if (editingInvoice) {
      await updateInvoice(editingInvoice.id, invoiceData);
      setEditingInvoice(null);
      setShowAddModal(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(invoiceId);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    await approveInvoice(invoiceId);
  };

  const handleDispute = async (invoiceId: string) => {
    const reason = prompt('Enter dispute reason:');
    if (reason) {
      await disputeInvoice(invoiceId, reason);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    await markPaid(invoiceId);
  };

  const handleRequestLienWaiver = (invoiceId: string) => {
    const invoice = allInvoices.find((i) => i.id === invoiceId);
    if (invoice) setLienWaiverInvoice(invoice);
  };

  const handleLienWaiverSubmit = async (waiverType: 'conditional' | 'unconditional', amount: number) => {
    if (!lienWaiverInvoice) return;
    await requestLienWaiver(
      lienWaiverInvoice.id,
      lienWaiverInvoice.vendorId,
      lienWaiverInvoice.vendorName,
      lienWaiverInvoice.projectId,
      waiverType,
      amount
    );
    setLienWaiverInvoice(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingInvoice(null);
  };

  // Unauthorized users
  if (profile && !isManager) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12" />}
          title="Access Restricted"
          description="Only project managers and owners can access AP Invoicing. Contact your administrator for access."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AP Invoicing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage subcontractor invoices and payments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Approval</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.pendingCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatCurrency(stats.pendingAmount)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">Approved</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.approvedCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatCurrency(stats.approvedAmount)} awaiting payment
              </div>
            </div>
            <div className="p-2 rounded-lg bg-green-50">
              <CheckIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Paid</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(stats.paidAmount)}
              </div>
              <div className="text-xs text-gray-400 mt-1">this period</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <BanknotesIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">Lien Waivers Pending</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {stats.pendingWaiversCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">awaiting signature</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-50">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const count = getFilterCount(filter.value);
          const isActive = quickFilter === filter.value;
          const Icon = filter.icon;

          return (
            <button
              key={filter.value}
              onClick={() => setQuickFilter(filter.value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{filter.label}</span>
              {count > 0 && (
                <Badge variant={isActive ? 'primary' : 'default'} size="sm">
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />

          {/* Vendor Filter */}
          <select
            value={filterVendorId}
            onChange={(e) => setFilterVendorId(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {subs
              .filter((s: Subcontractor) => s.isActive)
              .map((sub: Subcontractor) => (
                <option key={sub.id} value={sub.id}>
                  {sub.companyName}
                </option>
              ))}
          </select>

          {/* Project Filter */}
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {(projects as Project[])
              .filter((p: Project) => p.status === 'active')
              .map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>
      </Card>

      {/* Invoice List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading invoices</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </Card>
      ) : invoices.length === 0 && quickFilter === 'all' && !filterVendorId && !filterProjectId ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12" />}
          title="No subcontractor invoices yet"
          description="Start tracking vendor invoices by adding the first one."
          action={{
            label: 'Add First Invoice',
            onClick: () => setShowAddModal(true),
          }}
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12" />}
          title="No invoices found"
          description={`No ${quickFilter !== 'all' ? AP_INVOICE_STATUS_LABELS[quickFilter as APInvoiceStatus] + ' ' : ''}invoices match your current filters.`}
        />
      ) : (
        <>
          {/* Invoice count */}
          <div className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">{invoices.length}</span>{' '}
            invoice{invoices.length !== 1 ? 's' : ''}
          </div>

          <div className="space-y-4">
            {invoices.map((invoice) => (
              <InvoiceApprovalCard
                key={invoice.id}
                invoice={invoice}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSubmitInvoice={(id) => submitInvoice(id)}
                onApprove={handleApprove}
                onDispute={handleDispute}
                onMarkPaid={handleMarkPaid}
                onRequestLienWaiver={handleRequestLienWaiver}
                canApprove={isManager}
                canMarkPaid={isManager}
              />
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Invoice Modal */}
      {showAddModal && (
        <SubcontractorInvoiceForm
          open={showAddModal}
          onClose={handleCloseModal}
          onSubmit={editingInvoice ? handleUpdate : handleCreate}
          invoice={editingInvoice || undefined}
          mode={editingInvoice ? 'edit' : 'create'}
        />
      )}

      {/* Lien Waiver Modal */}
      {lienWaiverInvoice && (
        <LienWaiverModal
          open={!!lienWaiverInvoice}
          onClose={() => setLienWaiverInvoice(null)}
          onSubmit={handleLienWaiverSubmit}
          invoiceAmount={lienWaiverInvoice.amount}
          vendorName={lienWaiverInvoice.vendorName}
          projectName={lienWaiverInvoice.projectName}
        />
      )}
    </div>
  );
}
