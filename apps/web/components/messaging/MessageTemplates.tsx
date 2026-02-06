'use client';

/**
 * MessageTemplates — Slide-over panel for browsing, searching, creating,
 * editing, and deleting message templates.
 *
 * Templates are grouped by category with search filtering and variable
 * auto-detection from content using the {{variableName}} pattern.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageTemplateCategory } from '@/types';
import { useMessageTemplates } from '@/lib/hooks/useMessageTemplates';
import { toast } from '@/components/ui/Toast';
import {
  XMarkIcon,
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_LABELS: Record<MessageTemplateCategory, string> = {
  general: 'General',
  project_update: 'Project Updates',
  scheduling: 'Scheduling',
  payment: 'Payment',
  change_order: 'Change Orders',
  custom: 'Custom',
};

const CATEGORY_COLORS: Record<MessageTemplateCategory, string> = {
  general: 'bg-gray-100 text-gray-700',
  project_update: 'bg-blue-100 text-blue-700',
  scheduling: 'bg-purple-100 text-purple-700',
  payment: 'bg-green-100 text-green-700',
  change_order: 'bg-orange-100 text-orange-700',
  custom: 'bg-indigo-100 text-indigo-700',
};

const ALL_CATEGORIES: ('all' | MessageTemplateCategory)[] = [
  'all',
  'general',
  'project_update',
  'scheduling',
  'payment',
  'change_order',
  'custom',
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Auto-detect template variables from content using {{variableName}} pattern
 */
function detectVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  // Deduplicate
  return Array.from(new Set(matches));
}

/**
 * Truncate content for card preview
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

// ============================================================================
// Props
// ============================================================================

interface MessageTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface TemplateFormProps {
  initialName?: string;
  initialCategory?: MessageTemplateCategory;
  initialContent?: string;
  onSave: (data: {
    name: string;
    category: MessageTemplateCategory;
    content: string;
    variables: string[];
  }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  title: string;
}

function TemplateForm({
  initialName = '',
  initialCategory = 'general',
  initialContent = '',
  onSave,
  onCancel,
  saving,
  title,
}: TemplateFormProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<MessageTemplateCategory>(initialCategory);
  const [content, setContent] = useState(initialContent);

  const detectedVariables = useMemo(() => detectVariables(content), [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Template content is required');
      return;
    }

    await onSave({
      name: name.trim(),
      category,
      content: content.trim(),
      variables: detectedVariables,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {/* Name */}
      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
          Template Name
        </label>
        <input
          id="template-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekly Update"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="template-category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="template-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as MessageTemplateCategory)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="template-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hi {{clientName}}, here is an update on {{projectName}}..."
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use {'{{variableName}}'} for dynamic placeholders
        </p>
      </div>

      {/* Detected Variables */}
      {detectedVariables.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Detected Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {detectedVariables.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
              >
                <TagIcon className="w-3 h-3" />
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            saving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-brand-primary text-white hover:bg-brand-900'
          )}
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </form>
  );
}

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    category: MessageTemplateCategory;
    content: string;
    variables: string[];
    isDefault: boolean;
  };
  onSelect: (content: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, onSelect, onEdit, onDelete }: TemplateCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <h4 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!template.isDefault && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Edit template"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete template"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Category badge */}
      <span
        className={cn(
          'inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2',
          CATEGORY_COLORS[template.category]
        )}
      >
        {CATEGORY_LABELS[template.category]}
      </span>

      {/* Content preview */}
      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
        {truncate(template.content, 120)}
      </p>

      {/* Variable pills */}
      {template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {template.variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs"
            >
              <TagIcon className="w-2.5 h-2.5" />
              {v}
            </span>
          ))}
        </div>
      )}

      {/* Use Template button */}
      <button
        onClick={() => onSelect(template.content)}
        className="w-full px-3 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-50 transition-colors"
      >
        Use Template
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MessageTemplates({
  isOpen,
  onClose,
  onSelect,
}: MessageTemplatesProps) {
  const {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useMessageTemplates();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | MessageTemplateCategory>('all');
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setActiveCategory('all');
      setFormMode('none');
      setEditingTemplateId(null);
    }
  }, [isOpen]);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          t.variables.some((v) => v.toLowerCase().includes(q))
      );
    }

    return result;
  }, [templates, activeCategory, search]);

  // Get the template being edited
  const editingTemplate = useMemo(() => {
    if (!editingTemplateId) return null;
    return templates.find((t) => t.id === editingTemplateId) || null;
  }, [templates, editingTemplateId]);

  const handleCreate = async (data: {
    name: string;
    category: MessageTemplateCategory;
    content: string;
    variables: string[];
  }) => {
    setSaving(true);
    try {
      await addTemplate(data);
      setFormMode('none');
    } catch {
      // Toast already shown in hook
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    category: MessageTemplateCategory;
    content: string;
    variables: string[];
  }) => {
    if (!editingTemplateId) return;

    setSaving(true);
    try {
      await updateTemplate(editingTemplateId, data);
      setFormMode('none');
      setEditingTemplateId(null);
    } catch {
      // Toast already shown in hook
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
    } catch {
      // Toast already shown in hook
    }
  };

  const handleSelectTemplate = (content: string) => {
    onSelect(content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {formMode !== 'none' ? (
          /* Create / Edit Form */
          <div className="flex-1 overflow-y-auto">
            <TemplateForm
              title={formMode === 'create' ? 'New Template' : 'Edit Template'}
              initialName={editingTemplate?.name}
              initialCategory={editingTemplate?.category}
              initialContent={editingTemplate?.content}
              onSave={formMode === 'create' ? handleCreate : handleUpdate}
              onCancel={() => {
                setFormMode('none');
                setEditingTemplateId(null);
              }}
              saving={saving}
            />
          </div>
        ) : (
          <>
            {/* Search + New Template button */}
            <div className="px-4 pt-3 pb-2 space-y-3 border-b border-gray-100">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
                />
              </div>

              {/* Category filter tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                      activeCategory === cat
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Template list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="w-6 h-6 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin" />
                  <p className="mt-3 text-sm text-gray-500">Loading templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DocumentTextIcon className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">No templates found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {search.trim()
                      ? 'Try a different search term'
                      : 'Create a new template to get started'}
                  </p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                    onEdit={() => {
                      setEditingTemplateId(template.id);
                      setFormMode('edit');
                    }}
                    onDelete={() => handleDelete(template.id)}
                  />
                ))
              )}
            </div>

            {/* New Template FAB */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <button
                onClick={() => setFormMode('create')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-900 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Template
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MessageTemplates;
