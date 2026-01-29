'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Supplier, MATERIAL_CATEGORIES, MaterialCategory } from '@/types';

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  accountNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().optional(),
  categories: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  isPreferred: z.boolean(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => Promise<void>;
  supplier?: Supplier;
}

export default function SupplierFormModal({
  open,
  onClose,
  onSubmit,
  supplier,
}: SupplierFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      accountNumber: '',
      paymentTerms: 'Net 30',
      creditLimit: undefined,
      categories: [],
      rating: undefined,
      notes: '',
      isPreferred: false,
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contactName: supplier.contactName || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        zip: supplier.address?.zip || '',
        accountNumber: supplier.accountNumber || '',
        paymentTerms: supplier.paymentTerms || 'Net 30',
        creditLimit: supplier.creditLimit,
        categories: supplier.categories || [],
        rating: supplier.rating,
        notes: supplier.notes || '',
        isPreferred: supplier.isPreferred,
      });
      setSelectedCategories(supplier.categories || []);
    } else {
      reset({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        accountNumber: '',
        paymentTerms: 'Net 30',
        creditLimit: undefined,
        categories: [],
        rating: undefined,
        notes: '',
        isPreferred: false,
      });
      setSelectedCategories([]);
    }
  }, [supplier, reset]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const onFormSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        contactName: data.contactName,
        email: data.email || undefined,
        phone: data.phone,
        website: data.website,
        address:
          data.street || data.city || data.state || data.zip
            ? {
                street: data.street || '',
                city: data.city || '',
                state: data.state || '',
                zip: data.zip || '',
              }
            : undefined,
        accountNumber: data.accountNumber,
        paymentTerms: data.paymentTerms,
        creditLimit: data.creditLimit,
        categories: selectedCategories as MaterialCategory[],
        rating: data.rating,
        notes: data.notes,
        isPreferred: data.isPreferred,
        isActive: true,
      });
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add Supplier'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Basic Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              {...register('name')}
              error={errors.name?.message}
              required
            />

            <Input
              label="Contact Name"
              {...register('contactName')}
            />

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Phone"
              {...register('phone')}
            />

            <div className="col-span-2">
              <Input
                label="Website"
                {...register('website')}
                placeholder="https://"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Address</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Street"
                {...register('street')}
              />
            </div>

            <Input
              label="City"
              {...register('city')}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="State"
                {...register('state')}
              />
              <Input
                label="ZIP"
                {...register('zip')}
              />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Account Information</h3>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Account Number"
              {...register('accountNumber')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                {...register('paymentTerms')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="COD">COD (Cash on Delivery)</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="2/10 Net 30">2/10 Net 30</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('creditLimit', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Categories Supplied</h3>
          <div className="flex flex-wrap gap-2">
            {MATERIAL_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-brand-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating & Notes */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select
                {...register('rating', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">No rating</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Below Average</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isPreferred')}
                  className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-700">Preferred Supplier</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="Any notes about this supplier..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {supplier ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
