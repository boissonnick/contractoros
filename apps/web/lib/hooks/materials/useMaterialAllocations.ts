'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { MaterialItem, MaterialAllocation } from '@/types';
import { convertTimestamp } from './utils';

// ============================================
// Material Allocations Hook
// ============================================

export function useMaterialAllocations(projectId?: string) {
  const { profile } = useAuth();
  const [allocations, setAllocations] = useState<MaterialAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setAllocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const allocationsRef = collection(db, 'organizations', orgId, 'materialAllocations');
    let q = query(allocationsRef, orderBy('allocatedAt', 'desc'));

    if (projectId) {
      q = query(allocationsRef, where('projectId', '==', projectId), orderBy('allocatedAt', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          allocatedAt: convertTimestamp(doc.data().allocatedAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
        })) as MaterialAllocation[];

        setAllocations(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching allocations:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, projectId]);

  const allocateMaterial = useCallback(
    async (
      materialId: string,
      projectId: string,
      projectName: string,
      quantity: number,
      phaseId?: string,
      phaseName?: string
    ) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const batch = writeBatch(db);

      // Get material
      const materialRef = doc(db, 'organizations', orgId, 'materials', materialId);
      const materialDoc = await getDoc(materialRef);

      if (!materialDoc.exists()) throw new Error('Material not found');

      const material = materialDoc.data() as MaterialItem;

      if (material.quantityAvailable < quantity) {
        throw new Error('Not enough material available');
      }

      // Update material reserved quantity
      batch.update(materialRef, {
        quantityReserved: material.quantityReserved + quantity,
        quantityAvailable: material.quantityAvailable - quantity,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      // Create allocation
      const allocationRef = doc(collection(db, 'organizations', orgId, 'materialAllocations'));
      batch.set(allocationRef, {
        orgId,
        materialId,
        materialName: material.name,
        projectId,
        projectName,
        phaseId,
        phaseName,
        quantityAllocated: quantity,
        quantityUsed: 0,
        quantityRemaining: quantity,
        unit: material.unit,
        unitCost: material.unitCost,
        totalCost: quantity * material.unitCost,
        status: 'allocated',
        allocatedAt: serverTimestamp(),
        allocatedBy: profile.uid,
      });

      // Create transaction
      const transactionRef = doc(collection(db, 'organizations', orgId, 'materialTransactions'));
      batch.set(transactionRef, {
        orgId,
        materialId,
        materialName: material.name,
        type: 'allocate',
        quantity: quantity,
        unit: material.unit,
        previousQuantity: material.quantityAvailable,
        newQuantity: material.quantityAvailable - quantity,
        projectId,
        projectName,
        transactionDate: serverTimestamp(),
        createdBy: profile.uid,
        createdByName: profile.displayName || 'Unknown',
      });

      await batch.commit();
    },
    [orgId, profile?.uid, profile?.displayName]
  );

  const useMaterial = useCallback(
    async (allocationId: string, quantityUsed: number, notes?: string) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const batch = writeBatch(db);

      // Get allocation
      const allocationRef = doc(db, 'organizations', orgId, 'materialAllocations', allocationId);
      const allocationDoc = await getDoc(allocationRef);

      if (!allocationDoc.exists()) throw new Error('Allocation not found');

      const allocation = allocationDoc.data() as MaterialAllocation;

      if (allocation.quantityRemaining < quantityUsed) {
        throw new Error('Not enough allocated material remaining');
      }

      const newUsed = allocation.quantityUsed + quantityUsed;
      const newRemaining = allocation.quantityAllocated - newUsed;
      const newStatus: MaterialAllocation['status'] =
        newRemaining <= 0 ? 'fully_used' : 'partial_used';

      batch.update(allocationRef, {
        quantityUsed: newUsed,
        quantityRemaining: newRemaining,
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Update material quantity
      const materialRef = doc(db, 'organizations', orgId, 'materials', allocation.materialId);
      const materialDoc = await getDoc(materialRef);

      if (materialDoc.exists()) {
        const material = materialDoc.data() as MaterialItem;
        const newOnHand = material.quantityOnHand - quantityUsed;
        const newReserved = material.quantityReserved - quantityUsed;

        batch.update(materialRef, {
          quantityOnHand: newOnHand,
          quantityReserved: newReserved,
          status:
            newOnHand <= 0
              ? 'out_of_stock'
              : newOnHand <= material.reorderPoint
              ? 'low_stock'
              : 'in_stock',
          updatedAt: serverTimestamp(),
          updatedBy: profile.uid,
        });

        // Create transaction
        const transactionRef = doc(collection(db, 'organizations', orgId, 'materialTransactions'));
        batch.set(transactionRef, {
          orgId,
          materialId: allocation.materialId,
          materialName: allocation.materialName,
          type: 'consume',
          quantity: -quantityUsed,
          unit: allocation.unit,
          previousQuantity: material.quantityOnHand,
          newQuantity: newOnHand,
          projectId: allocation.projectId,
          projectName: allocation.projectName,
          notes,
          transactionDate: serverTimestamp(),
          createdBy: profile.uid,
          createdByName: profile.displayName || 'Unknown',
        });
      }

      await batch.commit();
    },
    [orgId, profile?.uid, profile?.displayName]
  );

  return {
    allocations,
    loading,
    error,
    allocateMaterial,
    useMaterial,
  };
}
