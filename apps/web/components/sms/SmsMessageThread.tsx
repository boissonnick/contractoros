"use client";

import React, { useMemo } from 'react';
import { SmsMessage } from '@/types';
import { formatPhoneForDisplay } from '@/lib/sms/phoneUtils';
import {
  MessageThread as SharedMessageThread,
  Message,
} from '@/components/messaging';

// ============================================================================
// Types
// ============================================================================

export interface SmsMessageThreadProps {
  messages: SmsMessage[];
  loading?: boolean;
  phoneNumber?: string;
  recipientName?: string;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Using 'org' as the current user ID for outbound messages
const ORG_USER_ID = 'org';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps SMS status to the shared Message status format
 */
function mapSmsStatus(status: SmsMessage['status']): Message['status'] {
  switch (status) {
    case 'queued':
      return 'sending';
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'failed':
    case 'undelivered':
      return 'failed';
    default:
      return 'sent';
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * SmsMessageThread - Display SMS messages in a conversation thread
 *
 * A wrapper around the shared MessageThread component that maintains
 * backward compatibility with the existing SmsMessage interface.
 *
 * Features:
 * - Outbound/inbound message styling
 * - Status indicators (sending, sent, delivered, failed)
 * - Timestamp grouping (Today, Yesterday, dates)
 * - Auto-scroll to latest message
 * - Loading skeleton state
 */
export default function SmsMessageThread({
  messages,
  loading = false,
  phoneNumber,
  recipientName,
  className,
}: SmsMessageThreadProps) {
  // Convert SmsMessage format to the shared Message format
  const convertedMessages: Message[] = useMemo(() => {
    return messages.map((msg) => {
      const isOutbound = msg.direction === 'outbound';
      return {
        id: msg.id,
        content: msg.body,
        senderId: isOutbound ? ORG_USER_ID : 'contact',
        senderName: isOutbound ? 'You' : (recipientName || formatPhoneForDisplay(msg.from)),
        createdAt: new Date(msg.sentAt || msg.createdAt),
        status: mapSmsStatus(msg.status),
      };
    });
  }, [messages, recipientName]);

  // Custom empty state text
  const emptyTitle = 'No messages yet';
  const emptyDescription = phoneNumber
    ? `Start a conversation with ${recipientName || formatPhoneForDisplay(phoneNumber)}`
    : 'Select a contact to start messaging';

  return (
    <SharedMessageThread
      messages={convertedMessages}
      currentUserId={ORG_USER_ID}
      currentUserName="You"
      loading={loading}
      showReadStatus={true}
      hideInput={true}
      emptyStateTitle={emptyTitle}
      emptyStateDescription={emptyDescription}
      className={className}
    />
  );
}

// Also export as named export for flexibility
export { SmsMessageThread };
