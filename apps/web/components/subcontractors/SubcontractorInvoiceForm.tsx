'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import {
  SubcontractorInvoice,
  APLineItem,
  Subcontractor,
  Project,
} from '@/types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// ---------- Zod schema ----------

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  rate: z.coerce.number().min(0, 'Rate must be >= 0'),
  amount: z.coerce.number().min(0),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  projectId: z.string().min(1, 'Project is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  attachmentUrls: z.array(z.string().url('Must be a valid URL').or(z.literal(''))).optional(),
  notes: z.string().optional(),
  lienWaiverStatus: z.enum(['not_required', 'pending', 'received']),
});

type InvoiceFormData = z.output<typeof invoiceSchema>;

// ---------- Props ----------

interface SubcontractorInvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    invoice: Omit<SubcontractorInvoice, 'id' | 'orgId' | 'createdAt' | 'createdBy'>
  ) => Promise<void>;
  invoice?: SubcontractorInvoice; // for edit mode
  mode?: 'create' | 'edit';
}

// ---------- Component ----------

export default function SubcontractorInvoiceForm({
  open,
  onClose,
  onSubmit,
  invoice,
  mode = 'create',
}: SubcontractorInvoiceFormProps) {
  const { data: projects = [] } = useProjects();
  const { subs: subcontractors, loading: subsLoading } = useSubcontractors();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultValues = (): Partial<InvoiceFormData> => {
    if (invoice) {
      return {
        invoiceNumber: invoice.invoiceNumber,
        vendorId: invoice.vendorId,
        projectId: invoice.projectId,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        description: invoice.description || '',
        lineItems: invoice.lineItems.length > 0
          ? invoice.lineItems
          : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        attachmentUrls: invoice.attachmentUrls?.length
          ? invoice.attachmentUrls
          : [''],
        notes: invoice.notes || '',
        lienWaiverStatus: invoice.lienWaiverStatus,
      };
    }

    return {
      invoiceNumber: '',
      vendorId: '',
      projectId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
      lineItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      attachmentUrls: [''],
      notes: '',
      lienWaiverStatus: 'not_required',
    };
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<z.input<typeof invoiceSchema>, unknown, InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: getDefaultValues(),
  });

  const {
    fields: lineItemFields,
    append: appendLineItem,
    remove: removeLineItem,
  } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control,
    name: 'attachmentUrls' as never,
  });

  const watchedLineItems = watch('lineItems');

  // Auto-calculate amount for each line item when quantity or rate changes
  useEffect(() => {
    watchedLineItems?.forEach((item, index) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      const rate = parseFloat(String(item.rate)) || 0;
      const calculated = Math.round(qty * rate * 100) / 100;
      if (item.amount !== calculated) {
        setValue(`lineItems.${index}.amount`, calculated);
      }
    });
  }, [watchedLineItems, setValue]);

  // Calculate total amount
  const totalAmount =
    watchedLineItems?.reduce(
      (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
      0
    ) || 0;

  // Reset form when modal opens / invoice changes
  useEffect(() => {
    if (open) {
      reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, reset]);

  const handleFormSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const selectedSub = subcontractors.find(
        (s: Subcontractor) => s.id === data.vendorId
      );
      const selectedProject = (projects as Project[]).find(
        (p: Project) => p.id === data.projectId
      );

      const lineItems: APLineItem[] = data.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        rate: li.rate,
        amount: li.amount,
      }));

      const invoiceData: Omit<
        SubcontractorInvoice,
        'id' | 'orgId' | 'createdAt' | 'createdBy'
      > = {
        invoiceNumber: data.invoiceNumber,
        vendorId: data.vendorId,
        vendorName: selectedSub?.companyName || '',
        projectId: data.projectId,
        projectName: selectedProject?.name || '',
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        description: data.description || '',
        amount: totalAmount,
        lineItems,
        status: invoice?.status || 'draft',
        lienWaiverStatus: data.lienWaiverStatus,
        attachmentUrls: (data.attachmentUrls || []).filter(
          (url) => url && url.length > 0
        ),
        notes: data.notes || undefined,
      };

      await onSubmit(invoiceData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting subcontractor invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Subcontractor Invoice' : 'New Subcontractor Invoice'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Invoice Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('invoiceNumber')}
            placeholder="e.g. INV-2026-001"
            error={errors.invoiceNumber?.message}
          />
        </div>

        {/* Vendor and Project */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor (Subcontractor) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('vendorId')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
              disabled={subsLoading}
            >
              <option value="">Select vendor</option>
              {subcontractors
                .filter((s: Subcontractor) => s.isActive)
                .map((sub: Subcontractor) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.companyName}
                  </option>
                ))}
            </select>
            {errors.vendorId && (
              <p className="text-red-500 text-xs mt-1">{errors.vendorId.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              {...register('projectId')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            >
              <option value="">Select project</option>
              {(projects as Project[])
                .filter(
                  (p: Project) =>
                    p.status === 'active' ||
                    (invoice && p.id === invoice.projectId)
                )
                .map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
            {errors.projectId && (
              <p className="text-red-500 text-xs mt-1">{errors.projectId.message}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('invoiceDate')}
              error={errors.invoiceDate?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('dueDate')}
              error={errors.dueDate?.message}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            rows={2}
            placeholder="Brief description of work performed..."
          />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Line Items <span className="text-red-500">*</span>
            </label>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() =>
                appendLineItem({ description: '', quantity: 1, rate: 0, amount: 0 })
              }
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Add Item
            </Button>
          </div>
          {errors.lineItems?.message && (
            <p className="text-sm text-red-600 mb-2">{errors.lineItems.message}</p>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 mb-1 px-1">
            <span className="text-xs font-medium text-gray-500">Description</span>
            <span className="text-xs font-medium text-gray-500">Qty</span>
            <span className="text-xs font-medium text-gray-500">Rate</span>
            <span className="text-xs font-medium text-gray-500">Amount</span>
            <span />
          </div>

          <div className="space-y-2">
            {lineItemFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-start"
              >
                <Input
                  {...register(`lineItems.${index}.description`)}
                  placeholder="Item description"
                  error={errors.lineItems?.[index]?.description?.message}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`lineItems.${index}.quantity`)}
                  placeholder="1"
                  error={errors.lineItems?.[index]?.quantity?.message}
                />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lineItems.${index}.rate`)}
                    className="pl-5"
                    placeholder="0.00"
                    error={errors.lineItems?.[index]?.rate?.message}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`lineItems.${index}.amount`)}
                    className="pl-5 bg-gray-50"
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 mt-1"
                  disabled={lineItemFields.length <= 1}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end mt-3 pr-10">
            <div className="text-right">
              <span className="text-sm font-medium text-gray-500 mr-3">Total:</span>
              <span className="text-lg font-semibold text-gray-900">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Lien Waiver Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lien Waiver Status
          </label>
          <select
            {...register('lienWaiverStatus')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
          >
            <option value="not_required">Not Required</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
          </select>
        </div>

        {/* Attachment URLs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Attachment URLs
            </label>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => appendAttachment('' as never)}
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Add URL
            </Button>
          </div>
          <div className="space-y-2">
            {attachmentFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`attachmentUrls.${index}` as const)}
                  placeholder="https://example.com/invoice.pdf"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
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
            placeholder="Additional notes about this invoice..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Save Changes'
                : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
