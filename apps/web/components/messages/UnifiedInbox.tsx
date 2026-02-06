'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useChannels } from '@/lib/hooks/useMessages';
import type { MessageChannel } from '@/types';

type FilterTab = 'all' | 'internal' | 'client' | 'subcontractor';

interface UnifiedInboxProps {
  basePath?: string;
  activeChannelId?: string;
  className?: string;
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'internal', label: 'Internal' },
  { key: 'client', label: 'Client' },
  { key: 'subcontractor', label: 'Subcontractor' },
];

function getChannelCategory(channel: MessageChannel): FilterTab {
  const nameLower = channel.name.toLowerCase();
  if (nameLower.includes('client') || nameLower.includes('homeowner') || nameLower.includes('owner')) {
    return 'client';
  }
  if (nameLower.includes('sub') || nameLower.includes('vendor') || nameLower.includes('trade')) {
    return 'subcontractor';
  }
  return 'internal';
}

function getChannelIcon(channel: MessageChannel) {
  const category = getChannelCategory(channel);
  switch (category) {
    case 'client':
      return BuildingOffice2Icon;
    case 'subcontractor':
      return WrenchScrewdriverIcon;
    default:
      return UserGroupIcon;
  }
}

interface ChannelRowProps {
  channel: MessageChannel;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

function ChannelRow({ channel, unreadCount, isActive, onClick }: ChannelRowProps) {
  const Icon = getChannelIcon(channel);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-100',
        isActive && 'bg-blue-50 hover:bg-blue-50 border-l-2 border-l-blue-600'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={cn(
              'text-sm truncate',
              unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}
          >
            {channel.name}
          </h4>
          {channel.lastMessageAt && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDistanceToNow(channel.lastMessageAt, { addSuffix: true })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-gray-500 truncate">
            {channel.lastMessageBy && channel.lastMessageText
              ? `${channel.lastMessageBy}: ${channel.lastMessageText}`
              : channel.lastMessageText || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function UnifiedInbox({
  basePath = '/dashboard/messages',
  activeChannelId,
  className,
}: UnifiedInboxProps) {
  const router = useRouter();
  const { channels, loading } = useChannels();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = useMemo(() => {
    let result = channels;

    if (activeFilter !== 'all') {
      result = result.filter((ch) => getChannelCategory(ch) === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.lastMessageText && ch.lastMessageText.toLowerCase().includes(q)) ||
          (ch.lastMessageBy && ch.lastMessageBy.toLowerCase().includes(q))
      );
    }

    return result;
  }, [channels, activeFilter, searchQuery]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: 0, internal: 0, client: 0, subcontractor: 0 };
    for (const ch of channels) {
      const category = getChannelCategory(ch);
      counts.all += 1;
      counts[category] += 1;
    }
    return counts;
  }, [channels]);

  const handleChannelClick = (channelId: string) => {
    router.push(`${basePath}?channel=${channelId}`);
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>

        <div className="relative mt-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex gap-1 px-4 py-2 border-b border-gray-100">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              activeFilter === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
            {filterCounts[tab.key] > 0 && (
              <span className="ml-1 text-[10px] opacity-75">({filterCounts[tab.key]})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <InboxIcon className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {activeFilter === 'all' ? 'No conversations yet' : `No ${activeFilter} conversations`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Messages will appear here when conversations start
            </p>
          </div>
        ) : (
          filteredChannels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              unreadCount={0}
              isActive={channel.id === activeChannelId}
              onClick={() => handleChannelClick(channel.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default UnifiedInbox;
