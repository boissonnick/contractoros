"use client";

/**
 * @fileoverview SMS Messaging Page
 *
 * A dedicated page for SMS messaging with:
 * - List of SMS conversations
 * - Click to open conversation
 * - New message button
 * - Search/filter functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Input, EmptyState, Skeleton } from '@/components/ui';
import { useSMS, SMSConversation, useSmsTemplates } from '@/lib/hooks/useSms';
import {
  SmsComposer,
  SmsConversationList,
  SMSConversationView,
} from '@/components/sms';
import { SmsConversation } from '@/types';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'list' | 'conversation' | 'new';

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Search and filter bar
 */
function SearchFilterBar({
  searchQuery,
  onSearchChange,
  onClear,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search conversations..."
        className="pl-9 pr-9"
      />
      {searchQuery && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
        >
          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}

/**
 * Conversation list loading skeleton
 */
function ConversationListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 animate-pulse">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SMS Messaging Page
 *
 * Features:
 * - Conversation list with search/filter
 * - Click to open conversation in split view
 * - New message composer
 * - Mobile-responsive design
 */
export default function SMSPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const {
    conversations: smsConversations,
    loading,
    error,
    sendMessage,
    totalUnread,
    refreshConversations,
  } = useSMS(orgId);

  const { templates } = useSmsTemplates();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedConversation, setSelectedConversation] =
    useState<SMSConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert SMSConversation to the format expected by SmsConversationList
  const conversationsForList: SmsConversation[] = useMemo(() => {
    return smsConversations.map((conv) => ({
      id: conv.id,
      orgId: orgId || '',
      phoneNumber: conv.phoneNumber,
      participantId: conv.participantId,
      participantType: conv.participantType,
      participantName: conv.contactName,
      lastMessageAt: conv.lastMessageAt || new Date(),
      lastMessagePreview: conv.lastMessage || '',
      lastMessageDirection: 'outbound' as const,
      unreadCount: conv.unreadCount,
      projectId: conv.projectId,
      createdAt: conv.lastMessageAt || new Date(),
    }));
  }, [smsConversations, orgId]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversationsForList;
    const search = searchQuery.toLowerCase();
    return conversationsForList.filter(
      (conv) =>
        conv.phoneNumber.includes(search) ||
        conv.participantName?.toLowerCase().includes(search)
    );
  }, [conversationsForList, searchQuery]);

  /**
   * Handle selecting a conversation
   */
  const handleSelectConversation = useCallback((conv: SmsConversation) => {
    // Convert back to SMSConversation format
    const smsConv: SMSConversation = {
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
    setSelectedConversation(smsConv);
    setViewMode('conversation');
  }, []);

  /**
   * Handle opening new message composer
   */
  const handleNewMessage = useCallback(() => {
    setSelectedConversation(null);
    setViewMode('new');
  }, []);

  /**
   * Handle going back to list (mobile)
   */
  const handleBack = useCallback(() => {
    setSelectedConversation(null);
    setViewMode('list');
  }, []);

  /**
   * Handle sending a message in the current conversation
   */
  const handleSendInConversation = useCallback(
    async (message: string) => {
      if (!selectedConversation) return;
      await sendMessage(
        selectedConversation.phoneNumber,
        message,
        selectedConversation.projectId
      );
    },
    [selectedConversation, sendMessage]
  );

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <XMarkIcon className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load messages
          </h2>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <Button onClick={refreshConversations}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">SMS Messages</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-brand-primary text-white text-xs font-medium rounded-full">
                {totalUnread} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings/sms-templates">
              <Button variant="secondary" size="sm">
                <Cog6ToothIcon className="h-4 w-4 mr-1" />
                Templates
              </Button>
            </Link>
            <Button onClick={handleNewMessage} size="sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Conversations sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white ${
            viewMode !== 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-gray-200">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <ConversationListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
                title={searchQuery ? 'No conversations found' : 'No messages yet'}
                description={
                  searchQuery
                    ? 'Try a different search term'
                    : 'Start a conversation to communicate with clients'
                }
                size="sm"
                className="py-12"
              />
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
        <div
          className={`flex-1 flex flex-col bg-gray-50 ${
            viewMode === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {viewMode === 'new' ? (
            /* New message composer */
            <div className="flex-1 flex flex-col">
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  New Message
                </h2>
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 rounded md:hidden"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <Card className="max-w-2xl mx-auto p-6">
                  <SmsComposer templates={templates} />
                </Card>
              </div>
            </div>
          ) : selectedConversation ? (
            /* Selected conversation */
            <SMSConversationView
              conversation={selectedConversation}
              orgId={orgId || ''}
              onSendMessage={handleSendInConversation}
              onBack={handleBack}
              className="h-full"
            />
          ) : (
            /* Empty state - no conversation selected */
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
    </div>
  );
}
