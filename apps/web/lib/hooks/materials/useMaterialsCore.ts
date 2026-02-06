'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  MaterialItem,
  MaterialStatus,
  MaterialCategory,
  MaterialTransaction,
} from '@/types';
import { convertTimestamp } from './utils';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

// ============================================
// Material Items Hook
// ============================================

export interface UseMaterialsOptions {
  category?: MaterialCategory;
  status?: MaterialStatus;
  searchTerm?: string;
  lowStockOnly?: boolean;
}

export function useMaterialsCore(options: UseMaterialsOptions = {}) {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setMaterials([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const materialsRef = collection(db, 'organizations', orgId, 'materials');
    let q = query(materialsRef, orderBy('name', 'asc'));

    if (options.category) {
      q = query(materialsRef, where('category', '==', options.category), orderBy('name', 'asc'));
    }

    if (options.status) {
      q = query(materialsRef, where('status', '==', options.status), orderBy('name', 'asc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
        })) as MaterialItem[];

        // Client-side filtering
        if (options.searchTerm) {
          const search = options.searchTerm.toLowerCase();
          items = items.filter(
            (item) =>
              item.name.toLowerCase().includes(search) ||
              item.sku?.toLowerCase().includes(search) ||
              item.description?.toLowerCase().includes(search)
          );
        }

        if (options.lowStockOnly) {
          items = items.filter((item) => item.quantityOnHand <= item.reorderPoint);
        }

        setMaterials(items);
        setLoading(false);
      },
      (err) => {
        logger.error('Error fetching materials', { error: err, hook: 'useMaterialsCore' });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.category, options.status, options.searchTerm, options.lowStockOnly]);

  const createMaterial = useCallback(
    async (data: Omit<MaterialItem, 'id' | 'orgId' | 'createdAt' | 'createdBy' | 'quantityAvailable'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const materialsRef = collection(db, 'organizations', orgId, 'materials');
      const quantityAvailable = data.quantityOnHand - data.quantityReserved;

      const docRef = await addDoc(materialsRef, {
        ...data,
        orgId,
        quantityAvailable,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast.success('Material created');
      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  const updateMaterial = useCallback(
    async (id: string, data: Partial<MaterialItem>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const materialRef = doc(db, 'organizations', orgId, 'materials', id);

      // Recalculate available if quantities changed
      let updateData: Record<string, unknown> = { ...data };
      if (data.quantityOnHand !== undefined || data.quantityReserved !== undefined) {
        const currentDoc = await getDoc(materialRef);
        if (currentDoc.exists()) {
          const current = currentDoc.data() as MaterialItem;
          const onHand = data.quantityOnHand ?? current.quantityOnHand;
          const reserved = data.quantityReserved ?? current.quantityReserved;
          updateData.quantityAvailable = onHand - reserved;

          // Update status based on stock
          if (onHand <= 0) {
            updateData.status = 'out_of_stock';
          } else if (onHand <= (data.reorderPoint ?? current.reorderPoint)) {
            updateData.status = 'low_stock';
          } else if (current.status === 'out_of_stock' || current.status === 'low_stock') {
            updateData.status = 'in_stock';
          }
        }
      }

      await updateDoc(materialRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });
    },
    [orgId, profile?.uid]
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      if (!orgId) throw new Error('Not authenticated');

      const materialRef = doc(db, 'organizations', orgId, 'materials', id);
      await deleteDoc(materialRef);
      toast.success('Material deleted');
    },
    [orgId]
  );

  const adjustQuantity = useCallback(
    async (
      id: string,
      adjustment: number,
      reason: MaterialTransaction['type'],
      notes?: string
    ) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const batch = writeBatch(db);
      const materialRef = doc(db, 'organizations', orgId, 'materials', id);
      const materialDoc = await getDoc(materialRef);

      if (!materialDoc.exists()) throw new Error('Material not found');

      const material = materialDoc.data() as MaterialItem;
      const newQuantity = material.quantityOnHand + adjustment;
      const newAvailable = newQuantity - material.quantityReserved;

      // Update material
      let newStatus: MaterialStatus = material.status;
      if (newQuantity <= 0) {
        newStatus = 'out_of_stock';
      } else if (newQuantity <= material.reorderPoint) {
        newStatus = 'low_stock';
      } else {
        newStatus = 'in_stock';
      }

      batch.update(materialRef, {
        quantityOnHand: newQuantity,
        quantityAvailable: newAvailable,
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      // Create transaction record
      const transactionRef = doc(collection(db, 'organizations', orgId, 'materialTransactions'));
      batch.set(transactionRef, {
        orgId,
        materialId: id,
        materialName: material.name,
        type: reason,
        quantity: adjustment,
        unit: material.unit,
        previousQuantity: material.quantityOnHand,
        newQuantity: newQuantity,
        notes,
        transactionDate: serverTimestamp(),
        createdBy: profile.uid,
        createdByName: profile.displayName || 'Unknown',
      });

      await batch.commit();
      toast.success('Quantity adjusted');
    },
    [orgId, profile?.uid, profile?.displayName]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = materials.length;
    const lowStockItems = materials.filter((m) => m.status === 'low_stock').length;
    const outOfStockItems = materials.filter((m) => m.status === 'out_of_stock').length;
    const totalValue = materials.reduce((sum, m) => sum + m.quantityOnHand * m.unitCost, 0);

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
    };
  }, [materials]);

  return {
    materials,
    loading,
    error,
    stats,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustQuantity,
  };
}
