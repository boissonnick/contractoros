"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScopeChange, ScopeChangeType, ChangeOrderImpact, ProjectPhase } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { changeOrderSchema, type ChangeOrderFormData } from '@/lib/validations';

interface ChangeOrderFormProps {
  phases: ProjectPhase[];
  onSubmit: (data: {
    title: string;
    description: string;
    reason: string;
    scopeChanges: ScopeChange[];
    impact: ChangeOrderImpact;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ChangeOrderForm({ phases, onSubmit, onCancel }: ChangeOrderFormProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof changeOrderSchema>, unknown, ChangeOrderFormData>({
    resolver: zodResolver(changeOrderSchema),
    defaultValues: {
      title: '',
      description: '',
      reason: '',
      scopeChanges: [],
      costImpact: 0,
      scheduleImpact: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'scopeChanges',
  });

  const watchedScopeChanges = watch('scopeChanges');
  const calculatedCost = watchedScopeChanges?.reduce(
    (sum, sc) => sum + (parseFloat(String(sc.costImpact)) || 0),
    0
  ) || 0;

  const onFormSubmit = async (data: ChangeOrderFormData) => {
    setSaving(true);
    try {
      const scopeChanges: ScopeChange[] = data.scopeChanges.map((sc, i) => ({
        id: Date.now().toString() + i,
        type: sc.type as ScopeChangeType,
        phaseId: sc.phaseId || undefined,
        originalDescription: sc.originalDescription || undefined,
        proposedDescription: sc.proposedDescription,
        costImpact: sc.costImpact,
      }));

      const affectedPhaseIds = Array.from(
        new Set(scopeChanges.filter((sc) => sc.phaseId).map((sc) => sc.phaseId!))
      );

      await onSubmit({
        title: data.title,
        description: data.description,
        reason: data.reason,
        scopeChanges,
        impact: {
          costChange: data.costImpact || calculatedCost,
          scheduleChange: data.scheduleImpact,
          affectedPhaseIds,
          affectedTaskIds: [],
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Input
        label="Title"
        {...register('title')}
        error={errors.title?.message}
        placeholder="e.g. Add master bath shower upgrade"
      />
      <Textarea
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        rows={3}
      />
      <Textarea
        label="Reason for Change"
        {...register('reason')}
        error={errors.reason?.message}
        rows={2}
        placeholder="Client request, unforeseen condition, etc."
      />

      {/* Scope Changes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Scope Changes</label>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() =>
              append({
                type: 'add',
                phaseId: '',
                originalDescription: '',
                proposedDescription: '',
                costImpact: 0,
              })
            }
            icon={<PlusIcon className="h-3.5 w-3.5" />}
          >
            Add Change
          </Button>
        </div>
        {errors.scopeChanges?.message && (
          <p className="text-sm text-red-600 mb-2">{errors.scopeChanges.message}</p>
        )}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  {...register(`scopeChanges.${index}.type`)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-28"
                >
                  <option value="add">Add</option>
                  <option value="remove">Remove</option>
                  <option value="modify">Modify</option>
                </select>
                <select
                  {...register(`scopeChanges.${index}.phaseId`)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1"
                >
                  <option value="">No phase</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              {watchedScopeChanges?.[index]?.type === 'modify' && (
                <Input
                  {...register(`scopeChanges.${index}.originalDescription`)}
                  placeholder="Original scope description"
                />
              )}
              <Input
                {...register(`scopeChanges.${index}.proposedDescription`)}
                error={errors.scopeChanges?.[index]?.proposedDescription?.message}
                placeholder="Proposed change description"
              />
              <Input
                type="number"
                {...register(`scopeChanges.${index}.costImpact`)}
                error={errors.scopeChanges?.[index]?.costImpact?.message}
                placeholder="Cost impact ($)"
                step="0.01"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Impact summary */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Total Cost Impact ($)"
          type="number"
          {...register('costImpact')}
          error={errors.costImpact?.message}
          placeholder={calculatedCost.toString()}
          step="0.01"
        />
        <Input
          label="Schedule Impact (days)"
          type="number"
          {...register('scheduleImpact')}
          error={errors.scheduleImpact?.message}
          placeholder="e.g. 5 or -2"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={saving}>
          {saving ? 'Creating...' : 'Create Change Order'}
        </Button>
      </div>
    </form>
  );
}
