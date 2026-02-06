"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChannels, useMessages } from '@/lib/hooks/useMessages';
import { useMessageSearch, MessageSearchResult } from '@/lib/hooks/useMessageSearch';
import { Card, Button } from '@/components/ui';
import { UnifiedInbox } from '@/components/messaging/UnifiedInbox';
import { ReadReceipt } from '@/components/messaging/ReadReceipt';
import { MessageTemplates } from '@/components/messaging/MessageTemplates';
import { MentionAutocomplete } from '@/components/messaging/MentionAutocomplete';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import {
  PlusIcon,
  PaperAirplaneIcon,
  HashtagIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  XMarkIcon,
  InboxIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';

function formatMessageDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const { channels, loading: channelsLoading, createChannel, getUnreadCount } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useMessages(activeChannelId);
  const { results: searchResults, loading: searchLoading, search, clearResults } = useMessageSearch();
  const [messageText, setMessageText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarView, setSidebarView] = useState<'channels' | 'inbox'>('channels');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // @mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Compute unread counts for all channels
  const unreadCounts = channels.reduce<Record<string, number>>((acc, ch) => {
    acc[ch.id] = getUnreadCount(ch.id, messages);
    return acc;
  }, {});

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select first channel by default
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  // Mark messages as read when channel changes or new messages arrive
  useEffect(() => {
    if (activeChannelId && messages.length > 0) {
      markAsRead();
    }
  }, [activeChannelId, messages.length, markAsRead]);

  // Handle @mention detection in input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    // Detect @ mention
    const cursorPos = e.target.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex >= 0) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1);
      // Only open if there's no space after @ (or it's right at @)
      if (!textAfterAt.includes(' ')) {
        setMentionOpen(true);
        setMentionQuery(textAfterAt);
        setMentionStartIndex(atIndex);
        return;
      }
    }

    setMentionOpen(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  }, []);

  const handleMentionSelect = useCallback((userId: string, displayName: string) => {
    // Replace @query with @displayName
    const before = messageText.slice(0, mentionStartIndex);
    const after = messageText.slice(mentionStartIndex + 1 + mentionQuery.length);
    const newText = `${before}@${displayName} ${after}`;
    setMessageText(newText);
    setMentionOpen(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
    inputRef.current?.focus();
  }, [messageText, mentionStartIndex, mentionQuery]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');

    // Extract @mentions
    const mentionRegex = /@(\w+(?:\s\w+)?)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    try {
      await sendMessage(text, mentions);
    } catch {
      toast.error('Failed to send message');
      setMessageText(text);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      const channelId = await createChannel({
        name: newChannelName.trim(),
        type: 'project',
        participantIds: user ? [user.uid] : [],
      });
      setActiveChannelId(channelId);
      setNewChannelName('');
      setShowNewChannel(false);
      toast.success('Channel created');
    } catch {
      toast.error('Failed to create channel');
    }
  };

  const handleTemplateSelect = (content: string) => {
    setMessageText((prev) => prev + content);
    inputRef.current?.focus();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await search(searchQuery.trim());
  };

  const handleSearchResultClick = (result: MessageSearchResult) => {
    setActiveChannelId(result.channelId);
    setShowSearch(false);
    setSearchQuery('');
    clearResults();
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  if (channelsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-52 bg-gray-100 rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="flex gap-4 h-[calc(100vh-220px)]">
          <div className="w-80 flex-shrink-0">
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-3 py-3 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-28 bg-gray-200 rounded" />
                      <div className="h-3 w-36 bg-gray-100 rounded mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="flex-1 px-4 py-3 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={"flex gap-3 animate-pulse" + (i % 2 === 0 ? '' : ' flex-row-reverse')}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className={cn('max-w-[70%]', i % 2 === 0 ? '' : 'text-right')}>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                    <div className={"h-10 rounded-xl" + (i % 2 === 0 ? " bg-gray-200 w-48" : " bg-gray-100 w-64")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-gray-500 mt-1">Team communication channels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
            Search
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowNewChannel(true)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New Channel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search all messages..."
              autoFocus
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? 'Searching...' : 'Search'}
          </Button>
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(''); clearResults(); }}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </span>
            <button onClick={clearResults} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          </div>
          {searchResults.map((result, i) => (
            <button
              key={`${result.message.id}-${i}`}
              onClick={() => handleSearchResultClick(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-blue-600">#{result.channelName}</span>
                <span className="text-xs text-gray-400">{result.message.senderName}</span>
                <span className="text-xs text-gray-300">{formatMessageDate(result.message.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 truncate">{result.matchedText}</p>
            </button>
          ))}
        </div>
      )}

      {/* New Channel Modal */}
      {showNewChannel && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Channel name"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChannel(); }}
            autoFocus
          />
          <Button variant="primary" size="sm" onClick={handleCreateChannel}>
            Create
          </Button>
          <button
            onClick={() => { setShowNewChannel(false); setNewChannelName(''); }}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* View Toggle Tabs */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            <button
              onClick={() => setSidebarView('channels')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors',
                sidebarView === 'channels'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <ListBulletIcon className="h-4 w-4" />
              Channels
            </button>
            <button
              onClick={() => setSidebarView('inbox')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors',
                sidebarView === 'inbox'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <InboxIcon className="h-4 w-4" />
              Unified Inbox
            </button>
          </div>

          {/* Sidebar Content */}
          {sidebarView === 'inbox' ? (
            <UnifiedInbox
              channels={channels}
              activeChannelId={activeChannelId}
              onSelectChannel={setActiveChannelId}
              unreadCounts={unreadCounts}
            />
          ) : (
            <div className="flex-1 overflow-y-auto bg-white">
              {channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No channels yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create a channel to get started</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {channels.map((ch) => {
                    const isActive = ch.id === activeChannelId;
                    const unread = unreadCounts[ch.id] || 0;
                    return (
                      <li key={ch.id}>
                        <button
                          onClick={() => setActiveChannelId(ch.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                            isActive && 'bg-blue-50 hover:bg-blue-50'
                          )}
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
                              ch.type === 'project'
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-green-100 text-green-600'
                            )}
                          >
                            {ch.type === 'project' ? (
                              <HashtagIcon className="h-4 w-4" />
                            ) : (
                              <UserIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={cn(
                                'text-sm truncate block',
                                unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                              )}
                            >
                              {ch.name}
                            </span>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {ch.participantIds.length} member{ch.participantIds.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {unread > 0 && (
                            <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Message Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {!activeChannel ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3" />
                <p className="font-medium">Select or create a channel</p>
                <p className="text-sm mt-1">Start a conversation with your team</p>
              </div>
            </div>
          ) : (
            <>
              {/* Channel Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {activeChannel.type === 'project' ? (
                      <HashtagIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <h3 className="font-semibold text-gray-900">{activeChannel.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeChannel.participantIds.length} member{activeChannel.participantIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messagesLoading ? (
                  <div className="space-y-4 py-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={cn('flex gap-3 animate-pulse', i % 2 === 1 && 'flex-row-reverse')}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="max-w-[70%]">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-3 w-16 bg-gray-200 rounded" />
                            <div className="h-3 w-12 bg-gray-100 rounded" />
                          </div>
                          <div className={cn('h-10 rounded-xl', i % 2 === 0 ? 'bg-gray-100 w-48' : 'bg-gray-200 w-56')} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id}>
                        <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-600">
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium text-gray-700">
                                {isOwn ? 'You' : msg.senderName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatMessageDate(msg.createdAt)}
                              </span>
                            </div>
                            <div className={cn(
                              'px-3 py-2 rounded-xl text-sm inline-block',
                              isOwn
                                ? 'bg-brand-primary text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                            )}>
                              {renderMessageText(msg.text)}
                            </div>
                            {/* Read Receipt */}
                            {isOwn && (
                              <div className={cn('flex', isOwn && 'justify-end')}>
                                <ReadReceipt
                                  readBy={msg.readBy}
                                  senderId={msg.senderId}
                                  currentUserId={user?.uid || ''}
                                  participantCount={activeChannel.participantIds.length}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-2 relative">
                  {/* Template Button */}
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Message templates"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (mentionOpen) return; // Let MentionAutocomplete handle keys
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Message #${activeChannel.name}...`}
                    />

                    {/* @Mention Autocomplete */}
                    <MentionAutocomplete
                      query={mentionQuery}
                      isOpen={mentionOpen}
                      onSelect={handleMentionSelect}
                      onClose={() => { setMentionOpen(false); setMentionQuery(''); }}
                      position={{ top: -8, left: 0 }}
                      className="bottom-full mb-1"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Use @name to mention someone. Press Enter to send. Click <DocumentTextIcon className="inline h-3 w-3" /> for templates.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Message Templates Slide-Over */}
      <MessageTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

/**
 * Render message text with @mention highlighting
 */
function renderMessageText(text: string) {
  const parts = text.split(/(@\w+(?:\s\w+)?)/g);

  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-semibold text-blue-200 bg-blue-500/20 rounded px-0.5">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
