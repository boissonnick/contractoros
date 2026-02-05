"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client, ClientStatus } from '@/types';
import { CLIENT_STATUS_LABELS } from '@/lib/hooks/useClients';
import { ClientSourceSelect } from './ClientSourceSelect';
import { Button, Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(['active', 'past', 'potential', 'inactive'] as const),
  source: z.enum(['referral', 'google', 'social_media', 'yard_sign', 'vehicle_wrap', 'website', 'repeat', 'other'] as const),
  referredBy: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  tags: z.array(z.string()).optional(),
  preferredCommunication: z.enum(['email', 'phone', 'text', 'any'] as const),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Client>) => Promise<void>;
}

export function EditClientModal({ client, isOpen, onClose, onSave }: EditClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Get first address if exists
  const primaryAddress = client.addresses?.find(a => a.isDefault) || client.addresses?.[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone || '',
      companyName: client.companyName || '',
      status: client.status,
      source: client.source,
      referredBy: client.referredBy || '',
      addressStreet: primaryAddress?.street || '',
      addressCity: primaryAddress?.city || '',
      addressState: primaryAddress?.state || '',
      addressZip: primaryAddress?.zip || '',
      tags: client.tags || [],
      preferredCommunication: client.preferredCommunication || 'email',
    },
  });

  // Reset form when client changes
  useEffect(() => {
    if (client && isOpen) {
      const addr = client.addresses?.find(a => a.isDefault) || client.addresses?.[0];
      reset({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone || '',
        companyName: client.companyName || '',
        status: client.status,
        source: client.source,
        referredBy: client.referredBy || '',
        addressStreet: addr?.street || '',
        addressCity: addr?.city || '',
        addressState: addr?.state || '',
        addressZip: addr?.zip || '',
        tags: client.tags || [],
        preferredCommunication: client.preferredCommunication || 'email',
      });
    }
  }, [client, isOpen, reset]);

  const source = watch('source');
  const tags = watch('tags') || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()], { shouldDirty: true });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag), { shouldDirty: true });
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      // Build addresses array
      const addresses = [...(client.addresses || [])];
      const hasAddress = data.addressStreet || data.addressCity;

      if (hasAddress) {
        const newAddress = {
          id: primaryAddress?.id || `addr_${Date.now()}`,
          type: primaryAddress?.type || 'property' as const,
          street: data.addressStreet || '',
          city: data.addressCity || '',
          state: data.addressState || '',
          zip: data.addressZip || '',
          isDefault: true,
        };

        // Update or add address
        const existingIndex = addresses.findIndex(a => a.id === newAddress.id);
        if (existingIndex >= 0) {
          addresses[existingIndex] = newAddress;
        } else {
          addresses.push(newAddress);
        }
      }

      await onSave({
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        status: data.status,
        source: data.source,
        referredBy: data.referredBy,
        addresses,
        tags: data.tags || [],
        preferredCommunication: data.preferredCommunication,
        isCommercial: !!data.companyName,
      });

      toast.success('Client updated successfully');
      onClose();
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit Client</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('firstName')}
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                {...register('lastName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('phone')}
                type="tel"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <div className="relative">
              <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('companyName')}
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {(Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {CLIENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Communication
              </label>
              <select
                {...register('preferredCommunication')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text</option>
                <option value="any">Any</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPinIcon className="inline h-4 w-4 mr-1" />
              Address
            </label>
            <input
              {...register('addressStreet')}
              type="text"
              placeholder="Street"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent mb-2"
            />
            <div className="grid grid-cols-6 gap-2">
              <input
                {...register('addressCity')}
                type="text"
                placeholder="City"
                className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <input
                {...register('addressState')}
                type="text"
                placeholder="State"
                className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <input
                {...register('addressZip')}
                type="text"
                placeholder="ZIP"
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How did this client find you?
            </label>
            <ClientSourceSelect
              value={source}
              onChange={(s) => setValue('source', s, { shouldDirty: true })}
            />
          </div>

          {source === 'referral' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referred By
              </label>
              <input
                {...register('referredBy')}
                type="text"
                placeholder="Who referred this client?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <TagIcon className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EditClientModal;
