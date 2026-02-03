"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import BaseModal from '@/components/ui/BaseModal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
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

export function EmailTemplatesTab() {
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
