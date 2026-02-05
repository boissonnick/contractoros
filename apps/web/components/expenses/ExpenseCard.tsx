'use client';

import { useState } from 'react';
import {
  CubeIcon,
  WrenchIcon,
  TruckIcon,
  FireIcon,
  UsersIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  CakeIcon,
  ShieldCheckIcon,
  BoltIcon,
  MegaphoneIcon,
  EllipsisHorizontalIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BaseModal from '@/components/ui/BaseModal';
import { Expense, ExpenseCategory, ExpenseStatus, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '@/types';
import { formatDate, formatCurrency } from '@/lib/date-utils';

interface ExpenseCardProps {
  expense: Expense;
  showProject?: boolean;
  showUser?: boolean;
  // Actions
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  onStartReview?: (expenseId: string) => void;
  onApprove?: (expenseId: string, note?: string) => void;
  onReject?: (expenseId: string, reason: string) => void;
  onRequestMoreInfo?: (expenseId: string, note: string) => void;
  onMarkPaid?: (expenseId: string, method?: string) => void;
  onCancel?: (expenseId: string) => void;
  // Permissions
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean; // Manager role
  canMarkPaid?: boolean; // Finance role
  isOwner?: boolean; // Is this expense owned by the current user
}

// Get icon component for category
function getCategoryIcon(category: ExpenseCategory) {
  const iconMap: Record<ExpenseCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    materials: CubeIcon,
    tools: WrenchIcon,
    equipment_rental: TruckIcon,
    fuel: FireIcon,
    vehicle: TruckIcon,
    subcontractor: UsersIcon,
    permits: DocumentTextIcon,
    labor: UserIcon,
    office: BuildingOfficeIcon,
    travel: PaperAirplaneIcon,
    meals: CakeIcon,
    insurance: ShieldCheckIcon,
    utilities: BoltIcon,
    marketing: MegaphoneIcon,
    other: EllipsisHorizontalIcon,
  };
  return iconMap[category] || CubeIcon;
}

// Get badge variant for status
function getStatusVariant(status: ExpenseStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'under_review':
      return 'primary';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'paid':
      return 'info';
    default:
      return 'default';
  }
}

// Get status icon
function getStatusIcon(status: ExpenseStatus) {
  switch (status) {
    case 'pending':
      return ClockIcon;
    case 'under_review':
      return EyeIcon;
    case 'approved':
      return CheckIcon;
    case 'rejected':
      return XMarkIcon;
    case 'paid':
      return BanknotesIcon;
    default:
      return ClockIcon;
  }
}

type ModalType = 'reject' | 'requestInfo' | 'markPaid' | null;

export function ExpenseCard({
  expense,
  showProject = true,
  showUser = false,
  onEdit,
  onDelete,
  onStartReview,
  onApprove,
  onReject,
  onRequestMoreInfo,
  onMarkPaid,
  onCancel,
  canEdit = true,
  canDelete = true,
  canApprove = false,
  canMarkPaid = false,
  isOwner = false,
}: ExpenseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalInput, setModalInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('direct_deposit');

  const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
  const statusInfo = EXPENSE_STATUSES.find(s => s.value === expense.status);
  const CategoryIcon = getCategoryIcon(expense.category);
  const StatusIcon = getStatusIcon(expense.status);

  const handleModalSubmit = () => {
    switch (activeModal) {
      case 'reject':
        if (onReject && modalInput) {
          onReject(expense.id, modalInput);
        }
        break;
      case 'requestInfo':
        if (onRequestMoreInfo && modalInput) {
          onRequestMoreInfo(expense.id, modalInput);
        }
        break;
      case 'markPaid':
        if (onMarkPaid) {
          onMarkPaid(expense.id, paymentMethod);
        }
        break;
    }
    setActiveModal(null);
    setModalInput('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalInput('');
  };

  // Determine available actions based on status and role
  const showEmployeeActions = isOwner && expense.status === 'pending';
  const showManagerPendingActions = canApprove && expense.status === 'pending';
  const showManagerReviewActions = canApprove && expense.status === 'under_review';
  const showFinanceActions = canMarkPaid && expense.status === 'approved' && expense.reimbursable;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Category Icon */}
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${categoryInfo?.color}15` }}
            >
              {/* eslint-disable-next-line react-hooks/static-components -- dynamic icon selected by expense category */}
              <CategoryIcon
                className="h-5 w-5"
                style={{ color: categoryInfo?.color }}
              />
            </div>

            {/* Description and Meta */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{expense.description}</h3>
                {expense.reimbursable && (
                  <BanknotesIcon className="h-4 w-4 text-green-500" title="Reimbursable" />
                )}
                {expense.billable && (
                  <ReceiptPercentIcon className="h-4 w-4 text-blue-500" title="Billable to client" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                <span>{formatDate(new Date(expense.date + 'T00:00:00'))}</span>
                {showProject && expense.projectName && (
                  <>
                    <span>-</span>
                    <span>{expense.projectName}</span>
                  </>
                )}
                {showUser && (
                  <>
                    <span>-</span>
                    <span>{expense.userName}</span>
                  </>
                )}
                {expense.vendorName && (
                  <>
                    <span>-</span>
                    <span>{expense.vendorName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Amount and Status */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(expense.amount)}
            </span>
            <Badge variant={getStatusVariant(expense.status)} size="sm">
              {/* eslint-disable-next-line react-hooks/static-components -- dynamic icon selected by expense status */}
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo?.label || expense.status}
            </Badge>
          </div>
        </div>

        {/* Category Badge and Info Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" size="sm">
            {categoryInfo?.label || expense.category}
          </Badge>
          {expense.receipts.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <PhotoIcon className="h-4 w-4" />
              <span>{expense.receipts.length} receipt{expense.receipts.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {expense.taxDeductible && (
            <Badge variant="info" size="sm">Tax Deductible</Badge>
          )}
          {expense.reviewNote && expense.status === 'pending' && (
            <div className="flex items-center gap-1 text-sm text-amber-600">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>Info requested</span>
            </div>
          )}
        </div>

        {/* Review Note (if manager requested more info) */}
        {expense.reviewNote && expense.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
            <h4 className="text-xs font-medium text-amber-700 uppercase mb-1 flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-3 w-3" />
              Manager Note
            </h4>
            <p className="text-sm text-amber-800">{expense.reviewNote}</p>
            {expense.approvedByName && (
              <p className="text-xs text-amber-600 mt-1">From: {expense.approvedByName}</p>
            )}
          </div>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            {/* Notes */}
            {expense.notes && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h4>
                <p className="text-sm text-gray-700">{expense.notes}</p>
              </div>
            )}

            {/* Payment Method */}
            {expense.paymentMethod && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Payment Method</h4>
                <p className="text-sm text-gray-700 capitalize">{expense.paymentMethod.replace('_', ' ')}</p>
              </div>
            )}

            {/* Tax Amount */}
            {expense.taxAmount !== undefined && expense.taxAmount > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Tax Amount</h4>
                <p className="text-sm text-gray-700">{formatCurrency(expense.taxAmount)}</p>
              </div>
            )}

            {/* Approval Info */}
            {(expense.status === 'approved' || expense.status === 'paid') && expense.approvedByName && (
              <div className="bg-green-50 p-2 rounded-md">
                <h4 className="text-xs font-medium text-green-700 uppercase mb-1">Approved</h4>
                <p className="text-sm text-green-600">
                  By {expense.approvedByName}
                  {expense.approvedAt && ` on ${formatDate(expense.approvedAt)}`}
                </p>
                {expense.reviewNote && (
                  <p className="text-sm text-green-600 mt-1">Note: {expense.reviewNote}</p>
                )}
              </div>
            )}

            {/* Payment Info */}
            {expense.status === 'paid' && (
              <div className="bg-blue-50 p-2 rounded-md">
                <h4 className="text-xs font-medium text-blue-700 uppercase mb-1">Payment</h4>
                <p className="text-sm text-blue-600">
                  {expense.reimbursementMethod && (
                    <span className="capitalize">{expense.reimbursementMethod.replace('_', ' ')}</span>
                  )}
                  {expense.paidByName && ` by ${expense.paidByName}`}
                  {expense.paidAt && ` on ${formatDate(expense.paidAt)}`}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {expense.status === 'rejected' && expense.rejectionReason && (
              <div className="bg-red-50 p-2 rounded-md">
                <h4 className="text-xs font-medium text-red-700 uppercase mb-1">Rejection Reason</h4>
                <p className="text-sm text-red-600">{expense.rejectionReason}</p>
                {expense.approvedByName && (
                  <p className="text-xs text-red-500 mt-1">By: {expense.approvedByName}</p>
                )}
              </div>
            )}

            {/* Under Review Info */}
            {expense.status === 'under_review' && expense.approvedByName && (
              <div className="bg-purple-50 p-2 rounded-md">
                <h4 className="text-xs font-medium text-purple-700 uppercase mb-1">Under Review</h4>
                <p className="text-sm text-purple-600">Being reviewed by {expense.approvedByName}</p>
              </div>
            )}

            {/* Receipts */}
            {expense.receipts.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Receipts</h4>
                <div className="flex flex-wrap gap-2">
                  {expense.receipts.map((receipt) => (
                    <a
                      key={receipt.id}
                      href={receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
                    >
                      <PhotoIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{receipt.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {expense.tags && expense.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {expense.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
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
            {/* Employee Actions - Cancel pending expense */}
            {showEmployeeActions && onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(expense.id)}
                className="text-gray-600 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}

            {/* Manager Actions - Pending expenses */}
            {showManagerPendingActions && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStartReview?.(expense.id)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Review
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onApprove?.(expense.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}

            {/* Manager Actions - Under Review expenses */}
            {showManagerReviewActions && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onApprove?.(expense.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveModal('requestInfo')}
                  className="text-amber-600 hover:text-amber-700"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Request Info
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveModal('reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {/* Finance Actions - Mark as Paid */}
            {showFinanceActions && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveModal('markPaid')}
                className="text-brand-600 hover:text-brand-700"
              >
                <BanknotesIcon className="h-4 w-4 mr-1" />
                Mark Paid
              </Button>
            )}

            {/* Edit/Delete (for expense owner on pending items) */}
            {canEdit && expense.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit?.(expense)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            {canDelete && expense.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete?.(expense.id)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <BaseModal
        open={activeModal === 'reject'}
        onClose={closeModal}
        title="Reject Expense"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this expense.
          </p>
          <textarea
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleModalSubmit} disabled={!modalInput.trim()}>
              Reject Expense
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Request More Info Modal */}
      <BaseModal
        open={activeModal === 'requestInfo'}
        onClose={closeModal}
        title="Request More Information"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            What additional information do you need from the employee?
          </p>
          <textarea
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            placeholder="e.g., Please attach a receipt for this expense..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleModalSubmit} disabled={!modalInput.trim()}>
              Send Request
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Mark Paid Modal */}
      <BaseModal
        open={activeModal === 'markPaid'}
        onClose={closeModal}
        title="Mark as Paid"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            How was this expense reimbursed?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            >
              <option value="direct_deposit">Direct Deposit</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="payroll">Added to Payroll</option>
            </select>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Employee:</span>
              <span className="font-medium text-gray-900">{expense.userName}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleModalSubmit}>
              Confirm Payment
            </Button>
          </div>
        </div>
      </BaseModal>
    </Card>
  );
}
