'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CategorySelect from './CategorySelect';
import {
  MaterialItem,
  MaterialCategory,
  MaterialStatus,
  LineItemUnit,
  LINE_ITEM_UNITS,
  Supplier,
} from '@/types';
import { logger } from '@/lib/utils/logger';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  quantityOnHand: z.number().min(0, 'Must be 0 or greater'),
  quantityReserved: z.number().min(0, 'Must be 0 or greater'),
  reorderPoint: z.number().min(0, 'Must be 0 or greater'),
  reorderQuantity: z.number().min(0, 'Must be 0 or greater'),
  unitCost: z.number().min(0, 'Must be 0 or greater'),
  markupPercent: z.number().optional(),
  defaultLocation: z.string().optional(),
  preferredSupplierId: z.string().optional(),
  preferredSupplierName: z.string().optional(),
  leadTimeDays: z.number().optional(),
  isActive: z.boolean(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

export interface MaterialFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MaterialItem, 'id' | 'orgId' | 'createdAt' | 'createdBy' | 'quantityAvailable'>) => Promise<void>;
  material?: MaterialItem;
  suppliers?: Supplier[];
}

export default function MaterialFormModal({
  open,
  onClose,
  onSubmit,
  material,
  suppliers = [],
}: MaterialFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category: '',
      customCategory: '',
      unit: 'each',
      quantityOnHand: 0,
      quantityReserved: 0,
      reorderPoint: 10,
      reorderQuantity: 25,
      unitCost: 0,
      markupPercent: 0,
      defaultLocation: '',
      preferredSupplierId: '',
      preferredSupplierName: '',
      leadTimeDays: 3,
      isActive: true,
    },
  });

  useEffect(() => {
    if (material) {
      reset({
        name: material.name,
        description: material.description || '',
        sku: material.sku || '',
        barcode: material.barcode || '',
        category: material.category,
        customCategory: (material as MaterialItem & { customCategory?: string }).customCategory || '',
        unit: material.unit,
        quantityOnHand: material.quantityOnHand,
        quantityReserved: material.quantityReserved,
        reorderPoint: material.reorderPoint,
        reorderQuantity: material.reorderQuantity,
        unitCost: material.unitCost,
        markupPercent: material.markupPercent || 0,
        defaultLocation: material.defaultLocation || '',
        preferredSupplierId: material.preferredSupplierId || '',
        preferredSupplierName: material.preferredSupplierName || '',
        leadTimeDays: material.leadTimeDays || 3,
        isActive: material.isActive,
      });
    } else {
      reset({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        category: '',
        customCategory: '',
        unit: 'each',
        quantityOnHand: 0,
        quantityReserved: 0,
        reorderPoint: 10,
        reorderQuantity: 25,
        unitCost: 0,
        markupPercent: 0,
        defaultLocation: '',
        preferredSupplierId: '',
        preferredSupplierName: '',
        leadTimeDays: 3,
        isActive: true,
      });
    }
  }, [material, reset]);

  const selectedSupplierId = watch('preferredSupplierId');

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      if (supplier) {
        setValue('preferredSupplierName', supplier.name);
      }
    } else {
      setValue('preferredSupplierName', '');
    }
  }, [selectedSupplierId, suppliers, setValue]);

  const onFormSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      // Determine status based on quantities
      let status: MaterialStatus = 'in_stock';
      if (data.quantityOnHand <= 0) {
        status = 'out_of_stock';
      } else if (data.quantityOnHand <= data.reorderPoint) {
        status = 'low_stock';
      }

      await onSubmit({
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category as MaterialCategory,
        unit: data.unit as LineItemUnit,
        quantityOnHand: data.quantityOnHand,
        quantityReserved: data.quantityReserved,
        reorderPoint: data.reorderPoint,
        reorderQuantity: data.reorderQuantity,
        unitCost: data.unitCost,
        markupPercent: data.markupPercent,
        defaultLocation: data.defaultLocation,
        preferredSupplierId: data.preferredSupplierId || undefined,
        preferredSupplierName: data.preferredSupplierName || undefined,
        leadTimeDays: data.leadTimeDays,
        status,
        isActive: data.isActive,
      });
      onClose();
    } catch (error) {
      logger.error('Error saving material', { error: error, component: 'MaterialFormModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={material ? 'Edit Material' : 'Add Material'}
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
              label="SKU"
              {...register('sku')}
              placeholder="e.g., LUM-2X4-8"
            />

            <Input
              label="Barcode"
              {...register('barcode')}
              placeholder="e.g., 012345678901"
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <CategorySelect
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  customCategory={watch('customCategory')}
                  onCustomCategoryChange={(value) => setValue('customCategory', value)}
                  error={errors.category?.message}
                />
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                {...register('unit')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {LINE_ITEM_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label} ({unit.abbr})
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Inventory</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity On Hand"
              type="number"
              {...register('quantityOnHand', { valueAsNumber: true })}
              error={errors.quantityOnHand?.message}
              min={0}
            />

            <Input
              label="Quantity Reserved"
              type="number"
              {...register('quantityReserved', { valueAsNumber: true })}
              error={errors.quantityReserved?.message}
              min={0}
            />

            <div>
              <Input
                label="Reorder Point"
                type="number"
                {...register('reorderPoint', { valueAsNumber: true })}
                error={errors.reorderPoint?.message}
                min={0}
              />
              <p className="mt-1 text-xs text-gray-500">Alert when stock falls below this</p>
            </div>

            <div>
              <Input
                label="Reorder Quantity"
                type="number"
                {...register('reorderQuantity', { valueAsNumber: true })}
                error={errors.reorderQuantity?.message}
                min={0}
              />
              <p className="mt-1 text-xs text-gray-500">Default order quantity</p>
            </div>

            <Input
              label="Default Location"
              {...register('defaultLocation')}
              placeholder="e.g., Warehouse A, Shelf B-3"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Pricing</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('unitCost', { valueAsNumber: true })}
                  min={0}
                  className="w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              {errors.unitCost?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.unitCost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Markup %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  {...register('markupPercent', { valueAsNumber: true })}
                  className="w-full pl-3 pr-7 py-2 rounded-md border border-gray-300 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              {errors.markupPercent?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.markupPercent.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Supplier */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Supplier</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Supplier
              </label>
              <select
                {...register('preferredSupplierId')}
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

            <Input
              label="Lead Time (days)"
              type="number"
              {...register('leadTimeDays', { valueAsNumber: true })}
              min={0}
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Active (show in inventory lists)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {material ? 'Save Changes' : 'Add Material'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
