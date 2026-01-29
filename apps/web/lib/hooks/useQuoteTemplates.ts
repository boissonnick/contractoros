'use client';

/**
 * useQuoteTemplates Hook
 * Handles CRUD operations for quote/estimate PDF templates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { QuotePdfTemplate, createDefaultQuotePdfTemplate } from '@/types';

interface UseQuoteTemplatesReturn {
  templates: QuotePdfTemplate[];
  loading: boolean;
  error: string | null;
  createTemplate: (template: Partial<QuotePdfTemplate>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<QuotePdfTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, newName: string) => Promise<string>;
  setDefaultTemplate: (id: string) => Promise<void>;
  incrementUsage: (id: string) => Promise<void>;
  getDefaultTemplate: () => QuotePdfTemplate | undefined;
}

export function useQuoteTemplates(): UseQuoteTemplatesReturn {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<QuotePdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;

  // Subscribe to templates
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const templatesRef = collection(db, 'organizations', orgId, 'quoteTemplates');
    const templatesQuery = query(
      templatesRef,
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      templatesQuery,
      (snapshot) => {
        const loadedTemplates: QuotePdfTemplate[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loadedTemplates.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            lastUsedAt: data.lastUsedAt?.toDate(),
          } as QuotePdfTemplate);
        });
        setTemplates(loadedTemplates);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading quote templates:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Create a new template
  const createTemplate = useCallback(
    async (templateData: Partial<QuotePdfTemplate>): Promise<string> => {
      if (!orgId || !user) throw new Error('Not authenticated');

      const defaultTemplate = createDefaultQuotePdfTemplate(orgId);

      const newTemplate = {
        ...defaultTemplate,
        ...templateData,
        orgId,
        isDefault: templateData.isDefault ?? false,
        isActive: true,
        usageCount: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // If this is being set as default, unset other defaults first
      if (newTemplate.isDefault) {
        const batch = writeBatch(db);
        templates
          .filter((t) => t.isDefault)
          .forEach((t) => {
            const ref = doc(db, 'organizations', orgId, 'quoteTemplates', t.id);
            batch.update(ref, { isDefault: false, updatedAt: serverTimestamp() });
          });
        await batch.commit();
      }

      const templatesRef = collection(db, 'organizations', orgId, 'quoteTemplates');
      const docRef = await addDoc(templatesRef, newTemplate);
      return docRef.id;
    },
    [orgId, user, templates]
  );

  // Update an existing template
  const updateTemplate = useCallback(
    async (id: string, updates: Partial<QuotePdfTemplate>): Promise<void> => {
      if (!orgId) throw new Error('Not authenticated');

      // If setting as default, unset other defaults first
      if (updates.isDefault) {
        const batch = writeBatch(db);
        templates
          .filter((t) => t.isDefault && t.id !== id)
          .forEach((t) => {
            const ref = doc(db, 'organizations', orgId, 'quoteTemplates', t.id);
            batch.update(ref, { isDefault: false, updatedAt: serverTimestamp() });
          });
        await batch.commit();
      }

      const templateRef = doc(db, 'organizations', orgId, 'quoteTemplates', id);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId, templates]
  );

  // Delete a template (soft delete by setting isActive to false)
  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      if (!orgId) throw new Error('Not authenticated');

      const template = templates.find((t) => t.id === id);
      if (template?.isDefault) {
        throw new Error('Cannot delete the default template');
      }

      const templateRef = doc(db, 'organizations', orgId, 'quoteTemplates', id);
      await updateDoc(templateRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId, templates]
  );

  // Duplicate an existing template
  const duplicateTemplate = useCallback(
    async (id: string, newName: string): Promise<string> => {
      if (!orgId || !user) throw new Error('Not authenticated');

      const template = templates.find((t) => t.id === id);
      if (!template) throw new Error('Template not found');

      const { id: _, createdAt, updatedAt, lastUsedAt, usageCount, isDefault, ...templateData } = template;

      return createTemplate({
        ...templateData,
        name: newName,
        isDefault: false,
      });
    },
    [orgId, user, templates, createTemplate]
  );

  // Set a template as the default
  const setDefaultTemplate = useCallback(
    async (id: string): Promise<void> => {
      if (!orgId) throw new Error('Not authenticated');

      const batch = writeBatch(db);

      // Unset all current defaults
      templates
        .filter((t) => t.isDefault)
        .forEach((t) => {
          const ref = doc(db, 'organizations', orgId, 'quoteTemplates', t.id);
          batch.update(ref, { isDefault: false, updatedAt: serverTimestamp() });
        });

      // Set the new default
      const templateRef = doc(db, 'organizations', orgId, 'quoteTemplates', id);
      batch.update(templateRef, { isDefault: true, updatedAt: serverTimestamp() });

      await batch.commit();
    },
    [orgId, templates]
  );

  // Increment usage count when a template is used
  const incrementUsage = useCallback(
    async (id: string): Promise<void> => {
      if (!orgId) throw new Error('Not authenticated');

      const templateRef = doc(db, 'organizations', orgId, 'quoteTemplates', id);
      await updateDoc(templateRef, {
        usageCount: increment(1),
        lastUsedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  // Get the default template
  const getDefaultTemplate = useCallback((): QuotePdfTemplate | undefined => {
    return templates.find((t) => t.isDefault) || templates[0];
  }, [templates]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
    incrementUsage,
    getDefaultTemplate,
  };
}
