"use client";

import React, { useState, useEffect } from 'react';
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
import { toast } from '@/components/ui/Toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import BaseModal from '@/components/ui/BaseModal';

// Email template types
type EmailTemplateType =
  | 'estimate_sent'
  | 'invoice_sent'
  | 'payment_received'
  | 'payment_reminder'
  | 'project_update'
  | 'document_ready'
  | 'signature_request'
  | 'welcome'
  | 'custom';

interface EmailTemplateVariable {
  name: string;
  description: string;
  required: boolean;
}

interface EmailTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  type: EmailTemplateType;
  subject: string;
  body: string;
  variables: EmailTemplateVariable[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

const TEMPLATE_TYPES: { value: EmailTemplateType; label: string; description: string }[] = [
  { value: 'estimate_sent', label: 'Estimate Sent', description: 'Notify when an estimate is ready for review' },
  { value: 'invoice_sent', label: 'Invoice Sent', description: 'Notify when an invoice is issued' },
  { value: 'payment_received', label: 'Payment Received', description: 'Confirm payment has been processed' },
  { value: 'payment_reminder', label: 'Payment Reminder', description: 'Remind about upcoming or overdue payments' },
  { value: 'project_update', label: 'Project Update', description: 'Share project progress updates' },
  { value: 'document_ready', label: 'Document Ready', description: 'Alert when documents are ready for review' },
  { value: 'signature_request', label: 'Signature Request', description: 'Request e-signature on documents' },
  { value: 'welcome', label: 'Welcome Email', description: 'Welcome new clients to your portal' },
  { value: 'custom', label: 'Custom', description: 'Create your own template' },
];

const DEFAULT_VARIABLES: Record<EmailTemplateType, EmailTemplateVariable[]> = {
  estimate_sent: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'projectName', description: 'Project name', required: true },
    { name: 'estimateAmount', description: 'Estimate total amount', required: false },
    { name: 'viewLink', description: 'Link to view estimate', required: true },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  invoice_sent: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'invoiceNumber', description: 'Invoice number', required: true },
    { name: 'invoiceAmount', description: 'Invoice total amount', required: true },
    { name: 'dueDate', description: 'Payment due date', required: true },
    { name: 'viewLink', description: 'Link to view/pay invoice', required: true },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  payment_received: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'paymentAmount', description: 'Payment amount', required: true },
    { name: 'projectName', description: 'Project name', required: false },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  payment_reminder: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'invoiceNumber', description: 'Invoice number', required: true },
    { name: 'invoiceAmount', description: 'Amount due', required: true },
    { name: 'dueDate', description: 'Payment due date', required: true },
    { name: 'payLink', description: 'Link to pay invoice', required: true },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  project_update: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'projectName', description: 'Project name', required: true },
    { name: 'updateSummary', description: 'Brief update summary', required: true },
    { name: 'viewLink', description: 'Link to project portal', required: false },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  document_ready: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'documentName', description: 'Document name', required: true },
    { name: 'viewLink', description: 'Link to view document', required: true },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  signature_request: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'documentName', description: 'Document requiring signature', required: true },
    { name: 'signLink', description: 'Link to sign document', required: true },
    { name: 'expiresAt', description: 'Signature deadline', required: false },
    { name: 'companyName', description: 'Your company name', required: true },
  ],
  welcome: [
    { name: 'clientName', description: 'Client full name', required: true },
    { name: 'portalLink', description: 'Link to client portal', required: true },
    { name: 'companyName', description: 'Your company name', required: true },
    { name: 'contactEmail', description: 'Your contact email', required: false },
    { name: 'contactPhone', description: 'Your contact phone', required: false },
  ],
  custom: [
    { name: 'clientName', description: 'Client full name', required: false },
    { name: 'projectName', description: 'Project name', required: false },
    { name: 'companyName', description: 'Your company name', required: false },
  ],
};

function getDefaultEmailTemplate(type: EmailTemplateType): { subject: string; body: string } {
  const templates: Record<EmailTemplateType, { subject: string; body: string }> = {
    estimate_sent: {
      subject: 'Your Estimate from {{companyName}} - {{projectName}}',
      body: `Hi {{clientName}},

Thank you for the opportunity to provide an estimate for your project.

Please click the link below to review your estimate:
{{viewLink}}

If you have any questions or would like to discuss the details, please don't hesitate to reach out.

Best regards,
{{companyName}}`,
    },
    invoice_sent: {
      subject: 'Invoice #{{invoiceNumber}} from {{companyName}}',
      body: `Hi {{clientName}},

Please find your invoice attached.

Invoice #: {{invoiceNumber}}
Amount Due: {{invoiceAmount}}
Due Date: {{dueDate}}

View and pay your invoice: {{viewLink}}

Thank you for your business!

{{companyName}}`,
    },
    payment_received: {
      subject: 'Payment Received - Thank You!',
      body: `Hi {{clientName}},

We've received your payment of {{paymentAmount}}. Thank you!

If you have any questions, please don't hesitate to reach out.

Best regards,
{{companyName}}`,
    },
    payment_reminder: {
      subject: 'Payment Reminder - Invoice #{{invoiceNumber}}',
      body: `Hi {{clientName}},

This is a friendly reminder that payment for Invoice #{{invoiceNumber}} is due on {{dueDate}}.

Amount Due: {{invoiceAmount}}

Pay now: {{payLink}}

If you've already sent payment, please disregard this message.

Thank you,
{{companyName}}`,
    },
    project_update: {
      subject: 'Project Update: {{projectName}}',
      body: `Hi {{clientName}},

Here's an update on your project:

{{updateSummary}}

View your project portal: {{viewLink}}

Let us know if you have any questions!

Best regards,
{{companyName}}`,
    },
    document_ready: {
      subject: 'Document Ready for Review: {{documentName}}',
      body: `Hi {{clientName}},

A document is ready for your review:

Document: {{documentName}}

View document: {{viewLink}}

Please review at your earliest convenience.

Best regards,
{{companyName}}`,
    },
    signature_request: {
      subject: 'Signature Required: {{documentName}}',
      body: `Hi {{clientName}},

Your signature is needed on the following document:

Document: {{documentName}}

Please sign here: {{signLink}}

This link will expire on {{expiresAt}}.

Thank you,
{{companyName}}`,
    },
    welcome: {
      subject: 'Welcome to {{companyName}}!',
      body: `Hi {{clientName}},

Welcome! We're excited to work with you.

You can access your client portal here: {{portalLink}}

In your portal you can:
- View project progress and updates
- Review and approve estimates
- Pay invoices online
- Access project documents

If you have any questions, feel free to contact us at {{contactEmail}} or {{contactPhone}}.

Best regards,
{{companyName}}`,
    },
    custom: {
      subject: '',
      body: `Hi {{clientName}},



Best regards,
{{companyName}}`,
    },
  };

  return templates[type];
}

interface TemplateFormData {
  name: string;
  description: string;
  type: EmailTemplateType;
  subject: string;
  body: string;
  isDefault: boolean;
}

export default function EmailTemplatesPage() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    type: 'custom',
    subject: '',
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
      collection(db, 'emailTemplates'),
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

  // Parse variables from template body
  const parseVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ''))));
  };

  const detectedVariables = parseVariables(formData.subject + ' ' + formData.body);

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        subject: template.subject,
        body: template.body,
        isDefault: template.isDefault || false,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: 'custom',
        subject: '',
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
      subject: '',
      body: '',
      isDefault: false,
    });
  };

  const handleTypeChange = (type: EmailTemplateType) => {
    const defaults = getDefaultEmailTemplate(type);
    setFormData((prev) => ({
      ...prev,
      type,
      subject: prev.subject || defaults.subject,
      body: prev.body || defaults.body,
    }));
  };

  const handleUseDefaultTemplate = () => {
    const defaults = getDefaultEmailTemplate(formData.type);
    setFormData((prev) => ({
      ...prev,
      subject: defaults.subject,
      body: defaults.body,
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

    if (!formData.subject.trim()) {
      toast.error('Email subject is required');
      return;
    }

    if (!formData.body.trim()) {
      toast.error('Email body is required');
      return;
    }

    try {
      const variables: EmailTemplateVariable[] = detectedVariables.map((name) => {
        const defaultVars = DEFAULT_VARIABLES[formData.type];
        const existing = defaultVars.find((v) => v.name === name);
        return existing || { name, description: '', required: false };
      });

      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        subject: formData.subject,
        body: formData.body,
        variables,
        isDefault: formData.isDefault,
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'emailTemplates', editingTemplate.id), templateData);
        toast.success('Template updated');
      } else {
        await addDoc(collection(db, 'emailTemplates'), {
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
      await deleteDoc(doc(db, 'emailTemplates', templateToDelete.id));
      toast.success('Template deleted');
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    if (!orgId || !profile?.uid) return;

    try {
      await addDoc(collection(db, 'emailTemplates'), {
        orgId,
        name: `${template.name} (Copy)`,
        description: template.description,
        type: template.type,
        subject: template.subject,
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

  const handleToggleDefault = async (template: EmailTemplate) => {
    if (!orgId) return;

    try {
      // If setting as default, unset other defaults of same type
      if (!template.isDefault) {
        const sameTypeTemplates = templates.filter(
          (t) => t.type === template.type && t.isDefault
        );
        for (const t of sameTypeTemplates) {
          await updateDoc(doc(db, 'emailTemplates', t.id), { isDefault: false });
        }
      }

      await updateDoc(doc(db, 'emailTemplates', template.id), {
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
  }, {} as Record<EmailTemplateType, EmailTemplate[]>);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-500">
            Create and manage reusable email templates for notifications and communications
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
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No email templates yet</h3>
          <p className="text-gray-500 mb-6">
            Create email templates to streamline your client communications
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
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{label}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typeTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          {template.isDefault && (
                            <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setPreviewTemplate(template);
                              setPreviewOpen(true);
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400"
                            title="Preview"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
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

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Subject:</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{template.subject}</p>
                        <p className="text-xs font-medium text-gray-700 mt-2 mb-1">Body:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                      </div>

                      {template.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.variables.slice(0, 4).map((v) => (
                            <span
                              key={v.name}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {`{{${v.name}}}`}
                            </span>
                          ))}
                          {template.variables.length > 4 && (
                            <span className="px-2 py-0.5 text-gray-400 text-xs">
                              +{template.variables.length - 4} more
                            </span>
                          )}
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
        title={editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Invoice - Friendly Reminder"
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

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TEMPLATE_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`text-left p-2 border rounded-lg transition-colors ${
                    formData.type === value
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-medium text-xs">{label}</span>
                  <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Email Subject *
              </label>
              <button
                type="button"
                onClick={handleUseDefaultTemplate}
                className="text-xs text-brand-primary hover:underline"
              >
                Use default template
              </button>
            </div>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Invoice #{{invoiceNumber}} from {{companyName}}"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Hi {{clientName}},..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Variables detected: {detectedVariables.length > 0 ? detectedVariables.join(', ') : 'None'}
            </p>
          </div>

          {/* Available variables */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Available Variables</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_VARIABLES[formData.type].map((v) => (
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
      </BaseModal>

      {/* Preview Modal */}
      <BaseModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewTemplate(null);
        }}
        title="Email Preview"
        size="lg"
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg">
                {previewTemplate.subject}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Body</p>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {previewTemplate.body}
                </pre>
              </div>
            </div>
            {previewTemplate.variables.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Variables Used</p>
                <div className="flex flex-wrap gap-1">
                  {previewTemplate.variables.map((v) => (
                    <span
                      key={v.name}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      title={v.description}
                    >
                      {`{{${v.name}}}`}
                      {v.required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
