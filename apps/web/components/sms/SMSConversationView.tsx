"use client";

/**
 * @fileoverview SMS Conversation View Component
 *
 * Displays a full SMS conversation with:
 * - Header with contact info
 * - Message list (inbound left, outbound right)
 * - Input field with send button
 * - Loading and error states
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input, EmptyState, Skeleton } from '@/components/ui';
import { SMSConversation, SMSMessage, useSMSMessages } from '@/lib/hooks/useSms';
import { formatPhoneForDisplay } from '@/lib/sms/phoneUtils';
import { formatRelative } from '@/lib/date-utils';
import { getSmsStatusColor, getSmsStatusLabel } from '@/lib/sms/smsUtils';
import { SmsStatus } from '@/types';
import {
  UserIcon,
  PhoneIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export interface SMSConversationViewProps {
  /** The conversation to display */
  conversation: SMSConversation;
  /** Organization ID */
  orgId: string;
  /** Callback when sending a message */
  onSendMessage: (message: string) => Promise<void>;
  /** Callback when going back (mobile) */
  onBack?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Message status indicator
 */
function MessageStatus({ status }: { status: string }) {
  switch (status) {
    case 'queued':
      return (
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <ClockIcon className="h-3 w-3" />
          Queued
        </span>
      );
    case 'sent':
      return (
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <CheckIcon className="h-3 w-3" />
          Sent
        </span>
      );
    case 'delivered':
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircleIcon className="h-3 w-3" />
          Delivered
        </span>
      );
    case 'failed':
    case 'undelivered':
      return (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <XCircleIcon className="h-3 w-3" />
          Failed
        </span>
      );
    default:
      return null;
  }
}

/**
 * Single message bubble
 */
function MessageBubble({ message }: { message: SMSMessage }) {
  const isOutbound = message.direction === 'outbound';

  return (
    <div
      className={cn(
        'flex flex-col max-w-[75%]',
        isOutbound ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-4 py-2',
          isOutbound
            ? 'bg-brand-primary text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      <div className="flex items-center gap-2 mt-1 px-1">
        <span className="text-xs text-gray-400">
          {formatRelative(message.sentAt)}
        </span>
        {isOutbound && <MessageStatus status={message.status} />}
      </div>
      {message.errorMessage && (
        <div className="flex items-center gap-1 mt-1 px-1 text-xs text-red-500">
          <ExclamationTriangleIcon className="h-3 w-3" />
          {message.errorMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for messages
 */
function MessagesSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Inbound message skeleton */}
      <div className="flex">
        <div className="max-w-[75%]">
          <Skeleton className="h-12 w-48 rounded-2xl rounded-bl-sm" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      </div>
      {/* Outbound message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <Skeleton className="h-16 w-56 rounded-2xl rounded-br-sm" />
          <Skeleton className="h-3 w-20 mt-1 ml-auto" />
        </div>
      </div>
      {/* Inbound message skeleton */}
      <div className="flex">
        <div className="max-w-[75%]">
          <Skeleton className="h-10 w-36 rounded-2xl rounded-bl-sm" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      </div>
      {/* Outbound message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <Skeleton className="h-12 w-44 rounded-2xl rounded-br-sm" />
          <Skeleton className="h-3 w-20 mt-1 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SMSConversationView - Display a full SMS conversation
 *
 * Features:
 * - Header with contact info
 * - Message list with auto-scroll
 * - Inbound messages on left, outbound on right
 * - Status indicators for each message
 * - Input field with send button
 * - Loading and error states
 */
export default function SMSConversationView({
  conversation,
  orgId,
  onSendMessage,
  onBack,
  className,
}: SMSConversationViewProps) {
  const { messages, loading, error, refresh } = useSMSMessages(
    conversation.phoneNumber,
    orgId
  );
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Handle sending a new message
   */
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      // Error is handled in the parent
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle Enter key to send
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Avatar */}
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            {conversation.contactName ? (
              <span className="text-sm font-medium text-gray-600">
                {conversation.contactName[0]?.toUpperCase()}
              </span>
            ) : (
              <PhoneIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {/* Contact info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {conversation.contactName ||
                formatPhoneForDisplay(conversation.phoneNumber)}
            </h2>
            {conversation.contactName && (
              <p className="text-sm text-gray-500">
                {formatPhoneForDisplay(conversation.phoneNumber)}
              </p>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh messages"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50"
      >
        {loading ? (
          <MessagesSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-3" />
            <p className="text-gray-900 font-medium mb-1">
              Failed to load messages
            </p>
            <p className="text-sm text-gray-500 mb-4">{error.message}</p>
            <Button variant="secondary" onClick={refresh}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
            title="No messages yet"
            description={`Start a conversation with ${
              conversation.contactName ||
              formatPhoneForDisplay(conversation.phoneNumber)
            }`}
            className="py-12"
          />
        ) : (
          <div className="p-4 space-y-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            loading={sending}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400 text-center">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}

// Also export as named export
export { SMSConversationView };
