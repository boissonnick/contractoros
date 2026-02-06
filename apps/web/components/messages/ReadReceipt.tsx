'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ReadReceipt as ReadReceiptType } from '@/types';

interface ReadReceiptProps {
  receipts: ReadReceiptType[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function MiniAvatar({ name, size }: { name: string; size: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[9px]';

  return (
    <div
      className={cn(
        'rounded-full bg-gray-300 flex items-center justify-center font-medium text-gray-700 ring-1 ring-white',
        sizeClasses
      )}
    >
      {getInitials(name)}
    </div>
  );
}

function TooltipContent({ receipts }: { receipts: ReadReceiptType[] }) {
  return (
    <div className="absolute bottom-full left-0 mb-1 z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg py-2 px-3 whitespace-nowrap">
      <p className="font-medium mb-1 text-gray-300">Read by</p>
      <ul className="space-y-0.5">
        {receipts.map((receipt) => (
          <li key={receipt.userId} className="flex items-center gap-2">
            <span className="truncate max-w-[140px]">{receipt.userName}</span>
            <span className="text-gray-400">{format(receipt.readAt, 'MMM d, h:mm a')}</span>
          </li>
        ))}
      </ul>
      <div className="absolute -bottom-1 left-3 w-2 h-2 bg-gray-900 rotate-45" />
    </div>
  );
}

export function ReadReceipt({
  receipts,
  maxVisible = 3,
  size = 'sm',
  className,
}: ReadReceiptProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!receipts || receipts.length === 0) return null;

  const sortedReceipts = [...receipts].sort(
    (a, b) => b.readAt.getTime() - a.readAt.getTime()
  );
  const visible = sortedReceipts.slice(0, maxVisible);
  const overflowCount = sortedReceipts.length - maxVisible;

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex -space-x-1.5">
        {visible.map((receipt) => (
          <MiniAvatar key={receipt.userId} name={receipt.userName} size={size} />
        ))}
      </div>

      {overflowCount > 0 && (
        <span
          className={cn(
            'ml-1 text-gray-500 font-medium',
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
        >
          +{overflowCount}
        </span>
      )}

      {showTooltip && <TooltipContent receipts={sortedReceipts} />}
    </div>
  );
}

export default ReadReceipt;
