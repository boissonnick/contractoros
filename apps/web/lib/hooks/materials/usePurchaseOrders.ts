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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  MaterialItem,
  MaterialPurchaseOrder,
  MaterialPurchaseOrderStatus,
} from '@/types';
import { convertTimestamp } from './utils';

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
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
