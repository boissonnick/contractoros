"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormField';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RFI, RFIPriority } from '@/types';

const createRFISchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  question: z.string().min(20, 'Question must be at least 20 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  drawingRef: z.string().optional(),
  specSection: z.string().optional(),
  location: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateRFIFormData = z.infer<typeof createRFISchema>;

interface CreateRFIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<RFI>) => Promise<void>;
  projectId: string;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CreateRFIModal({
  isOpen,
  onClose,
  onSubmit,
  projectId,
}: CreateRFIModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateRFIFormData>({
    resolver: zodResolver(createRFISchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const handleFormSubmit = async (data: CreateRFIFormData) => {
    await onSubmit({
      subject: data.subject,
      question: data.question,
      priority: data.priority as RFIPriority,
      drawingRef: data.drawingRef || undefined,
      specSection: data.specSection || undefined,
      location: data.location || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Create RFI
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
                  <FormInput
                    name="subject"
                    register={register}
                    label="Subject"
                    placeholder="Brief description of the question"
                    error={errors.subject}
                    required
                  />

                  <FormTextarea
                    name="question"
                    register={register}
                    label="Question"
                    placeholder="Provide a detailed description of the question or clarification needed..."
                    error={errors.question}
                    rows={4}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                      name="priority"
                      register={register}
                      label="Priority"
                      options={priorityOptions}
                      error={errors.priority}
                      required
                    />

                    <FormInput
                      name="dueDate"
                      register={register}
                      label="Response Due Date"
                      type="date"
                      error={errors.dueDate}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      name="drawingRef"
                      register={register}
                      label="Drawing Reference"
                      placeholder="e.g., A-101, S-201"
                      error={errors.drawingRef}
                    />

                    <FormInput
                      name="specSection"
                      register={register}
                      label="Spec Section"
                      placeholder="e.g., 03 30 00"
                      error={errors.specSection}
                    />
                  </div>

                  <FormInput
                    name="location"
                    register={register}
                    label="Location"
                    placeholder="e.g., Building A, Floor 2, Room 201"
                    error={errors.location}
                  />

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={handleClose} type="button">
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={isSubmitting}>
                      Create RFI
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
