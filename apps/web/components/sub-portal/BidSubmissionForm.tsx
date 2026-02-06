'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { useSubBids } from '@/lib/hooks/useSubBids';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { logger } from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  PlusIcon,
  TrashIcon,
  PaperClipIcon,
  XMarkIcon,
  DocumentTextIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Zod Schema
// ============================================

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be >= 0'),
});

const bidFormSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  amount: z.coerce.number().min(0.01, 'Bid amount must be greater than zero'),
  laborCost: z.coerce.number().min(0).optional(),
  materialCost: z.coerce.number().min(0).optional(),
  timeline: z.string().optional(),
  proposedStartDate: z.string().optional(),
  proposedEndDate: z.string().optional(),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type BidFormValues = z.input<typeof bidFormSchema>;

// ============================================
// Types
// ============================================

interface BidSubmissionFormProps {
  projectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProjectOption {
  id: string;
  name: string;
}

// ============================================
// Component
// ============================================

export default function BidSubmissionForm({
  projectId,
  onSuccess,
  onCancel,
}: BidSubmissionFormProps) {
  const { user } = useAuth();
  const { bids } = useSubBids();
  const [submitting, setSubmitting] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitAsDraft, setSubmitAsDraft] = useState(false);

  // Derive project options from existing bids (projects the sub is associated with)
  const projectOptions: ProjectOption[] = useMemo(() => {
    const projectMap = new Map<string, string>();
    for (const bid of bids) {
      if (!projectMap.has(bid.projectId)) {
        projectMap.set(bid.projectId, bid.projectName || `Project ${bid.projectId.slice(-6)}`);
      }
    }
    return Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [bids]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      projectId: projectId || '',
      amount: 0,
      laborCost: undefined,
      materialCost: undefined,
      timeline: '',
      proposedStartDate: '',
      proposedEndDate: '',
      description: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = watch('lineItems');

  // Auto-calculate total from line items
  const lineItemsTotal = useMemo(() => {
    if (!watchedLineItems) return 0;
    return watchedLineItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [watchedLineItems]);

  // Sync amount from line items total
  const handleSyncAmount = useCallback(() => {
    setValue('amount', lineItemsTotal);
  }, [lineItemsTotal, setValue]);

  // File attachment handling
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    for (const file of newFiles) {
      if (file.size > MAX_SIZE) {
        toast.error(`File "${file.name}" is too large (max 10MB)`);
        return;
      }
    }

    setAttachmentFiles(prev => [...prev, ...newFiles]);
    // Reset input value
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Upload attachments to Firebase Storage
  const uploadAttachments = useCallback(async (bidId: string): Promise<string[]> => {
    if (attachmentFiles.length === 0) return [];

    const urls: string[] = [];
    const totalFiles = attachmentFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = attachmentFiles[i];
      const fileId = crypto.randomUUID();
      const ext = file.name.split('.').pop() || 'bin';
      const storageRef = ref(storage, `bids/${bidId}/attachments/${fileId}.${ext}`);

      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      const url = await new Promise<string>((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => {
            const fileProgress = snapshot.bytesTransferred / snapshot.totalBytes;
            const overallProgress = ((i + fileProgress) / totalFiles) * 100;
            setUploadProgress(Math.round(overallProgress));
          },
          reject,
          async () => {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });

      urls.push(url);
    }

    setUploadProgress(null);
    return urls;
  }, [attachmentFiles]);

  // Form submission
  const onFormSubmit = useCallback(async (data: BidFormValues) => {
    if (!user) {
      toast.error('You must be logged in to submit a bid');
      return;
    }

    setSubmitting(true);

    try {
      const now = new Date();
      const status = submitAsDraft ? 'draft' : 'submitted';

      const bidData: Record<string, unknown> = {
        projectId: data.projectId,
        subId: user.uid,
        amount: Number(data.amount),
        status,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Optional fields
      if (data.laborCost) bidData.laborCost = Number(data.laborCost);
      if (data.materialCost) bidData.materialCost = Number(data.materialCost);
      if (data.timeline) bidData.timeline = data.timeline;
      if (data.description) bidData.description = data.description;
      if (data.proposedStartDate) {
        bidData.proposedStartDate = Timestamp.fromDate(new Date(data.proposedStartDate));
      }
      if (data.proposedEndDate) {
        bidData.proposedEndDate = Timestamp.fromDate(new Date(data.proposedEndDate));
      }
      if (status === 'submitted') {
        bidData.submittedAt = Timestamp.fromDate(now);
      }

      const docRef = await addDoc(collection(db, 'bids'), bidData);

      // Upload attachments if any
      if (attachmentFiles.length > 0) {
        const attachmentUrls = await uploadAttachments(docRef.id);
        await updateDoc(doc(db, 'bids', docRef.id), {
          attachments: attachmentUrls,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      toast.success(
        status === 'draft'
          ? 'Bid saved as draft'
          : 'Bid submitted successfully'
      );
      onSuccess();
    } catch (err) {
      logger.error('Error submitting bid', { error: err, component: 'BidSubmissionForm' });
      toast.error('Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, submitAsDraft, attachmentFiles, uploadAttachments, onSuccess]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
          Submit a Bid
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Complete the form below to submit your bid. You can save as a draft and submit later.
        </p>
      </div>

      {/* Project Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project <span className="text-red-500">*</span>
        </label>
        {projectId ? (
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            {projectOptions.find(p => p.id === projectId)?.name || `Project ${projectId.slice(-6)}`}
          </div>
        ) : (
          <select
            {...register('projectId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
          >
            <option value="">Select a project...</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
        {errors.projectId && (
          <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
        )}
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Breakdown Line Items <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Quantity</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          {fields.map((field, index) => {
            const qty = Number(watchedLineItems?.[index]?.quantity) || 0;
            const price = Number(watchedLineItems?.[index]?.unitPrice) || 0;
            const itemTotal = qty * price;

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg"
              >
                {/* Description */}
                <div className="md:col-span-5">
                  <label className="md:hidden block text-xs text-gray-500 mb-1">Description</label>
                  <input
                    {...register(`lineItems.${index}.description`)}
                    type="text"
                    placeholder="e.g., Framing labor"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.lineItems[index]?.description?.message}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <label className="md:hidden block text-xs text-gray-500 mb-1">Quantity</label>
                  <input
                    {...register(`lineItems.${index}.quantity`)}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary text-right"
                  />
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="md:hidden block text-xs text-gray-500 mb-1">Unit Price</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      {...register(`lineItems.${index}.unitPrice`)}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary text-right"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="md:col-span-2 flex items-center justify-end">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(itemTotal)}
                  </span>
                </div>

                {/* Remove */}
                <div className="md:col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Remove line item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {errors.lineItems?.root && (
          <p className="mt-1 text-sm text-red-600">{errors.lineItems.root.message}</p>
        )}

        {/* Line items subtotal */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Line Items Total</span>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">
              {formatCurrency(lineItemsTotal)}
            </span>
            <button
              type="button"
              onClick={handleSyncAmount}
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              title="Set bid amount to line items total"
            >
              <CalculatorIcon className="h-3.5 w-3.5" />
              Use as bid amount
            </button>
          </div>
        </div>
      </div>

      {/* Bid Amount */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Bid Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Labor Cost
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              {...register('laborCost')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material Cost
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              {...register('materialCost')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proposed Start Date
          </label>
          <input
            {...register('proposedStartDate')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proposed End Date
          </label>
          <input
            {...register('proposedEndDate')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Timeline
          </label>
          <input
            {...register('timeline')}
            type="text"
            placeholder="e.g., 2-3 weeks"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Description / Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes / Approach Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="Describe your approach, qualifications, inclusions/exclusions, or any other relevant details..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachments
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Attach supporting documents such as material quotes, work plans, or certifications (max 10MB each).
        </p>

        {/* File list */}
        {attachmentFiles.length > 0 && (
          <div className="space-y-2 mb-3">
            {attachmentFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <PaperClipIcon className="h-4 w-4" />
          Attach Files
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Uploading attachments...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="outline"
          onClick={() => setSubmitAsDraft(true)}
          loading={submitting && submitAsDraft}
          disabled={submitting && !submitAsDraft}
          className="w-full sm:w-auto"
        >
          Save as Draft
        </Button>
        <Button
          type="submit"
          variant="primary"
          onClick={() => setSubmitAsDraft(false)}
          loading={submitting && !submitAsDraft}
          disabled={submitting && submitAsDraft}
          className="w-full sm:w-auto"
        >
          Submit Bid
        </Button>
      </div>
    </form>
  );
}
