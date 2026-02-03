"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, Input, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import BaseModal from '@/components/ui/BaseModal';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';

// SOW Templates imports
import { useSowTemplates, SowTemplate, SowTemplateItem, SowTemplateInput } from '@/lib/hooks/useSowTemplates';

// Quote Templates imports
import { QuoteTemplateFormModal, QuoteTemplateCard } from '@/components/quotetemplates';
import { useQuoteTemplates } from '@/lib/hooks/useQuoteTemplates';
import { QuotePdfTemplate } from '@/types';

// Email Templates imports
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { EmailTemplate, EmailTemplateFormData } from '@/lib/email/types';
import { extractVariables } from '@/lib/email/template-engine';
import { invoiceDueTemplate } from '@/lib/email/templates/invoice-due';
import { TemplateEditor } from '@/components/email/TemplateEditor';

// SMS Templates imports
import { SmsTemplate, SmsTemplateType, SmsTemplateVariable } from '@/types';
import {
  getTemplateTypeLabel,
  getDefaultTemplateVariables,
  getDefaultTemplate,
  calculateSmsSegments,
  parseTemplateVariables,
} from '@/lib/sms/smsUtils';

// Line Items imports
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  ResponsiveTableWrapper,
  MobileTableCard,
  MobileTableRow,
} from '@/components/ui';
import { useLineItems } from '@/lib/hooks/useLineItems';
import {
  LineItem,
  LineItemTrade,
  LineItemUnit,
  LINE_ITEM_TRADES,
  LINE_ITEM_UNITS,
} from '@/types';
import {
  MagnifyingGlassIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type TabType = 'quotes' | 'sow' | 'email' | 'sms' | 'line-items';

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'quotes', label: 'Quote PDF', icon: DocumentTextIcon },
  { id: 'sow', label: 'SOW', icon: RectangleStackIcon },
  { id: 'email', label: 'Email', icon: EnvelopeIcon },
  { id: 'sms', label: 'SMS', icon: ChatBubbleLeftRightIcon },
  { id: 'line-items', label: 'Line Items', icon: Squares2X2Icon },
];

// ============================================================================
// SOW Templates Tab
// ============================================================================

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

function SowTemplatesTab() {
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
                  className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(items, index, 'description', e.target.value, setter)}
                  placeholder="Description of work..."
                  rows={2}
                  className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
          <select
            value={form.projectType}
            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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

// ============================================================================
// Quote Templates Tab
// ============================================================================

function QuoteTemplatesTab() {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
  } = useQuoteTemplates();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuotePdfTemplate | undefined>(undefined);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (template: QuotePdfTemplate) => {
    setEditingTemplate(template);
    setMode('edit');
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<QuotePdfTemplate>) => {
    try {
      if (mode === 'edit' && editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
        toast.success('Template updated successfully');
      } else {
        await createTemplate(data);
        toast.success('Template created successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save template');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTemplate(id);
      toast.success('Template deleted successfully');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    try {
      await duplicateTemplate(id, `${template.name} (Copy)`);
      toast.success('Template duplicated successfully');
    } catch (err) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTemplate(id);
      toast.success('Default template updated');
    } catch (err) {
      toast.error('Failed to set default template');
    }
  };

  if (loading) {
    return <SkeletonList count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Customize the look and feel of your estimate PDFs with branded templates
        </p>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
          title="No quote templates yet"
          description="Create your first template to customize how your estimate PDFs look. You can set brand colors, fonts, and default content."
          action={{
            label: 'Create Template',
            onClick: handleCreate,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <QuoteTemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips for Great Quote Templates</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Use your brand colors to make estimates instantly recognizable</li>
          <li>Include default payment terms to save time on each estimate</li>
          <li>Set up standard terms and conditions once, use them everywhere</li>
          <li>The default template will be automatically selected for new estimates</li>
        </ul>
      </div>

      <QuoteTemplateFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        template={editingTemplate}
        mode={mode}
      />
    </div>
  );
}

// ============================================================================
// Email Templates Tab
// ============================================================================

function EmailTemplatesTab() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'organizations', orgId, 'emailTemplates'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const docData = d.data();
          return {
            id: d.id,
            name: docData.name,
            subject: docData.subject,
            body: docData.body,
            variables: docData.variables || extractVariables(docData.subject + ' ' + docData.body),
            createdAt: docData.createdAt?.toDate() || new Date(),
            updatedAt: docData.updatedAt?.toDate() || new Date(),
          } as EmailTemplate;
        });
        setTemplates(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading email templates:', err);
        toast.error('Failed to load templates');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  const handleOpenEditor = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
    } else {
      setEditingTemplate(null);
    }
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async (data: EmailTemplateFormData) => {
    if (!orgId) {
      toast.error('Organization not found');
      return;
    }

    setSaving(true);

    try {
      const variables = extractVariables(data.subject + ' ' + data.body);

      if (editingTemplate) {
        await updateDoc(
          doc(db, 'organizations', orgId, 'emailTemplates', editingTemplate.id),
          {
            name: data.name,
            subject: data.subject,
            body: data.body,
            variables,
            updatedAt: serverTimestamp(),
          }
        );
        toast.success('Template updated');
      } else {
        await addDoc(collection(db, 'organizations', orgId, 'emailTemplates'), {
          name: data.name,
          subject: data.subject,
          body: data.body,
          variables,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success('Template created');
      }

      handleCloseEditor();
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!orgId || !templateToDelete) return;

    try {
      await deleteDoc(
        doc(db, 'organizations', orgId, 'emailTemplates', templateToDelete.id)
      );
      toast.success('Template deleted');
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    if (!orgId) return;

    try {
      await addDoc(collection(db, 'organizations', orgId, 'emailTemplates'), {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Template duplicated');
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error('Failed to duplicate template');
    }
  };

  const handleCreateDefault = async () => {
    if (!orgId) return;

    try {
      await addDoc(collection(db, 'organizations', orgId, 'emailTemplates'), {
        ...invoiceDueTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Default template created');
    } catch (err) {
      console.error('Error creating default template:', err);
      toast.error('Failed to create template');
    }
  };

  if (loading) {
    return <SkeletonList count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Create and manage reusable email templates
        </p>
        <div className="flex items-center gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={handleCreateDefault}>
              Create Default
            </Button>
          )}
          <Button onClick={() => handleOpenEditor()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<EnvelopeIcon className="h-full w-full" />}
          title="No email templates yet"
          description="Create email templates to streamline your client communications"
          action={{
            label: 'Create Template',
            onClick: () => handleOpenEditor(),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditor(template)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTemplateToDelete(template);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 text-red-400"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Subject:</p>
                <p className="text-sm text-gray-700 line-clamp-1">{template.subject}</p>
                <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Body:</p>
                <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
              </div>

              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 4).map((variable) => (
                    <Badge key={variable} className="bg-gray-100 text-gray-600 text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                  {template.variables.length > 4 && (
                    <span className="text-xs text-gray-400">
                      +{template.variables.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <TemplateEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        onSubmit={handleSaveTemplate}
        initialData={
          editingTemplate
            ? {
                name: editingTemplate.name,
                subject: editingTemplate.subject,
                body: editingTemplate.body,
              }
            : undefined
        }
        title={editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        loading={saving}
      />

      <BaseModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTemplateToDelete(null);
        }}
        title="Delete Template"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTemplateToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This
          action cannot be undone.
        </p>
      </BaseModal>
    </div>
  );
}

// ============================================================================
// SMS Templates Tab
// ============================================================================

const SMS_TEMPLATE_TYPES: { value: SmsTemplateType; label: string; description: string }[] = [
  { value: 'payment_reminder', label: 'Payment Reminder', description: 'Remind clients about upcoming or overdue payments' },
  { value: 'payment_received', label: 'Payment Received', description: 'Confirm payment has been received' },
  { value: 'schedule_update', label: 'Schedule Update', description: 'Notify about schedule changes' },
  { value: 'project_update', label: 'Project Update', description: 'Share project progress updates' },
  { value: 'invoice_sent', label: 'Invoice Sent', description: 'Notify when invoice is sent' },
  { value: 'document_ready', label: 'Document Ready', description: 'Alert when documents are ready' },
  { value: 'task_assigned', label: 'Task Assigned', description: 'Notify about new task assignments' },
  { value: 'custom', label: 'Custom', description: 'Create your own template' },
];

interface SmsTemplateFormData {
  name: string;
  description: string;
  type: SmsTemplateType;
  body: string;
  isDefault: boolean;
}

function SmsTemplatesTab() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<SmsTemplate | null>(null);

  const [formData, setFormData] = useState<SmsTemplateFormData>({
    name: '',
    description: '',
    type: 'custom',
    body: '',
    isDefault: false,
  });

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'smsTemplates'),
      where('orgId', '==', orgId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const docData = d.data();
          return {
            id: d.id,
            ...docData,
            createdAt: docData.createdAt?.toDate() || new Date(),
            updatedAt: docData.updatedAt?.toDate(),
          } as SmsTemplate;
        });
        setTemplates(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading templates:', err);
        toast.error('Failed to load templates');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  const smsInfo = calculateSmsSegments(formData.body);
  const detectedVariables = parseTemplateVariables(formData.body);

  const handleOpenModal = (template?: SmsTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        body: template.body,
        isDefault: template.isDefault || false,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: 'custom',
        body: '',
        isDefault: false,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      body: '',
      isDefault: false,
    });
  };

  const handleTypeChange = (type: SmsTemplateType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      body: prev.body || getDefaultTemplate(type),
    }));
  };

  const handleUseDefaultTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      body: getDefaultTemplate(prev.type),
    }));
  };

  const handleSave = async () => {
    if (!orgId || !profile?.uid) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!formData.body.trim()) {
      toast.error('Template body is required');
      return;
    }

    try {
      const variables: SmsTemplateVariable[] = detectedVariables.map((name) => {
        const defaultVars = getDefaultTemplateVariables(formData.type);
        const existing = defaultVars.find((v) => v.name === name);
        return existing || { name, description: '', required: false };
      });

      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        body: formData.body,
        variables,
        isDefault: formData.isDefault,
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'smsTemplates', editingTemplate.id), templateData);
        toast.success('Template updated');
      } else {
        await addDoc(collection(db, 'smsTemplates'), {
          ...templateData,
          orgId,
          createdBy: profile.uid,
          createdAt: serverTimestamp(),
        });
        toast.success('Template created');
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteDoc(doc(db, 'smsTemplates', templateToDelete.id));
      toast.success('Template deleted');
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template: SmsTemplate) => {
    if (!orgId || !profile?.uid) return;

    try {
      await addDoc(collection(db, 'smsTemplates'), {
        orgId,
        name: `${template.name} (Copy)`,
        description: template.description,
        type: template.type,
        body: template.body,
        variables: template.variables,
        isDefault: false,
        isActive: true,
        createdBy: profile.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Template duplicated');
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error('Failed to duplicate template');
    }
  };

  const handleToggleDefault = async (template: SmsTemplate) => {
    if (!orgId) return;

    try {
      if (!template.isDefault) {
        const sameTypeTemplates = templates.filter(
          (t) => t.type === template.type && t.isDefault
        );
        for (const t of sameTypeTemplates) {
          await updateDoc(doc(db, 'smsTemplates', t.id), { isDefault: false });
        }
      }

      await updateDoc(doc(db, 'smsTemplates', template.id), {
        isDefault: !template.isDefault,
        updatedAt: serverTimestamp(),
      });

      toast.success(template.isDefault ? 'Default removed' : 'Set as default');
    } catch (err) {
      console.error('Error toggling default:', err);
      toast.error('Failed to update template');
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<SmsTemplateType, SmsTemplate[]>);

  if (loading) {
    return <SkeletonList count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Create and manage reusable SMS message templates
        </p>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-6">
            Create SMS templates to quickly send common messages
          </p>
          <Button onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {SMS_TEMPLATE_TYPES.map(({ value: type, label }) => {
            const typeTemplates = groupedTemplates[type];
            if (!typeTemplates || typeTemplates.length === 0) return null;

            return (
              <div key={type}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{label}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typeTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          {template.isDefault && (
                            <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleDefault(template)}
                            className={`p-1 rounded hover:bg-gray-100 ${
                              template.isDefault ? 'text-brand-primary' : 'text-gray-400'
                            }`}
                            title={template.isDefault ? 'Remove default' : 'Set as default'}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(template)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTemplateToDelete(template);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-red-400"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {template.description && (
                        <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <p className="line-clamp-3">{template.body}</p>
                      </div>

                      {template.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.variables.map((v) => (
                            <span
                              key={v.name}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {`{{${v.name}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Payment Reminder - Friendly"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="When to use this template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SMS_TEMPLATE_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`text-left p-3 border rounded-lg transition-colors ${
                    formData.type === value
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-medium text-sm">{label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Message Body *
              </label>
              <button
                type="button"
                onClick={handleUseDefaultTemplate}
                className="text-xs text-brand-primary hover:underline"
              >
                Use default template
              </button>
            </div>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Hi {{clientName}}, this is a reminder..."
            />
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>
                {smsInfo.charactersUsed} characters / {smsInfo.segments} segment(s) ({smsInfo.encoding})
              </span>
              <span>
                Variables: {detectedVariables.length > 0 ? detectedVariables.join(', ') : 'None'}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Available Variables</p>
            <div className="flex flex-wrap gap-2">
              {getDefaultTemplateVariables(formData.type).map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => {
                    setFormData((p) => ({
                      ...p,
                      body: p.body + `{{${v.name}}}`,
                    }));
                  }}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-100"
                  title={v.description}
                >
                  {`{{${v.name}}}`}
                  {v.required && <span className="text-red-500 ml-0.5">*</span>}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-gray-700">
              Set as default template for this type
            </span>
          </label>
        </div>
      </BaseModal>

      <BaseModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTemplateToDelete(null);
        }}
        title="Delete Template"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTemplateToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
        </p>
      </BaseModal>
    </div>
  );
}

// ============================================================================
// Line Items Tab
// ============================================================================

interface LineItemFormData {
  name: string;
  description: string;
  trade: LineItemTrade;
  category: string;
  unit: LineItemUnit;
  materialCost: number;
  laborCost: number;
  defaultMarkup: number;
  sku: string;
  supplier: string;
  supplierSku: string;
  tags: string;
}

const DEFAULT_LINE_ITEM_FORM_DATA: LineItemFormData = {
  name: '',
  description: '',
  trade: 'general',
  category: '',
  unit: 'each',
  materialCost: 0,
  laborCost: 0,
  defaultMarkup: 20,
  sku: '',
  supplier: '',
  supplierSku: '',
  tags: '',
};

function LineItemsTab() {
  const { profile } = useAuth();
  const {
    lineItems,
    loading,
    createLineItem,
    updateLineItem,
    deleteLineItem,
    toggleFavorite,
    duplicateLineItem,
    bulkUpdatePricing,
  } = useLineItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<LineItemTrade | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'trade' | 'price' | 'usage'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [formData, setFormData] = useState<LineItemFormData>(DEFAULT_LINE_ITEM_FORM_DATA);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LineItem | null>(null);

  const [bulkPricingOpen, setBulkPricingOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPriceChange, setBulkPriceChange] = useState(0);
  const [bulkPriceReason, setBulkPriceReason] = useState('');

  const filteredItems = React.useMemo(() => {
    let items = lineItems;

    if (selectedTrade !== 'all') {
      items = items.filter((item) => item.trade === selectedTrade);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.supplier?.toLowerCase().includes(q)
      );
    }

    items = [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'trade':
          comparison = a.trade.localeCompare(b.trade);
          break;
        case 'price':
          comparison = a.unitPrice - b.unitPrice;
          break;
        case 'usage':
          comparison = (b.usageCount || 0) - (a.usageCount || 0);
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [lineItems, selectedTrade, searchQuery, sortBy, sortDir]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getUnitAbbr = (unit: string) => {
    const found = LINE_ITEM_UNITS.find((u) => u.value === unit);
    return found?.abbr || unit;
  };

  const handleOpenModal = (item?: LineItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        trade: item.trade,
        category: item.category || '',
        unit: item.unit,
        materialCost: item.materialCost,
        laborCost: item.laborCost,
        defaultMarkup: item.defaultMarkup,
        sku: item.sku || '',
        supplier: item.supplier || '',
        supplierSku: item.supplierSku || '',
        tags: item.tags?.join(', ') || '',
      });
    } else {
      setEditingItem(null);
      setFormData(DEFAULT_LINE_ITEM_FORM_DATA);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData(DEFAULT_LINE_ITEM_FORM_DATA);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      trade: formData.trade,
      category: formData.category.trim() || undefined,
      unit: formData.unit,
      materialCost: formData.materialCost,
      laborCost: formData.laborCost,
      defaultMarkup: formData.defaultMarkup,
      sku: formData.sku.trim() || undefined,
      supplier: formData.supplier.trim() || undefined,
      supplierSku: formData.supplierSku.trim() || undefined,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    };

    try {
      if (editingItem) {
        await updateLineItem(editingItem.id, data);
      } else {
        await createLineItem(data);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving line item:', err);
      toast.error('Failed to save line item');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteLineItem(itemToDelete.id);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting line item:', err);
      toast.error('Failed to delete line item');
    }
  };

  const handleBulkPricing = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      await bulkUpdatePricing(selectedIds, bulkPriceChange, bulkPriceReason);
      setBulkPricingOpen(false);
      setSelectedIds([]);
      setBulkPriceChange(0);
      setBulkPriceReason('');
    } catch (err) {
      console.error('Error updating pricing:', err);
      toast.error('Failed to update pricing');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  if (loading) {
    return <SkeletonList count={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Manage your reusable line items for estimates and quotes
        </p>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="secondary" onClick={() => setBulkPricingOpen(true)}>
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Adjust Pricing ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => handleOpenModal()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search line items..."
            className="pl-9"
          />
        </div>

        <select
          value={selectedTrade}
          onChange={(e) => setSelectedTrade(e.target.value as LineItemTrade | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Trades</option>
          {LINE_ITEM_TRADES.map((trade) => (
            <option key={trade.value} value={trade.value}>
              {trade.label}
            </option>
          ))}
        </select>

        <div className="text-sm text-gray-500">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Card className="overflow-hidden">
        <ResponsiveTableWrapper
          mobileCards={
            filteredItems.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                {searchQuery || selectedTrade !== 'all'
                  ? 'No items match your filters'
                  : 'No line items yet. Create your first one!'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <MobileTableCard key={item.id} onClick={() => handleOpenModal(item)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="p-0.5"
                      >
                        {item.isFavorite ? (
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.sku && (
                          <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {LINE_ITEM_TRADES.find((t) => t.value === item.trade)?.label || item.trade}
                    </span>
                  </div>
                  <MobileTableRow label="Unit Price">
                    {formatPrice(item.unitPrice)}
                  </MobileTableRow>
                  <MobileTableRow label="Unit">{getUnitAbbr(item.unit)}</MobileTableRow>
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLineItem(item.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </MobileTableCard>
              ))
            )
          }
        >
          <Table stickyFirstColumn>
            <TableHead>
              <TableRow hover={false}>
                <TableHeader className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                </TableHeader>
                <TableHeader sortable sortDirection={sortBy === 'name' ? sortDir : null} onSort={() => toggleSort('name')}>
                  Name
                </TableHeader>
                <TableHeader sortable sortDirection={sortBy === 'trade' ? sortDir : null} onSort={() => toggleSort('trade')} priority="medium">
                  Trade
                </TableHeader>
                <TableHeader align="right" sortable sortDirection={sortBy === 'price' ? sortDir : null} onSort={() => toggleSort('price')}>
                  Unit Price
                </TableHeader>
                <TableHeader align="center" priority="medium">Unit</TableHeader>
                <TableHeader align="center" sortable sortDirection={sortBy === 'usage' ? sortDir : null} onSort={() => toggleSort('usage')} priority="low">
                  Usage
                </TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  message={
                    searchQuery || selectedTrade !== 'all'
                      ? 'No items match your filters'
                      : 'No line items yet. Create your first one!'
                  }
                />
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="p-0.5"
                        >
                          {item.isFavorite ? (
                            <StarIconSolid className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <StarIcon className="h-4 w-4 text-gray-300 hover:text-yellow-500" />
                          )}
                        </button>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                          )}
                          {item.sku && (
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell priority="medium">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {LINE_ITEM_TRADES.find((t) => t.value === item.trade)?.label || item.trade}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-medium text-gray-900">{formatPrice(item.unitPrice)}</span>
                      <div className="text-xs text-gray-500">
                        M: {formatPrice(item.materialCost)} + L: {formatPrice(item.laborCost)}
                      </div>
                    </TableCell>
                    <TableCell align="center" priority="medium">
                      <span className="text-gray-700">{getUnitAbbr(item.unit)}</span>
                    </TableCell>
                    <TableCell align="center" priority="low">
                      <span className="text-gray-700">{item.usageCount || 0}</span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => duplicateLineItem(item.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveTableWrapper>
      </Card>

      <BaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Line Item' : 'Add Line Item'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Create Line Item'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Standard Interior Paint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData((p) => ({ ...p, trade: e.target.value as LineItemTrade }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {LINE_ITEM_TRADES.map((trade) => (
                  <option key={trade.value} value={trade.value}>
                    {trade.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value as LineItemUnit }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {LINE_ITEM_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label} ({unit.abbr})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={formData.materialCost}
                  onChange={(e) => setFormData((p) => ({ ...p, materialCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={formData.laborCost}
                  onChange={(e) => setFormData((p) => ({ ...p, laborCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Markup</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.defaultMarkup}
                  onChange={(e) => setFormData((p) => ({ ...p, defaultMarkup: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  className="w-full pr-7 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Calculated Unit Price:</span>
              <span className="font-medium text-brand-primary">
                {formatPrice(
                  (formData.materialCost + formData.laborCost) * (1 + formData.defaultMarkup / 100)
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))}
                placeholder="Internal SKU"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData((p) => ({ ...p, supplier: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier SKU</label>
              <Input
                value={formData.supplierSku}
                onChange={(e) => setFormData((p) => ({ ...p, supplierSku: e.target.value }))}
                placeholder="Supplier's SKU"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
              placeholder="Comma-separated tags"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., premium, exterior, residential</p>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        title="Delete Line Item"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
        </p>
      </BaseModal>

      <BaseModal
        open={bulkPricingOpen}
        onClose={() => {
          setBulkPricingOpen(false);
          setBulkPriceChange(0);
          setBulkPriceReason('');
        }}
        title="Bulk Pricing Adjustment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setBulkPricingOpen(false);
                setBulkPriceChange(0);
                setBulkPriceReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkPricing}>
              Apply to {selectedIds.length} Items
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Adjust pricing for {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Change (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={bulkPriceChange}
                onChange={(e) => setBulkPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-7"
                placeholder="e.g., 5 for 5% increase, -10 for 10% decrease"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Positive value for increase, negative for decrease
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <Input
              value={bulkPriceReason}
              onChange={(e) => setBulkPriceReason(e.target.value)}
              placeholder="e.g., Material cost increase Q1 2026"
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('quotes');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px" aria-label="Template tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'quotes' && <QuoteTemplatesTab />}
        {activeTab === 'sow' && <SowTemplatesTab />}
        {activeTab === 'email' && <EmailTemplatesTab />}
        {activeTab === 'sms' && <SmsTemplatesTab />}
        {activeTab === 'line-items' && <LineItemsTab />}
      </div>
    </div>
  );
}
