/**
 * Assistant Conversation Service
 *
 * Handles persistence of AI assistant conversations to Firestore.
 * Stores conversations and messages for chat history functionality.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChatMessage } from '@/lib/assistant/types';

/**
 * Conversation metadata stored in Firestore
 */
export interface Conversation {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessagePreview?: string;
}

/**
 * Message stored in Firestore (extends ChatMessage with additional fields)
 */
export interface StoredMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: Date;
  conversationId: string;
}

/**
 * Get the conversations collection path for an organization
 */
function getConversationsPath(orgId: string): string {
  return `organizations/${orgId}/assistantConversations`;
}

/**
 * Get the messages collection path for a conversation
 */
function getMessagesPath(orgId: string, conversationId: string): string {
  return `organizations/${orgId}/assistantConversations/${conversationId}/messages`;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  orgId: string,
  userId: string,
  title?: string
): Promise<string> {
  const conversationsRef = collection(db, getConversationsPath(orgId));

  const conversationData = {
    orgId,
    userId,
    title: title || 'New Conversation',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: 0,
  };

  const docRef = await addDoc(conversationsRef, conversationData);
  return docRef.id;
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  orgId: string,
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  const messagesRef = collection(db, getMessagesPath(orgId, conversationId));

  // Save the message
  await setDoc(doc(messagesRef, message.id), {
    ...message,
    conversationId,
    timestamp: Timestamp.fromDate(message.timestamp),
  });

  // Update the conversation metadata
  const conversationRef = doc(db, getConversationsPath(orgId), conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (conversationSnap.exists()) {
    const currentData = conversationSnap.data();
    await setDoc(conversationRef, {
      ...currentData,
      updatedAt: serverTimestamp(),
      messageCount: (currentData.messageCount || 0) + 1,
      lastMessagePreview: message.content.slice(0, 100),
    }, { merge: true });
  }
}

/**
 * Get all messages in a conversation
 */
export async function getConversation(
  orgId: string,
  conversationId: string
): Promise<ChatMessage[]> {
  const messagesRef = collection(db, getMessagesPath(orgId, conversationId));
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      role: data.role,
      content: data.content,
      timestamp: data.timestamp instanceof Timestamp
        ? data.timestamp.toDate()
        : new Date(data.timestamp),
      status: data.status,
      metadata: data.metadata,
    } as ChatMessage;
  });
}

/**
 * List all conversations for an organization (most recent first)
 */
export async function listConversations(
  orgId: string,
  limit = 20
): Promise<Conversation[]> {
  const conversationsRef = collection(db, getConversationsPath(orgId));
  const q = query(
    conversationsRef,
    orderBy('updatedAt', 'desc'),
    firestoreLimit(limit)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      orgId: data.orgId,
      userId: data.userId,
      title: data.title,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : new Date(data.updatedAt),
      messageCount: data.messageCount || 0,
      lastMessagePreview: data.lastMessagePreview,
    };
  });
}

/**
 * Get a single conversation's metadata
 */
export async function getConversationMeta(
  orgId: string,
  conversationId: string
): Promise<Conversation | null> {
  const conversationRef = doc(db, getConversationsPath(orgId), conversationId);
  const snapshot = await getDoc(conversationRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    orgId: data.orgId,
    userId: data.userId,
    title: data.title,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : new Date(data.updatedAt),
    messageCount: data.messageCount || 0,
    lastMessagePreview: data.lastMessagePreview,
  };
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  orgId: string,
  conversationId: string
): Promise<void> {
  // Delete all messages in the conversation
  const messagesRef = collection(db, getMessagesPath(orgId, conversationId));
  const messagesSnapshot = await getDocs(messagesRef);

  const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // Delete the conversation document
  const conversationRef = doc(db, getConversationsPath(orgId), conversationId);
  await deleteDoc(conversationRef);
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  orgId: string,
  conversationId: string,
  title: string
): Promise<void> {
  const conversationRef = doc(db, getConversationsPath(orgId), conversationId);
  await setDoc(conversationRef, {
    title,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Get the most recent conversation for a user
 */
export async function getMostRecentConversation(
  orgId: string,
  userId: string
): Promise<Conversation | null> {
  const conversations = await listConversations(orgId, 1);

  // Filter by userId if needed (for user-specific history)
  const userConversation = conversations.find((c) => c.userId === userId);

  return userConversation || conversations[0] || null;
}
