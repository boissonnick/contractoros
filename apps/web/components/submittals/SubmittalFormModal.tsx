'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  PaperClipIcon,
  DocumentPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { SubmissionType } from './SubmittalCard';

export interface SubmittalFormData {
  title: string;
  specSection: string;
  description: string;
  submissionType: SubmissionType;
  reviewerId?: string;
  requiredDate?: string;
  attachments: File[];
}

interface Reviewer {
  id: string;
  name: string;
  role?: string;
}

interface SubmittalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmittalFormData) => Promise<void>;
  initialData?: Partial<SubmittalFormData>;
  reviewers: Reviewer[];
  projectId: string;
  editMode?: boolean;
  isRevision?: boolean;
}

const SUBMISSION_TYPES: { value: SubmissionType; label: string }[] = [
  { value: 'shop_drawing', label: 'Shop Drawing' },
  { value: 'product_data', label: 'Product Data' },
  { value: 'sample', label: 'Sample' },
  { value: 'mock_up', label: 'Mock-Up' },
  { value: 'test_report', label: 'Test Report' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'other', label: 'Other' },
];

export function SubmittalFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  reviewers,
  projectId: _projectId,
  editMode = false,
  isRevision = false,
}: SubmittalFormModalProps) {
  const [formData, setFormData] = useState<SubmittalFormData>({
    title: initialData?.title || '',
    specSection: initialData?.specSection || '',
    description: initialData?.description || '',
    submissionType: initialData?.submissionType || 'product_data',
    reviewerId: initialData?.reviewerId || '',
    requiredDate: initialData?.requiredDate || '',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (isRevision) return 'Revise Submittal';
    if (editMode) return 'Edit Submittal';
    return 'New Submittal';
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {getTitle()}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Submittal title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Spec Section & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spec Section
                      </label>
                      <input
                        type="text"
                        name="specSection"
                        value={formData.specSection}
                        onChange={handleInputChange}
                        placeholder="e.g., 08 11 13"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Submission Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="submissionType"
                        value={formData.submissionType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        {SUBMISSION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Additional details about the submittal..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Reviewer & Required Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reviewer
                      </label>
                      <select
                        name="reviewerId"
                        value={formData.reviewerId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="">Select reviewer...</option>
                        {reviewers.map((reviewer) => (
                          <option key={reviewer.id} value={reviewer.id}>
                            {reviewer.name}{reviewer.role ? ` (${reviewer.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Date
                      </label>
                      <input
                        type="date"
                        name="requiredDate"
                        value={formData.requiredDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* File Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Submittal Documents <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="submittal-attachments"
                        accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                      <label
                        htmlFor="submittal-attachments"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <DocumentPlusIcon className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">
                          Click to upload documents
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          PDF, DWG, DOC, XLS, Images
                        </span>
                      </label>
                    </div>
                    {formData.attachments.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {formData.attachments.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <PaperClipIcon className="h-4 w-4" />
                              <span className="truncate max-w-xs">{file.name}</span>
                              <span className="text-xs text-gray-400">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.title.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : isRevision
                      ? 'Submit Revision'
                      : 'Submit'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default SubmittalFormModal;
