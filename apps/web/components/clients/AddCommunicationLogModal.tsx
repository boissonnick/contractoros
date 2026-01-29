"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientCommunicationLog } from '@/types';
import { Button, Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const logSchema = z.object({
  type: z.enum(['phone', 'email', 'text', 'meeting', 'site_visit', 'note'] as const),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  direction: z.enum(['inbound', 'outbound'] as const),
});

type LogFormData = z.infer<typeof logSchema>;

interface AddCommunicationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (log: Omit<ClientCommunicationLog, 'id' | 'clientId' | 'createdAt' | 'createdBy' | 'createdByName' | 'orgId'>) => Promise<void>;
}

const logTypes = [
  { value: 'phone', label: 'Phone Call', icon: PhoneIcon },
  { value: 'email', label: 'Email', icon: EnvelopeIcon },
  { value: 'meeting', label: 'Meeting', icon: UserGroupIcon },
  { value: 'note', label: 'Note', icon: DocumentTextIcon },
] as const;

export function AddCommunicationLogModal({ isOpen, onClose, onAdd }: AddCommunicationLogModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      type: 'phone',
      direction: 'outbound',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: LogFormData) => {
    setIsSubmitting(true);
    try {
      await onAdd({
        type: data.type,
        subject: data.subject,
        content: data.content,
        direction: data.direction,
      });

      toast.success('Communication logged');
      reset();
      onClose();
    } catch (err) {
      console.error('Error logging communication:', err);
      toast.error('Failed to log communication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Log Communication</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {logTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('type', value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                    ${selectedType === value
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('direction')}
                  type="radio"
                  value="outbound"
                  className="text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm">Outbound (you contacted them)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('direction')}
                  type="radio"
                  value="inbound"
                  className="text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm">Inbound (they contacted you)</span>
              </label>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              {...register('subject')}
              type="text"
              placeholder={selectedType === 'phone' ? 'What was the call about?' : 'Subject line or topic'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details *
            </label>
            <textarea
              {...register('content')}
              rows={4}
              placeholder={
                selectedType === 'phone'
                  ? 'Summary of the phone call...'
                  : selectedType === 'email'
                  ? 'Email content or summary...'
                  : selectedType === 'meeting'
                  ? 'Meeting notes and discussion points...'
                  : 'Notes about this client...'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
            />
            {errors.content && (
              <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Communication'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddCommunicationLogModal;
