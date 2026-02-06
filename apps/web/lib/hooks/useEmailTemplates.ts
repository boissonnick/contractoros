/**
 * useEmailTemplates Hook
 * CRUD operations for email templates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EmailTemplate, EmailTemplateType } from '@/types';
import { DEFAULT_EMAIL_TEMPLATES, getDefaultTemplate } from '@/lib/email/default-templates';

interface UseEmailTemplatesOptions {
  orgId: string;
}

interface UseEmailTemplatesReturn {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  getTemplate: (templateId: string) => Promise<EmailTemplate | null>;
  getTemplateByType: (type: EmailTemplateType) => EmailTemplate | undefined;
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (templateId: string, updates: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  resetToDefault: (templateId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEmailTemplates({ orgId }: UseEmailTemplatesOptions): UseEmailTemplatesReturn {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'organizations', orgId, 'emailTemplates'),
        orderBy('type')
      );

      const snapshot = await getDocs(q);
      const orgTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as EmailTemplate[];

      // Merge with default templates (show defaults for types not customized)
      const existingTypes = new Set(orgTemplates.map(t => t.type));
      const defaultsToInclude = DEFAULT_EMAIL_TEMPLATES
        .filter(dt => !existingTypes.has(dt.type))
        .map(dt => ({
          id: `default-${dt.type}`,
          orgId,
          type: dt.type,
          name: dt.name,
          subject: dt.subject,
          body: dt.body,
          variables: dt.variables,
          isDefault: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as EmailTemplate));

      setTemplates([...orgTemplates, ...defaultsToInclude]);
    } catch (err) {
      logger.error('Error fetching email templates', { error: err, hook: 'useEmailTemplates' });
      setError('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getTemplate = async (templateId: string): Promise<EmailTemplate | null> => {
    if (!orgId) return null;

    // Handle default templates
    if (templateId.startsWith('default-')) {
      const type = templateId.replace('default-', '') as EmailTemplateType;
      const defaultTemplate = getDefaultTemplate(type);
      if (defaultTemplate) {
        return {
          id: templateId,
          orgId,
          type: defaultTemplate.type,
          name: defaultTemplate.name,
          subject: defaultTemplate.subject,
          body: defaultTemplate.body,
          variables: defaultTemplate.variables,
          isDefault: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    }

    try {
      const docRef = doc(db, 'organizations', orgId, 'emailTemplates', templateId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
      } as EmailTemplate;
    } catch (err) {
      logger.error('Error fetching template', { error: err, hook: 'useEmailTemplates' });
      return null;
    }
  };

  const getTemplateByType = (type: EmailTemplateType): EmailTemplate | undefined => {
    // First check org templates
    const orgTemplate = templates.find(t => t.type === type && !t.isDefault);
    if (orgTemplate) return orgTemplate;

    // Fall back to default
    return templates.find(t => t.type === type);
  };

  const createTemplate = async (
    template: Omit<EmailTemplate, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!orgId) throw new Error('Organization ID required');

    const docRef = await addDoc(
      collection(db, 'organizations', orgId, 'emailTemplates'),
      {
        ...template,
        orgId,
        isDefault: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );

    await fetchTemplates();
    return docRef.id;
  };

  const updateTemplate = async (
    templateId: string,
    updates: Partial<EmailTemplate>
  ): Promise<void> => {
    if (!orgId) throw new Error('Organization ID required');

    // If it's a default template, create a new org template instead
    if (templateId.startsWith('default-')) {
      const type = templateId.replace('default-', '') as EmailTemplateType;
      const defaultTemplate = getDefaultTemplate(type);
      if (defaultTemplate) {
        await createTemplate({
          type: defaultTemplate.type,
          name: updates.name || defaultTemplate.name,
          subject: updates.subject || defaultTemplate.subject,
          body: updates.body || defaultTemplate.body,
          variables: updates.variables || defaultTemplate.variables,
          isDefault: false,
          isActive: updates.isActive ?? true,
        });
        return;
      }
    }

    const docRef = doc(db, 'organizations', orgId, 'emailTemplates', templateId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await fetchTemplates();
  };

  const deleteTemplate = async (templateId: string): Promise<void> => {
    if (!orgId) throw new Error('Organization ID required');

    // Can't delete default templates
    if (templateId.startsWith('default-')) {
      throw new Error('Cannot delete default templates');
    }

    const docRef = doc(db, 'organizations', orgId, 'emailTemplates', templateId);
    await deleteDoc(docRef);

    await fetchTemplates();
  };

  const resetToDefault = async (templateId: string): Promise<void> => {
    if (!orgId) throw new Error('Organization ID required');

    // Find the template to reset
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Get the default for this type
    const defaultTemplate = getDefaultTemplate(template.type);
    if (!defaultTemplate) throw new Error('No default template for this type');

    // If it's a custom template, delete it (will fall back to default)
    if (!templateId.startsWith('default-')) {
      await deleteTemplate(templateId);
    }
  };

  return {
    templates,
    loading,
    error,
    getTemplate,
    getTemplateByType,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    resetToDefault,
    refresh: fetchTemplates,
  };
}

/**
 * Hook for email logs/history
 */
interface UseEmailHistoryOptions {
  orgId: string;
  clientId?: string;
  projectId?: string;
  limit?: number;
}

export function useEmailHistory({ orgId, clientId, projectId, limit = 50 }: UseEmailHistoryOptions) {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let q = query(
        collection(db, 'organizations', orgId, 'emailLogs'),
        orderBy('sentAt', 'desc')
      );

      if (clientId) {
        q = query(q, where('clientId', '==', clientId));
      }

      if (projectId) {
        q = query(q, where('projectId', '==', projectId));
      }

      const snapshot = await getDocs(q);
      const emailLogs = snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate?.() || new Date(),
        openedAt: doc.data().openedAt?.toDate?.(),
      })) as EmailLog[];

      setLogs(emailLogs);
    } catch (err) {
      logger.error('Error fetching email logs', { error: err, hook: 'useEmailTemplates' });
      setError('Failed to load email history');
    } finally {
      setLoading(false);
    }
  }, [orgId, clientId, projectId, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs,
  };
}

// Import EmailLog type for the hook
import { EmailLog } from '@/types';
import { logger } from '@/lib/utils/logger';
