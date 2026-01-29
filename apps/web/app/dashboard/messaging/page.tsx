"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Input } from '@/components/ui';
import { useSms, useSmsConversations, useSmsTemplates } from '@/lib/hooks/useSms';
import { SmsComposer, SmsConversationList, SmsMessageThread } from '@/components/sms';
import { SmsConversation, SmsMessage } from '@/types';
import { formatPhoneForDisplay } from '@/lib/sms/phoneUtils';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function MessagingPage() {
  const { profile } = useAuth();
  const { conversations, loading: conversationsLoading, getTotalUnread } = useSmsConversations();
  const { templates, getDefault } = useSmsTemplates();

  const [selectedConversation, setSelectedConversation] = useState<SmsConversation | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const orgId = profile?.orgId;

  // Load messages when conversation is selected
  useEffect(() => {
    if (!orgId || !selectedConversation) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    const q = query(
      collection(db, 'smsMessages'),
      where('orgId', '==', orgId),
      where('to', 'in', [selectedConversation.phoneNumber]),
      orderBy('createdAt', 'asc')
    );

    // We also need to get messages FROM this phone number (inbound)
    // Firestore doesn't support OR queries easily, so we'll use two queries
    const qInbound = query(
      collection(db, 'smsMessages'),
      where('orgId', '==', orgId),
      where('from', '==', selectedConversation.phoneNumber),
      orderBy('createdAt', 'asc')
    );

    let outboundMessages: SmsMessage[] = [];
    let inboundMessages: SmsMessage[] = [];

    const unsubscribeOutbound = onSnapshot(
      q,
      (snapshot) => {
        outboundMessages = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            sentAt: data.sentAt?.toDate(),
            deliveredAt: data.deliveredAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as SmsMessage;
        });

        // Combine and sort
        const allMessages = [...outboundMessages, ...inboundMessages].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        setMessages(allMessages);
        setMessagesLoading(false);
      },
      (err) => {
        console.error('Error loading outbound messages:', err);
        setMessagesLoading(false);
      }
    );

    const unsubscribeInbound = onSnapshot(
      qInbound,
      (snapshot) => {
        inboundMessages = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            sentAt: data.sentAt?.toDate(),
            deliveredAt: data.deliveredAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as SmsMessage;
        });

        // Combine and sort
        const allMessages = [...outboundMessages, ...inboundMessages].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        setMessages(allMessages);
        setMessagesLoading(false);
      },
      (err) => {
        console.error('Error loading inbound messages:', err);
        setMessagesLoading(false);
      }
    );

    return () => {
      unsubscribeOutbound();
      unsubscribeInbound();
    };
  }, [orgId, selectedConversation]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conv.phoneNumber.includes(search) ||
      conv.participantName?.toLowerCase().includes(search)
    );
  });

  const totalUnread = getTotalUnread();

  const handleSelectConversation = (conversation: SmsConversation) => {
    setSelectedConversation(conversation);
    setShowNewMessage(false);
  };

  const handleNewMessage = () => {
    setSelectedConversation(null);
    setShowNewMessage(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-brand-primary text-white text-xs rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <Button onClick={handleNewMessage} className="w-full">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
            </div>
          ) : (
            <SmsConversationList
              conversations={filteredConversations}
              selectedId={selectedConversation?.id}
              onSelect={handleSelectConversation}
            />
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {showNewMessage ? (
          /* New message composer */
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-6">
              <Card className="max-w-2xl mx-auto p-6">
                <SmsComposer
                  templates={templates}
                />
              </Card>
            </div>
          </div>
        ) : selectedConversation ? (
          /* Selected conversation */
          <div className="flex-1 flex flex-col">
            {/* Conversation header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {selectedConversation.participantName ? (
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <PhoneIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.participantName ||
                      formatPhoneForDisplay(selectedConversation.phoneNumber)}
                  </h2>
                  {selectedConversation.participantName && (
                    <p className="text-sm text-gray-500">
                      {formatPhoneForDisplay(selectedConversation.phoneNumber)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <SmsMessageThread
                messages={messages}
                loading={messagesLoading}
                phoneNumber={selectedConversation.phoneNumber}
                recipientName={selectedConversation.participantName}
                className="h-full"
              />
            </div>

            {/* Composer */}
            <div className="bg-white border-t border-gray-200 p-4">
              <SmsComposer
                to={selectedConversation.phoneNumber}
                recipientName={selectedConversation.participantName}
                recipientId={selectedConversation.participantId}
                recipientType={selectedConversation.participantType}
                projectId={selectedConversation.projectId}
                templates={templates}
                compact
              />
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-500 mb-4">
                Choose a conversation from the list or start a new one
              </p>
              <Button onClick={handleNewMessage}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
