'use client';

import { useState, useEffect } from 'react';
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

type ExpenseFormData = z.infer<typeof expenseSchema>;

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

  const getDefaultValues = (): Partial<ExpenseFormData> => {
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
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: getDefaultValues(),
  });

  const selectedProjectId = watch('projectId');

  // Reset form when expense changes
  useEffect(() => {
    if (open) {
      reset(getDefaultValues());
    }
  }, [open, expense, reset]);

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
      };

      await onSubmit(expenseData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
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
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
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
          </label>
          <select
            {...register('category')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            </label>
            <Input
              {...register('vendorName')}
              placeholder="e.g., Home Depot, Lowe's"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              {...register('paymentMethod')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Reimbursable</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('billable')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

        {/* Receipt Note */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">
            📷 You can add receipt photos after saving this expense.
          </p>
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
