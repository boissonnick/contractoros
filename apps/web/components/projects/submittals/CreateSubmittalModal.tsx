"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormField';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Submittal, SubmittalPriority } from '@/types';

const createSubmittalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  specSection: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
});

type CreateSubmittalFormData = z.infer<typeof createSubmittalSchema>;

interface CreateSubmittalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Submittal>) => Promise<void>;
  projectId: string;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CreateSubmittalModal({
  isOpen,
  onClose,
  onSubmit,
  projectId,
}: CreateSubmittalModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateSubmittalFormData>({
    resolver: zodResolver(createSubmittalSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const handleFormSubmit = async (data: CreateSubmittalFormData) => {
    await onSubmit({
      title: data.title,
      description: data.description || undefined,
      specSection: data.specSection || undefined,
      priority: data.priority as SubmittalPriority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: 'draft',
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
                    Create Submittal
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
                    name="title"
                    register={register}
                    label="Title"
                    placeholder="e.g., Concrete Mix Design, HVAC Equipment Data"
                    error={errors.title}
                    required
                  />

                  <FormTextarea
                    name="description"
                    register={register}
                    label="Description"
                    placeholder="Provide details about this submittal..."
                    error={errors.description}
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      name="specSection"
                      register={register}
                      label="Spec Section"
                      placeholder="e.g., 03 30 00"
                      error={errors.specSection}
                    />

                    <FormSelect
                      name="priority"
                      register={register}
                      label="Priority"
                      options={priorityOptions}
                      error={errors.priority}
                      required
                    />
                  </div>

                  <FormInput
                    name="dueDate"
                    register={register}
                    label="Review Due Date"
                    type="date"
                    error={errors.dueDate}
                  />

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      After creating, you can upload attachments and submit for review.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={handleClose} type="button">
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={isSubmitting}>
                      Create Submittal
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
