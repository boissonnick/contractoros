'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLeads } from '@/lib/hooks/useLeads';
import { LeadStatus } from '@/types';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/FormField';
import { toast } from '@/components/ui/Toast';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(['website', 'referral', 'advertising', 'social', 'other']),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']),
  projectType: z.string().optional(),
  estimatedValue: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_OPTIONS = [
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Advertising', value: 'advertising' },
  { label: 'Social Media', value: 'social' },
  { label: 'Other', value: 'other' },
];

const STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Proposal Sent', value: 'proposal_sent' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

export default function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const { addLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: 'website',
      status: 'new',
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      await addLead({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        source: data.source,
        status: data.status as LeadStatus,
        projectType: data.projectType || undefined,
        estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : undefined,
        notes: data.notes || undefined,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
      });

      toast.success('Lead added successfully');
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal open={isOpen} onClose={handleClose} title="Add Lead" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormInput
          name="name"
          register={register}
          label="Name"
          required
          error={errors.name}
          placeholder="Lead's full name"
        />

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="email"
            register={register}
            label="Email"
            type="email"
            error={errors.email}
            placeholder="email@example.com"
          />

          <FormInput
            name="phone"
            register={register}
            label="Phone"
            type="tel"
            error={errors.phone}
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Company */}
        <FormInput
          name="company"
          register={register}
          label="Company"
          error={errors.company}
          placeholder="Company name (optional)"
        />

        {/* Source & Status */}
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="source"
            register={register}
            label="Source"
            error={errors.source}
            options={SOURCE_OPTIONS}
          />

          <FormSelect
            name="status"
            register={register}
            label="Status"
            error={errors.status}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Project Type & Estimated Value */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="projectType"
            register={register}
            label="Project Type"
            error={errors.projectType}
            placeholder="e.g., Kitchen Remodel"
          />

          <FormInput
            name="estimatedValue"
            register={register}
            label="Estimated Value ($)"
            type="number"
            error={errors.estimatedValue}
            placeholder="0"
          />
        </div>

        {/* Next Follow-up */}
        <FormInput
          name="nextFollowUpDate"
          register={register}
          label="Next Follow-up Date"
          type="date"
          error={errors.nextFollowUpDate}
        />

        {/* Notes */}
        <FormTextarea
          name="notes"
          register={register}
          label="Notes"
          error={errors.notes}
          placeholder="Any additional notes about this lead..."
          rows={3}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add Lead
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
