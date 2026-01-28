"use client";

import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Badge } from '@/components/ui';
import { FormTextarea } from '@/components/ui/FormField';
import {
  XMarkIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { RFI, RFIResponse, RFIPriority, RFIStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const responseSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters'),
});

type ResponseFormData = z.infer<typeof responseSchema>;

interface RFIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfi: RFI | null;
  onAddResponse: (rfiId: string, response: string) => Promise<void>;
  onUpdateStatus: (rfiId: string, status: RFIStatus) => Promise<void>;
  canRespond?: boolean;
  canClose?: boolean;
}

const priorityConfig: Record<RFIPriority, { label: string; color: string; icon: React.ReactNode }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700', icon: null },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700', icon: null },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
};

const statusConfig: Record<RFIStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
  pending_response: { label: 'Pending Response', color: 'bg-yellow-100 text-yellow-700' },
  answered: { label: 'Answered', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
};

export default function RFIDetailModal({
  isOpen,
  onClose,
  rfi,
  onAddResponse,
  onUpdateStatus,
  canRespond = true,
  canClose = true,
}: RFIDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
  });

  const handleResponseSubmit = async (data: ResponseFormData) => {
    if (!rfi) return;
    setIsSubmitting(true);
    try {
      await onAddResponse(rfi.id, data.response);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: RFIStatus) => {
    if (!rfi) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(rfi.id, newStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rfi) return null;

  const isOverdue = rfi.dueDate && new Date(rfi.dueDate) < new Date() && rfi.status !== 'closed';

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
                      <span className="text-sm font-medium text-blue-600">{rfi.number}</span>
                      <Badge className={statusConfig[rfi.status].color}>
                        {statusConfig[rfi.status].label}
                      </Badge>
                      <Badge className={priorityConfig[rfi.priority].color}>
                        {priorityConfig[rfi.priority].icon}
                        {priorityConfig[rfi.priority].label}
                      </Badge>
                      {isOverdue && (
                        <Badge className="bg-red-100 text-red-700">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {rfi.subject}
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
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        Responses ({rfi.responses?.length || 0})
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
                        Attachments ({rfi.attachments?.length || 0})
                      </Tab>
                    </Tab.List>

                    <Tab.Panels>
                      {/* Details Tab */}
                      <Tab.Panel className="p-6 space-y-6">
                        {/* Question */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Question</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-900 whitespace-pre-wrap">{rfi.question}</p>
                          </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {rfi.drawingRef && (
                            <div className="flex items-start gap-2">
                              <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Drawing Reference</p>
                                <p className="text-sm font-medium text-gray-900">{rfi.drawingRef}</p>
                              </div>
                            </div>
                          )}
                          {rfi.specSection && (
                            <div className="flex items-start gap-2">
                              <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Spec Section</p>
                                <p className="text-sm font-medium text-gray-900">{rfi.specSection}</p>
                              </div>
                            </div>
                          )}
                          {rfi.location && (
                            <div className="flex items-start gap-2">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm font-medium text-gray-900">{rfi.location}</p>
                              </div>
                            </div>
                          )}
                          {rfi.dueDate && (
                            <div className="flex items-start gap-2">
                              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Due Date</p>
                                <p className={cn(
                                  "text-sm font-medium",
                                  isOverdue ? "text-red-600" : "text-gray-900"
                                )}>
                                  {format(new Date(rfi.dueDate), 'MMM d, yyyy')}
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
                              <p className="text-xs text-gray-500">Created By</p>
                              <p className="text-sm font-medium text-gray-900">
                                {rfi.createdByName || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(rfi.createdAt), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          {rfi.assignedToName && (
                            <div className="flex items-start gap-2">
                              <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Assigned To</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {rfi.assignedToName}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Official Response */}
                        {rfi.officialResponse && (
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              <h4 className="text-sm font-medium text-gray-700">Official Response</h4>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                              <p className="text-gray-900 whitespace-pre-wrap">{rfi.officialResponse}</p>
                              {rfi.respondedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Responded {format(new Date(rfi.respondedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </Tab.Panel>

                      {/* Responses Tab */}
                      <Tab.Panel className="p-6 space-y-4">
                        {/* Response Thread */}
                        {rfi.responses && rfi.responses.length > 0 ? (
                          <div className="space-y-4">
                            {rfi.responses.map((response: RFIResponse, index: number) => (
                              <div
                                key={response.id || index}
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {response.authorName || 'Unknown'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {format(new Date(response.createdAt), 'MMM d, yyyy h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                  {response.isOfficial && (
                                    <Badge className="bg-green-100 text-green-700">
                                      Official Response
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{response.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No responses yet</p>
                          </div>
                        )}

                        {/* Add Response Form */}
                        {canRespond && rfi.status !== 'closed' && (
                          <form onSubmit={handleSubmit(handleResponseSubmit)} className="pt-4 border-t border-gray-200">
                            <FormTextarea
                              name="response"
                              register={register}
                              label="Add Response"
                              placeholder="Type your response..."
                              error={errors.response}
                              rows={3}
                            />
                            <div className="flex justify-end mt-3">
                              <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                              >
                                Submit Response
                              </Button>
                            </div>
                          </form>
                        )}
                      </Tab.Panel>

                      {/* Attachments Tab */}
                      <Tab.Panel className="p-6">
                        {rfi.attachments && rfi.attachments.length > 0 ? (
                          <div className="space-y-2">
                            {rfi.attachments.map((attachment, index) => (
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
                          </div>
                        )}
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    {rfi.status === 'open' && canRespond && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange('pending_response')}
                        loading={isSubmitting}
                      >
                        Mark Pending
                      </Button>
                    )}
                    {rfi.status === 'pending_response' && canRespond && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange('answered')}
                        loading={isSubmitting}
                      >
                        Mark Answered
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canClose && rfi.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange('closed')}
                        loading={isSubmitting}
                      >
                        Close RFI
                      </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
