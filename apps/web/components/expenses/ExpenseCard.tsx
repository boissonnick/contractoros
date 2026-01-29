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
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Expense, ExpenseCategory, ExpenseStatus, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '@/types';
import { formatDate, formatCurrency } from '@/lib/date-utils';

interface ExpenseCardProps {
  expense: Expense;
  showProject?: boolean;
  showUser?: boolean;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  onApprove?: (expenseId: string) => void;
  onReject?: (expenseId: string) => void;
  onMarkReimbursed?: (expenseId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
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
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'reimbursed':
      return 'info';
    default:
      return 'default';
  }
}

export function ExpenseCard({
  expense,
  showProject = true,
  showUser = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onMarkReimbursed,
  canEdit = true,
  canDelete = true,
  canApprove = false,
}: ExpenseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
  const statusInfo = EXPENSE_STATUSES.find(s => s.value === expense.status);
  const CategoryIcon = getCategoryIcon(expense.category);

  const handleReject = () => {
    if (onReject && rejectReason) {
      onReject(expense.id);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

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
                    <span>•</span>
                    <span>{expense.projectName}</span>
                  </>
                )}
                {showUser && (
                  <>
                    <span>•</span>
                    <span>{expense.userName}</span>
                  </>
                )}
                {expense.vendorName && (
                  <>
                    <span>•</span>
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
              {statusInfo?.label || expense.status}
            </Badge>
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2">
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
        </div>

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

            {/* Rejection Reason */}
            {expense.status === 'rejected' && expense.rejectionReason && (
              <div className="bg-red-50 p-2 rounded-md">
                <h4 className="text-xs font-medium text-red-700 uppercase mb-1">Rejection Reason</h4>
                <p className="text-sm text-red-600">{expense.rejectionReason}</p>
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
            {/* Approval Actions (for managers) */}
            {canApprove && expense.status === 'pending' && (
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
                  onClick={() => setShowRejectModal(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {/* Mark Reimbursed */}
            {canApprove && expense.status === 'approved' && expense.reimbursable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkReimbursed?.(expense.id)}
                className="text-blue-600 hover:text-blue-700"
              >
                <BanknotesIcon className="h-4 w-4 mr-1" />
                Mark Reimbursed
              </Button>
            )}

            {/* Edit/Delete (for expense owner) */}
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
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Expense</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject} disabled={!rejectReason}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
