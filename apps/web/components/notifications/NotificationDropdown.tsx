'use client';

import React from 'react';
import Link from 'next/link';
import { BellSlashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  if (!isOpen) return null;

  const displayNotifications = notifications.slice(0, 10);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div
        className={cn(
          'absolute right-0 top-full mt-2 z-50',
          'w-80 sm:w-96 max-h-[70vh]',
          'bg-white rounded-lg shadow-lg border border-gray-200',
          'flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all read
            </button>
          )}
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
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 10 && (
          <div className="border-t border-gray-100 p-2">
            <Link
              href="/dashboard/notifications"
              onClick={onClose}
              className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded hover:bg-gray-50"
            >
              View all notifications
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default NotificationDropdown;
