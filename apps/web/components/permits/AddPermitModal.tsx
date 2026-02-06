'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePermits, PERMIT_TYPE_LABELS, PERMIT_STATUS_LABELS } from '@/lib/hooks/usePermits';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { PermitType, PermitStatus, Project } from '@/types';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormField';
import { logger } from '@/lib/utils/logger';

const permitSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  permitType: z.string().min(1, 'Permit type is required'),
  jurisdiction: z.string().min(1, 'Jurisdiction is required'),
  status: z.string().min(1, 'Status is required'),
  permitNumber: z.string().optional(),
  projectId: z.string().optional(),
  submittedDate: z.string().optional(),
  approvedDate: z.string().optional(),
  expirationDate: z.string().optional(),
  fees: z.string().optional(),
  feePaidDate: z.string().optional(),
  documentURL: z.string().url('Invalid URL').optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type PermitFormData = z.infer<typeof permitSchema>;

interface AddPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const TYPE_OPTIONS = [
  { label: 'Select type', value: '' },
  ...Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { label: 'Select status', value: '' },
  ...Object.entries(PERMIT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function AddPermitModal({ isOpen, onClose, projectId }: AddPermitModalProps) {
  const { addPermit } = usePermits();
  const { data: projectsData } = useProjects();
  const projects = (projectsData || []) as Project[];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PermitFormData>({
    resolver: zodResolver(permitSchema),
    defaultValues: {
      status: 'draft',
      projectId: projectId || '',
    },
  });

  const selectedProjectId = watch('projectId');
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const onSubmit = async (data: PermitFormData) => {
    setIsSubmitting(true);
    try {
      await addPermit({
        description: data.description,
        permitType: data.permitType as PermitType,
        jurisdiction: data.jurisdiction,
        status: data.status as PermitStatus,
        permitNumber: data.permitNumber || undefined,
        projectId: data.projectId || undefined,
        projectName: selectedProject?.name || undefined,
        submittedDate: data.submittedDate ? new Date(data.submittedDate) : undefined,
        approvedDate: data.approvedDate ? new Date(data.approvedDate) : undefined,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        fees: data.fees ? parseFloat(data.fees) : undefined,
        feePaidDate: data.feePaidDate ? new Date(data.feePaidDate) : undefined,
        documentURL: data.documentURL || undefined,
        contactName: data.contactName || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        notes: data.notes || undefined,
      });

      reset();
      onClose();
    } catch (error) {
      logger.error('Error adding permit', { error: error, component: 'AddPermitModal' });
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
    <BaseModal open={isOpen} onClose={handleClose} title="Add Permit" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Description */}
        <FormInput
          name="description"
          register={register}
          label="Description"
          required
          error={errors.description}
          placeholder="e.g., Residential Building Permit for Addition"
        />

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="permitType"
            register={register}
            label="Permit Type"
            required
            error={errors.permitType}
            options={TYPE_OPTIONS}
          />

          <FormSelect
            name="status"
            register={register}
            label="Status"
            required
            error={errors.status}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Jurisdiction & Permit Number */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="jurisdiction"
            register={register}
            label="Jurisdiction"
            required
            error={errors.jurisdiction}
            placeholder="e.g., City of Austin"
          />

          <FormInput
            name="permitNumber"
            register={register}
            label="Permit Number"
            error={errors.permitNumber}
            placeholder="Assigned permit number"
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

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4">
          <FormInput
            name="submittedDate"
            register={register}
            label="Submitted Date"
            type="date"
            error={errors.submittedDate}
          />

          <FormInput
            name="approvedDate"
            register={register}
            label="Approved Date"
            type="date"
            error={errors.approvedDate}
          />

          <FormInput
            name="expirationDate"
            register={register}
            label="Expiration Date"
            type="date"
            error={errors.expirationDate}
          />
        </div>

        {/* Fees */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="fees"
            register={register}
            label="Permit Fees ($)"
            type="number"
            error={errors.fees}
            placeholder="0.00"
          />

          <FormInput
            name="feePaidDate"
            register={register}
            label="Fee Paid Date"
            type="date"
            error={errors.feePaidDate}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-3 gap-4">
          <FormInput
            name="contactName"
            register={register}
            label="Contact Name"
            error={errors.contactName}
            placeholder="Inspector or contact"
          />

          <FormInput
            name="contactPhone"
            register={register}
            label="Contact Phone"
            type="tel"
            error={errors.contactPhone}
          />

          <FormInput
            name="contactEmail"
            register={register}
            label="Contact Email"
            type="email"
            error={errors.contactEmail}
          />
        </div>

        {/* Document URL */}
        <FormInput
          name="documentURL"
          register={register}
          label="Document URL"
          type="url"
          error={errors.documentURL}
          placeholder="Link to permit document"
        />

        {/* Notes */}
        <FormTextarea
          name="notes"
          register={register}
          label="Notes"
          error={errors.notes}
          placeholder="Additional notes about the permit"
          rows={3}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add Permit
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
