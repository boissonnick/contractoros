"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormField';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PunchItem, PunchItemPriority } from '@/types';

const createPunchItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().optional(),
  trade: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreatePunchItemFormData = z.infer<typeof createPunchItemSchema>;

interface CreatePunchItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PunchItem>) => Promise<void>;
  projectId: string;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const tradeOptions = [
  { value: '', label: 'Select trade...' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'painting', label: 'Painting' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

export default function CreatePunchItemModal({
  isOpen,
  onClose,
  onSubmit,
  projectId,
}: CreatePunchItemModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreatePunchItemFormData>({
    resolver: zodResolver(createPunchItemSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const handleFormSubmit = async (data: CreatePunchItemFormData) => {
    await onSubmit({
      title: data.title,
      description: data.description || undefined,
      priority: data.priority as PunchItemPriority,
      location: data.location || undefined,
      trade: data.trade || undefined,
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
                    Add Punch Item
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
                    placeholder="e.g., Missing outlet cover plate"
                    error={errors.title}
                    required
                  />

                  <FormTextarea
                    name="description"
                    register={register}
                    label="Description"
                    placeholder="Provide details about the issue..."
                    error={errors.description}
                    rows={3}
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

                    <FormSelect
                      name="trade"
                      register={register}
                      label="Trade"
                      options={tradeOptions}
                      error={errors.trade}
                    />
                  </div>

                  <FormInput
                    name="location"
                    register={register}
                    label="Location"
                    placeholder="e.g., Building A, Floor 2, Room 201"
                    error={errors.location}
                  />

                  <FormInput
                    name="dueDate"
                    register={register}
                    label="Due Date"
                    type="date"
                    error={errors.dueDate}
                  />

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      After creating, you can add photos and assign to team members.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={handleClose} type="button">
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={isSubmitting}>
                      Add Item
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
