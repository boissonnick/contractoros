"use client";

import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Badge } from '@/components/ui';
import { FormTextarea, FormSelect } from '@/components/ui/FormField';
import {
  XMarkIcon,
  PaperClipIcon,
  ClockIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Submittal, SubmittalStatus, SubmittalPriority } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const reviewSchema = z.object({
  status: z.enum(['approved', 'approved_as_noted', 'revise_resubmit', 'rejected']),
  comments: z.string().min(10, 'Comments must be at least 10 characters'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface SubmittalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submittal: Submittal | null;
  onUpdateStatus: (submittalId: string, status: SubmittalStatus, comments?: string) => Promise<void>;
  canReview?: boolean;
}

const priorityConfig: Record<SubmittalPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

const statusConfig: Record<SubmittalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: <ClockIcon className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  approved_as_noted: { label: 'Approved as Noted', color: 'bg-blue-100 text-blue-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  revise_resubmit: { label: 'Revise & Resubmit', color: 'bg-orange-100 text-orange-700', icon: <ArrowPathIcon className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
};

const reviewStatusOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'approved_as_noted', label: 'Approved as Noted' },
  { value: 'revise_resubmit', label: 'Revise & Resubmit' },
  { value: 'rejected', label: 'Rejected' },
];

export default function SubmittalDetailModal({
  isOpen,
  onClose,
  submittal,
  onUpdateStatus,
  canReview = true,
}: SubmittalDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: 'approved',
    },
  });

  const handleReviewSubmit = async (data: ReviewFormData) => {
    if (!submittal) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(submittal.id, data.status, data.comments);
      reset();
      setShowReviewForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!submittal) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(submittal.id, 'pending_review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submittal) return null;

  const isOverdue = submittal.dueDate &&
    new Date(submittal.dueDate) < new Date() &&
    submittal.status === 'pending_review';
  const isPendingReview = submittal.status === 'pending_review';
  const isDraft = submittal.status === 'draft';
  const isReviewed = ['approved', 'approved_as_noted', 'revise_resubmit', 'rejected'].includes(submittal.status);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-600">{submittal.number}</span>
                      <Badge className={statusConfig[submittal.status].color}>
                        {statusConfig[submittal.status].icon}
                        <span className="ml-1">{statusConfig[submittal.status].label}</span>
                      </Badge>
                      <Badge className={priorityConfig[submittal.priority].color}>
                        {priorityConfig[submittal.priority].label}
                      </Badge>
                      {submittal.revisionNumber > 0 && (
                        <Badge className="bg-purple-100 text-purple-700">
                          Rev {submittal.revisionNumber}
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge className="bg-red-100 text-red-700">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {submittal.title}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto">
                  <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                    <Tab.List className="flex border-b border-gray-200 px-6">
                      <Tab className={({ selected }) =>
                        cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                          selected
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        )
                      }>
                        Details
                      </Tab>
                      <Tab className={({ selected }) =>
                        cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1',
                          selected
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        )
                      }>
                        <PaperClipIcon className="h-4 w-4" />
                        Attachments ({submittal.attachments?.length || 0})
                      </Tab>
                      {isReviewed && (
                        <Tab className={({ selected }) =>
                          cn(
                            'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                            selected
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          )
                        }>
                          Review
                        </Tab>
                      )}
                    </Tab.List>

                    <Tab.Panels>
                      {/* Details Tab */}
                      <Tab.Panel className="p-6 space-y-6">
                        {/* Description */}
                        {submittal.description && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-900 whitespace-pre-wrap">{submittal.description}</p>
                            </div>
                          </div>
                        )}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {submittal.specSection && (
                            <div className="flex items-start gap-2">
                              <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Spec Section</p>
                                <p className="text-sm font-medium text-gray-900">{submittal.specSection}</p>
                              </div>
                            </div>
                          )}
                          {submittal.dueDate && (
                            <div className="flex items-start gap-2">
                              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Due Date</p>
                                <p className={cn(
                                  "text-sm font-medium",
                                  isOverdue ? "text-red-600" : "text-gray-900"
                                )}>
                                  {format(new Date(submittal.dueDate), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* People */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                          <div className="flex items-start gap-2">
                            <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Submitted By</p>
                              <p className="text-sm font-medium text-gray-900">
                                {submittal.submittedByName || 'Unknown'}
                              </p>
                              {submittal.submittedAt && (
                                <p className="text-xs text-gray-500">
                                  {format(new Date(submittal.submittedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>
                          {submittal.assignedToName && (
                            <div className="flex items-start gap-2">
                              <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Assigned To</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {submittal.assignedToName}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Review Form for Pending Submittals */}
                        {isPendingReview && canReview && (
                          <div className="pt-4 border-t border-gray-200">
                            {!showReviewForm ? (
                              <Button
                                variant="primary"
                                onClick={() => setShowReviewForm(true)}
                              >
                                Review Submittal
                              </Button>
                            ) : (
                              <form onSubmit={handleSubmit(handleReviewSubmit)} className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-900">Review Submittal</h4>

                                <FormSelect
                                  name="status"
                                  register={register}
                                  label="Decision"
                                  options={reviewStatusOptions}
                                  error={errors.status}
                                  required
                                />

                                <FormTextarea
                                  name="comments"
                                  register={register}
                                  label="Review Comments"
                                  placeholder="Provide your review comments..."
                                  error={errors.comments}
                                  rows={4}
                                  required
                                />

                                <div className="flex gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowReviewForm(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    variant="primary"
                                    loading={isSubmitting}
                                  >
                                    Submit Review
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </Tab.Panel>

                      {/* Attachments Tab */}
                      <Tab.Panel className="p-6">
                        {submittal.attachments && submittal.attachments.length > 0 ? (
                          <div className="space-y-2">
                            {submittal.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {attachment.type} • {Math.round(attachment.size / 1024)} KB
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <PaperClipIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No attachments</p>
                            {isDraft && (
                              <Button variant="outline" size="sm" className="mt-4">
                                Upload Files
                              </Button>
                            )}
                          </div>
                        )}
                      </Tab.Panel>

                      {/* Review Tab */}
                      {isReviewed && (
                        <Tab.Panel className="p-6 space-y-4">
                          <div className={cn(
                            "rounded-lg p-4 border",
                            submittal.status === 'approved' && "bg-green-50 border-green-200",
                            submittal.status === 'approved_as_noted' && "bg-blue-50 border-blue-200",
                            submittal.status === 'revise_resubmit' && "bg-orange-50 border-orange-200",
                            submittal.status === 'rejected' && "bg-red-50 border-red-200",
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              {statusConfig[submittal.status].icon}
                              <span className="font-medium text-gray-900">
                                {statusConfig[submittal.status].label}
                              </span>
                            </div>
                            {submittal.reviewComments && (
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {submittal.reviewComments}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              {submittal.reviewedByName && (
                                <span>Reviewed by: {submittal.reviewedByName}</span>
                              )}
                              {submittal.reviewedAt && (
                                <span>{format(new Date(submittal.reviewedAt), 'MMM d, yyyy h:mm a')}</span>
                              )}
                            </div>
                          </div>

                          {submittal.status === 'revise_resubmit' && (
                            <div className="flex items-start gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">Action Required</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                  This submittal requires revision. Please address the comments above and resubmit.
                                </p>
                              </div>
                            </div>
                          )}
                        </Tab.Panel>
                      )}
                    </Tab.Panels>
                  </Tab.Group>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div>
                    {isDraft && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmitForReview}
                        loading={isSubmitting}
                      >
                        Submit for Review
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
