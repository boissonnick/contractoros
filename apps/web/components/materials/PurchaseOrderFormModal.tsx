'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  MaterialPurchaseOrder,
  MaterialPurchaseOrderLineItem,
  Supplier,
  MaterialItem,
  LINE_ITEM_UNITS,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/utils/logger';

const lineItemSchema = z.object({
  id: z.string(),
  materialId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  quantityOrdered: z.number().min(1, 'Must order at least 1'),
  quantityReceived: z.number().min(0),
  unitCost: z.number().min(0, 'Cost must be 0 or greater'),
  totalCost: z.number(),
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierName: z.string(),
  supplierContact: z.string().optional(),
  supplierEmail: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  shipToLocation: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().optional(),
  shippingCost: z.number().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export interface PurchaseOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<MaterialPurchaseOrder, 'id' | 'orgId' | 'orderNumber' | 'createdAt' | 'createdBy'>
  ) => Promise<void>;
  order?: MaterialPurchaseOrder;
  suppliers: Supplier[];
  materials?: MaterialItem[];
  projects?: { id: string; name: string }[];
}

export default function PurchaseOrderFormModal({
  open,
  onClose,
  onSubmit,
  order,
  suppliers,
  materials = [],
  projects = [],
}: PurchaseOrderFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      supplierName: '',
      supplierContact: '',
      supplierEmail: '',
      projectId: '',
      projectName: '',
      shipToLocation: '',
      expectedDeliveryDate: '',
      notes: '',
      lineItems: [],
      taxRate: 0,
      shippingCost: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const lineItems = watch('lineItems');
  const taxRate = watch('taxRate') || 0;
  const shippingCost = watch('shippingCost') || 0;
  const supplierId = watch('supplierId');
  const projectId = watch('projectId');

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount + shippingCost;

  useEffect(() => {
    if (order) {
      reset({
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        supplierContact: order.supplierContact || '',
        supplierEmail: order.supplierEmail || '',
        projectId: order.projectId || '',
        projectName: order.projectName || '',
        shipToLocation: order.shipToLocation || '',
        expectedDeliveryDate: order.expectedDeliveryDate
          ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
          : '',
        notes: order.notes || '',
        lineItems: order.lineItems.map((item) => ({
          ...item,
          quantityReceived: item.quantityReceived || 0,
        })),
        taxRate: order.taxRate || 0,
        shippingCost: order.shippingCost || 0,
      });
    } else {
      reset({
        supplierId: '',
        supplierName: '',
        supplierContact: '',
        supplierEmail: '',
        projectId: '',
        projectName: '',
        shipToLocation: '',
        expectedDeliveryDate: '',
        notes: '',
        lineItems: [],
        taxRate: 0,
        shippingCost: 0,
      });
    }
  }, [order, reset]);

  // Update supplier info when selected
  useEffect(() => {
    if (supplierId) {
      const supplier = suppliers.find((s) => s.id === supplierId);
      if (supplier) {
        setValue('supplierName', supplier.name);
        setValue('supplierContact', supplier.contactName || '');
        setValue('supplierEmail', supplier.email || '');
      }
    }
  }, [supplierId, suppliers, setValue]);

  // Update project name when selected
  useEffect(() => {
    if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setValue('projectName', project.name);
      }
    } else {
      setValue('projectName', '');
    }
  }, [projectId, projects, setValue]);

  // Add material to line items
  const addMaterial = () => {
    if (!selectedMaterialId) return;

    const material = materials.find((m) => m.id === selectedMaterialId);
    if (!material) return;

    append({
      id: uuidv4(),
      materialId: material.id,
      name: material.name,
      description: material.description || '',
      sku: material.sku || '',
      unit: material.unit,
      quantityOrdered: material.reorderQuantity || 1,
      quantityReceived: 0,
      unitCost: material.lastPurchasePrice || material.unitCost,
      totalCost: (material.reorderQuantity || 1) * (material.lastPurchasePrice || material.unitCost),
    });

    setSelectedMaterialId('');
  };

  // Add blank line item
  const addBlankItem = () => {
    append({
      id: uuidv4(),
      materialId: '',
      name: '',
      description: '',
      sku: '',
      unit: 'each',
      quantityOrdered: 1,
      quantityReceived: 0,
      unitCost: 0,
      totalCost: 0,
    });
  };

  // Update line item total when quantity or cost changes
  const updateLineItemTotal = (index: number, quantity: number, unitCost: number) => {
    setValue(`lineItems.${index}.totalCost`, quantity * unitCost);
  };

  const onFormSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        status: order?.status || 'draft',
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        supplierContact: data.supplierContact,
        supplierEmail: data.supplierEmail,
        projectId: data.projectId || undefined,
        projectName: data.projectName || undefined,
        shipToLocation: data.shipToLocation,
        lineItems: data.lineItems as MaterialPurchaseOrderLineItem[],
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        shippingCost: data.shippingCost,
        total,
        orderDate: order?.orderDate || new Date(),
        expectedDeliveryDate: data.expectedDeliveryDate
          ? new Date(data.expectedDeliveryDate)
          : undefined,
        notes: data.notes,
      });
      onClose();
    } catch (error) {
      logger.error('Error saving purchase order', { error: error, component: 'PurchaseOrderFormModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={order ? 'Edit Purchase Order' : 'New Purchase Order'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Supplier & Project */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              {...register('supplierId')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">Select a supplier...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplierId && (
              <p className="mt-1 text-sm text-red-600">{errors.supplierId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project (optional)
            </label>
            <select
              {...register('projectId')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Ship To Location"
            {...register('shipToLocation')}
            placeholder="e.g., Warehouse, Job Site"
          />

          <Input
            label="Expected Delivery Date"
            type="date"
            {...register('expectedDeliveryDate')}
          />
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Line Items</h3>
            <div className="flex items-center gap-2">
              {materials.length > 0 && (
                <>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
                  >
                    <option value="">Select material...</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.sku || 'No SKU'})
                      </option>
                    ))}
                  </select>
                  <Button type="button" size="sm" variant="secondary" onClick={addMaterial}>
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Material
                  </Button>
                </>
              )}
              <Button type="button" size="sm" variant="secondary" onClick={addBlankItem}>
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No items added yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Add materials from inventory or create custom items
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Item</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 w-20">Unit</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 w-24">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 w-28">
                      Unit Cost
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 w-28">Total</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="px-3 py-2">
                        <input
                          {...register(`lineItems.${index}.name`)}
                          className="w-full border-0 bg-transparent p-0 focus:ring-0 text-sm"
                          placeholder="Item name"
                        />
                        <input
                          {...register(`lineItems.${index}.sku`)}
                          className="w-full border-0 bg-transparent p-0 focus:ring-0 text-xs text-gray-400"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          {...register(`lineItems.${index}.unit`)}
                          className="w-full border-0 bg-transparent p-0 focus:ring-0 text-sm"
                        >
                          {LINE_ITEM_UNITS.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.abbr}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          {...register(`lineItems.${index}.quantityOrdered`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              const qty = parseFloat(e.target.value) || 0;
                              const cost = lineItems[index]?.unitCost || 0;
                              updateLineItemTotal(index, qty, cost);
                            },
                          })}
                          className="w-full border-0 bg-transparent p-0 focus:ring-0 text-sm text-right"
                          min={1}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end">
                          <span className="text-gray-400 mr-1">$</span>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`lineItems.${index}.unitCost`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const cost = parseFloat(e.target.value) || 0;
                                const qty = lineItems[index]?.quantityOrdered || 0;
                                updateLineItemTotal(index, qty, cost);
                              },
                            })}
                            className="w-20 border-0 bg-transparent p-0 focus:ring-0 text-sm text-right"
                            min={0}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        ${(lineItems[index]?.totalCost || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {errors.lineItems && (
            <p className="text-sm text-red-600">{errors.lineItems.message}</p>
          )}
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tax:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  {...register('taxRate', { valueAsNumber: true })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                  placeholder="0"
                />
                <span className="text-gray-400">%</span>
                <span className="font-medium ml-2">${taxAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Shipping:</span>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('shippingCost', { valueAsNumber: true })}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-base">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            placeholder="Order notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {order ? 'Save Changes' : 'Create Order'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
