"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { Message, MessageChannel, MessageChannelType, UserProfile } from '@/types';
import { Card, Button, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { format, isToday, isYesterday } from 'date-fns';
import {
  PlusIcon,
  PaperAirplaneIcon,
  HashtagIcon,
  UserIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  HomeModernIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// Channel type labels and icons
const CHANNEL_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  'team': { label: 'Team', icon: UsersIcon, description: 'Internal team discussion' },
  'client': { label: 'Client', icon: HomeModernIcon, description: 'Communication with client' },
  'subs': { label: 'Subcontractors', icon: WrenchScrewdriverIcon, description: 'Subcontractor coordination' },
  'project': { label: 'General', icon: HashtagIcon, description: 'General project discussion' },
};

function formatMessageDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

function channelFromFirestore(id: string, data: Record<string, unknown>): MessageChannel {
  return {
    id,
    orgId: data.orgId as string,
    type: data.type as MessageChannelType,
    name: data.name as string,
    projectId: data.projectId as string | undefined,
    participantIds: (data.participantIds as string[]) || [],
    lastMessageAt: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : undefined,
    lastMessageText: data.lastMessageText as string | undefined,
    lastMessageBy: data.lastMessageBy as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

function messageFromFirestore(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    channelId: data.channelId as string,
    orgId: data.orgId as string,
    senderId: data.senderId as string,
    senderName: data.senderName as string,
    senderAvatar: data.senderAvatar as string | undefined,
    text: data.text as string,
    mentions: (data.mentions as string[]) || [],
    attachmentURL: data.attachmentURL as string | undefined,
    attachmentName: data.attachmentName as string | undefined,
    isEdited: (data.isEdited as boolean) || false,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

// Hook for project-specific channels
function useProjectChannels(projectId: string | null) {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId || !projectId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'messageChannels'),
      where('orgId', '==', profile.orgId),
      where('projectId', '==', projectId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map((d) => channelFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => {
          const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
          const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
          return bTime - aTime;
        });
      setChannels(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId, projectId]);

  const createChannel = useCallback(
    async (input: { name: string; type: MessageChannelType; participantIds?: string[] }) => {
      if (!profile?.orgId || !user || !projectId) throw new Error('No organization or project');

      const participants = input.participantIds?.includes(user.uid)
        ? input.participantIds
        : [...(input.participantIds || []), user.uid];

      const ref = await addDoc(collection(db, 'messageChannels'), {
        orgId: profile.orgId,
        type: input.type,
        name: input.name,
        projectId,
        participantIds: participants,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });

      return ref.id;
    },
    [profile, user, projectId]
  );

  return { channels, loading, createChannel };
}

// Hook for messages in a channel
function useProjectMessages(channelId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc'),
      firestoreLimit(200),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) =>
        messageFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
      setMessages(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [channelId]);

  const sendMessage = useCallback(
    async (text: string, mentions: string[] = []) => {
      if (!channelId || !user || !profile) throw new Error('Missing context');

      await addDoc(collection(db, 'messages'), {
        channelId,
        orgId: profile.orgId,
        senderId: user.uid,
        senderName: profile.displayName || user.email || 'Unknown',
        text,
        mentions,
        isEdited: false,
        createdAt: Timestamp.now(),
      });

      // Update channel's last message
      await updateDoc(doc(db, 'messageChannels', channelId), {
        lastMessageAt: Timestamp.now(),
        lastMessageText: text.slice(0, 100),
        lastMessageBy: profile.displayName || user.email || '',
      });
    },
    [channelId, user, profile]
  );

  return { messages, loading, sendMessage };
}

// New Channel Modal Component
function NewChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, type: MessageChannelType) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<MessageChannelType>('project');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      await onCreate(name.trim(), type);
      onClose();
    } catch {
      toast.error('Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Channel</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., General, Client Updates, Sub Coordination"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CHANNEL_TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key as MessageChannelType)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border text-left transition-colors',
                      type === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{config.label}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!name.trim()} className="flex-1">
              Create Channel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isOwn,
  showSender = true,
}: {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
}) {
  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-600">
        {message.senderName.charAt(0).toUpperCase()}
      </div>
      <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
        {showSender && (
          <div className={cn('flex items-center gap-2 mb-0.5', isOwn && 'flex-row-reverse')}>
            <span className="text-xs font-medium text-gray-700">
              {isOwn ? 'You' : message.senderName}
            </span>
            <span className="text-xs text-gray-400">
              {formatMessageDate(message.createdAt)}
            </span>
          </div>
        )}
        <div
          className={cn(
            'px-3 py-2 rounded-xl text-sm inline-block whitespace-pre-wrap break-words',
            isOwn
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          )}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

export default function ProjectMessagesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();

  // State
  const { channels, loading: channelsLoading, createChannel } = useProjectChannels(projectId);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const { messages, loading: messagesLoading, sendMessage } = useProjectMessages(activeChannelId);
  const [messageText, setMessageText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ uid: string; displayName: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select first channel by default or auto-create if none exist
  useEffect(() => {
    if (!channelsLoading && channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, channelsLoading, activeChannelId]);

  // Fetch team members for @mentions
  useEffect(() => {
    async function fetchTeamMembers() {
      if (!profile?.orgId) return;
      try {
        const q = query(
          collection(db, 'users'),
          where('orgId', '==', profile.orgId),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        const members = snap.docs.map((d) => {
          const data = d.data() as UserProfile;
          return {
            uid: data.uid || d.id,
            displayName: data.displayName || data.email || 'Unknown',
          };
        });
        setTeamMembers(members);
      } catch (err) {
        console.error('Error fetching team members:', err);
      }
    }
    fetchTeamMembers();
  }, [profile?.orgId]);

  // Filter channels by search
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;
    const search = searchQuery.toLowerCase();
    return channels.filter((c) => c.name.toLowerCase().includes(search));
  }, [channels, searchQuery]);

  // Send message handler
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
      setMessageText(text);
    }
  };

  // Create channel handler
  const handleCreateChannel = async (name: string, type: MessageChannelType) => {
    try {
      const channelId = await createChannel({
        name,
        type,
        participantIds: user ? [user.uid] : [],
      });
      setActiveChannelId(channelId);
      toast.success('Channel created');
    } catch {
      toast.error('Failed to create channel');
      throw new Error('Failed to create channel');
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelConfig = activeChannel
    ? CHANNEL_TYPE_CONFIG[activeChannel.type] || CHANNEL_TYPE_CONFIG['project']
    : null;

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-240px)] min-h-[500px]">
      {/* Channel Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">Channels</h3>
            <button
              onClick={() => setShowNewChannel(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="New channel"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          {channels.length > 3 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-8 px-4">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No channels found' : 'No channels yet'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewChannel(true)}
                  className="mt-3"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Channel
                </Button>
              )}
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const config = CHANNEL_TYPE_CONFIG[channel.type] || CHANNEL_TYPE_CONFIG['project'];
              const Icon = config.icon;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                    activeChannelId === channel.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{channel.name}</span>
                  </div>
                  {channel.lastMessageText && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate pl-6">
                      {channel.lastMessageBy && `${channel.lastMessageBy}: `}
                      {channel.lastMessageText}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Area */}
      <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
              title={channels.length === 0 ? 'Start the conversation' : 'Select a channel'}
              description={
                channels.length === 0
                  ? 'Create a channel to start discussing this project with your team, clients, or subcontractors.'
                  : 'Choose a channel from the sidebar or create a new one.'
              }
              action={
                channels.length === 0
                  ? { label: 'Create Channel', onClick: () => setShowNewChannel(true) }
                  : undefined
              }
              size="sm"
            />
          </div>
        ) : (
          <>
            {/* Channel Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                {channelConfig && <channelConfig.icon className="h-5 w-5 text-gray-400" />}
                <div>
                  <h3 className="font-semibold text-gray-900">{activeChannel.name}</h3>
                  <p className="text-xs text-gray-400">
                    {activeChannel.participantIds.length} participant{activeChannel.participantIds.length !== 1 ? 's' : ''}
                    {channelConfig && ` \u00b7 ${channelConfig.description}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Be the first to send a message!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user?.uid;
                  // Show sender name if first message or different sender from previous
                  const showSender = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={isOwn}
                      showSender={showSender}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Message ${activeChannel.name}...`}
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
              <p className="text-xs text-gray-400 mt-1.5">
                Use @name to mention someone. Press Enter to send.
              </p>
            </div>
          </>
        )}
      </Card>

      {/* New Channel Modal */}
      {showNewChannel && (
        <NewChannelModal
          onClose={() => setShowNewChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}
    </div>
  );
}
