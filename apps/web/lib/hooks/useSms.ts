"use client";

/**
 * @fileoverview SMS Hook for Conversation-based Messaging
 *
 * Provides hooks for SMS conversations and messaging with real-time updates.
 * Integrates with Firestore for data and Cloud Functions for sending messages.
 *
 * Exports:
 * - useSMS: Main hook with the standard interface
 * - useSms: Legacy hook for backward compatibility
 * - useSmsConversations: Hook for conversation list
 * - useSmsTemplates: Hook for SMS templates
 * - useSMSMessages: Hook for fetching messages for a specific conversation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { formatToE164 } from '@/lib/sms/phoneUtils';
import { logger } from '@/lib/utils/logger';

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
        logger.error('useSms error', { error: err, hook: 'useSms' });
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
        logger.error('Send SMS error', { error: err, hook: 'useSms' });
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
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
        logger.error('useSmsConversations error', { error: err, hook: 'useSms' });
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
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
        logger.error('useSmsTemplates error', { error: err, hook: 'useSms' });
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

// ============================================================================
// New Interface Types (Per Specification)
// ============================================================================

/**
 * Simplified SMS Conversation interface
 */
export interface SMSConversation {
  id: string;
  phoneNumber: string;
  contactName?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  projectId?: string;
  participantId?: string;
  participantType?: 'user' | 'client' | 'subcontractor';
}

/**
 * Simplified SMS Message interface
 */
export interface SMSMessage {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sentAt: Date;
  twilioSid?: string;
  recipientName?: string;
  from?: string;
  to?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Result interface for useSMS hook
 */
export interface UseSMSResult {
  conversations: SMSConversation[];
  loading: boolean;
  error: Error | null;
  sendMessage: (to: string, message: string, projectId?: string) => Promise<void>;
  getMessages: (conversationId: string) => SMSMessage[];
  getConversation: (conversationId: string) => SMSConversation | undefined;
  markAsRead: (conversationId: string) => Promise<void>;
  totalUnread: number;
  refreshConversations: () => void;
}

/**
 * Result interface for useSMSMessages hook
 */
export interface UseSMSMessagesResult {
  messages: SMSMessage[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

// ============================================================================
// Helper Functions for New Interface
// ============================================================================

/**
 * Convert SmsConversation to SMSConversation (simplified interface)
 */
function toSimplifiedConversation(conv: SmsConversation): SMSConversation {
  return {
    id: conv.id,
    phoneNumber: conv.phoneNumber,
    contactName: conv.participantName,
    lastMessage: conv.lastMessagePreview,
    lastMessageAt: conv.lastMessageAt,
    unreadCount: conv.unreadCount,
    projectId: conv.projectId,
    participantId: conv.participantId,
    participantType: conv.participantType,
  };
}

/**
 * Convert SmsMessage to SMSMessage (simplified interface)
 */
function toSimplifiedMessage(msg: SmsMessage): SMSMessage {
  return {
    id: msg.id,
    body: msg.body,
    direction: msg.direction,
    status: msg.status,
    sentAt: msg.sentAt || msg.createdAt,
    twilioSid: msg.twilioMessageSid,
    recipientName: msg.recipientName,
    from: msg.from,
    to: msg.to,
    errorCode: msg.errorCode,
    errorMessage: msg.errorMessage,
  };
}

// ============================================================================
// New Hooks (Per Specification)
// ============================================================================

/**
 * Main SMS hook with simplified interface
 *
 * @param orgId - Organization ID to scope the SMS data
 * @returns SMS data and operations
 *
 * @example
 * const { conversations, loading, sendMessage, getMessages } = useSMS(orgId);
 *
 * // Send a message
 * await sendMessage('+15551234567', 'Hello!', projectId);
 */
export function useSMS(orgId: string | undefined): UseSMSResult {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<SMSConversation[]>([]);
  const [messagesCache] = useState<Map<string, SMSMessage[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to conversations
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      setConversations([]);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'smsConversations'),
      where('orgId', '==', orgId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return toSimplifiedConversation(
            conversationFromFirestore(doc.id, data as Record<string, unknown>)
          );
        });
        setConversations(convs);
        setLoading(false);
      },
      (err) => {
        logger.error('useSMS conversations error', { error: err, hook: 'useSms' });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, refreshKey]);

  /**
   * Send an SMS message
   */
  const sendMessage = useCallback(
    async (to: string, message: string, projectId?: string) => {
      if (!user || !orgId) {
        toast.error('You must be logged in to send messages');
        throw new Error('Not authenticated');
      }

      if (!to || !message.trim()) {
        toast.error('Recipient and message are required');
        throw new Error('Invalid parameters');
      }

      try {
        const response = await fetch('/api/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formatToE164(to),
            message: message.trim(),
            orgId,
            projectId,
            createdBy: user.uid,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        toast.success('Message sent');
      } catch (err) {
        logger.error('Send SMS error', { error: err, hook: 'useSms' });
        toast.error(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      }
    },
    [user, orgId]
  );

  /**
   * Get messages for a specific conversation from cache
   */
  const getMessages = useCallback(
    (conversationId: string): SMSMessage[] => {
      return messagesCache.get(conversationId) || [];
    },
    [messagesCache]
  );

  /**
   * Get a specific conversation
   */
  const getConversation = useCallback(
    (conversationId: string): SMSConversation | undefined => {
      return conversations.find((c) => c.id === conversationId);
    },
    [conversations]
  );

  /**
   * Mark a conversation as read
   */
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!orgId) return;

      try {
        const response = await fetch('/api/sms/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            orgId,
          }),
        });

        if (!response.ok) {
          logger.error('Failed to mark conversation as read', { hook: 'useSms' });
        }
      } catch (err) {
        logger.error('Mark as read error', { error: err, hook: 'useSms' });
      }
    },
    [orgId]
  );

  /**
   * Calculate total unread count
   */
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  /**
   * Force refresh conversations
   */
  const refreshConversations = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    conversations,
    loading,
    error,
    sendMessage,
    getMessages,
    getConversation,
    markAsRead,
    totalUnread,
    refreshConversations,
  };
}

/**
 * Hook for fetching messages for a specific conversation
 *
 * Provides real-time updates for messages in a conversation.
 *
 * @param phoneNumber - Phone number to fetch messages for
 * @param orgId - Organization ID
 * @returns Messages data and operations
 *
 * @example
 * const { messages, loading } = useSMSMessages('+15551234567', orgId);
 */
export function useSMSMessages(
  phoneNumber: string | undefined,
  orgId: string | undefined
): UseSMSMessagesResult {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!orgId || !phoneNumber) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    // We need to query messages by phone number
    // Since Firestore doesn't support OR queries easily,
    // we'll use two listeners for inbound and outbound

    let outboundMessages: SMSMessage[] = [];
    let inboundMessages: SMSMessage[] = [];

    // Query for outbound messages (to this phone)
    const outboundQuery = query(
      collection(db, 'smsMessages'),
      where('orgId', '==', orgId),
      where('to', '==', phoneNumber),
      orderBy('createdAt', 'asc')
    );

    // Query for inbound messages (from this phone)
    const inboundQuery = query(
      collection(db, 'smsMessages'),
      where('orgId', '==', orgId),
      where('from', '==', phoneNumber),
      orderBy('createdAt', 'asc')
    );

    const combineAndSort = () => {
      const allMessages = [...outboundMessages, ...inboundMessages].sort(
        (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
      );
      setMessages(allMessages);
      setLoading(false);
    };

    const unsubOutbound = onSnapshot(
      outboundQuery,
      (snapshot) => {
        outboundMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return toSimplifiedMessage(
            messageFromFirestore(doc.id, data as Record<string, unknown>)
          );
        });
        combineAndSort();
      },
      (err) => {
        logger.error('useSMSMessages outbound error', { error: err, hook: 'useSms' });
        setError(err as Error);
        setLoading(false);
      }
    );

    const unsubInbound = onSnapshot(
      inboundQuery,
      (snapshot) => {
        inboundMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return toSimplifiedMessage(
            messageFromFirestore(doc.id, data as Record<string, unknown>)
          );
        });
        combineAndSort();
      },
      (err) => {
        logger.error('useSMSMessages inbound error', { error: err, hook: 'useSms' });
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      unsubOutbound();
      unsubInbound();
    };
  }, [phoneNumber, orgId, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    messages,
    loading,
    error,
    refresh,
  };
}

// Default export for convenience
export default useSMS;
