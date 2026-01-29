"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  increment,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  LineItem,
  LineItemTrade,
  LineItemUnit,
  EstimateTemplate,
  BuilderTemplateItem,
  LineItemPriceHistory,
} from '@/types';
import { toast } from '@/components/ui/Toast';

// =============================================================================
// LINE ITEMS HOOK
// =============================================================================

interface UseLineItemsOptions {
  trade?: LineItemTrade;
  search?: string;
  favoritesOnly?: boolean;
  activeOnly?: boolean;
}

interface UseLineItemsReturn {
  lineItems: LineItem[];
  loading: boolean;
  error: Error | null;

  // CRUD operations
  createLineItem: (data: CreateLineItemData) => Promise<string>;
  updateLineItem: (id: string, data: UpdateLineItemData) => Promise<void>;
  deleteLineItem: (id: string) => Promise<void>;

  // Quick actions
  toggleFavorite: (id: string) => Promise<void>;
  duplicateLineItem: (id: string) => Promise<string>;
  recordUsage: (id: string) => Promise<void>;
  updatePricing: (id: string, pricing: PricingUpdate, reason?: string) => Promise<void>;

  // Bulk operations
  bulkUpdatePricing: (ids: string[], percentChange: number, reason?: string) => Promise<void>;
  importLineItems: (items: CreateLineItemData[]) => Promise<string[]>;

  // Filtering
  getByTrade: (trade: LineItemTrade) => LineItem[];
  getRecent: (limit?: number) => LineItem[];
  getFavorites: () => LineItem[];
  searchLineItems: (query: string) => LineItem[];
}

interface CreateLineItemData {
  name: string;
  description?: string;
  trade: LineItemTrade;
  category?: string;
  unit: LineItemUnit;
  materialCost: number;
  laborCost: number;
  defaultMarkup: number;
  sku?: string;
  supplier?: string;
  supplierSku?: string;
  tags?: string[];
}

interface UpdateLineItemData extends Partial<CreateLineItemData> {
  isActive?: boolean;
  isFavorite?: boolean;
}

interface PricingUpdate {
  materialCost?: number;
  laborCost?: number;
  unitPrice?: number;
}

export function useLineItems(options: UseLineItemsOptions = {}): UseLineItemsReturn {
  const { profile } = useAuth();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  // Subscribe to line items
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'lineItems'),
      where('orgId', '==', orgId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            lastUsedAt: data.lastUsedAt?.toDate(),
          } as LineItem;
        });

        setLineItems(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading line items:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  // Apply client-side filters
  const filteredLineItems = useMemo(() => {
    let items = lineItems;

    if (options.trade) {
      items = items.filter((item) => item.trade === options.trade);
    }

    if (options.favoritesOnly) {
      items = items.filter((item) => item.isFavorite);
    }

    if (options.activeOnly !== false) {
      items = items.filter((item) => item.isActive);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search) ||
          item.sku?.toLowerCase().includes(search) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    return items;
  }, [lineItems, options.trade, options.favoritesOnly, options.activeOnly, options.search]);

  // Calculate unit price from material + labor + markup
  const calculateUnitPrice = useCallback(
    (materialCost: number, laborCost: number, markupPercent: number) => {
      const baseCost = materialCost + laborCost;
      const markup = baseCost * (markupPercent / 100);
      return baseCost + markup;
    },
    []
  );

  // Create line item
  const createLineItem = useCallback(
    async (data: CreateLineItemData): Promise<string> => {
      if (!orgId || !profile?.uid) {
        throw new Error('Not authenticated');
      }

      const unitPrice = calculateUnitPrice(
        data.materialCost,
        data.laborCost,
        data.defaultMarkup
      );

      const docRef = await addDoc(collection(db, 'lineItems'), {
        orgId,
        ...data,
        unitPrice,
        isActive: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Line item created');
      return docRef.id;
    },
    [orgId, profile?.uid, calculateUnitPrice]
  );

  // Update line item
  const updateLineItem = useCallback(
    async (id: string, data: UpdateLineItemData): Promise<void> => {
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Recalculate unit price if pricing changed
      const existingItem = lineItems.find((item) => item.id === id);
      if (existingItem) {
        const materialCost = data.materialCost ?? existingItem.materialCost;
        const laborCost = data.laborCost ?? existingItem.laborCost;
        const markup = data.defaultMarkup ?? existingItem.defaultMarkup;

        updateData.unitPrice = calculateUnitPrice(materialCost, laborCost, markup);
      }

      await updateDoc(doc(db, 'lineItems', id), updateData);
      toast.success('Line item updated');
    },
    [lineItems, calculateUnitPrice]
  );

  // Delete line item
  const deleteLineItem = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'lineItems', id));
    toast.success('Line item deleted');
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const item = lineItems.find((i) => i.id === id);
    if (!item) return;

    await updateDoc(doc(db, 'lineItems', id), {
      isFavorite: !item.isFavorite,
      updatedAt: serverTimestamp(),
    });
  }, [lineItems]);

  // Duplicate line item
  const duplicateLineItem = useCallback(
    async (id: string): Promise<string> => {
      const item = lineItems.find((i) => i.id === id);
      if (!item || !orgId || !profile?.uid) {
        throw new Error('Item not found or not authenticated');
      }

      const docRef = await addDoc(collection(db, 'lineItems'), {
        orgId,
        name: `${item.name} (Copy)`,
        description: item.description,
        trade: item.trade,
        category: item.category,
        unit: item.unit,
        materialCost: item.materialCost,
        laborCost: item.laborCost,
        unitPrice: item.unitPrice,
        defaultMarkup: item.defaultMarkup,
        sku: item.sku ? `${item.sku}-COPY` : undefined,
        supplier: item.supplier,
        supplierSku: item.supplierSku,
        tags: item.tags,
        isActive: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Line item duplicated');
      return docRef.id;
    },
    [lineItems, orgId, profile?.uid]
  );

  // Record usage (increment counter and update last used)
  const recordUsage = useCallback(async (id: string): Promise<void> => {
    await updateDoc(doc(db, 'lineItems', id), {
      usageCount: increment(1),
      lastUsedAt: serverTimestamp(),
    });
  }, []);

  // Update pricing with history
  const updatePricing = useCallback(
    async (id: string, pricing: PricingUpdate, reason?: string): Promise<void> => {
      if (!orgId || !profile?.uid) return;

      const item = lineItems.find((i) => i.id === id);
      if (!item) return;

      const materialCost = pricing.materialCost ?? item.materialCost;
      const laborCost = pricing.laborCost ?? item.laborCost;
      const unitPrice =
        pricing.unitPrice ?? calculateUnitPrice(materialCost, laborCost, item.defaultMarkup);

      const batch = writeBatch(db);

      // Update the line item
      batch.update(doc(db, 'lineItems', id), {
        materialCost,
        laborCost,
        unitPrice,
        updatedAt: serverTimestamp(),
      });

      // Record price history
      const historyRef = doc(collection(db, 'lineItemPriceHistory'));
      batch.set(historyRef, {
        lineItemId: id,
        orgId,
        materialCost,
        laborCost,
        unitPrice,
        reason,
        effectiveDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      await batch.commit();
      toast.success('Pricing updated');
    },
    [lineItems, orgId, profile?.uid, calculateUnitPrice]
  );

  // Bulk update pricing
  const bulkUpdatePricing = useCallback(
    async (ids: string[], percentChange: number, reason?: string): Promise<void> => {
      if (!orgId || !profile?.uid) return;

      const batch = writeBatch(db);
      const multiplier = 1 + percentChange / 100;

      for (const id of ids) {
        const item = lineItems.find((i) => i.id === id);
        if (!item) continue;

        const newMaterialCost = Math.round(item.materialCost * multiplier * 100) / 100;
        const newLaborCost = Math.round(item.laborCost * multiplier * 100) / 100;
        const newUnitPrice = calculateUnitPrice(newMaterialCost, newLaborCost, item.defaultMarkup);

        batch.update(doc(db, 'lineItems', id), {
          materialCost: newMaterialCost,
          laborCost: newLaborCost,
          unitPrice: newUnitPrice,
          updatedAt: serverTimestamp(),
        });

        // Record history
        const historyRef = doc(collection(db, 'lineItemPriceHistory'));
        batch.set(historyRef, {
          lineItemId: id,
          orgId,
          materialCost: newMaterialCost,
          laborCost: newLaborCost,
          unitPrice: newUnitPrice,
          reason: reason || `Bulk adjustment: ${percentChange > 0 ? '+' : ''}${percentChange}%`,
          effectiveDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdBy: profile.uid,
        });
      }

      await batch.commit();
      toast.success(`Updated pricing for ${ids.length} items`);
    },
    [lineItems, orgId, profile?.uid, calculateUnitPrice]
  );

  // Import multiple line items
  const importLineItems = useCallback(
    async (items: CreateLineItemData[]): Promise<string[]> => {
      if (!orgId || !profile?.uid) {
        throw new Error('Not authenticated');
      }

      const ids: string[] = [];
      const batch = writeBatch(db);

      for (const item of items) {
        const docRef = doc(collection(db, 'lineItems'));
        const unitPrice = calculateUnitPrice(
          item.materialCost,
          item.laborCost,
          item.defaultMarkup
        );

        batch.set(docRef, {
          orgId,
          ...item,
          unitPrice,
          isActive: true,
          isFavorite: false,
          usageCount: 0,
          createdAt: serverTimestamp(),
          createdBy: profile.uid,
        });

        ids.push(docRef.id);
      }

      await batch.commit();
      toast.success(`Imported ${items.length} line items`);
      return ids;
    },
    [orgId, profile?.uid, calculateUnitPrice]
  );

  // Filter helpers
  const getByTrade = useCallback(
    (trade: LineItemTrade): LineItem[] => {
      return lineItems.filter((item) => item.trade === trade && item.isActive);
    },
    [lineItems]
  );

  const getRecent = useCallback(
    (limit = 10): LineItem[] => {
      return [...lineItems]
        .filter((item) => item.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt?.getTime() || 0) - (a.lastUsedAt?.getTime() || 0))
        .slice(0, limit);
    },
    [lineItems]
  );

  const getFavorites = useCallback((): LineItem[] => {
    return lineItems.filter((item) => item.isFavorite && item.isActive);
  }, [lineItems]);

  const searchLineItems = useCallback(
    (searchQuery: string): LineItem[] => {
      if (!searchQuery) return lineItems.filter((item) => item.isActive);
      const q = searchQuery.toLowerCase();
      return lineItems.filter(
        (item) =>
          item.isActive &&
          (item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.supplier?.toLowerCase().includes(q) ||
            item.tags?.some((tag) => tag.toLowerCase().includes(q)))
      );
    },
    [lineItems]
  );

  return {
    lineItems: filteredLineItems,
    loading,
    error,
    createLineItem,
    updateLineItem,
    deleteLineItem,
    toggleFavorite,
    duplicateLineItem,
    recordUsage,
    updatePricing,
    bulkUpdatePricing,
    importLineItems,
    getByTrade,
    getRecent,
    getFavorites,
    searchLineItems,
  };
}

// =============================================================================
// ESTIMATE TEMPLATES HOOK
// =============================================================================

interface UseEstimateTemplatesReturn {
  templates: EstimateTemplate[];
  loading: boolean;
  error: Error | null;

  createTemplate: (data: CreateTemplateData) => Promise<string>;
  updateTemplate: (id: string, data: UpdateTemplateData) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<string>;
  recordUsage: (id: string) => Promise<void>;

  getByProjectType: (projectType: string) => EstimateTemplate[];
  getByTrade: (trade: LineItemTrade) => EstimateTemplate[];
}

interface CreateTemplateData {
  name: string;
  description?: string;
  trade?: LineItemTrade;
  projectType?: string;
  lineItems: BuilderTemplateItem[];
  defaultMarkup: number;
  includeTax: boolean;
  defaultTaxRate?: number;
  terms?: string;
  notes?: string;
}

interface UpdateTemplateData extends Partial<CreateTemplateData> {
  isActive?: boolean;
}

export function useEstimateTemplates(): UseEstimateTemplatesReturn {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'estimateTemplates'),
      where('orgId', '==', orgId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            lastUsedAt: data.lastUsedAt?.toDate(),
          } as EstimateTemplate;
        });
        setTemplates(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading estimate templates:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  const createTemplate = useCallback(
    async (data: CreateTemplateData): Promise<string> => {
      if (!orgId || !profile?.uid) {
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, 'estimateTemplates'), {
        orgId,
        ...data,
        isActive: true,
        usageCount: 0,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Template created');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  const updateTemplate = useCallback(
    async (id: string, data: UpdateTemplateData): Promise<void> => {
      await updateDoc(doc(db, 'estimateTemplates', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success('Template updated');
    },
    []
  );

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'estimateTemplates', id));
    toast.success('Template deleted');
  }, []);

  const duplicateTemplate = useCallback(
    async (id: string): Promise<string> => {
      const template = templates.find((t) => t.id === id);
      if (!template || !orgId || !profile?.uid) {
        throw new Error('Template not found');
      }

      const docRef = await addDoc(collection(db, 'estimateTemplates'), {
        orgId,
        name: `${template.name} (Copy)`,
        description: template.description,
        trade: template.trade,
        projectType: template.projectType,
        lineItems: template.lineItems,
        defaultMarkup: template.defaultMarkup,
        includeTax: template.includeTax,
        defaultTaxRate: template.defaultTaxRate,
        terms: template.terms,
        notes: template.notes,
        isActive: true,
        usageCount: 0,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Template duplicated');
      return docRef.id;
    },
    [templates, orgId, profile?.uid]
  );

  const recordUsage = useCallback(async (id: string): Promise<void> => {
    await updateDoc(doc(db, 'estimateTemplates', id), {
      usageCount: increment(1),
      lastUsedAt: serverTimestamp(),
    });
  }, []);

  const getByProjectType = useCallback(
    (projectType: string): EstimateTemplate[] => {
      return templates.filter(
        (t) => t.isActive && t.projectType?.toLowerCase() === projectType.toLowerCase()
      );
    },
    [templates]
  );

  const getByTrade = useCallback(
    (trade: LineItemTrade): EstimateTemplate[] => {
      return templates.filter((t) => t.isActive && t.trade === trade);
    },
    [templates]
  );

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    recordUsage,
    getByProjectType,
    getByTrade,
  };
}

// =============================================================================
// PRICE HISTORY HOOK
// =============================================================================

export function useLineItemPriceHistory(lineItemId: string) {
  const { profile } = useAuth();
  const [history, setHistory] = useState<LineItemPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId || !lineItemId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'lineItemPriceHistory'),
      where('lineItemId', '==', lineItemId),
      where('orgId', '==', profile.orgId),
      orderBy('effectiveDate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            effectiveDate: data.effectiveDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as LineItemPriceHistory;
        });
        setHistory(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading price history:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.orgId, lineItemId]);

  return { history, loading };
}
