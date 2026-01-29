"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SmsMessage, SmsConversation, SmsTemplate, SmsTemplateType } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

// Convert Firestore data to SmsMessage
function messageFromFirestore(id: string, data: Record<string, unknown>): SmsMessage {
  return {
    id,
    orgId: data.orgId as string,
    to: data.to as string,
    from: data.from as string,
    body: data.body as string,
    direction: data.direction as SmsMessage['direction'],
    twilioMessageSid: data.twilioMessageSid as string | undefined,
    twilioAccountSid: data.twilioAccountSid as string | undefined,
    status: data.status as SmsMessage['status'],
    errorCode: data.errorCode as string | undefined,
    errorMessage: data.errorMessage as string | undefined,
    price: data.price as string | undefined,
    priceUnit: data.priceUnit as string | undefined,
    recipientId: data.recipientId as string | undefined,
    recipientType: data.recipientType as SmsMessage['recipientType'],
    recipientName: data.recipientName as string | undefined,
    projectId: data.projectId as string | undefined,
    invoiceId: data.invoiceId as string | undefined,
    taskId: data.taskId as string | undefined,
    templateId: data.templateId as string | undefined,
    templateType: data.templateType as SmsTemplateType | undefined,
    templateVariables: data.templateVariables as Record<string, string> | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    sentAt: data.sentAt ? (data.sentAt as Timestamp).toDate() : undefined,
    deliveredAt: data.deliveredAt ? (data.deliveredAt as Timestamp).toDate() : undefined,
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
    createdBy: data.createdBy as string | undefined,
    metadata: data.metadata as Record<string, string> | undefined,
  };
}

// Convert Firestore data to SmsConversation
function conversationFromFirestore(id: string, data: Record<string, unknown>): SmsConversation {
  return {
    id,
    orgId: data.orgId as string,
    phoneNumber: data.phoneNumber as string,
    participantId: data.participantId as string | undefined,
    participantType: data.participantType as SmsConversation['participantType'],
    participantName: data.participantName as string | undefined,
    lastMessageAt: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : new Date(),
    lastMessagePreview: data.lastMessagePreview as string,
    lastMessageDirection: data.lastMessageDirection as SmsConversation['lastMessageDirection'],
    unreadCount: (data.unreadCount as number) || 0,
    projectId: data.projectId as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

// Convert Firestore data to SmsTemplate
function templateFromFirestore(id: string, data: Record<string, unknown>): SmsTemplate {
  return {
    id,
    orgId: data.orgId as string,
    name: data.name as string,
    description: data.description as string | undefined,
    type: data.type as SmsTemplateType,
    body: data.body as string,
    variables: (data.variables as SmsTemplate['variables']) || [],
    isActive: (data.isActive as boolean) || true,
    isDefault: (data.isDefault as boolean) || false,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
    createdBy: data.createdBy as string,
  };
}

export interface UseSmsOptions {
  phoneNumber?: string;
  projectId?: string;
  messageLimit?: number;
}

/**
 * Hook for managing SMS messages within an organization
 */
export function useSms(options: UseSmsOptions = {}) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  // Subscribe to SMS messages
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'smsMessages'),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(options.messageLimit || 100)
    );

    // Filter by phone number if provided
    if (options.phoneNumber) {
      q = query(
        collection(db, 'smsMessages'),
        where('orgId', '==', orgId),
        where('to', '==', options.phoneNumber),
        orderBy('createdAt', 'desc'),
        limit(options.messageLimit || 100)
      );
    }

    // Filter by project if provided
    if (options.projectId) {
      q = query(
        collection(db, 'smsMessages'),
        where('orgId', '==', orgId),
        where('projectId', '==', options.projectId),
        orderBy('createdAt', 'desc'),
        limit(options.messageLimit || 100)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => messageFromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useSms error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, options.phoneNumber, options.projectId, options.messageLimit]);

  /**
   * Send an SMS message
   */
  const sendMessage = useCallback(
    async (params: {
      to: string;
      message: string;
      recipientId?: string;
      recipientType?: 'user' | 'client' | 'subcontractor';
      recipientName?: string;
      projectId?: string;
      invoiceId?: string;
      taskId?: string;
      templateId?: string;
      templateVariables?: Record<string, string>;
    }) => {
      if (!user || !orgId) {
        toast.error('You must be logged in to send messages');
        return null;
      }

      try {
        const response = await fetch('/api/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            orgId,
            createdBy: user.uid,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }

        const data = await response.json();
        toast.success('Message sent');
        return data;
      } catch (err) {
        console.error('Send SMS error:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to send message');
        return null;
      }
    },
    [user, orgId]
  );

  /**
   * Get message statistics
   */
  const getStats = useCallback(() => {
    const sent = messages.filter((m) => m.direction === 'outbound');
    const received = messages.filter((m) => m.direction === 'inbound');
    const delivered = messages.filter((m) => m.status === 'delivered');
    const failed = messages.filter((m) => m.status === 'failed' || m.status === 'undelivered');

    return {
      total: messages.length,
      sent: sent.length,
      received: received.length,
      delivered: delivered.length,
      failed: failed.length,
    };
  }, [messages]);

  return {
    messages,
    loading,
    sendMessage,
    getStats,
  };
}

/**
 * Hook for SMS conversations
 */
export function useSmsConversations() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'smsConversations'),
      where('orgId', '==', orgId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setConversations(snapshot.docs.map((d) => conversationFromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useSmsConversations error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  /**
   * Get total unread count
   */
  const getTotalUnread = useCallback(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  return {
    conversations,
    loading,
    getTotalUnread,
  };
}

/**
 * Hook for SMS templates
 */
export function useSmsTemplates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'smsTemplates'),
      where('orgId', '==', orgId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTemplates(snapshot.docs.map((d) => templateFromFirestore(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('useSmsTemplates error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  /**
   * Get templates by type
   */
  const getByType = useCallback(
    (type: SmsTemplateType) => {
      return templates.filter((t) => t.type === type);
    },
    [templates]
  );

  /**
   * Get default template for a type
   */
  const getDefault = useCallback(
    (type: SmsTemplateType) => {
      return templates.find((t) => t.type === type && t.isDefault) ||
        templates.find((t) => t.type === type);
    },
    [templates]
  );

  return {
    templates,
    loading,
    getByType,
    getDefault,
  };
}
