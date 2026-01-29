"use client";

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SmsMessage } from '@/types';
import { formatPhoneForDisplay } from '@/lib/sms/phoneUtils';
import { getSmsStatusColor, getSmsStatusLabel } from '@/lib/sms/smsUtils';
import { formatDate } from '@/lib/date-utils';
import {
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export interface SmsMessageThreadProps {
  messages: SmsMessage[];
  loading?: boolean;
  phoneNumber?: string;
  recipientName?: string;
  className?: string;
}

const StatusIcon: Record<SmsMessage['status'], React.ComponentType<{ className?: string }>> = {
  queued: ClockIcon,
  sent: CheckIcon,
  delivered: CheckCircleIcon,
  failed: XCircleIcon,
  undelivered: ExclamationCircleIcon,
};

/**
 * SmsMessageThread - Display messages in a conversation thread
 *
 * Features:
 * - Outbound/inbound message styling
 * - Status indicators
 * - Timestamp grouping
 * - Auto-scroll to latest
 */
export default function SmsMessageThread({
  messages,
  loading = false,
  phoneNumber,
  recipientName,
  className,
}: SmsMessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <MessageSkeleton key={i} isOutbound={i % 2 === 0} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center text-gray-500">
          <p>No messages yet</p>
          {phoneNumber && (
            <p className="text-sm text-gray-400 mt-1">
              Start a conversation with {recipientName || formatPhoneForDisplay(phoneNumber)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = groupByDate(messages);

  return (
    <div className={cn('flex flex-col p-4 space-y-4 overflow-y-auto', className)}>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center mb-4">
            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
              {date}
            </span>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {dateMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: SmsMessage }) {
  const isOutbound = message.direction === 'outbound';
  const Icon = StatusIcon[message.status] || ClockIcon;
  const statusColor = getSmsStatusColor(message.status);

  return (
    <div
      className={cn(
        'flex',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isOutbound
            ? 'bg-brand-primary text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
      >
        {/* Message body */}
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>

        {/* Footer with time and status */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isOutbound ? 'text-white/70' : 'text-gray-500'
          )}
        >
          <span className="text-xs">
            {formatTime(message.sentAt || message.createdAt)}
          </span>

          {isOutbound && (
            <Icon
              className={cn(
                'h-3.5 w-3.5',
                message.status === 'delivered' ? 'text-white' :
                message.status === 'failed' || message.status === 'undelivered' ? 'text-red-300' :
                'text-white/70'
              )}
            />
          )}
        </div>

        {/* Error message */}
        {message.errorMessage && (
          <p className={cn(
            'text-xs mt-1',
            isOutbound ? 'text-red-200' : 'text-red-500'
          )}>
            {message.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function MessageSkeleton({ isOutbound }: { isOutbound: boolean }) {
  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl px-4 py-3 animate-pulse',
          isOutbound ? 'bg-gray-300 rounded-br-sm' : 'bg-gray-200 rounded-bl-sm'
        )}
      >
        <div className="h-4 w-32 bg-gray-400/30 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-400/30 rounded" />
      </div>
    </div>
  );
}

// Helper to group messages by date
function groupByDate(messages: SmsMessage[]): Record<string, SmsMessage[]> {
  const groups: Record<string, SmsMessage[]> = {};

  for (const message of messages) {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  }

  return groups;
}

// Helper to format time
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}
