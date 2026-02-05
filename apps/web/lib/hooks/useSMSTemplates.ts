/**
 * useSMSTemplates Hook
 *
 * CRUD operations for SMS message templates with real-time updates.
 * Templates support variable placeholders like {{clientName}}, {{projectName}}, etc.
 */

import { useState, useEffect, useCallback } from 'react';
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SmsTemplate, SmsTemplateVariable } from '@/types';
import { parseTemplateVariables, getDefaultTemplateVariables } from '@/lib/sms/smsUtils';

/**
 * SMS Template Category
 */
export type SMSTemplateCategory = 'reminder' | 'update' | 'notification' | 'custom';

/**
 * Available template variables with sample data for preview
 */
export const AVAILABLE_VARIABLES = [
  { key: 'clientName', label: 'Client Name', sample: 'John Smith' },
  { key: 'projectName', label: 'Project Name', sample: 'Kitchen Renovation' },
  { key: 'appointmentDate', label: 'Appointment Date', sample: 'Monday, Feb 10' },
  { key: 'amount', label: 'Amount', sample: '$1,500.00' },
  { key: 'companyName', label: 'Company Name', sample: 'ABC Construction' },
  { key: 'invoiceNumber', label: 'Invoice Number', sample: 'INV-2024-001' },
  { key: 'dueDate', label: 'Due Date', sample: 'February 15, 2024' },
  { key: 'paymentLink', label: 'Payment Link', sample: 'https://pay.example.com/abc123' },
  { key: 'taskName', label: 'Task Name', sample: 'Install cabinets' },
  { key: 'time', label: 'Time', sample: '9:00 AM' },
  { key: 'documentName', label: 'Document Name', sample: 'Contract Agreement' },
  { key: 'update', label: 'Update Message', sample: 'Framing is complete!' },
] as const;

/**
 * Get sample data for template preview
 */
export function getSampleData(): Record<string, string> {
  return AVAILABLE_VARIABLES.reduce((acc, v) => {
    acc[v.key] = v.sample;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Render a template with variables replaced by actual values
 */
export function renderTemplatePreview(
  body: string,
  data: Record<string, string> = getSampleData()
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

/**
 * Map SmsTemplateType to SMSTemplateCategory
 */
export function getTemplateCategory(type: string): SMSTemplateCategory {
  const categoryMap: Record<string, SMSTemplateCategory> = {
    payment_reminder: 'reminder',
    schedule_update: 'update',
    project_update: 'update',
    payment_received: 'notification',
    invoice_sent: 'notification',
    document_ready: 'notification',
    task_assigned: 'notification',
    custom: 'custom',
  };
  return categoryMap[type] || 'custom';
}

/**
 * Input for creating a new template
 */
export interface CreateTemplateInput {
  name: string;
  body: string;
  description?: string;
  type?: string;
  isDefault?: boolean;
}

/**
 * Input for updating an existing template
 */
export interface UpdateTemplateInput {
  name?: string;
  body?: string;
  description?: string;
  type?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Return type for the hook
 */
export interface UseSMSTemplatesReturn {
  templates: SmsTemplate[];
  loading: boolean;
  error: string | null;
  createTemplate: (input: CreateTemplateInput) => Promise<string>;
  updateTemplate: (templateId: string, input: UpdateTemplateInput) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (template: SmsTemplate) => Promise<string>;
  setDefaultTemplate: (templateId: string, type: string) => Promise<void>;
}

/**
 * Hook for managing SMS templates with real-time updates
 *
 * @param orgId - Organization ID
 * @param userId - Current user ID (for createdBy tracking)
 */
export function useSMSTemplates(
  orgId: string | undefined,
  userId?: string
): UseSMSTemplatesReturn {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to templates collection
  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
            createdAt: docData.createdAt instanceof Timestamp
              ? docData.createdAt.toDate()
              : docData.createdAt || new Date(),
            updatedAt: docData.updatedAt instanceof Timestamp
              ? docData.updatedAt.toDate()
              : docData.updatedAt,
          } as SmsTemplate;
        });
        setTemplates(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading SMS templates:', err);
        setError('Failed to load SMS templates');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  /**
   * Create a new template
   */
  const createTemplate = useCallback(
    async (input: CreateTemplateInput): Promise<string> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const detectedVariables = parseTemplateVariables(input.body);
      const type = input.type || 'custom';

      const variables: SmsTemplateVariable[] = detectedVariables.map((name) => {
        const defaultVars = getDefaultTemplateVariables(type as any);
        const existing = defaultVars.find((v) => v.name === name);
        return existing || { name, description: '', required: false };
      });

      const templateData = {
        orgId,
        name: input.name.trim(),
        description: input.description?.trim() || '',
        type,
        body: input.body,
        variables,
        isDefault: input.isDefault || false,
        isActive: true,
        createdBy: userId || 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'smsTemplates'), templateData);
      return docRef.id;
    },
    [orgId, userId]
  );

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(
    async (templateId: string, input: UpdateTemplateInput): Promise<void> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      if (input.description !== undefined) {
        updateData.description = input.description.trim();
      }
      if (input.type !== undefined) {
        updateData.type = input.type;
      }
      if (input.isDefault !== undefined) {
        updateData.isDefault = input.isDefault;
      }
      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }
      if (input.body !== undefined) {
        updateData.body = input.body;

        // Re-parse variables when body changes
        const detectedVariables = parseTemplateVariables(input.body);
        const type = input.type || templates.find((t) => t.id === templateId)?.type || 'custom';

        const variables: SmsTemplateVariable[] = detectedVariables.map((name) => {
          const defaultVars = getDefaultTemplateVariables(type as any);
          const existing = defaultVars.find((v) => v.name === name);
          return existing || { name, description: '', required: false };
        });

        updateData.variables = variables;
      }

      await updateDoc(doc(db, 'smsTemplates', templateId), updateData);
    },
    [orgId, templates]
  );

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    await deleteDoc(doc(db, 'smsTemplates', templateId));
  }, [orgId]);

  /**
   * Duplicate an existing template
   */
  const duplicateTemplate = useCallback(
    async (template: SmsTemplate): Promise<string> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const duplicateData = {
        orgId,
        name: `${template.name} (Copy)`,
        description: template.description || '',
        type: template.type,
        body: template.body,
        variables: template.variables,
        isDefault: false,
        isActive: true,
        createdBy: userId || 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'smsTemplates'), duplicateData);
      return docRef.id;
    },
    [orgId, userId]
  );

  /**
   * Set a template as the default for its type
   * Automatically unsets any other default templates of the same type
   */
  const setDefaultTemplate = useCallback(
    async (templateId: string, type: string): Promise<void> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Find and unset current defaults of the same type
      const sameTypeDefaults = templates.filter(
        (t) => t.type === type && t.isDefault && t.id !== templateId
      );

      // Unset existing defaults
      for (const t of sameTypeDefaults) {
        await updateDoc(doc(db, 'smsTemplates', t.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }

      // Set the new default
      await updateDoc(doc(db, 'smsTemplates', templateId), {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId, templates]
  );

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
  };
}
