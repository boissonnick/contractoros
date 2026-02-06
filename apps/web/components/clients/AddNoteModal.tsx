"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (content: string) => Promise<void>;
}

export function AddNoteModal({ isOpen, onClose, onAdd }: AddNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
  });

  const onSubmit = async (data: NoteFormData) => {
    setIsSubmitting(true);
    try {
      await onAdd(data.content);
      toast.success('Note added');
      reset();
      onClose();
    } catch (err) {
      logger.error('Error adding note', { error: err, component: 'AddNoteModal' });
      toast.error('Failed to add note');
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
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Add Note</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note *
            </label>
            <textarea
              {...register('content')}
              rows={6}
              placeholder="Write your note here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
              autoFocus
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
              {isSubmitting ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddNoteModal;
