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
  Timestamp,
  writeBatch,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  MaterialItem,
  MaterialStatus,
  MaterialCategory,
  EquipmentItem,
  EquipmentCheckout,
  EquipmentCheckoutStatus,
  Supplier,
  MaterialPurchaseOrder,
  MaterialPurchaseOrderStatus,
  MaterialPurchaseOrderLineItem,
  MaterialAllocation,
  MaterialTransaction,
  StorageLocation,
  LowStockAlert,
  LineItemUnit,
} from '@/types';

// Helper to convert Firestore timestamps
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return timestamp;
};

// ============================================
// Material Items Hook
// ============================================

export interface UseMaterialsOptions {
  category?: MaterialCategory;
  status?: MaterialStatus;
  searchTerm?: string;
  lowStockOnly?: boolean;
}

export function useMaterials(options: UseMaterialsOptions = {}) {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
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
        console.error('Error fetching materials:', err);
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

// ============================================
// Suppliers Hook
// ============================================

export function useSuppliers() {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const suppliersRef = collection(db, 'organizations', orgId, 'suppliers');
    const q = query(suppliersRef, where('isActive', '==', true), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
        })) as Supplier[];

        setSuppliers(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching suppliers:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  const createSupplier = useCallback(
    async (data: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const suppliersRef = collection(db, 'organizations', orgId, 'suppliers');
      const docRef = await addDoc(suppliersRef, {
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

  const updateSupplier = useCallback(
    async (id: string, data: Partial<Supplier>) => {
      if (!orgId) throw new Error('Not authenticated');

      const supplierRef = doc(db, 'organizations', orgId, 'suppliers', id);
      await updateDoc(supplierRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      if (!orgId) throw new Error('Not authenticated');

      // Soft delete
      const supplierRef = doc(db, 'organizations', orgId, 'suppliers', id);
      await updateDoc(supplierRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

// ============================================
// Purchase Orders Hook
// ============================================

export interface UsePurchaseOrdersOptions {
  status?: MaterialPurchaseOrderStatus;
  supplierId?: string;
  projectId?: string;
}

export function usePurchaseOrders(options: UsePurchaseOrdersOptions = {}) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<MaterialPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersRef = collection(db, 'organizations', orgId, 'purchaseOrders');
    let q = query(ordersRef, orderBy('orderDate', 'desc'));

    if (options.status) {
      q = query(ordersRef, where('status', '==', options.status), orderBy('orderDate', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          orderDate: convertTimestamp(doc.data().orderDate),
          expectedDeliveryDate: convertTimestamp(doc.data().expectedDeliveryDate),
          actualDeliveryDate: convertTimestamp(doc.data().actualDeliveryDate),
          approvedAt: convertTimestamp(doc.data().approvedAt),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt),
        })) as MaterialPurchaseOrder[];

        // Client-side filtering
        if (options.supplierId) {
          items = items.filter((item) => item.supplierId === options.supplierId);
        }

        if (options.projectId) {
          items = items.filter((item) => item.projectId === options.projectId);
        }

        setOrders(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching purchase orders:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, options.status, options.supplierId, options.projectId]);

  const generateOrderNumber = useCallback(async () => {
    if (!orgId) throw new Error('Not authenticated');

    // Generate order number based on date and count
    const today = new Date();
    const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const ordersRef = collection(db, 'organizations', orgId, 'purchaseOrders');
    const todayOrders = await getDocs(
      query(ordersRef, where('orderNumber', '>=', prefix), where('orderNumber', '<', prefix + 'Z'))
    );

    const count = todayOrders.size + 1;
    return `${prefix}-${String(count).padStart(4, '0')}`;
  }, [orgId]);

  const createPurchaseOrder = useCallback(
    async (
      data: Omit<
        MaterialPurchaseOrder,
        'id' | 'orgId' | 'orderNumber' | 'createdAt' | 'createdBy'
      >
    ) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const orderNumber = await generateOrderNumber();
      const ordersRef = collection(db, 'organizations', orgId, 'purchaseOrders');

      const docRef = await addDoc(ordersRef, {
        ...data,
        orgId,
        orderNumber,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      return docRef.id;
    },
    [orgId, profile?.uid, generateOrderNumber]
  );

  const updatePurchaseOrder = useCallback(
    async (id: string, data: Partial<MaterialPurchaseOrder>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const orderRef = doc(db, 'organizations', orgId, 'purchaseOrders', id);
      await updateDoc(orderRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });
    },
    [orgId, profile?.uid]
  );

  const approvePurchaseOrder = useCallback(
    async (id: string) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const orderRef = doc(db, 'organizations', orgId, 'purchaseOrders', id);
      await updateDoc(orderRef, {
        status: 'approved',
        approvedBy: profile.uid,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });
    },
    [orgId, profile?.uid]
  );

  const receiveItems = useCallback(
    async (
      id: string,
      receivedItems: { lineItemId: string; quantityReceived: number }[]
    ) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const batch = writeBatch(db);
      const orderRef = doc(db, 'organizations', orgId, 'purchaseOrders', id);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) throw new Error('Purchase order not found');

      const order = orderDoc.data() as MaterialPurchaseOrder;

      // Update line items
      const updatedLineItems = order.lineItems.map((item) => {
        const received = receivedItems.find((r) => r.lineItemId === item.id);
        if (received) {
          return {
            ...item,
            quantityReceived: item.quantityReceived + received.quantityReceived,
          };
        }
        return item;
      });

      // Check if fully received
      const allReceived = updatedLineItems.every(
        (item) => item.quantityReceived >= item.quantityOrdered
      );
      const someReceived = updatedLineItems.some((item) => item.quantityReceived > 0);

      let newStatus: MaterialPurchaseOrderStatus = order.status;
      if (allReceived) {
        newStatus = 'received';
      } else if (someReceived) {
        newStatus = 'partial';
      }

      batch.update(orderRef, {
        lineItems: updatedLineItems,
        status: newStatus,
        actualDeliveryDate: allReceived ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });

      // Update material quantities
      for (const received of receivedItems) {
        const lineItem = order.lineItems.find((li) => li.id === received.lineItemId);
        if (lineItem?.materialId) {
          const materialRef = doc(db, 'organizations', orgId, 'materials', lineItem.materialId);
          const materialDoc = await getDoc(materialRef);

          if (materialDoc.exists()) {
            const material = materialDoc.data() as MaterialItem;
            const newQuantity = material.quantityOnHand + received.quantityReceived;

            batch.update(materialRef, {
              quantityOnHand: newQuantity,
              quantityAvailable: newQuantity - material.quantityReserved,
              status:
                newQuantity <= 0
                  ? 'out_of_stock'
                  : newQuantity <= material.reorderPoint
                  ? 'low_stock'
                  : 'in_stock',
              lastPurchasePrice: lineItem.unitCost,
              updatedAt: serverTimestamp(),
              updatedBy: profile.uid,
            });

            // Create transaction record
            const transactionRef = doc(
              collection(db, 'organizations', orgId, 'materialTransactions')
            );
            batch.set(transactionRef, {
              orgId,
              materialId: lineItem.materialId,
              materialName: lineItem.name,
              type: 'purchase',
              quantity: received.quantityReceived,
              unit: lineItem.unit,
              previousQuantity: material.quantityOnHand,
              newQuantity: newQuantity,
              unitCost: lineItem.unitCost,
              totalCost: received.quantityReceived * lineItem.unitCost,
              purchaseOrderId: id,
              transactionDate: serverTimestamp(),
              createdBy: profile.uid,
              createdByName: profile.displayName || 'Unknown',
            });
          }
        }
      }

      await batch.commit();
    },
    [orgId, profile?.uid, profile?.displayName]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'draft'
    ).length;
    const openOrders = orders.filter(
      (o) => o.status === 'ordered' || o.status === 'partial'
    ).length;
    const totalValue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      totalOrders,
      pendingOrders,
      openOrders,
      totalValue,
    };
  }, [orders]);

  return {
    orders,
    loading,
    error,
    stats,
    createPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    receiveItems,
  };
}

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

// ============================================
// Storage Locations Hook
// ============================================

export function useStorageLocations() {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const locationsRef = collection(db, 'organizations', orgId, 'storageLocations');
    const q = query(locationsRef, where('isActive', '==', true), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
        })) as StorageLocation[];

        setLocations(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching locations:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  const createLocation = useCallback(
    async (data: Omit<StorageLocation, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const locationsRef = collection(db, 'organizations', orgId, 'storageLocations');
      const docRef = await addDoc(locationsRef, {
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

  const updateLocation = useCallback(
    async (id: string, data: Partial<StorageLocation>) => {
      if (!orgId) throw new Error('Not authenticated');

      const locationRef = doc(db, 'organizations', orgId, 'storageLocations', id);
      await updateDoc(locationRef, data);
    },
    [orgId]
  );

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
  };
}

// ============================================
// Low Stock Alerts Hook
// ============================================

export function useLowStockAlerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const alertsRef = collection(db, 'organizations', orgId, 'lowStockAlerts');
    const q = query(
      alertsRef,
      where('status', 'in', ['active', 'acknowledged']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          acknowledgedAt: convertTimestamp(doc.data().acknowledgedAt),
          resolvedAt: convertTimestamp(doc.data().resolvedAt),
        })) as LowStockAlert[];

        setAlerts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching alerts:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  const acknowledgeAlert = useCallback(
    async (id: string) => {
      if (!orgId || !profile?.uid) throw new Error('Not authenticated');

      const alertRef = doc(db, 'organizations', orgId, 'lowStockAlerts', id);
      await updateDoc(alertRef, {
        status: 'acknowledged',
        acknowledgedBy: profile.uid,
        acknowledgedAt: serverTimestamp(),
      });
    },
    [orgId, profile?.uid]
  );

  const resolveAlert = useCallback(
    async (id: string, purchaseOrderId?: string) => {
      if (!orgId) throw new Error('Not authenticated');

      const alertRef = doc(db, 'organizations', orgId, 'lowStockAlerts', id);
      await updateDoc(alertRef, {
        status: purchaseOrderId ? 'ordered' : 'resolved',
        purchaseOrderId,
        resolvedAt: serverTimestamp(),
      });
    },
    [orgId]
  );

  return {
    alerts,
    loading,
    error,
    acknowledgeAlert,
    resolveAlert,
  };
}

// ============================================
// Material Transactions Hook
// ============================================

export function useMaterialTransactions(materialId?: string, projectId?: string) {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const transactionsRef = collection(db, 'organizations', orgId, 'materialTransactions');
    let q = query(transactionsRef, orderBy('transactionDate', 'desc'), limit(100));

    if (materialId) {
      q = query(
        transactionsRef,
        where('materialId', '==', materialId),
        orderBy('transactionDate', 'desc'),
        limit(100)
      );
    } else if (projectId) {
      q = query(
        transactionsRef,
        where('projectId', '==', projectId),
        orderBy('transactionDate', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          transactionDate: convertTimestamp(doc.data().transactionDate),
        })) as MaterialTransaction[];

        setTransactions(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, materialId, projectId]);

  return {
    transactions,
    loading,
    error,
  };
}
