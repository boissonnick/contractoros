'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MessageChannel } from '@/types';
import {
  HashtagIcon,
  UserIcon,
  MagnifyingGlassIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

type FilterTab = 'all' | 'unread';

interface UnifiedInboxProps {
  channels: MessageChannel[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  unreadCounts: Record<string, number>;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeDate(date: Date | undefined): string {
  if (!date) return '';
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

// ============================================================================
// Component
// ============================================================================

export function UnifiedInbox({
  channels,
  activeChannelId,
  onSelectChannel,
  unreadCounts,
  className,
}: UnifiedInboxProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredChannels = useMemo(() => {
    let result = channels;

    // Apply search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (ch) =>
          ch.name.toLowerCase().includes(term) ||
          (ch.lastMessageText && ch.lastMessageText.toLowerCase().includes(term))
      );
    }

    // Apply unread filter
    if (activeTab === 'unread') {
      result = result.filter((ch) => (unreadCounts[ch.id] || 0) > 0);
    }

    // Sort by last message time (most recent first)
    return result.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
      const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });
  }, [channels, search, activeTab, unreadCounts]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
    [unreadCounts]
  );

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
          {totalUnread > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded-full">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === 'unread'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Unread
            {totalUnread > 0 && (
              <span className="ml-1 text-blue-600">({totalUnread})</span>
            )}
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <InboxIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {activeTab === 'unread'
                ? 'No unread messages'
                : search
                  ? 'No channels match your search'
                  : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredChannels.map((channel) => {
              const unread = unreadCounts[channel.id] || 0;
              const isActive = channel.id === activeChannelId;

              return (
                <li key={channel.id}>
                  <button
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      isActive && 'bg-blue-50 hover:bg-blue-50',
                      unread > 0 && !isActive && 'bg-blue-50/30'
                    )}
                  >
                    {/* Channel Type Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center',
                        channel.type === 'project'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-green-100 text-green-600'
                      )}
                    >
                      {channel.type === 'project' ? (
                        <HashtagIcon className="h-4 w-4" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-sm truncate',
                            unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          )}
                        >
                          {channel.name}
                        </span>
                        <span className="flex-shrink-0 text-xs text-gray-400">
                          {formatRelativeDate(channel.lastMessageAt || channel.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={cn(
                            'text-xs truncate',
                            unread > 0 ? 'text-gray-700' : 'text-gray-500'
                          )}
                        >
                          {channel.lastMessageBy && channel.lastMessageText
                            ? `${channel.lastMessageBy}: ${channel.lastMessageText}`
                            : channel.lastMessageText || 'No messages yet'}
                        </p>

                        {unread > 0 && (
                          <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UnifiedInbox;
