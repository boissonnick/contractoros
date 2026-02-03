"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Input } from '@/components/ui';
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
import { db } from '@/lib/firebase/config';
import { SmsTemplate, SmsTemplateType, SmsTemplateVariable } from '@/types';
import { toast } from '@/components/ui/Toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import BaseModal from '@/components/ui/BaseModal';
import {
  getTemplateTypeLabel,
  getDefaultTemplateVariables,
  getDefaultTemplate,
  calculateSmsSegments,
  parseTemplateVariables,
} from '@/lib/sms/smsUtils';
import {
  AVAILABLE_VARIABLES,
  getSampleData,
  renderTemplatePreview,
} from '@/lib/hooks/useSMSTemplates';

/**
 * Template Preview Component
 * Shows how a template will render with sample data
 */
function TemplatePreview({
  body,
  sampleData,
}: {
  body: string;
  sampleData: Record<string, string>;
}) {
  const rendered = useMemo(() => {
    if (!body) return '';
    return renderTemplatePreview(body, sampleData);
  }, [body, sampleData]);

  if (!body) {
    return (
      <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm">
        Enter a message to see the preview
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Phone mockup */}
      <div className="bg-gray-900 rounded-3xl p-2 max-w-xs mx-auto shadow-xl">
        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10" />

        {/* Screen */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden">
          {/* Status bar */}
          <div className="bg-gray-200 px-4 py-2 flex justify-between items-center text-xs text-gray-600">
            <span>9:41 AM</span>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-2 border border-gray-500 rounded-sm">
                <div className="w-3/4 h-full bg-gray-500 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Message header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {sampleData.companyName?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{sampleData.companyName || 'Company'}</p>
                <p className="text-xs text-gray-500">SMS</p>
              </div>
            </div>
          </div>

          {/* Message bubble */}
          <div className="p-4 min-h-[120px] bg-gray-100">
            <div className="bg-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {rendered}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1">Now</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Variable Buttons for inserting common variables
 */
function QuickVariableButtons({
  onInsert,
  currentBody,
}: {
  onInsert: (variable: string) => void;
  currentBody: string;
}) {
  // Show variables that haven't been used yet first
  const sortedVariables = useMemo(() => {
    const usedVars = parseTemplateVariables(currentBody);
    return [...AVAILABLE_VARIABLES].sort((a, b) => {
      const aUsed = usedVars.includes(a.key);
      const bUsed = usedVars.includes(b.key);
      if (aUsed && !bUsed) return 1;
      if (!aUsed && bUsed) return -1;
      return 0;
    });
  }, [currentBody]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Insert Variable</p>
      <div className="flex flex-wrap gap-2">
        {sortedVariables.map((v) => {
          const isUsed = currentBody.includes(`{{${v.key}}}`);
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => onInsert(v.key)}
              className={`px-3 py-1.5 border rounded-lg text-xs transition-colors ${
                isUsed
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={`${v.label}: "${v.sample}"`}
            >
              <span className="font-mono">{`{{${v.key}}}`}</span>
              <span className="ml-1 text-gray-400">({v.label})</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">
        Click to insert at cursor position. Variables will be replaced with actual data when sending.
      </p>
    </div>
  );
}

const TEMPLATE_TYPES: { value: SmsTemplateType; label: string; description: string }[] = [
  { value: 'payment_reminder', label: 'Payment Reminder', description: 'Remind clients about upcoming or overdue payments' },
  { value: 'payment_received', label: 'Payment Received', description: 'Confirm payment has been received' },
  { value: 'schedule_update', label: 'Schedule Update', description: 'Notify about schedule changes' },
  { value: 'project_update', label: 'Project Update', description: 'Share project progress updates' },
  { value: 'invoice_sent', label: 'Invoice Sent', description: 'Notify when invoice is sent' },
  { value: 'document_ready', label: 'Document Ready', description: 'Alert when documents are ready' },
  { value: 'task_assigned', label: 'Task Assigned', description: 'Notify about new task assignments' },
  { value: 'custom', label: 'Custom', description: 'Create your own template' },
];

interface TemplateFormData {
  name: string;
  description: string;
  type: SmsTemplateType;
  body: string;
  isDefault: boolean;
}

export default function SmsTemplatesPage() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<SmsTemplate | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    type: 'custom',
    body: '',
    isDefault: false,
  });

  const orgId = profile?.orgId;

  // Load templates
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

  // Calculate SMS info for preview
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
      // If setting as default, unset other defaults of same type
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

  // Group templates by type
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<SmsTemplateType, SmsTemplate[]>);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-gray-500 mt-1">
            Create and manage reusable SMS message templates
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates by type */}
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
          {TEMPLATE_TYPES.map(({ value: type, label }) => {
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

      {/* Create/Edit Modal */}
      <BaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="xl"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Form */}
          <div className="space-y-4">
            {/* Name */}
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

            {/* Description */}
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

            {/* Category/Type selector - simplified */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as SmsTemplateType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {TEMPLATE_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Body */}
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
                id="sms-body-textarea"
                value={formData.body}
                onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
                placeholder="Hi {{clientName}}, this is a reminder about your {{projectName}} project..."
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

            {/* Variable insertion buttons */}
            <div className="bg-gray-50 rounded-lg p-3">
              <QuickVariableButtons
                currentBody={formData.body}
                onInsert={(variable) => {
                  const textarea = document.getElementById('sms-body-textarea') as HTMLTextAreaElement | null;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = formData.body;
                    const before = text.substring(0, start);
                    const after = text.substring(end);
                    const newText = `${before}{{${variable}}}${after}`;
                    setFormData((p) => ({ ...p, body: newText }));
                    // Restore cursor position after the inserted variable
                    setTimeout(() => {
                      textarea.focus();
                      const newPos = start + variable.length + 4; // +4 for {{ and }}
                      textarea.setSelectionRange(newPos, newPos);
                    }, 0);
                  } else {
                    // Fallback: append to end
                    setFormData((p) => ({ ...p, body: p.body + `{{${variable}}}` }));
                  }
                }}
              />
            </div>

            {/* Default checkbox */}
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

          {/* Right column: Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <EyeIcon className="h-4 w-4" />
              <span>Live Preview</span>
            </div>

            <TemplatePreview body={formData.body} sampleData={getSampleData()} />

            {/* Sample data legend */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                <DevicePhoneMobileIcon className="h-4 w-4" />
                Preview Sample Data
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {AVAILABLE_VARIABLES.slice(0, 6).map((v) => (
                  <div key={v.key} className="flex justify-between">
                    <span className="text-blue-600 font-mono">{`{{${v.key}}}`}</span>
                    <span className="text-blue-800">{v.sample}</span>
                  </div>
                ))}
              </div>
              {detectedVariables.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  Your template uses: {detectedVariables.map((v) => `{{${v}}}`).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Delete Confirmation */}
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
