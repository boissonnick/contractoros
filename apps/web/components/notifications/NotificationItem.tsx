'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  AtSymbolIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { AppNotification } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onClose?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  invoice_paid: BanknotesIcon,
  payment_received: BanknotesIcon,
  task_assigned: ClipboardDocumentCheckIcon,
  task_due: ClipboardDocumentCheckIcon,
  project_update: FolderIcon,
  mention: AtSymbolIcon,
  estimate_approved: CheckCircleIcon,
  signature_completed: PencilSquareIcon,
  signature_requested: PencilSquareIcon,
  default: BellIcon,
};

const COLOR_MAP: Record<string, string> = {
  invoice_paid: 'text-green-600 bg-green-100',
  payment_received: 'text-green-600 bg-green-100',
  task_assigned: 'text-blue-600 bg-blue-100',
  task_due: 'text-orange-600 bg-orange-100',
  project_update: 'text-purple-600 bg-purple-100',
  mention: 'text-yellow-600 bg-yellow-100',
  estimate_approved: 'text-green-600 bg-green-100',
  signature_completed: 'text-indigo-600 bg-indigo-100',
  signature_requested: 'text-indigo-600 bg-indigo-100',
  default: 'text-gray-600 bg-gray-100',
};

export function NotificationItem({ notification, onRead, onClose }: NotificationItemProps) {
  const router = useRouter();
  const Icon = ICON_MAP[notification.type] || ICON_MAP.default;
  const colorClass = COLOR_MAP[notification.type] || COLOR_MAP.default;

  const handleClick = () => {
    // Mark as read
    if (!notification.isRead) {
      onRead(notification.id);
    }

    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link);
      onClose?.();
    }
  };

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : '';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 text-left transition-colors',
        'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
        !notification.isRead && 'bg-blue-50/50'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {notification.body}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </button>
  );
}

export default NotificationItem;
