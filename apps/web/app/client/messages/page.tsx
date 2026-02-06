"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, FirestoreError } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';
import { Message, MessageChannel, Project } from '@/types';
import {
  ChatBubbleLeftRightIcon,
  HashtagIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

interface MessageThread {
  channel: MessageChannel;
  messages: Message[];
  project?: Project;
  unreadCount: number;
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export default function ClientMessagesPage() {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Cleanup snapshot listeners on unmount
  useEffect(() => {
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub());
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Clean up previous listeners before setting up new ones
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];

    setFetchError(null);
    setLoading(true);

    try {
      // Fetch channels where client is a participant
      const channelsQuery = query(
        collection(db, 'messageChannels'),
        where('participantIds', 'array-contains', user.uid)
      );
      const channelsSnap = await getDocs(channelsQuery);

      const channelsData: MessageChannel[] = channelsSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          orgId: data.orgId,
          type: data.type,
          name: data.name,
          projectId: data.projectId,
          participantIds: data.participantIds || [],
          lastMessageAt: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : undefined,
          lastMessageText: data.lastMessageText,
          lastMessageBy: data.lastMessageBy,
          createdBy: data.createdBy,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        };
      });

      // Sort by most recent message
      channelsData.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
        const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });

      // Fetch projects for project-based channels
      const projectIds = Array.from(new Set(channelsData.filter(c => c.projectId).map(c => c.projectId!)));
      const projectsMap = new Map<string, Project>();

      if (projectIds.length > 0) {
        // Fetch projects in batches of 10 (Firestore 'in' limit)
        for (let i = 0; i < projectIds.length; i += 10) {
          const batch = projectIds.slice(i, i + 10);
          const projectsQuery = query(
            collection(db, 'projects'),
            where('__name__', 'in', batch)
          );
          const projectsSnap = await getDocs(projectsQuery);
          projectsSnap.docs.forEach(d => {
            projectsMap.set(d.id, { id: d.id, ...d.data() } as Project);
          });
        }
      }

      // Build initial threads with empty messages (snapshots will fill them)
      const threadsData: MessageThread[] = channelsData.map((channel) => ({
        channel,
        messages: [],
        project: channel.projectId ? projectsMap.get(channel.projectId) : undefined,
        unreadCount: 0,
      }));

      setThreads(threadsData);

      // Set up real-time listeners for messages in each channel
      const unsubscribes = channelsData.map((channel) => {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('channelId', '==', channel.id),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        return onSnapshot(messagesQuery, (snapshot) => {
          const messages: Message[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              channelId: data.channelId,
              orgId: data.orgId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              text: data.text,
              mentions: data.mentions || [],
              attachmentURL: data.attachmentURL,
              attachmentName: data.attachmentName,
              isEdited: data.isEdited || false,
              createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            };
          });
          // Reverse to show oldest first in expanded view
          messages.reverse();

          setThreads(prev => prev.map(t =>
            t.channel.id === channel.id ? { ...t, messages } : t
          ));
        });
      });

      // Store unsubscribe functions for cleanup
      unsubscribeRefs.current = unsubscribes;
    } catch (error) {
      logger.error('Error fetching messages', { error, page: 'client-messages' });
      setFetchError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-expand first thread if only one exists
  useEffect(() => {
    if (threads.length === 1 && !expandedThreadId) {
      setExpandedThreadId(threads[0].channel.id);
    }
  }, [threads, expandedThreadId]);

  // Group threads by project
  const threadsByProject = useMemo(() => {
    const grouped = new Map<string | null, MessageThread[]>();

    threads.forEach(thread => {
      const projectId = thread.channel.projectId || null;
      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }
      grouped.get(projectId)!.push(thread);
    });

    return grouped;
  }, [threads]);

  const toggleThread = (channelId: string) => {
    setExpandedThreadId(prev => prev === channelId ? null : channelId);
  };

  const handleSend = async (channelId: string) => {
    if (!replyText.trim() || sending || !user?.uid) return;

    const thread = threads.find(t => t.channel.id === channelId);
    if (!thread) return;

    setSending(true);
    try {
      const senderName = profile?.displayName || user.email || 'Client';
      const now = Timestamp.now();

      // Add message to messages collection
      await addDoc(collection(db, 'messages'), {
        channelId,
        orgId: thread.channel.orgId,
        senderId: user.uid,
        senderName,
        text: replyText.trim(),
        createdAt: now,
      });

      // Update channel with latest message info
      await updateDoc(doc(db, 'messageChannels', channelId), {
        lastMessageAt: now,
        lastMessageText: replyText.trim(),
        lastMessageBy: senderName,
      });

      setReplyText('');
    } catch (error) {
      logger.error('Error sending message', { error, page: 'client-messages' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Messages"
          description="Communications about your projects"
        />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Messages"
          description="Communications about your projects"
        />
        <FirestoreError message={fetchError} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Communications about your projects"
      />

      {threads.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
            title="No messages yet"
            description="When your contractor sends you updates or messages, they'll appear here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Message Threads */}
          {Array.from(threadsByProject.entries()).map(([projectId, projectThreads]) => {
            const project = projectThreads[0]?.project;

            return (
              <div key={projectId || 'direct'} className="space-y-3">
                {/* Project Header (if grouped by project) */}
                {projectId && project && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                    <HashtagIcon className="h-4 w-4" />
                    <span className="font-medium">{project.name}</span>
                    {project.address && (
                      <span className="text-gray-400">
                        - {project.address.city}, {project.address.state}
                      </span>
                    )}
                  </div>
                )}

                {!projectId && threadsByProject.size > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">Direct Messages</span>
                  </div>
                )}

                {/* Thread Cards */}
                <div className="space-y-3">
                  {projectThreads.map(thread => {
                    const isExpanded = expandedThreadId === thread.channel.id;
                    const latestMessage = thread.messages[thread.messages.length - 1];

                    return (
                      <Card key={thread.channel.id} className="overflow-hidden">
                        {/* Thread Header - Clickable */}
                        <button
                          onClick={() => toggleThread(thread.channel.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "p-2 rounded-xl flex-shrink-0",
                                thread.channel.type === 'project'
                                  ? "bg-blue-100"
                                  : "bg-purple-100"
                              )}>
                                {thread.channel.type === 'project' ? (
                                  <HashtagIcon className={cn(
                                    "h-5 w-5",
                                    "text-blue-600"
                                  )} />
                                ) : (
                                  <UserIcon className={cn(
                                    "h-5 w-5",
                                    "text-purple-600"
                                  )} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium tracking-tight text-gray-900 truncate">
                                    {thread.channel.name}
                                  </h3>
                                  {thread.unreadCount > 0 && (
                                    <span className="bg-brand-primary text-white text-xs px-2 py-0.5 rounded-full">
                                      {thread.unreadCount}
                                    </span>
                                  )}
                                </div>
                                {latestMessage && (
                                  <p className="text-sm text-gray-500 truncate mt-0.5">
                                    <span className="font-medium">{latestMessage.senderName}:</span>{' '}
                                    {latestMessage.text}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              {latestMessage && (
                                <span className="text-xs text-gray-400">
                                  {formatMessageDate(latestMessage.createdAt)}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Expanded Messages */}
                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            <div className="max-h-96 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                              {thread.messages.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                  No messages in this thread yet.
                                </p>
                              ) : (
                                thread.messages.map((message, idx) => {
                                  const isOwn = message.senderId === user?.uid;
                                  const showDate = idx === 0 ||
                                    (thread.messages[idx - 1] &&
                                     format(message.createdAt, 'yyyy-MM-dd') !==
                                     format(thread.messages[idx - 1].createdAt, 'yyyy-MM-dd'));

                                  return (
                                    <React.Fragment key={message.id}>
                                      {showDate && (
                                        <div className="flex items-center justify-center py-2">
                                          <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border">
                                            {isToday(message.createdAt)
                                              ? 'Today'
                                              : isYesterday(message.createdAt)
                                                ? 'Yesterday'
                                                : format(message.createdAt, 'MMMM d, yyyy')}
                                          </span>
                                        </div>
                                      )}
                                      <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
                                        <div className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium",
                                          isOwn
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-200 text-gray-600"
                                        )}>
                                          {message.senderName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={cn('max-w-[80%]', isOwn && 'text-right')}>
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-gray-700">
                                              {isOwn ? 'You' : message.senderName}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {format(message.createdAt, 'h:mm a')}
                                            </span>
                                          </div>
                                          <div className={cn(
                                            'px-3 py-2 rounded-xl text-sm inline-block',
                                            isOwn
                                              ? 'bg-brand-primary text-white rounded-tr-sm'
                                              : 'bg-white text-gray-900 rounded-tl-sm border'
                                          )}>
                                            {message.text}
                                          </div>
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </div>

                            {/* Message Composer */}
                            <div className="border-t border-gray-200 px-4 py-3 bg-white">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type a message..."
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(thread.channel.id); } }}
                                />
                                <button
                                  onClick={() => handleSend(thread.channel.id)}
                                  disabled={!replyText.trim() || sending}
                                  className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors"
                                >
                                  {sending ? 'Sending...' : 'Send'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Contact Information Card */}
          <Card className="p-6 bg-gray-50 border-dashed">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm ring-1 ring-black/5 mb-3">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-medium tracking-tight text-gray-900 mb-2">
                Stay Connected
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Expand any thread above to view messages and reply directly.
                You can also reach your project manager by phone or email.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="tel:"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call Project Manager
                </a>
                <a
                  href="mailto:"
                  className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-colors"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send Email
                </a>
              </div>
            </div>
          </Card>

          {/* Last updated indicator */}
          <div className="text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <ClockIcon className="h-3 w-3" />
              Messages update in real time
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
