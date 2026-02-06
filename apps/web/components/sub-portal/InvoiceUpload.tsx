'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { useSubcontractorInvoices } from '@/lib/hooks/useSubcontractorInvoices';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { logger } from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Zod Schema
// ============================================

const invoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  rate: z.coerce.number().min(0, 'Rate must be >= 0'),
});

const invoiceUploadSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.input<typeof invoiceUploadSchema>;

// ============================================
// Types
// ============================================

interface InvoiceUploadProps {
  projectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

export default function InvoiceUpload({
  projectId,
  onSuccess,
  onCancel,
}: InvoiceUploadProps) {
  const { user, profile } = useAuth();
  const { createInvoice } = useSubcontractorInvoices(
    projectId ? { projectId } : {}
  );

  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceUploadSchema),
    defaultValues: {
      invoiceNumber: '',
      amount: 0,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
      lineItems: [{ description: '', quantity: 1, rate: 0 }],
      notes: '',
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
      const rate = Number(item.rate) || 0;
      return sum + qty * rate;
    }, 0);
  }, [watchedLineItems]);

  // ============================================
  // File Upload Handling
  // ============================================

  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF or image (JPEG, PNG, WebP).');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`File too large (${sizeMB}MB). Maximum size is 15MB.`);
      return false;
    }
    return true;
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setDocumentFile(file);

    // Generate preview URL
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setDocumentPreviewUrl(url);
    } else {
      // For PDFs, we show a document icon instead of a preview
      setDocumentPreviewUrl(null);
    }
  }, [validateFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = '';
  }, [handleFileSelected]);

  const handleRemoveFile = useCallback(() => {
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
    }
    setDocumentFile(null);
    setDocumentPreviewUrl(null);
  }, [documentPreviewUrl]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }, [handleFileSelected]);

  // Upload document to Firebase Storage
  const uploadDocument = useCallback(async (
    orgId: string,
    invoiceId: string
  ): Promise<string | null> => {
    if (!documentFile) return null;

    const fileId = crypto.randomUUID();
    const ext = documentFile.name.split('.').pop() || 'bin';
    const storageRef = ref(
      storage,
      `organizations/${orgId}/subcontractor-invoices/${invoiceId}/${fileId}.${ext}`
    );

    const task = uploadBytesResumable(storageRef, documentFile, {
      contentType: documentFile.type,
    });

    return new Promise<string>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(percent);
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploadProgress(null);
          resolve(url);
        }
      );
    });
  }, [documentFile]);

  // ============================================
  // Form Submission
  // ============================================

  const onFormSubmit = useCallback(async (data: InvoiceFormValues) => {
    if (!user || !profile?.orgId) {
      toast.error('You must be logged in to upload an invoice');
      return;
    }

    setSubmitting(true);

    try {
      // Build line items with computed amounts
      const lineItems = data.lineItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate),
      }));

      const totalAmount = Number(data.amount);

      // Create the invoice record
      const invoiceId = await createInvoice({
        vendorId: user.uid,
        vendorName: profile.displayName || user.email || 'Subcontractor',
        projectId: projectId || '',
        projectName: '', // Will be enriched server-side or by the GC
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate || data.invoiceDate,
        amount: totalAmount,
        description: data.description,
        lineItems,
        status: 'draft',
        lienWaiverStatus: 'not_required',
        attachmentUrls: [],
        notes: data.notes || undefined,
      });

      // Upload the document file if present
      if (documentFile && invoiceId) {
        try {
          const fileUrl = await uploadDocument(profile.orgId, invoiceId);
          if (fileUrl) {
            // Update the invoice with the attachment URL
            await updateDoc(
              doc(db, `organizations/${profile.orgId}/subcontractorInvoices/${invoiceId}`),
              {
                attachmentUrls: [fileUrl],
                updatedAt: Timestamp.fromDate(new Date()),
              }
            );
          }
        } catch (uploadErr) {
          logger.error('Error uploading invoice document', {
            error: uploadErr,
            component: 'InvoiceUpload',
          });
          toast.warning('Invoice created, but document upload failed. You can re-upload later.');
        }
      }

      toast.success('Invoice created successfully');
      onSuccess();
    } catch (err) {
      logger.error('Error creating invoice', { error: err, component: 'InvoiceUpload' });
      toast.error('Failed to create invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, profile, projectId, documentFile, createInvoice, uploadDocument, onSuccess]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
          Upload Invoice
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload your invoice document and enter the details below. In the future, OCR will auto-fill fields from your uploaded document.
        </p>
      </div>

      {/* Document Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invoice Document
        </label>

        {!documentFile ? (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragging
                ? 'border-brand-primary bg-brand-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${isDragging ? 'text-brand-primary' : 'text-gray-400'}`} />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {isDragging ? 'Drop your file here' : 'Drag and drop your invoice'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              or click to browse. PDF, JPEG, PNG, WebP (max 15MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Preview area */}
            <div className="bg-gray-50 p-4">
              {documentPreviewUrl ? (
                <div className="relative max-h-64 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={documentPreviewUrl}
                    alt="Invoice preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-16 w-16 text-red-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">PDF Document</p>
                  </div>
                </div>
              )}
            </div>

            {/* File info bar */}
            <div className="flex items-center justify-between p-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{documentFile.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  ({(documentFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  title="Replace file"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-gray-400 hover:text-red-600"
                  title="Remove file"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Uploading document...</span>
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

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('invoiceNumber')}
            type="text"
            placeholder="e.g., INV-2026-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
          />
          {errors.invoiceNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount <span className="text-red-500">*</span>
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
            Invoice Date <span className="text-red-500">*</span>
          </label>
          <input
            {...register('invoiceDate')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
          {errors.invoiceDate && (
            <p className="mt-1 text-sm text-red-600">{errors.invoiceDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            {...register('dueDate')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          {...register('description')}
          type="text"
          placeholder="e.g., Plumbing rough-in for Phase 2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Line Items <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => append({ description: '', quantity: 1, rate: 0 })}
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
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1" />
          </div>

          {fields.map((field, index) => {
            const qty = Number(watchedLineItems?.[index]?.quantity) || 0;
            const rate = Number(watchedLineItems?.[index]?.rate) || 0;
            const itemTotal = qty * rate;

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
                    placeholder="e.g., Labor - rough-in"
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

                {/* Rate */}
                <div className="md:col-span-2">
                  <label className="md:hidden block text-xs text-gray-500 mb-1">Rate</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      {...register(`lineItems.${index}.rate`)}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary/20 focus:border-brand-primary text-right"
                    />
                  </div>
                </div>

                {/* Amount */}
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
          <span className="text-base font-semibold text-gray-900">
            {formatCurrency(lineItemsTotal)}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Any additional notes or context for this invoice..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {/* OCR Coming Soon Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <EyeIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Auto-fill coming soon</p>
          <p className="text-xs text-blue-700 mt-0.5">
            In a future update, uploading an invoice document will automatically extract the invoice number, amount, date, and line items using OCR. For now, please enter these details manually.
          </p>
        </div>
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
          variant="primary"
          loading={submitting}
          className="w-full sm:w-auto"
        >
          Create Invoice
        </Button>
      </div>
    </form>
  );
}
