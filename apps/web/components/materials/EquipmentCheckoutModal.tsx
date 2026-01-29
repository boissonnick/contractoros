'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { EquipmentItem, EquipmentCheckout } from '@/types';

// Checkout schema
const checkoutSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  location: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  notes: z.string().optional(),
});

// Return schema
const returnSchema = z.object({
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
type ReturnFormData = z.infer<typeof returnSchema>;

export interface EquipmentCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  equipment: EquipmentItem;
  mode: 'checkout' | 'return';
  projects?: { id: string; name: string }[];
  onCheckout: (projectId?: string, projectName?: string, notes?: string) => Promise<void>;
  onReturn: (condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged', notes?: string) => Promise<void>;
}

export default function EquipmentCheckoutModal({
  open,
  onClose,
  equipment,
  mode,
  projects = [],
  onCheckout,
  onReturn,
}: EquipmentCheckoutModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout form
  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      projectId: '',
      projectName: '',
      location: '',
      expectedReturnDate: '',
      notes: '',
    },
  });

  // Return form
  const returnForm = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      condition: equipment.condition || 'good',
      notes: '',
    },
  });

  const handleCheckout = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    try {
      const project = projects.find((p) => p.id === data.projectId);
      await onCheckout(
        data.projectId || undefined,
        project?.name || data.projectName || undefined,
        data.notes || undefined
      );
      onClose();
    } catch (error) {
      console.error('Error checking out equipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (data: ReturnFormData) => {
    setIsSubmitting(true);
    try {
      await onReturn(data.condition, data.notes || undefined);
      onClose();
    } catch (error) {
      console.error('Error returning equipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'checkout' ? 'Check Out Equipment' : 'Return Equipment'}
      size="md"
    >
      {/* Equipment Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          {equipment.imageUrl ? (
            <img
              src={equipment.imageUrl}
              alt={equipment.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{equipment.name}</h3>
            {equipment.serialNumber && (
              <p className="text-sm text-gray-500">SN: {equipment.serialNumber}</p>
            )}
            {equipment.make && equipment.model && (
              <p className="text-sm text-gray-500">
                {equipment.make} {equipment.model}
              </p>
            )}
          </div>
        </div>
      </div>

      {mode === 'checkout' ? (
        <form onSubmit={checkoutForm.handleSubmit(handleCheckout)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Project
            </label>
            <select
              {...checkoutForm.register('projectId')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">No project (personal use)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Location"
            {...checkoutForm.register('location')}
            placeholder="Where will this be used?"
          />

          <Input
            label="Expected Return Date"
            type="date"
            {...checkoutForm.register('expectedReturnDate')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...checkoutForm.register('notes')}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="Any notes about this checkout..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Check Out
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={returnForm.handleSubmit(handleReturn)} className="space-y-4">
          {/* Current checkout info */}
          {equipment.checkedOutToName && (
            <div className="p-3 bg-amber-50 rounded-md text-sm">
              <p className="text-amber-800">
                Checked out to: <strong>{equipment.checkedOutToName}</strong>
              </p>
              {equipment.currentProjectName && (
                <p className="text-amber-700">Project: {equipment.currentProjectName}</p>
              )}
              {equipment.checkedOutAt && (
                <p className="text-amber-600">
                  Since: {new Date(equipment.checkedOutAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return Condition <span className="text-red-500">*</span>
            </label>
            <select
              {...returnForm.register('condition')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="excellent">Excellent - Like new</option>
              <option value="good">Good - Normal wear</option>
              <option value="fair">Fair - Shows wear</option>
              <option value="poor">Poor - Needs attention</option>
              <option value="damaged">Damaged - Needs repair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Notes</label>
            <textarea
              {...returnForm.register('notes')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="Any issues or notes about the condition..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Return Equipment
            </Button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
