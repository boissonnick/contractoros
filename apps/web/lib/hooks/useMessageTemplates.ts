/**
 * useMessageTemplates Hook
 *
 * Real-time CRUD operations for message templates with default template merging.
 * Uses onSnapshot for real-time Firestore sync.
 * Templates support variable placeholders like {{clientName}}, {{projectName}}, etc.
 *
 * Collection: organizations/{orgId}/messageTemplates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MessageTemplate, MessageTemplateCategory } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Default Templates (baked in, not stored in Firestore)
// ============================================================================

const DEFAULT_MESSAGE_TEMPLATES: Omit<MessageTemplate, 'id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Project Update',
    category: 'project_update',
    content: 'Hi {{clientName}}, here\'s a quick update on {{projectName}}: {{updateDetails}}',
    variables: ['{{clientName}}', '{{projectName}}', '{{updateDetails}}'],
    isDefault: true,
  },
  {
    name: 'Schedule Change',
    category: 'scheduling',
    content: 'The schedule for {{projectName}} has been updated. {{scheduleDetails}}',
    variables: ['{{projectName}}', '{{scheduleDetails}}'],
    isDefault: true,
  },
  {
    name: 'Payment Reminder',
    category: 'payment',
    content: 'Hi {{clientName}}, this is a friendly reminder that payment of {{amount}} for {{projectName}} is due on {{dueDate}}.',
    variables: ['{{clientName}}', '{{amount}}', '{{projectName}}', '{{dueDate}}'],
    isDefault: true,
  },
  {
    name: 'Change Order Notice',
    category: 'change_order',
    content: 'A change order has been submitted for {{projectName}}: {{changeOrderDetails}}. Please review and approve.',
    variables: ['{{projectName}}', '{{changeOrderDetails}}'],
    isDefault: true,
  },
];

// ============================================================================
// Return Type
// ============================================================================

interface UseMessageTemplatesReturn {
  templates: MessageTemplate[];
  loading: boolean;
  error: string | null;
  addTemplate: (template: {
    name: string;
    category: MessageTemplateCategory;
    content: string;
    variables: string[];
  }) => Promise<string>;
  updateTemplate: (
    templateId: string,
    updates: Partial<Pick<MessageTemplate, 'name' | 'category' | 'content' | 'variables'>>
  ) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  getByCategory: (category: MessageTemplateCategory) => MessageTemplate[];
}

// ============================================================================
// Hook
// ============================================================================

export function useMessageTemplates(): UseMessageTemplatesReturn {
  const { user, profile } = useAuth();
  const [orgTemplates, setOrgTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;

  // Real-time listener via onSnapshot
  useEffect(() => {
    if (!orgId) {
      setOrgTemplates([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'organizations', orgId, 'messageTemplates'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const docData = d.data();
          return {
            id: d.id,
            ...docData,
            createdAt: docData.createdAt?.toDate?.() || new Date(),
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          } as MessageTemplate;
        });
        setOrgTemplates(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        logger.error('Error listening to message templates', {
          error: err,
          hook: 'useMessageTemplates',
        });
        setError('Failed to load message templates');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  // Merge org templates with defaults for categories not already customized
  const templates: MessageTemplate[] = (() => {
    if (!orgId) return [];

    const existingCategories = new Set(orgTemplates.map((t) => t.category));
    const defaultsToInclude = DEFAULT_MESSAGE_TEMPLATES
      .filter((dt) => !existingCategories.has(dt.category))
      .map((dt, index) => ({
        id: `default-${dt.category}-${index}`,
        orgId,
        name: dt.name,
        category: dt.category,
        content: dt.content,
        variables: dt.variables,
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as MessageTemplate));

    return [...orgTemplates, ...defaultsToInclude];
  })();

  const addTemplate = useCallback(
    async (template: {
      name: string;
      category: MessageTemplateCategory;
      content: string;
      variables: string[];
    }): Promise<string> => {
      if (!orgId) throw new Error('Organization ID required');
      if (!user?.uid) throw new Error('User not authenticated');

      try {
        const docRef = await addDoc(
          collection(db, 'organizations', orgId, 'messageTemplates'),
          {
            ...template,
            orgId,
            isDefault: false,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }
        );

        toast.success('Template created');
        return docRef.id;
      } catch (err) {
        logger.error('Error creating message template', { error: err, hook: 'useMessageTemplates' });
        toast.error('Failed to create template');
        throw err;
      }
    },
    [orgId, user?.uid]
  );

  const updateTemplate = useCallback(
    async (
      templateId: string,
      updates: Partial<Pick<MessageTemplate, 'name' | 'category' | 'content' | 'variables'>>
    ): Promise<void> => {
      if (!orgId) throw new Error('Organization ID required');

      // If it's a default template, create an org-level override instead
      if (templateId.startsWith('default-')) {
        const defaultTemplate = templates.find((t) => t.id === templateId);
        if (defaultTemplate) {
          await addTemplate({
            name: updates.name || defaultTemplate.name,
            category: updates.category || defaultTemplate.category,
            content: updates.content || defaultTemplate.content,
            variables: updates.variables || defaultTemplate.variables,
          });
          return;
        }
      }

      try {
        const docRef = doc(db, 'organizations', orgId, 'messageTemplates', templateId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        toast.success('Template updated');
      } catch (err) {
        logger.error('Error updating message template', { error: err, hook: 'useMessageTemplates' });
        toast.error('Failed to update template');
        throw err;
      }
    },
    [orgId, templates, addTemplate]
  );

  const deleteTemplate = useCallback(
    async (templateId: string): Promise<void> => {
      if (!orgId) throw new Error('Organization ID required');

      // Cannot delete default templates
      if (templateId.startsWith('default-')) {
        toast.error('Cannot delete default templates');
        throw new Error('Cannot delete default templates');
      }

      try {
        const docRef = doc(db, 'organizations', orgId, 'messageTemplates', templateId);
        await deleteDoc(docRef);

        toast.success('Template deleted');
      } catch (err) {
        logger.error('Error deleting message template', { error: err, hook: 'useMessageTemplates' });
        toast.error('Failed to delete template');
        throw err;
      }
    },
    [orgId]
  );

  const getByCategory = useCallback(
    (category: MessageTemplateCategory): MessageTemplate[] => {
      return templates.filter((t) => t.category === category);
    },
    [templates]
  );

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getByCategory,
  };
}

export default useMessageTemplates;
