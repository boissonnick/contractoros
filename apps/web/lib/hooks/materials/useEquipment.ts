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
  serverTimestamp,
  writeBatch,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  MaterialCategory,
  EquipmentItem,
  EquipmentCheckout,
  EquipmentCheckoutStatus,
} from '@/types';
import { convertTimestamp } from './utils';

// ============================================
// Equipment Hook
// ============================================

export interface UseEquipmentOptions {
  category?: MaterialCategory;
  status?: EquipmentCheckoutStatus;
  searchTerm?: string;
}

export function useEquipment(options: UseEquipmentOptions = {}) {
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setEquipment([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const equipmentRef = collection(db, 'organizations', orgId, 'equipment');
    let q = query(equipmentRef, where('isActive', '==', true), orderBy('name', 'asc'));

    if (options.status) {
      q = query(
        equipmentRef,
        where('isActive', '==', true),
        where('status', '==', options.status),
        orderBy('name', 'asc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          purchaseDate: convertTimestamp(doc.data().purchaseDate),
          rentalStartDate: convertTimestamp(doc.data().rentalStartDate),
          rentalEndDate: convertTimestamp(doc.data().rentalEndDate),
          checkedOutAt: convertTimestamp(doc.data().checkedOutAt),
          expectedReturnDate: convertTimestamp(doc.data().expectedReturnDate),
          lastMaintenanceDate: convertTimestamp(doc.data().lastMaintenanceDate),
          nextMaintenanceDate: convertTimestamp(doc.data().nextMaintenanceDate),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
        })) as EquipmentItem[];

        // Client-side filtering
        if (options.category) {
          items = items.filter((item) => item.category === options.category);
        }

        if (options.searchTerm) {
          const search = options.searchTerm.toLowerCase();
          items = items.filter(
            (item) =>
              item.name.toLowerCase().includes(search) ||
              item.serialNumber?.toLowerCase().includes(search) ||
              item.assetTag?.toLowerCase().includes(search)
          );
        }

        setEquipment(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching equipment:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.category, options.status, options.searchTerm]);

  const createEquipment = useCallback(
    async (data: Omit<EquipmentItem, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const equipmentRef = collection(db, 'organizations', orgId, 'equipment');
      const docRef = await addDoc(equipmentRef, {
        ...data,
        orgId,
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      return docRef.id;
    },
    [orgId, profile?.uid]
  );

  const updateEquipment = useCallback(
    async (id: string, data: Partial<EquipmentItem>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const equipmentRef = doc(db, 'organizations', orgId, 'equipment', id);
      await updateDoc(equipmentRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });
    },
    [orgId, profile?.uid]
  );

  const checkoutEquipment = useCallback(
    async (equipmentId: string, projectId?: string, projectName?: string, notes?: string) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const batch = writeBatch(db);

      // Update equipment status
      const equipmentRef = doc(db, 'organizations', orgId, 'equipment', equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);

      if (!equipmentDoc.exists()) throw new Error('Equipment not found');

      const equipmentData = equipmentDoc.data() as EquipmentItem;

      batch.update(equipmentRef, {
        status: 'checked_out',
        checkedOutTo: profile.uid,
        checkedOutToName: profile.displayName || 'Unknown',
        checkedOutAt: serverTimestamp(),
        currentProjectId: projectId,
        currentProjectName: projectName,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      // Create checkout record
      const checkoutRef = doc(collection(db, 'organizations', orgId, 'equipmentCheckouts'));
      batch.set(checkoutRef, {
        orgId,
        equipmentId,
        equipmentName: equipmentData.name,
        equipmentSerialNumber: equipmentData.serialNumber,
        checkedOutBy: profile.uid,
        checkedOutByName: profile.displayName || 'Unknown',
        checkedOutAt: serverTimestamp(),
        projectId,
        projectName,
        checkoutNotes: notes,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      await batch.commit();
    },
    [orgId, profile?.uid, profile?.displayName]
  );

  const returnEquipment = useCallback(
    async (
      equipmentId: string,
      condition: EquipmentCheckout['returnCondition'],
      notes?: string
    ) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const batch = writeBatch(db);

      // Update equipment status
      const equipmentRef = doc(db, 'organizations', orgId, 'equipment', equipmentId);
      batch.update(equipmentRef, {
        status: 'available',
        checkedOutTo: null,
        checkedOutToName: null,
        checkedOutAt: null,
        currentProjectId: null,
        currentProjectName: null,
        condition,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      // Find and update active checkout record
      const checkoutsRef = collection(db, 'organizations', orgId, 'equipmentCheckouts');
      const activeCheckout = await getDocs(
        query(
          checkoutsRef,
          where('equipmentId', '==', equipmentId),
          where('status', '==', 'active'),
          limit(1)
        )
      );

      if (!activeCheckout.empty) {
        const checkoutDoc = activeCheckout.docs[0];
        batch.update(checkoutDoc.ref, {
          returnedAt: serverTimestamp(),
          returnedBy: profile.uid,
          returnCondition: condition,
          returnNotes: notes,
          status: 'returned',
        });
      }

      await batch.commit();
    },
    [orgId, profile?.uid]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEquipment = equipment.length;
    const available = equipment.filter((e) => e.status === 'available').length;
    const checkedOut = equipment.filter((e) => e.status === 'checked_out').length;
    const inMaintenance = equipment.filter((e) => e.status === 'maintenance').length;
    const totalValue = equipment.reduce((sum, e) => sum + (e.currentValue || e.purchasePrice || 0), 0);

    return {
      totalEquipment,
      available,
      checkedOut,
      inMaintenance,
      totalValue,
    };
  }, [equipment]);

  return {
    equipment,
    loading,
    error,
    stats,
    createEquipment,
    updateEquipment,
    checkoutEquipment,
    returnEquipment,
  };
}
