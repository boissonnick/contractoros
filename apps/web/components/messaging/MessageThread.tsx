'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  ChevronUpIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface MessageAttachment {
  url: string;
  type: 'image' | 'file';
  name: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: Date;
  attachments?: MessageAttachment[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface UploadProgressInfo {
  current: number;
  total: number;
  percentage: number;
}

export interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  currentUserName?: string;
  onSendMessage?: (content: string, attachments?: File[]) => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  uploadProgress?: UploadProgressInfo | null;
  showReadStatus?: boolean;
  hideInput?: boolean;
  placeholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

// ============================================================================
// Date Helper Functions
// ============================================================================

function formatMessageTime(date: Date): string {
  return format(date, 'h:mm a');
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return format(date, 'EEEE'); // Day name (Monday, Tuesday, etc.)
  }

  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMMM d'); // January 15
  }

  return format(date, 'MMMM d, yyyy'); // January 15, 2024
}

function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();

  for (const message of messages) {
    const dateKey = format(message.createdAt, 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  }

  return groups;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface DateDividerProps {
  date: Date;
}

function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 border-t border-gray-200" />
      <span className="px-4 text-xs font-medium text-gray-500 bg-white">
        {getDateLabel(date)}
      </span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md';
}

function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size === 'sm' ? 24 : 32}
        height={size === 'sm' ? 24 : 32}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClasses)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 flex-shrink-0',
        sizeClasses
      )}
    >
      {initials}
    </div>
  );
}

interface MessageStatusProps {
  status?: Message['status'];
  isOwn: boolean;
}

function MessageStatus({ status, isOwn }: MessageStatusProps) {
  if (!status || !isOwn) return null;

  switch (status) {
    case 'sending':
      return (
        <span className="ml-1.5 text-xs opacity-50">Sending...</span>
      );
    case 'sent':
      return <CheckIcon className="ml-1 w-3.5 h-3.5 opacity-70" />;
    case 'delivered':
      return <CheckCircleIcon className="ml-1 w-3.5 h-3.5 opacity-70" />;
    case 'read':
      return <CheckCircleIcon className="ml-1 w-3.5 h-3.5 text-blue-300" />;
    case 'failed':
      return (
        <span className="ml-1.5 text-xs text-red-300">Failed</span>
      );
    default:
      return null;
  }
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  showReadStatus?: boolean;
}

function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showName = true,
  showReadStatus = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex gap-2 mb-3 px-4',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar src={message.senderAvatar} name={message.senderName} size="sm" />
      )}
      {showAvatar && isOwn && <div className="w-6" />}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
          isOwn
            ? 'bg-brand-primary text-white rounded-br-md'
            : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
        )}
      >
        {/* Sender name */}
        {showName && !isOwn && (
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {message.senderName}
          </p>
        )}

        {/* Message content */}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, i) => (
              <a
                key={i}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'block rounded-lg overflow-hidden transition-opacity hover:opacity-90',
                  isOwn ? 'bg-blue-500' : 'bg-gray-50 border border-gray-200'
                )}
              >
                {attachment.type === 'image' ? (
                  <Image
                    src={attachment.url}
                    alt={attachment.name}
                    width={400}
                    height={192}
                    className="max-w-full max-h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div
                    className={cn(
                      'flex items-center gap-2 p-3 text-sm',
                      isOwn ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    <DocumentIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate flex-1">{attachment.name}</span>
                    <ArrowDownTrayIcon className="w-4 h-4 flex-shrink-0" />
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Timestamp and status */}
        <div
          className={cn(
            'flex items-center justify-end mt-1.5',
            isOwn ? 'text-blue-200' : 'text-gray-400'
          )}
        >
          <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
          {showReadStatus && <MessageStatus status={message.status} isOwn={isOwn} />}
        </div>
      </div>
    </div>
  );
}

interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
}

function LoadMoreButton({ onClick, loading }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center py-3">
      <button
        onClick={onClick}
        disabled={loading}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors',
          loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
            Loading...
          </>
        ) : (
          <>
            <ChevronUpIcon className="w-4 h-4" />
            Load older messages
          </>
        )}
      </button>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-700 font-medium">
        {title || 'No messages yet'}
      </p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">
        {description || 'Send a message to start the conversation'}
      </p>
    </div>
  );
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (files: File[]) => void;
  attachments: File[];
  onRemoveAttachment: (index: number) => void;
  sending: boolean;
  uploadProgress?: UploadProgressInfo | null;
  placeholder?: string;
}

function MessageInput({
  value,
  onChange,
  onSend,
  onFileSelect,
  attachments,
  onRemoveAttachment,
  sending,
  uploadProgress,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const canSend = !sending && !uploadProgress && (value.trim() || attachments.length > 0);

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Upload progress */}
      {uploadProgress && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-blue-700 font-medium">
              Uploading file {uploadProgress.current} of {uploadProgress.total}...
            </span>
            <span className="text-sm font-semibold text-blue-700">
              {uploadProgress.percentage}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && !uploadProgress && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-16 h-16 rounded-lg bg-white border border-gray-200 overflow-hidden group"
            >
              {file.type.startsWith('image/') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                  <DocumentIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-[8px] text-gray-500 truncate w-full text-center mt-0.5">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => onRemoveAttachment(index)}
                className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="p-3 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!!uploadProgress || sending}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            uploadProgress || sending
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
          title="Attach file"
        >
          <PhotoIcon className="w-6 h-6" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent placeholder-gray-400"
          style={{ maxHeight: '120px' }}
        />

        <button
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            'flex-shrink-0 p-2.5 rounded-xl transition-all',
            canSend
              ? 'bg-brand-primary text-white hover:bg-brand-900 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
          title="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MessageThread({
  messages,
  currentUserId,
  currentUserName: _currentUserName,
  onSendMessage,
  onLoadMore,
  hasMore = false,
  loading = false,
  loadingMore = false,
  uploadProgress,
  showReadStatus = false,
  hideInput = false,
  placeholder,
  emptyStateTitle,
  emptyStateDescription,
  className,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Auto-scroll to bottom when new messages arrive (if user is at bottom)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;

    // Only auto-scroll if new messages were added and user was at bottom
    if (newCount > prevCount && shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCountRef.current = newCount;
  }, [messages.length, shouldAutoScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading, messages.length]);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  const handleSend = async () => {
    if (!onSendMessage) return;
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    const messageContent = newMessage.trim();
    const messageAttachments = [...attachments];

    // Clear input immediately for better UX
    setNewMessage('');
    setAttachments([]);

    try {
      await onSendMessage(messageContent, messageAttachments.length > 0 ? messageAttachments : undefined);
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      logger.error('Failed to send message', { error: error, component: 'MessageThread' });
      // Restore message on failure
      setNewMessage(messageContent);
      setAttachments(messageAttachments);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadMore = async () => {
    if (onLoadMore && hasMore && !loadingMore) {
      await onLoadMore();
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <span className="w-8 h-8 border-3 border-gray-300 border-t-brand-primary rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
        ) : (
          <div className="py-4">
            {/* Load more button */}
            {hasMore && (
              <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />
            )}

            {/* Messages grouped by date */}
            {Array.from(groupedMessages.entries()).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                <DateDivider date={dateMessages[0].createdAt} />
                {dateMessages.map((message, index) => {
                  const isOwn = message.senderId === currentUserId;
                  // Show avatar for first message in a sequence from same sender
                  const prevMessage = dateMessages[index - 1];
                  const showAvatar =
                    !prevMessage || prevMessage.senderId !== message.senderId;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showAvatar}
                      showReadStatus={showReadStatus}
                    />
                  );
                })}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area (optional) */}
      {!hideInput && onSendMessage && (
        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          attachments={attachments}
          onRemoveAttachment={handleRemoveAttachment}
          sending={sending}
          uploadProgress={uploadProgress}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export default MessageThread;
