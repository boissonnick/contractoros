"use client";

import React, { useState } from 'react';
import { ScopeItem, ScopeMaterial, ProjectPhase, QuoteSection } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ScopeItemFormProps {
  initialData?: ScopeItem;
  phases: ProjectPhase[];
  quoteSections: QuoteSection[];
  onSubmit: (item: ScopeItem) => void;
  onCancel: () => void;
}

export default function ScopeItemForm({ initialData, phases, quoteSections, onSubmit, onCancel }: ScopeItemFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [specifications, setSpecifications] = useState(initialData?.specifications || '');
  const [laborDescription, setLaborDescription] = useState(initialData?.laborDescription || '');
  const [estimatedHours, setEstimatedHours] = useState(initialData?.estimatedHours?.toString() || '');
  const [estimatedCost, setEstimatedCost] = useState(initialData?.estimatedCost?.toString() || '');
  const [phaseId, setPhaseId] = useState(initialData?.phaseId || '');
  const [quoteSectionId, setQuoteSectionId] = useState(initialData?.quoteSectionId || '');
  const [materials, setMaterials] = useState<ScopeMaterial[]>(initialData?.materials || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      id: initialData?.id || Date.now().toString(),
      phaseId: phaseId || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      specifications: specifications.trim() || undefined,
      materials,
      laborDescription: laborDescription.trim() || undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      quoteSectionId: quoteSectionId || undefined,
      order: initialData?.order ?? 0,
    });
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: '', quantity: undefined, unit: undefined, estimatedCost: undefined }]);
  };

  const updateMaterial = (index: number, field: keyof ScopeMaterial, value: string) => {
    const updated = [...materials];
    if (field === 'name' || field === 'unit') {
      updated[index] = { ...updated[index], [field]: value };
    } else {
      updated[index] = { ...updated[index], [field]: value ? parseFloat(value) : undefined };
    }
    setMaterials(updated);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      <Textarea label="Specifications" value={specifications} onChange={(e) => setSpecifications(e.target.value)} rows={2} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
          <select
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No phase</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Linked Quote Section</label>
          <select
            value={quoteSectionId}
            onChange={(e) => setQuoteSectionId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {quoteSections.map((qs) => (
              <option key={qs.id} value={qs.id}>{qs.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Textarea label="Labor Description" value={laborDescription} onChange={(e) => setLaborDescription(e.target.value)} rows={2} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Estimated Hours" type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} min={0} step="0.5" />
        <Input label="Estimated Cost ($)" type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} min={0} step="0.01" />
      </div>

      {/* Materials */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Materials</label>
          <Button variant="secondary" size="sm" type="button" onClick={addMaterial} icon={<PlusIcon className="h-3.5 w-3.5" />}>
            Add Material
          </Button>
        </div>
        {materials.length === 0 && (
          <p className="text-xs text-gray-400">No materials added.</p>
        )}
        <div className="space-y-2">
          {materials.map((mat, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input value={mat.name} onChange={(e) => updateMaterial(i, 'name', e.target.value)} placeholder="Material name" className="flex-1" />
              <Input value={mat.quantity?.toString() || ''} onChange={(e) => updateMaterial(i, 'quantity', e.target.value)} placeholder="Qty" type="number" className="w-20" />
              <Input value={mat.unit || ''} onChange={(e) => updateMaterial(i, 'unit', e.target.value)} placeholder="Unit" className="w-20" />
              <Input value={mat.estimatedCost?.toString() || ''} onChange={(e) => updateMaterial(i, 'estimatedCost', e.target.value)} placeholder="Cost" type="number" className="w-24" />
              <button type="button" onClick={() => removeMaterial(i)} className="p-2 text-gray-400 hover:text-red-500 mt-1">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={!title.trim()}>
          {initialData ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}
