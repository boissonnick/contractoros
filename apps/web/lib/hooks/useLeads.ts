"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Lead, ServiceTicket } from '@/types';
import { useAuth } from '@/lib/auth';

export function useLeads() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'leads'),
      where('orgId', '==', profile.orgId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          lastContactDate: data.lastContactDate ? (data.lastContactDate as Timestamp).toDate() : undefined,
          nextFollowUpDate: data.nextFollowUpDate ? (data.nextFollowUpDate as Timestamp).toDate() : undefined,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        } as Lead;
      });
      setLeads(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId]);

  const addLead = useCallback(
    async (input: Omit<Lead, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      const data: Record<string, unknown> = {
        ...input,
        orgId: profile.orgId,
        status: input.status || 'new',
        createdAt: Timestamp.now(),
      };
      if (input.lastContactDate) data.lastContactDate = Timestamp.fromDate(input.lastContactDate);
      if (input.nextFollowUpDate) data.nextFollowUpDate = Timestamp.fromDate(input.nextFollowUpDate);
      await addDoc(collection(db, 'leads'), data);
    },
    [profile]
  );

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
    delete data.id;
    delete data.createdAt;
    if (updates.lastContactDate) data.lastContactDate = Timestamp.fromDate(new Date(updates.lastContactDate));
    if (updates.nextFollowUpDate) data.nextFollowUpDate = Timestamp.fromDate(new Date(updates.nextFollowUpDate));
    await updateDoc(doc(db, 'leads', id), data);
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'leads', id));
  }, []);

  return { leads, loading, addLead, updateLead, deleteLead };
}

export function useServiceTickets(clientId?: string) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'serviceTickets'),
      where('orgId', '==', profile.orgId),
      orderBy('createdAt', 'desc'),
    );

    if (clientId) {
      q = query(
        collection(db, 'serviceTickets'),
        where('orgId', '==', profile.orgId),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc'),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          scheduledDate: data.scheduledDate ? (data.scheduledDate as Timestamp).toDate() : undefined,
          completedDate: data.completedDate ? (data.completedDate as Timestamp).toDate() : undefined,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        } as ServiceTicket;
      });
      setTickets(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, clientId]);

  const addTicket = useCallback(
    async (input: Omit<ServiceTicket, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      const data: Record<string, unknown> = {
        ...input,
        orgId: profile.orgId,
        status: input.status || 'open',
        createdAt: Timestamp.now(),
      };
      if (input.scheduledDate) data.scheduledDate = Timestamp.fromDate(input.scheduledDate);
      await addDoc(collection(db, 'serviceTickets'), data);
    },
    [profile]
  );

  const updateTicket = useCallback(async (id: string, updates: Partial<ServiceTicket>) => {
    const data: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
    delete data.id;
    delete data.createdAt;
    if (updates.scheduledDate) data.scheduledDate = Timestamp.fromDate(new Date(updates.scheduledDate));
    if (updates.completedDate) data.completedDate = Timestamp.fromDate(new Date(updates.completedDate));
    await updateDoc(doc(db, 'serviceTickets', id), data);
  }, []);

  return { tickets, loading, addTicket, updateTicket };
}
