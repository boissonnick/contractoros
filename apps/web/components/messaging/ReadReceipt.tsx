'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

interface ReadReceiptProps {
  readBy?: Record<string, Date>;
  senderId: string;
  currentUserId: string;
  participantCount: number;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a display string from the readBy map.
 * Excludes the sender from the reader list since they authored the message.
 */
function buildReadLabel(readBy: Record<string, Date>, senderId: string): string {
  // Get all readers who are NOT the sender
  const readers = Object.keys(readBy).filter((uid) => uid !== senderId);

  if (readers.length === 0) return '';
  if (readers.length === 1) return `Read`;
  if (readers.length === 2) return `Read by ${readers.length}`;
  return `Read by ${readers.length}`;
}

// ============================================================================
// Component
// ============================================================================

export function ReadReceipt({
  readBy,
  senderId,
  currentUserId,
  participantCount,
  className,
}: ReadReceiptProps) {
  // Only show read receipts on the current user's own messages
  if (senderId !== currentUserId) return null;

  // Count readers excluding the sender
  const readerCount = readBy
    ? Object.keys(readBy).filter((uid) => uid !== senderId).length
    : 0;

  // Total possible readers = participants minus the sender
  const maxReaders = Math.max(participantCount - 1, 0);

  // No other participants to read
  if (maxReaders === 0) return null;

  const allRead = readerCount >= maxReaders && maxReaders > 0;
  const someRead = readerCount > 0;

  const label = readBy ? buildReadLabel(readBy, senderId) : '';

  return (
    <div
      className={cn(
        'flex items-center gap-1 mt-0.5',
        className
      )}
    >
      {allRead ? (
        <>
          <CheckCircleIcon className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-[10px] text-blue-500 font-medium">
            {label || 'Read'}
          </span>
        </>
      ) : someRead ? (
        <>
          <CheckCircleIcon className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-[10px] text-gray-400">
            {label || 'Read'}
          </span>
        </>
      ) : (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-gray-300" />
          <span className="text-[10px] text-gray-300">Delivered</span>
        </>
      )}
    </div>
  );
}

export default ReadReceipt;
