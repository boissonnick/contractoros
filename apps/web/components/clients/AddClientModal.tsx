"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientStatus } from '@/types';
import { createClient, CLIENT_STATUS_LABELS } from '@/lib/hooks/useClients';
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
import { logger } from '@/lib/utils/logger';

const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(['active', 'past', 'potential', 'inactive'] as const),
  source: z.enum(['referral', 'google', 'social_media', 'yard_sign', 'vehicle_wrap', 'website', 'repeat', 'other'] as const).optional(),
  referredBy: z.string().optional(),
  // Address form fields that we'll convert to the addresses array
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
}

export function AddClientModal({ orgId, isOpen, onClose, onSuccess }: AddClientModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'potential',
      tags: [],
    },
  });

  const source = watch('source');
  const tags = watch('tags') || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag));
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      // Build addresses array from form fields
      const addresses = [];
      if (data.addressStreet || data.addressCity) {
        addresses.push({
          id: `addr_${Date.now()}`,
          type: 'property' as const,
          street: data.addressStreet || '',
          city: data.addressCity || '',
          state: data.addressState || '',
          zip: data.addressZip || '',
          isDefault: true,
        });
      }

      const clientId = await createClient({
        orgId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        displayName: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
        status: data.status,
        source: data.source || 'other',
        referredBy: data.referredBy,
        addresses,
        contacts: [],
        preferredCommunication: 'email',
        tags: data.tags || [],
        isCommercial: !!data.companyName,
      }, orgId);

      toast.success('Client created successfully');
      reset();
      setStep(1);
      onClose();
      onSuccess?.(clientId);
    } catch (err) {
      logger.error('Error creating client', { error: err, component: 'AddClientModal' });
      toast.error('Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Contact Details' : 'Source & Tags'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
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
                      placeholder="John"
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
                    placeholder="Doe"
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
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
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
                    placeholder="Acme Inc."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>

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
            </>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="inline h-4 w-4 mr-1" />
                  Address
                </label>
                <input
                  {...register('addressStreet')}
                  type="text"
                  placeholder="123 Main St"
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
            </>
          )}

          {/* Step 3: Source & Tags */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did this client find you?
                </label>
                <ClientSourceSelect
                  value={source}
                  onChange={(s) => setValue('source', s)}
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
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </Button>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button type="button" variant="primary" onClick={() => setStep(step + 1)}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Client'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddClientModal;
