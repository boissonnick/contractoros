"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChannels, useMessages } from '@/lib/hooks/useMessages';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import {
  PlusIcon,
  PaperAirplaneIcon,
  HashtagIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';

function formatMessageDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { channels, loading: channelsLoading, createChannel } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(activeChannelId);
  const [messageText, setMessageText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    if (!messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');

    // Extract @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    try {
      await sendMessage(text, mentions);
    } catch {
      toast.error('Failed to send message');
      setMessageText(text); // Restore on failure
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

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Team communication channels</p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Channel Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Channels</h3>
            <button
              onClick={() => setShowNewChannel(true)}
              className="p-1 text-gray-400 hover:text-blue-600"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {showNewChannel && (
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Channel name"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChannel(); }}
                autoFocus
              />
              <Button size="sm" variant="primary" onClick={handleCreateChannel}>
                Add
              </Button>
            </div>
          )}

          <div className="space-y-1 overflow-y-auto flex-1">
            {channels.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No channels yet</p>
            ) : (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    activeChannelId === channel.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {channel.type === 'project' ? (
                      <HashtagIcon className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <UserIcon className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{channel.name}</span>
                  </div>
                  {channel.lastMessageText && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate pl-6">
                      {channel.lastMessageText}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
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
              <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
                      >
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
                            {msg.text}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={`Message #${activeChannel.name}...`}
                  />
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
                  Use @name to mention someone. Press Enter to send.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
