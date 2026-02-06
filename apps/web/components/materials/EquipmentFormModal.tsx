'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  EquipmentItem,
  MaterialCategory,
  EquipmentCheckoutStatus,
  MATERIAL_CATEGORIES,
  EQUIPMENT_STATUSES,
  Supplier,
} from '@/types';
import { logger } from '@/lib/utils/logger';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  assetTag: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  purchasePrice: z.number().optional(),
  currentValue: z.number().optional(),
  isRental: z.boolean(),
  rentalSupplierId: z.string().optional(),
  rentalSupplierName: z.string().optional(),
  rentalRate: z.number().optional(),
  rentalPeriod: z.string().optional(),
  condition: z.string().min(1, 'Condition is required'),
  status: z.string().min(1, 'Status is required'),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export interface EquipmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<EquipmentItem, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => Promise<void>;
  equipment?: EquipmentItem;
  suppliers?: Supplier[];
}

export default function EquipmentFormModal({
  open,
  onClose,
  onSubmit,
  equipment,
  suppliers = [],
}: EquipmentFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      description: '',
      serialNumber: '',
      assetTag: '',
      category: 'tools',
      make: '',
      model: '',
      year: undefined,
      purchasePrice: undefined,
      currentValue: undefined,
      isRental: false,
      rentalSupplierId: '',
      rentalSupplierName: '',
      rentalRate: undefined,
      rentalPeriod: 'day',
      condition: 'good',
      status: 'available',
    },
  });

  const isRental = watch('isRental');
  const selectedSupplierId = watch('rentalSupplierId');

  useEffect(() => {
    if (equipment) {
      reset({
        name: equipment.name,
        description: equipment.description || '',
        serialNumber: equipment.serialNumber || '',
        assetTag: equipment.assetTag || '',
        category: equipment.category,
        make: equipment.make || '',
        model: equipment.model || '',
        year: equipment.year,
        purchasePrice: equipment.purchasePrice,
        currentValue: equipment.currentValue,
        isRental: equipment.isRental,
        rentalSupplierId: equipment.rentalSupplierId || '',
        rentalSupplierName: equipment.rentalSupplierName || '',
        rentalRate: equipment.rentalRate,
        rentalPeriod: equipment.rentalPeriod || 'day',
        condition: equipment.condition,
        status: equipment.status,
      });
    } else {
      reset({
        name: '',
        description: '',
        serialNumber: '',
        assetTag: '',
        category: 'tools',
        make: '',
        model: '',
        year: undefined,
        purchasePrice: undefined,
        currentValue: undefined,
        isRental: false,
        rentalSupplierId: '',
        rentalSupplierName: '',
        rentalRate: undefined,
        rentalPeriod: 'day',
        condition: 'good',
        status: 'available',
      });
    }
  }, [equipment, reset]);

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      if (supplier) {
        setValue('rentalSupplierName', supplier.name);
      }
    } else {
      setValue('rentalSupplierName', '');
    }
  }, [selectedSupplierId, suppliers, setValue]);

  const onFormSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        description: data.description,
        serialNumber: data.serialNumber,
        assetTag: data.assetTag,
        category: data.category as MaterialCategory,
        make: data.make,
        model: data.model,
        year: data.year,
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue,
        isRental: data.isRental,
        rentalSupplierId: data.isRental ? data.rentalSupplierId : undefined,
        rentalSupplierName: data.isRental ? data.rentalSupplierName : undefined,
        rentalRate: data.isRental ? data.rentalRate : undefined,
        rentalPeriod: data.isRental ? (data.rentalPeriod as 'hour' | 'day' | 'week' | 'month') : undefined,
        condition: data.condition as EquipmentItem['condition'],
        status: data.status as EquipmentCheckoutStatus,
        isActive: true,
      });
      onClose();
    } catch (error) {
      logger.error('Error saving equipment', { error: error, component: 'EquipmentFormModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter to equipment-related categories
  const equipmentCategories = MATERIAL_CATEGORIES.filter((c) =>
    ['tools', 'equipment', 'rental', 'safety', 'other'].includes(c.value)
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={equipment ? 'Edit Equipment' : 'Add Equipment'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Basic Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Name"
                {...register('name')}
                error={errors.name?.message}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <Input
              label="Serial Number"
              {...register('serialNumber')}
            />

            <Input
              label="Asset Tag"
              {...register('assetTag')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {equipmentCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                {...register('condition')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {EQUIPMENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Make/Model */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Make & Model</h3>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Make"
              {...register('make')}
              placeholder="e.g., DeWalt"
            />

            <Input
              label="Model"
              {...register('model')}
              placeholder="e.g., DCS575T2"
            />

            <Input
              label="Year"
              type="number"
              {...register('year', { valueAsNumber: true })}
              placeholder="e.g., 2023"
            />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Value</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('purchasePrice', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('currentValue', { valueAsNumber: true })}
                  className="w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rental */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRental"
              {...register('isRental')}
              className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="isRental" className="text-sm font-medium text-gray-700">
              This is rental equipment
            </label>
          </div>

          {isRental && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rental Supplier
                </label>
                <select
                  {...register('rentalSupplierId')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rental Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('rentalRate', { valueAsNumber: true })}
                    className="w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rental Period
                </label>
                <select
                  {...register('rentalPeriod')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {equipment ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
