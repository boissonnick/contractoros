'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BellIcon, BellSlashIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import {
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  AtSymbolIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { AppNotification, NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import { writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Extended props interface for full control
interface NotificationCenterProps {
  className?: string;
  maxVisibleItems?: number;
  showViewAllLink?: boolean;
}

// Icon mapping for all notification types
const NOTIFICATION_ICONS: Record<NotificationType | 'default', React.ComponentType<{ className?: string }>> = {
  task_assigned: ClipboardDocumentCheckIcon,
  task_completed: CheckCircleIcon,
  task_due_soon: ClockIcon,
  rfi_created: DocumentTextIcon,
  rfi_responded: DocumentTextIcon,
  submittal_review: DocumentTextIcon,
  punch_item_assigned: ExclamationTriangleIcon,
  invoice_paid: BanknotesIcon,
  invoice_overdue: ExclamationTriangleIcon,
  expense_approved: CurrencyDollarIcon,
  expense_rejected: XCircleIcon,
  change_order_pending: DocumentTextIcon,
  selection_pending: CalendarIcon,
  selection_made: CheckCircleIcon,
  message_received: ChatBubbleLeftIcon,
  mention: AtSymbolIcon,
  general: BellIcon,
  default: BellIcon,
};

// Color mapping for notification types
const NOTIFICATION_COLORS: Record<NotificationType | 'default', string> = {
  task_assigned: 'text-blue-600 bg-blue-100',
  task_completed: 'text-green-600 bg-green-100',
  task_due_soon: 'text-orange-600 bg-orange-100',
  rfi_created: 'text-purple-600 bg-purple-100',
  rfi_responded: 'text-purple-600 bg-purple-100',
  submittal_review: 'text-indigo-600 bg-indigo-100',
  punch_item_assigned: 'text-red-600 bg-red-100',
  invoice_paid: 'text-green-600 bg-green-100',
  invoice_overdue: 'text-red-600 bg-red-100',
  expense_approved: 'text-green-600 bg-green-100',
  expense_rejected: 'text-red-600 bg-red-100',
  change_order_pending: 'text-yellow-600 bg-yellow-100',
  selection_pending: 'text-yellow-600 bg-yellow-100',
  selection_made: 'text-green-600 bg-green-100',
  message_received: 'text-blue-600 bg-blue-100',
  mention: 'text-yellow-600 bg-yellow-100',
  general: 'text-gray-600 bg-gray-100',
  default: 'text-gray-600 bg-gray-100',
};

/**
 * NotificationCenter - A complete notification dropdown component for the header
 *
 * Features:
 * - Bell icon trigger with animated unread badge
 * - Dropdown panel with scrollable notification list
 * - Mark as read/mark all read functionality
 * - Clear all notifications
 * - Type-based icons and color coding
 * - Navigation to notification links
 * - "View All" link to notifications page
 */
export function NotificationCenter({
  className,
  maxVisibleItems = 7,
  showViewAllLink = true,
}: NotificationCenterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);

  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Animate badge when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (notifications.length === 0) return;

    const batch = writeBatch(db);
    notifications.forEach((n) => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  }, [notifications]);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: AppNotification) => {
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
      if (notification.link) {
        router.push(notification.link);
        setIsOpen(false);
      }
    },
    [markAsRead, router]
  );

  const displayNotifications = notifications.slice(0, maxVisibleItems);
  const hasMoreNotifications = notifications.length > maxVisibleItems;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          isOpen && 'bg-gray-100 text-gray-700'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon className="h-6 w-6" />

        {/* Animated Badge */}
        {!loading && unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5',
              'flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1',
              'text-xs font-bold text-white',
              'bg-red-500 rounded-full',
              'ring-2 ring-white',
              'transform transition-transform duration-300',
              animate && 'animate-bounce'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-80 sm:w-96 max-h-[70vh]',
              'bg-white rounded-lg shadow-lg border border-gray-200',
              'flex flex-col overflow-hidden',
              'animate-in fade-in slide-in-from-top-2 duration-200'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Clear all notifications"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellSlashIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">
                    We'll notify you when something happens
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayNotifications.map((notification) => (
                    <NotificationCenterItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {showViewAllLink && (hasMoreNotifications || notifications.length > 0) && (
              <div className="border-t border-gray-100 p-2">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded hover:bg-gray-50"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Individual notification item within the NotificationCenter dropdown
 */
interface NotificationCenterItemProps {
  notification: AppNotification;
  onClick: () => void;
}

function NotificationCenterItem({ notification, onClick }: NotificationCenterItemProps) {
  const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
  const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.default;

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : '';

  return (
    <button
      onClick={onClick}
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
            'text-sm line-clamp-1',
            notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
          {notification.body}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </button>
  );
}

export default NotificationCenter;
