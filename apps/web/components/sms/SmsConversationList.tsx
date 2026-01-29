"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { SmsConversation } from '@/types';
import { formatPhoneForDisplay } from '@/lib/sms/phoneUtils';
import { formatRelative } from '@/lib/date-utils';
import {
  ChatBubbleLeftRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

export interface SmsConversationListProps {
  conversations: SmsConversation[];
  loading?: boolean;
  selectedId?: string;
  onSelect?: (conversation: SmsConversation) => void;
  className?: string;
}

/**
 * SmsConversationList - List of SMS conversations
 *
 * Features:
 * - Shows conversation preview
 * - Unread count badge
 * - Last message direction indicator
 * - Click to open conversation
 */
export default function SmsConversationList({
  conversations,
  loading = false,
  selectedId,
  onSelect,
  className,
}: SmsConversationListProps) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No conversations yet</p>
        <p className="text-sm text-gray-400">Send your first message to get started</p>
      </div>
    );
  }

  return (
    <div className={cn('divide-y divide-gray-100', className)}>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          onClick={onSelect ? () => onSelect(conversation) : undefined}
        />
      ))}
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: SmsConversation;
  isSelected: boolean;
  onClick?: () => void;
}) {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 transition-colors',
        isSelected ? 'bg-brand-primary/5' : 'hover:bg-gray-50',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar/initial */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
            hasUnread ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-600'
          )}>
            {conversation.participantName?.[0]?.toUpperCase() || '?'}
          </div>

          <div className="min-w-0">
            {/* Name/number */}
            <p className={cn(
              'font-medium truncate',
              hasUnread ? 'text-gray-900' : 'text-gray-700'
            )}>
              {conversation.participantName || formatPhoneForDisplay(conversation.phoneNumber)}
            </p>

            {/* Last message preview */}
            <p className={cn(
              'text-sm truncate flex items-center gap-1',
              hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
            )}>
              {conversation.lastMessageDirection === 'outbound' ? (
                <ArrowUpIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-green-500 flex-shrink-0" />
              )}
              <span className="truncate">{conversation.lastMessagePreview}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Time */}
          <span className="text-xs text-gray-400">
            {formatRelative(conversation.lastMessageAt)}
          </span>

          {/* Unread badge */}
          {hasUnread && (
            <span className="bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="px-4 py-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-48 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
