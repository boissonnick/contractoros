"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { ScopeMaterial } from '@/types';

export interface SowTemplateItem {
  title: string;
  description?: string;
  specifications?: string;
  materials: ScopeMaterial[];
  laborDescription?: string;
  estimatedHours?: number;
  estimatedCost?: number;
  phaseName?: string; // Phase to assign to when applying
  order: number;
}

export interface SowTemplate {
  id: string;
  orgId: string;
  name: string;
  description: string;
  projectType: string;
  items: SowTemplateItem[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type SowTemplateInput = Omit<SowTemplate, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>;

export function useSowTemplates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<SowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!profile?.orgId) return;

    setLoading(true);
    setError(null);

    try {
      const snap = await getDocs(
        query(
          collection(db, 'sowTemplates'),
          where('orgId', '==', profile.orgId),
          orderBy('name', 'asc')
        )
      );

      const data = snap.docs.map((d) => {
        const docData = d.data();
        return {
          id: d.id,
          ...docData,
          createdAt: docData.createdAt?.toDate?.() || new Date(),
          updatedAt: docData.updatedAt?.toDate?.(),
        } as SowTemplate;
      });

      setTemplates(data);
    } catch (err) {
      console.error('Error loading SOW templates:', err);
      setError(err instanceof Error ? err : new Error('Failed to load templates'));
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const addTemplate = useCallback(async (input: SowTemplateInput): Promise<string> => {
    if (!profile?.orgId) throw new Error('No organization');

    const docRef = await addDoc(collection(db, 'sowTemplates'), {
      ...input,
      orgId: profile.orgId,
      createdAt: Timestamp.now(),
    });

    await loadTemplates();
    return docRef.id;
  }, [profile?.orgId, loadTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<SowTemplateInput>): Promise<void> => {
    if (!profile?.orgId) throw new Error('No organization');

    await updateDoc(doc(db, 'sowTemplates', id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await loadTemplates();
  }, [profile?.orgId, loadTemplates]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    if (!profile?.orgId) throw new Error('No organization');

    await deleteDoc(doc(db, 'sowTemplates', id));
    await loadTemplates();
  }, [profile?.orgId, loadTemplates]);

  const duplicateTemplate = useCallback(async (id: string, newName: string): Promise<string> => {
    if (!profile?.orgId) throw new Error('No organization');

    const template = templates.find((t) => t.id === id);
    if (!template) throw new Error('Template not found');

    return addTemplate({
      name: newName,
      description: template.description,
      projectType: template.projectType,
      items: template.items,
      isDefault: false,
    });
  }, [profile?.orgId, templates, addTemplate]);

  return {
    templates,
    loading,
    error,
    reload: loadTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}
