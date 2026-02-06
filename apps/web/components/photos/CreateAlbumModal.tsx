"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import { Button, Input } from '@/components/ui';
import { PhotoAlbum } from '@/types';
import {
  FolderIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

const albumSchema = z.object({
  name: z.string().min(1, 'Album name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean(),
  clientAccessEnabled: z.boolean(),
});

type AlbumFormData = z.infer<typeof albumSchema>;

export interface CreateAlbumModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PhotoAlbum, 'id' | 'projectId' | 'orgId' | 'photoCount' | 'createdBy' | 'createdAt'>) => Promise<void>;
  /** Existing album for editing */
  album?: PhotoAlbum | null;
  /** Loading state for submit button */
  loading?: boolean;
}

/**
 * CreateAlbumModal - Modal for creating or editing photo albums
 *
 * Features:
 * - Form validation with Zod
 * - Toggle for public/private visibility
 * - Toggle for client sharing
 * - Edit mode support
 */
export default function CreateAlbumModal({
  open,
  onClose,
  onSubmit,
  album,
  loading = false,
}: CreateAlbumModalProps) {
  const isEditing = !!album;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
    defaultValues: {
      name: album?.name || '',
      description: album?.description || '',
      isPublic: album?.isPublic || false,
      clientAccessEnabled: album?.clientAccessEnabled || false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is intentional; compiler skips this component
  const isPublic = watch('isPublic');
  const clientAccessEnabled = watch('clientAccessEnabled');

  // Reset form when album changes
  React.useEffect(() => {
    if (open) {
      reset({
        name: album?.name || '',
        description: album?.description || '',
        isPublic: album?.isPublic || false,
        clientAccessEnabled: album?.clientAccessEnabled || false,
      });
    }
  }, [open, album, reset]);

  const handleFormSubmit = async (data: AlbumFormData) => {
    try {
      await onSubmit({
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        clientAccessEnabled: data.clientAccessEnabled,
      });
      reset();
      onClose();
    } catch (error) {
      logger.error('Failed to save album', { error: error, component: 'CreateAlbumModal' });
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Album' : 'Create Album'}
      subtitle={isEditing ? 'Update album settings' : 'Organize your photos into an album'}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={loading || isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Create Album'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Album Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Album Name *
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Kitchen Renovation Progress"
            error={errors.name?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Add a description for this album..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Visibility Settings */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Visibility Settings
          </label>

          {/* Public/Private toggle */}
          <button
            type="button"
            onClick={() => setValue('isPublic', !isPublic)}
            className={cn(
              'w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left',
              isPublic
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isPublic ? 'bg-green-100' : 'bg-gray-100'
            )}>
              {isPublic ? (
                <GlobeAltIcon className="h-5 w-5 text-green-600" />
              ) : (
                <LockClosedIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {isPublic ? 'Public Album' : 'Private Album'}
              </p>
              <p className="text-xs text-gray-500">
                {isPublic
                  ? 'Anyone with the link can view this album'
                  : 'Only team members can view this album'}
              </p>
            </div>
            <div className={cn(
              'w-11 h-6 rounded-full relative transition-colors',
              isPublic ? 'bg-green-500' : 'bg-gray-300'
            )}>
              <div className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                isPublic ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </div>
          </button>

          {/* Client Sharing toggle */}
          <button
            type="button"
            onClick={() => setValue('clientAccessEnabled', !clientAccessEnabled)}
            className={cn(
              'w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left',
              clientAccessEnabled
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              clientAccessEnabled ? 'bg-blue-100' : 'bg-gray-100'
            )}>
              <UserGroupIcon className={cn(
                'h-5 w-5',
                clientAccessEnabled ? 'text-blue-600' : 'text-gray-500'
              )} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Client Access
              </p>
              <p className="text-xs text-gray-500">
                {clientAccessEnabled
                  ? 'Clients can view this album in their portal'
                  : 'Album is hidden from clients'}
              </p>
            </div>
            <div className={cn(
              'w-11 h-6 rounded-full relative transition-colors',
              clientAccessEnabled ? 'bg-blue-500' : 'bg-gray-300'
            )}>
              <div className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                clientAccessEnabled ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </div>
          </button>
        </div>

        {/* Preview */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {watch('name') || 'Album Name'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {isPublic ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <GlobeAltIcon className="h-3 w-3" /> Public
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <LockClosedIcon className="h-3 w-3" /> Private
                  </span>
                )}
                {clientAccessEnabled && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <UserGroupIcon className="h-3 w-3" /> Client Access
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
