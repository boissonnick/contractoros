"use client";

import React, { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useSowTemplates, SowTemplate, SowTemplateItem, SowTemplateInput } from '@/lib/hooks/useSowTemplates';

const PROJECT_TYPES = [
  { value: 'single_room', label: 'Single Room' },
  { value: 'full_renovation', label: 'Full Renovation' },
  { value: 'addition', label: 'Addition' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

function emptyItem(order: number): SowTemplateItem {
  return {
    title: '',
    description: '',
    materials: [],
    estimatedHours: 0,
    estimatedCost: 0,
    phaseName: '',
    order,
  };
}

export function SowTemplatesTab() {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useSowTemplates();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newForm, setNewForm] = useState<SowTemplateInput>({
    name: '',
    description: '',
    projectType: 'single_room',
    items: [emptyItem(0)],
  });

  const [editForm, setEditForm] = useState<SowTemplateInput | null>(null);

  const handleCreateTemplate = async () => {
    if (!newForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const validItems = newForm.items.filter(item => item.title.trim());
    if (validItems.length === 0) {
      toast.error('Add at least one scope item');
      return;
    }

    try {
      await addTemplate({
        ...newForm,
        items: validItems.map((item, i) => ({ ...item, order: i })),
      });
      toast.success('SOW template created');
      setShowAddForm(false);
      setNewForm({
        name: '',
        description: '',
        projectType: 'single_room',
        items: [emptyItem(0)],
      });
    } catch {
      toast.error('Failed to create template');
    }
  };

  const startEditing = (template: SowTemplate) => {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      description: template.description,
      projectType: template.projectType,
      items: [...template.items].sort((a, b) => a.order - b.order),
    });
    setExpandedId(template.id);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;

    if (!editForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const validItems = editForm.items.filter(item => item.title.trim());
    if (validItems.length === 0) {
      toast.error('Add at least one scope item');
      return;
    }

    try {
      await updateTemplate(editingId, {
        ...editForm,
        items: validItems.map((item, i) => ({ ...item, order: i })),
      });
      toast.success('Template updated');
      setEditingId(null);
      setEditForm(null);
    } catch {
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SOW template? This cannot be undone.')) return;

    try {
      await deleteTemplate(id);
      toast.success('Template deleted');
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) {
        setEditingId(null);
        setEditForm(null);
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    const newName = prompt('Enter name for the duplicate:', `${name} (Copy)`);
    if (!newName) return;

    try {
      await duplicateTemplate(id, newName);
      toast.success('Template duplicated');
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const addItem = (items: SowTemplateItem[], setter: (items: SowTemplateItem[]) => void) => {
    setter([...items, emptyItem(items.length)]);
  };

  const removeItem = (items: SowTemplateItem[], index: number, setter: (items: SowTemplateItem[]) => void) => {
    setter(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  const moveItem = (items: SowTemplateItem[], index: number, dir: -1 | 1, setter: (items: SowTemplateItem[]) => void) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const next = [...items];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    setter(next.map((item, i) => ({ ...item, order: i })));
  };

  const updateItem = (
    items: SowTemplateItem[],
    index: number,
    field: keyof SowTemplateItem,
    value: string | number,
    setter: (items: SowTemplateItem[]) => void
  ) => {
    setter(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const renderItemEditor = (
    items: SowTemplateItem[],
    setter: (items: SowTemplateItem[]) => void
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Scope Items</label>
        <span className="text-xs text-gray-400">{items.filter(i => i.title.trim()).length} items</span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 mt-2 w-5 text-right">{index + 1}.</span>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(items, index, 'title', e.target.value, setter)}
                  placeholder="Item title (e.g., Demo existing kitchen)"
                  className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
                />
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(items, index, 'description', e.target.value, setter)}
                  placeholder="Description of work..."
                  rows={2}
                  className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent resize-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Est. Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.estimatedHours || ''}
                      onChange={(e) => updateItem(items, index, 'estimatedHours', parseFloat(e.target.value) || 0, setter)}
                      className="w-full text-sm px-2 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Est. Cost ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={item.estimatedCost || ''}
                      onChange={(e) => updateItem(items, index, 'estimatedCost', parseFloat(e.target.value) || 0, setter)}
                      className="w-full text-sm px-2 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Phase Name</label>
                    <input
                      type="text"
                      value={item.phaseName || ''}
                      onChange={(e) => updateItem(items, index, 'phaseName', e.target.value, setter)}
                      placeholder="e.g., Demo"
                      className="w-full text-sm px-2 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(items, index, -1, setter)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveItem(items, index, 1, setter)}
                  disabled={index === items.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeItem(items, index, setter)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Remove"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => addItem(items, setter)}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
      >
        <PlusIcon className="h-4 w-4" />
        Add Scope Item
      </button>
    </div>
  );

  const renderTemplateForm = (
    form: SowTemplateInput,
    setForm: (form: SowTemplateInput) => void,
    onSave: () => void,
    onCancel: () => void,
    isEditing: boolean
  ) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Kitchen Remodel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
          <select
            value={form.projectType}
            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of what this template covers..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent resize-none"
        />
      </div>

      {renderItemEditor(form.items, (items) => setForm({ ...form, items }))}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onSave}>
          {isEditing ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonList count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Create reusable scope of work templates for different project types
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Template
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">New SOW Template</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {renderTemplateForm(
            newForm,
            setNewForm,
            handleCreateTemplate,
            () => setShowAddForm(false),
            false
          )}
        </Card>
      )}

      {templates.length === 0 && !showAddForm ? (
        <Card className="p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No SOW templates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create templates to quickly add scope items to new projects
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => setShowAddForm(true)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create First Template
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const isExpanded = expandedId === template.id;
            const isEditing = editingId === template.id;
            const totalHours = template.items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);
            const totalCost = template.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

            return (
              <Card key={template.id} className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (isEditing) return;
                      setExpandedId(isExpanded ? null : template.id);
                    }}
                    className="flex items-center gap-3 flex-1 text-left"
                    disabled={isEditing}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.isDefault && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {PROJECT_TYPES.find(t => t.value === template.projectType)?.label || template.projectType}
                        {' · '}
                        {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {totalHours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-3.5 w-3.5" />
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>

                    {!isEditing && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDuplicate(template.id, template.name)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startEditing(template)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && !isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    )}
                    <div className="space-y-2">
                      {template.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-xs text-gray-400 mt-0.5 w-5 text-right">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              {item.estimatedHours ? (
                                <span>{item.estimatedHours}h</span>
                              ) : null}
                              {item.estimatedCost ? (
                                <span>${item.estimatedCost.toLocaleString()}</span>
                              ) : null}
                              {item.phaseName && (
                                <span className="bg-gray-200 px-1.5 py-0.5 rounded">
                                  {item.phaseName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEditing && editForm && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {renderTemplateForm(
                      editForm,
                      setEditForm,
                      handleSaveEdit,
                      cancelEdit,
                      true
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
