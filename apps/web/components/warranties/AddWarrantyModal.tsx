'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWarranties } from '@/lib/hooks/useWarranties';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormField';
import { Project } from '@/types';

const warrantySchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  warrantyNumber: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  projectId: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  documentURL: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type WarrantyFormData = z.infer<typeof warrantySchema>;

interface AddWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const CATEGORY_OPTIONS = [
  { label: 'Select category', value: '' },
  { label: 'Appliances', value: 'Appliances' },
  { label: 'Roofing', value: 'Roofing' },
  { label: 'HVAC', value: 'HVAC' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Windows & Doors', value: 'Windows & Doors' },
  { label: 'Flooring', value: 'Flooring' },
  { label: 'Siding', value: 'Siding' },
  { label: 'Foundation', value: 'Foundation' },
  { label: 'Structural', value: 'Structural' },
  { label: 'Labor', value: 'Labor' },
  { label: 'Other', value: 'Other' },
];

export default function AddWarrantyModal({ isOpen, onClose, projectId }: AddWarrantyModalProps) {
  const { addWarranty } = useWarranties();
  const { data: projectsData } = useProjects();
  const projects = (projectsData || []) as Project[];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantySchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      projectId: projectId || '',
    },
  });

  const selectedProjectId = watch('projectId');
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const onSubmit = async (data: WarrantyFormData) => {
    setIsSubmitting(true);
    try {
      await addWarranty({
        itemName: data.itemName,
        category: data.category || undefined,
        manufacturer: data.manufacturer || undefined,
        warrantyNumber: data.warrantyNumber || undefined,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        projectId: data.projectId || undefined,
        projectName: selectedProject?.name || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        documentURL: data.documentURL || undefined,
        notes: data.notes || undefined,
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Error adding warranty:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const projectOptions = [
    { label: 'No project', value: '' },
    ...projects.map((p) => ({ label: p.name, value: p.id })),
  ];

  return (
    <BaseModal open={isOpen} onClose={handleClose} title="Add Warranty" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Item Name */}
        <FormInput
          name="itemName"
          register={register}
          label="Item Name"
          required
          error={errors.itemName}
          placeholder="e.g., Kitchen Refrigerator, Roof Shingles"
        />

        {/* Category & Manufacturer */}
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="category"
            register={register}
            label="Category"
            error={errors.category}
            options={CATEGORY_OPTIONS}
          />

          <FormInput
            name="manufacturer"
            register={register}
            label="Manufacturer"
            error={errors.manufacturer}
            placeholder="e.g., Samsung, GAF"
          />
        </div>

        {/* Warranty Number */}
        <FormInput
          name="warrantyNumber"
          register={register}
          label="Warranty Number"
          error={errors.warrantyNumber}
          placeholder="Reference number from warranty document"
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="startDate"
            register={register}
            label="Start Date"
            type="date"
            required
            error={errors.startDate}
          />

          <FormInput
            name="endDate"
            register={register}
            label="End Date"
            type="date"
            required
            error={errors.endDate}
          />
        </div>

        {/* Project */}
        <FormSelect
          name="projectId"
          register={register}
          label="Project"
          error={errors.projectId}
          options={projectOptions}
        />

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="contactPhone"
            register={register}
            label="Contact Phone"
            type="tel"
            error={errors.contactPhone}
            placeholder="Warranty support phone"
          />

          <FormInput
            name="contactEmail"
            register={register}
            label="Contact Email"
            type="email"
            error={errors.contactEmail}
            placeholder="Warranty support email"
          />
        </div>

        {/* Document URL */}
        <FormInput
          name="documentURL"
          register={register}
          label="Document URL"
          type="url"
          error={errors.documentURL}
          placeholder="Link to warranty document"
        />

        {/* Notes */}
        <FormTextarea
          name="notes"
          register={register}
          label="Notes"
          error={errors.notes}
          placeholder="Additional notes about the warranty"
          rows={3}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add Warranty
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
