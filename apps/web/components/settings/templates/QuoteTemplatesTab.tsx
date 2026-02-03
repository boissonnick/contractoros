"use client";

import React, { useState } from 'react';
import { Button, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import {
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { QuoteTemplateFormModal, QuoteTemplateCard } from '@/components/quotetemplates';
import { useQuoteTemplates } from '@/lib/hooks/useQuoteTemplates';
import { QuotePdfTemplate } from '@/types';

export function QuoteTemplatesTab() {
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
