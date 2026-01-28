"use client";

import React, { useState } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { AppNotification, NotificationType } from '@/types';
import {
  BellIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  SwatchIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

const TYPE_ICONS: Partial<Record<NotificationType, typeof BellIcon>> = {
  task_assigned: ClipboardDocumentListIcon,
  task_completed: CheckIcon,
  task_due_soon: ExclamationTriangleIcon,
  invoice_paid: CurrencyDollarIcon,
  invoice_overdue: ExclamationTriangleIcon,
  rfi_created: DocumentTextIcon,
  rfi_responded: DocumentTextIcon,
  punch_item_assigned: WrenchScrewdriverIcon,
  message_received: ChatBubbleLeftIcon,
  mention: AtSymbolIcon,
  selection_pending: SwatchIcon,
  selection_made: SwatchIcon,
};

function formatNotifDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'MMM d');
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckIcon className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filter === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-1">
          {filtered.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || BellIcon;
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                  notif.isRead ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg flex-shrink-0 mt-0.5',
                  notif.isRead ? 'bg-gray-100' : 'bg-blue-100'
                )}>
                  <Icon className={cn(
                    'h-4 w-4',
                    notif.isRead ? 'text-gray-400' : 'text-blue-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'text-sm truncate',
                      notif.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'
                    )}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatNotifDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
