'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  Project,
} from '@/types';
import { ReceiptCaptureButton } from './ReceiptCaptureButton';
import { ReceiptOCRResult } from './ReceiptScanner';
import OCRConfidenceAlert from './OCRConfidenceAlert';
import LineItemsTable from './LineItemsTable';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  projectId: z.string().optional(),
  vendorName: z.string().optional(),
  paymentMethod: z.string().optional(),
  reimbursable: z.boolean().optional(),
  billable: z.boolean().optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  taxDeductible: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type ExpenseFormData = z.output<typeof expenseSchema>;

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  expense?: Expense;
  defaultProjectId?: string;
  mode?: 'create' | 'edit';
}

export function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  expense,
  defaultProjectId,
  mode = 'create',
}: ExpenseFormModalProps) {
  const { data: projects = [] } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<ReceiptOCRResult | null>(null);

  const getDefaultValues = useCallback((): Partial<ExpenseFormData> => {
    if (expense) {
      return {
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        projectId: expense.projectId || '',
        vendorName: expense.vendorName || '',
        paymentMethod: expense.paymentMethod || '',
        reimbursable: expense.reimbursable,
        billable: expense.billable,
        taxAmount: expense.taxAmount,
        taxDeductible: expense.taxDeductible,
        notes: expense.notes || '',
        tags: expense.tags?.join(', ') || '',
      };
    }

    return {
      description: '',
      amount: undefined,
      category: 'materials',
      date: new Date().toISOString().split('T')[0],
      projectId: defaultProjectId || '',
      vendorName: '',
      paymentMethod: '',
      reimbursable: true,
      billable: false,
      taxAmount: undefined,
      taxDeductible: false,
      notes: '',
      tags: '',
    };
  }, [expense, defaultProjectId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<z.input<typeof expenseSchema>, unknown, ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: getDefaultValues(),
  });

  const _selectedProjectId = watch('projectId');

  // Reset form when expense changes
  useEffect(() => {
    if (open) {
      reset(getDefaultValues());
      setWasAutoFilled(false);
      setScanError(null);
      setOcrResult(null);
    }
  }, [open, expense, reset, getDefaultValues]);

  // Handle OCR scan completion - auto-fill form fields
  const handleScanComplete = useCallback(
    (result: ReceiptOCRResult) => {
      setScanError(null);
      setOcrResult(result);

      // Auto-fill vendor name
      if (result.vendor) {
        setValue('vendorName', result.vendor, { shouldValidate: true });
      }

      // Auto-fill amount
      if (result.total != null) {
        setValue('amount', result.total, { shouldValidate: true });
      }

      // Auto-fill date
      if (result.date) {
        setValue('date', result.date, { shouldValidate: true });
      }

      // Auto-fill category
      if (result.category) {
        setValue('category', result.category, { shouldValidate: true });
      }

      // Auto-fill tax amount
      if (result.tax != null) {
        setValue('taxAmount', result.tax, { shouldValidate: true });
      }

      // Auto-fill payment method (map from OCR result to form values)
      if (result.paymentMethod) {
        const paymentMethodMap: Record<string, string> = {
          cash: 'cash',
          card: 'credit_card',
          check: 'check',
          other: 'other',
        };
        const mappedMethod = paymentMethodMap[result.paymentMethod];
        if (mappedMethod) {
          setValue('paymentMethod', mappedMethod, { shouldValidate: true });
        }
      }

      // Generate description from vendor and line items
      let description = '';
      if (result.vendor) {
        description = `Purchase at ${result.vendor}`;
      }
      if (result.lineItems && result.lineItems.length > 0) {
        const itemDescriptions = result.lineItems
          .slice(0, 3)
          .map((item) => item.description)
          .filter(Boolean)
          .join(', ');
        if (itemDescriptions) {
          description = description
            ? `${description}: ${itemDescriptions}`
            : itemDescriptions;
        }
      }
      if (description) {
        setValue('description', description.slice(0, 200), { shouldValidate: true });
      }

      setWasAutoFilled(true);
    },
    [setValue]
  );

  // Handle OCR scan error
  const handleScanError = useCallback((error: string) => {
    setScanError(error);
  }, []);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const selectedProject = (projects as Project[]).find((p: Project) => p.id === data.projectId);

      const expenseData: Omit<Expense, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'> = {
        description: data.description,
        amount: data.amount,
        category: data.category as ExpenseCategory,
        date: data.date,
        projectId: data.projectId || undefined,
        projectName: selectedProject?.name,
        vendorName: data.vendorName || undefined,
        paymentMethod: data.paymentMethod ? data.paymentMethod as ExpensePaymentMethod : undefined,
        reimbursable: data.reimbursable ?? true,
        billable: data.billable ?? false,
        receipts: expense?.receipts || [],
        taxAmount: data.taxAmount,
        taxDeductible: data.taxDeductible,
        notes: data.notes || undefined,
        tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean),
        status: expense?.status || 'pending',
        ocrConfidence: ocrResult?.confidence,
        ocrModel: ocrResult?.modelUsed,
        ocrProcessingTimeMs: ocrResult?.processingTimeMs,
        lineItems: ocrResult?.lineItems,
      };

      await onSubmit(expenseData);
      reset();
      onClose();
    } catch (error) {
      logger.error('Error submitting expense', { error: error, component: 'ExpenseFormModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Expense' : 'Add Expense'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Receipt Scanner - only show in create mode */}
        {mode === 'create' && (
          <div className="pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Scan Receipt (optional)
              </label>
              {wasAutoFilled && (
                <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  <SparklesIcon className="h-3 w-3" />
                  Auto-filled from receipt
                </span>
              )}
            </div>
            <ReceiptCaptureButton
              onScanComplete={handleScanComplete}
              onScanError={handleScanError}
              projectId={watch('projectId') || undefined}
            />
            {scanError && (
              <p className="mt-2 text-sm text-red-600">{scanError}</p>
            )}
            {ocrResult && (
              <div className="space-y-3 mt-3">
                <OCRConfidenceAlert
                  confidence={ocrResult.confidence}
                  model={ocrResult.modelUsed}
                  processingTimeMs={ocrResult.processingTimeMs}
                  onRetry={() => { setOcrResult(null); setWasAutoFilled(false); }}
                />
                {ocrResult.lineItems.length > 0 && (
                  <LineItemsTable lineItems={ocrResult.lineItems} />
                )}
              </div>
            )}
            {!ocrResult && (
              <p className="mt-2 text-xs text-gray-500">
                Take a photo or upload a receipt image to auto-fill expense details using AI.
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
            {wasAutoFilled && (
              <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
            )}
          </label>
          <Input
            {...register('description')}
            placeholder="What was this expense for?"
            error={errors.description?.message}
          />
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
              {wasAutoFilled && (
                <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('amount')}
                className="pl-7"
                placeholder="0.00"
                error={errors.amount?.message}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
              {wasAutoFilled && (
                <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
              )}
            </label>
            <Input
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
            {wasAutoFilled && (
              <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
            )}
          </label>
          <select
            {...register('category')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            {...register('projectId')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
          >
            <option value="">No project selected</option>
            {(projects as Project[])
              .filter((p: Project) => p.status === 'active' || (expense && p.id === expense.projectId))
              .map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>

        {/* Vendor and Payment Method */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor/Store
              {wasAutoFilled && (
                <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
              )}
            </label>
            <Input
              {...register('vendorName')}
              placeholder="e.g., Home Depot, Lowe's"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
              {wasAutoFilled && (
                <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
              )}
            </label>
            <select
              {...register('paymentMethod')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            >
              <option value="">Select method</option>
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tax */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Amount
              {wasAutoFilled && (
                <span className="ml-2 text-xs text-purple-500 font-normal">(scanned)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('taxAmount')}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('taxDeductible')}
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
              />
              <span className="text-sm text-gray-700">Tax Deductible</span>
            </label>
          </div>
        </div>

        {/* Flags */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('reimbursable')}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
            />
            <span className="text-sm text-gray-700">Reimbursable</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('billable')}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
            />
            <span className="text-sm text-gray-700">Billable to Client</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            rows={3}
            placeholder="Additional details about this expense..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <Input
            {...register('tags')}
            placeholder="Enter tags separated by commas"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
