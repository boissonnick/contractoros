'use client';

import React, { useMemo } from 'react';
import {
  MessageThread as SharedMessageThread,
  Message,
  UploadProgressInfo,
} from '@/components/messaging';

// ============================================================================
// Types - Maintaining backward compatibility
// ============================================================================

export interface ThreadMessage {
  id: string;
  content: string;
  senderType: 'contractor' | 'client';
  senderName: string;
  createdAt: Date;
  attachments?: { url: string; type: 'image' | 'file'; name: string }[];
}

interface MessageThreadProps {
  messages: ThreadMessage[];
  contractorName?: string;
  clientName?: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  uploadProgress?: UploadProgressInfo | null;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Using 'client' as the current user ID since client portal messages
// are always from the perspective of the client
const CLIENT_USER_ID = 'client';

// ============================================================================
// Component
// ============================================================================

/**
 * MessageThread - Client Portal Message Thread Component
 *
 * A wrapper around the shared MessageThread component that maintains
 * backward compatibility with the existing ThreadMessage interface.
 *
 * Features:
 * - Message bubbles with different styling for own vs others
 * - Timestamp grouping (Today, Yesterday, dates)
 * - Auto-scroll to bottom on new messages
 * - File attachments with preview
 * - Upload progress indicator
 */
export function MessageThread({
  messages,
  contractorName = 'Contractor',
  clientName = 'You',
  onSendMessage,
  uploadProgress,
  className,
}: MessageThreadProps) {
  // Convert ThreadMessage format to the shared Message format
  const convertedMessages: Message[] = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderType === 'client' ? CLIENT_USER_ID : 'contractor',
      senderName: msg.senderType === 'client' ? clientName : (msg.senderName || contractorName),
      createdAt: new Date(msg.createdAt),
      attachments: msg.attachments,
    }));
  }, [messages, clientName, contractorName]);

  return (
    <SharedMessageThread
      messages={convertedMessages}
      currentUserId={CLIENT_USER_ID}
      currentUserName={clientName}
      onSendMessage={onSendMessage}
      uploadProgress={uploadProgress}
      placeholder="Type a message..."
      emptyStateTitle="No messages yet"
      emptyStateDescription="Send a message to start the conversation"
      className={className}
    />
  );
}

export default MessageThread;
