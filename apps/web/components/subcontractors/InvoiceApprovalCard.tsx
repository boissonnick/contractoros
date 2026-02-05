'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  SubcontractorInvoice,
  APInvoiceStatus,
  AP_INVOICE_STATUS_LABELS,
} from '@/types';
import { formatCurrency, formatDate } from '@/lib/date-utils';

// ---------- Props ----------

interface InvoiceApprovalCardProps {
  invoice: SubcontractorInvoice;
  onApprove?: (invoiceId: string) => void;
  onDispute?: (invoiceId: string) => void;
  onMarkPaid?: (invoiceId: string) => void;
  onEdit?: (invoice: SubcontractorInvoice) => void;
  onDelete?: (invoiceId: string) => void;
  onSubmitInvoice?: (invoiceId: string) => void;
  onResubmit?: (invoiceId: string) => void;
  onRequestLienWaiver?: (invoiceId: string) => void;
  canApprove?: boolean;
  canMarkPaid?: boolean;
}

// ---------- Helpers ----------

function getStatusVariant(
  status: APInvoiceStatus
): 'default' | 'primary' | 'success' | 'info' | 'danger' {
  switch (status) {
    case 'draft':
      return 'default';
    case 'submitted':
      return 'primary';
    case 'approved':
      return 'success';
    case 'paid':
      return 'info';
    case 'disputed':
      return 'danger';
    default:
      return 'default';
  }
}

function getLienWaiverVariant(
  status: SubcontractorInvoice['lienWaiverStatus']
): 'default' | 'warning' | 'success' {
  switch (status) {
    case 'not_required':
      return 'default';
    case 'pending':
      return 'warning';
    case 'received':
      return 'success';
    default:
      return 'default';
  }
}

const LIEN_WAIVER_LABELS: Record<SubcontractorInvoice['lienWaiverStatus'], string> = {
  not_required: 'Not Required',
  pending: 'Waiver Pending',
  received: 'Waiver Received',
};

// ---------- Component ----------

export default function InvoiceApprovalCard({
  invoice,
  onApprove,
  onDispute,
  onMarkPaid,
  onEdit,
  onDelete,
  onSubmitInvoice,
  onResubmit,
  onRequestLienWaiver,
  canApprove = false,
  canMarkPaid = false,
}: InvoiceApprovalCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const lineItemCount = invoice.lineItems.length;
  const lineItemTotal = invoice.lineItems.reduce((sum, li) => sum + li.amount, 0);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header: vendor name, invoice number, status badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{invoice.vendorName}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <Badge variant={getStatusVariant(invoice.status)} size="sm" dot>
            {AP_INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
          </Badge>
        </div>

        {/* Middle: project, amount, dates */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{invoice.projectName}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                Issued: {formatDate(new Date(invoice.invoiceDate + 'T00:00:00'))}
              </span>
              <span>
                Due: {formatDate(new Date(invoice.dueDate + 'T00:00:00'))}
              </span>
            </div>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(invoice.amount)}
          </span>
        </div>

        {/* Line items summary + lien waiver */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" size="sm">
            {lineItemCount} item{lineItemCount !== 1 ? 's' : ''} &middot;{' '}
            {formatCurrency(lineItemTotal)}
          </Badge>

          {invoice.lienWaiverStatus !== 'not_required' && (
            <Badge
              variant={getLienWaiverVariant(invoice.lienWaiverStatus)}
              size="sm"
            >
              <ClipboardDocumentCheckIcon className="h-3 w-3 mr-1" />
              {LIEN_WAIVER_LABELS[invoice.lienWaiverStatus]}
            </Badge>
          )}

          {invoice.description && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {invoice.description}
            </span>
          )}
        </div>

        {/* Expandable details */}
        {showDetails && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            {/* Line items table */}
            {invoice.lineItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Line Items
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-1.5 text-xs font-medium text-gray-500">
                          Description
                        </th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium text-gray-500">
                          Qty
                        </th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium text-gray-500">
                          Rate
                        </th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium text-gray-500">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 text-gray-700">
                            {item.description}
                          </td>
                          <td className="px-3 py-1.5 text-right text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-1.5 text-right text-gray-600">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td
                          colSpan={3}
                          className="px-3 py-1.5 text-right text-xs font-medium text-gray-500"
                        >
                          Total
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold text-gray-900">
                          {formatCurrency(lineItemTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Notes
                </h4>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Attachments */}
            {invoice.attachmentUrls.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Attachments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {invoice.attachmentUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Approval info */}
            {(invoice.status === 'approved' || invoice.status === 'paid') &&
              invoice.approvedBy && (
                <div className="bg-green-50 p-2 rounded-md">
                  <h4 className="text-xs font-medium text-green-700 uppercase mb-1">
                    Approved
                  </h4>
                  <p className="text-sm text-green-600">
                    By {invoice.approvedBy}
                    {invoice.approvedAt &&
                      ` on ${formatDate(invoice.approvedAt)}`}
                  </p>
                </div>
              )}

            {/* Payment info */}
            {invoice.status === 'paid' && invoice.paidAt && (
              <div className="bg-purple-50 p-2 rounded-md">
                <h4 className="text-xs font-medium text-purple-700 uppercase mb-1">
                  Payment
                </h4>
                <p className="text-sm text-purple-600">
                  {invoice.paymentMethod && (
                    <span className="capitalize">
                      {invoice.paymentMethod.replace('_', ' ')}
                    </span>
                  )}
                  {invoice.checkNumber && ` (Check #${invoice.checkNumber})`}
                  {invoice.paidAt && ` on ${formatDate(invoice.paidAt)}`}
                </p>
              </div>
            )}

            {/* Lien waiver detail */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                Lien Waiver
              </h4>
              <Badge
                variant={getLienWaiverVariant(invoice.lienWaiverStatus)}
                size="sm"
              >
                <ClipboardDocumentCheckIcon className="h-3 w-3 mr-1" />
                {LIEN_WAIVER_LABELS[invoice.lienWaiverStatus]}
              </Badge>
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {showDetails ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                Show details
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {/* Draft actions: Submit, Edit, Delete */}
            {invoice.status === 'draft' && (
              <>
                {onSubmitInvoice && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSubmitInvoice(invoice.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                    Submit
                  </Button>
                )}
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(invoice)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(invoice.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Submitted actions: Approve, Dispute (if canApprove) */}
            {invoice.status === 'submitted' && canApprove && (
              <>
                {onApprove && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onApprove(invoice.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
                {onDispute && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDispute(invoice.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Dispute
                  </Button>
                )}
              </>
            )}

            {/* Approved actions: Mark Paid, Request Lien Waiver (if canMarkPaid) */}
            {invoice.status === 'approved' && canMarkPaid && (
              <>
                {onMarkPaid && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMarkPaid(invoice.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <BanknotesIcon className="h-4 w-4 mr-1" />
                    Mark Paid
                  </Button>
                )}
                {onRequestLienWaiver &&
                  invoice.lienWaiverStatus !== 'received' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRequestLienWaiver(invoice.id)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                      Request Waiver
                    </Button>
                  )}
              </>
            )}

            {/* Disputed actions: Edit, Re-submit */}
            {invoice.status === 'disputed' && (
              <>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(invoice)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {onResubmit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onResubmit(invoice.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Re-submit
                  </Button>
                )}
              </>
            )}

            {/* Paid: view only — no actions beyond show/hide details */}
          </div>
        </div>
      </div>
    </Card>
  );
}
