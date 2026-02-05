"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Message, MessageChannel, MessageChannelType } from '@/types';
import { useAuth } from '@/lib/auth';

function channelFromFirestore(id: string, data: Record<string, unknown>): MessageChannel {
  return {
    id,
    orgId: data.orgId as string,
    type: data.type as MessageChannelType,
    name: data.name as string,
    projectId: data.projectId as string | undefined,
    participantIds: (data.participantIds as string[]) || [],
    lastMessageAt: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : undefined,
    lastMessageText: data.lastMessageText as string | undefined,
    lastMessageBy: data.lastMessageBy as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

function messageFromFirestore(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    channelId: data.channelId as string,
    orgId: data.orgId as string,
    senderId: data.senderId as string,
    senderName: data.senderName as string,
    senderAvatar: data.senderAvatar as string | undefined,
    text: data.text as string,
    mentions: (data.mentions as string[]) || [],
    attachmentURL: data.attachmentURL as string | undefined,
    attachmentName: data.attachmentName as string | undefined,
    isEdited: (data.isEdited as boolean) || false,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

export function useChannels() {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId || !user?.uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'messageChannels'),
      where('orgId', '==', profile.orgId),
      where('participantIds', 'array-contains', user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map((d) => channelFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => {
          const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
          const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
          return bTime - aTime;
        });
      setChannels(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, user?.uid]);

  const createChannel = useCallback(
    async (input: { name: string; type: MessageChannelType; projectId?: string; participantIds: string[] }) => {
      if (!profile?.orgId || !user) throw new Error('No organization');

      const participants = input.participantIds.includes(user.uid)
        ? input.participantIds
        : [...input.participantIds, user.uid];

      const ref = await addDoc(collection(db, 'messageChannels'), {
        orgId: profile.orgId,
        type: input.type,
        name: input.name,
        projectId: input.projectId || null,
        participantIds: participants,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });

      return ref.id;
    },
    [profile, user]
  );

  return { channels, loading, createChannel };
}

export function useMessages(channelId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc'),
      firestoreLimit(200),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) =>
        messageFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
      setMessages(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [channelId]);

  const sendMessage = useCallback(
    async (text: string, mentions: string[] = []) => {
      if (!channelId || !user || !profile) throw new Error('Missing context');

      await addDoc(collection(db, 'messages'), {
        channelId,
        orgId: profile.orgId,
        senderId: user.uid,
        senderName: profile.displayName || user.email || 'Unknown',
        text,
        mentions,
        isEdited: false,
        createdAt: Timestamp.now(),
      });

      // Update channel's last message
      await updateDoc(doc(db, 'messageChannels', channelId), {
        lastMessageAt: Timestamp.now(),
        lastMessageText: text.slice(0, 100),
        lastMessageBy: profile.displayName || user.email || '',
      });
    },
    [channelId, user, profile]
  );

  return { messages, loading, sendMessage };
}
