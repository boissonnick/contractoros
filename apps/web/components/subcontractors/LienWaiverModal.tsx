'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { logger } from '@/lib/utils/logger';
type APWaiverType = 'conditional' | 'unconditional';

const lienWaiverSchema = z.object({
  waiverType: z.enum(['conditional', 'unconditional']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

type LienWaiverFormInput = z.input<typeof lienWaiverSchema>;
type LienWaiverFormOutput = z.output<typeof lienWaiverSchema>;

interface LienWaiverModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (waiverType: APWaiverType, amount: number) => Promise<void>;
  invoiceAmount?: number;
  vendorName?: string;
  projectName?: string;
}

const WAIVER_OPTIONS: {
  value: APWaiverType;
  label: string;
  description: string;
}[] = [
  {
    value: 'conditional',
    label: 'Conditional',
    description:
      'The claimant has not been paid. Waiver is conditional upon receipt of payment.',
  },
  {
    value: 'unconditional',
    label: 'Unconditional',
    description:
      'The claimant has been paid. This is a final, unconditional waiver.',
  },
];

export default function LienWaiverModal({
  open,
  onClose,
  onSubmit,
  invoiceAmount,
  vendorName,
  projectName,
}: LienWaiverModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LienWaiverFormInput, unknown, LienWaiverFormOutput>({
    resolver: zodResolver(lienWaiverSchema),
    defaultValues: {
      waiverType: 'conditional',
      amount: invoiceAmount ?? 0,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        waiverType: 'conditional',
        amount: invoiceAmount ?? 0,
      });
    }
  }, [open, invoiceAmount, reset]);

  const selectedType = watch('waiverType');

  const handleFormSubmit = async (data: LienWaiverFormOutput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.waiverType, data.amount);
      reset();
      onClose();
    } catch (error) {
      logger.error('Error requesting lien waiver', { error: error, component: 'LienWaiverModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Request Lien Waiver"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="lien-waiver-form"
            loading={isSubmitting}
          >
            Request Waiver
          </Button>
        </div>
      }
    >
      <form
        id="lien-waiver-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-5"
      >
        {/* Context section */}
        {(vendorName || projectName) && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Request lien waiver
              {vendorName && (
                <>
                  {' '}from <span className="font-medium text-gray-900">{vendorName}</span>
                </>
              )}
              {projectName && (
                <>
                  {' '}for <span className="font-medium text-gray-900">{projectName}</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Waiver type radio buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waiver Type
          </label>
          <div className="space-y-3">
            {WAIVER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedType === option.value
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('waiverType')}
                  className="mt-0.5 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    {option.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
          {errors.waiverType && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.waiverType.message}
            </p>
          )}
        </div>

        {/* Amount input with $ prefix */}
        <Input
          id="lien-waiver-amount"
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.amount?.message}
          icon={<span className="text-gray-400 text-sm">$</span>}
          iconPosition="left"
          {...register('amount')}
        />
      </form>
    </BaseModal>
  );
}
