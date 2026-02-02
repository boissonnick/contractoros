'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

export interface ThreadMessage {
  id: string;
  content: string;
  senderType: 'contractor' | 'client';
  senderName: string;
  createdAt: Date;
  attachments?: { url: string; type: 'image' | 'file'; name: string }[];
}

interface MessageThreadProps {
  messages: ThreadMessage[];
  contractorName?: string;
  clientName?: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  className?: string;
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

export function MessageThread({
  messages,
  contractorName = 'Contractor',
  clientName = 'You',
  onSendMessage,
  className,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      await onSendMessage(newMessage.trim(), attachments);
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isClient = message.senderType === 'client';

            return (
              <div
                key={message.id}
                className={cn('flex', isClient ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5',
                    isClient
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  )}
                >
                  {/* Sender name (for contractor messages) */}
                  {!isClient && (
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {message.senderName || contractorName}
                    </p>
                  )}

                  {/* Message content */}
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>

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
                            'block rounded-lg overflow-hidden',
                            isClient ? 'bg-blue-500' : 'bg-white border'
                          )}
                        >
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-full max-h-48 object-cover"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 text-sm">
                              <PhotoIcon className="w-4 h-4" />
                              {attachment.name}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={cn(
                      'text-xs mt-1',
                      isClient ? 'text-blue-200' : 'text-gray-400'
                    )}
                  >
                    {formatMessageDate(new Date(message.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 flex gap-2 overflow-x-auto">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 overflow-hidden"
            >
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ maxHeight: '120px' }}
          />

          <button
            onClick={handleSend}
            disabled={sending || (!newMessage.trim() && attachments.length === 0)}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-lg transition-colors',
              sending || (!newMessage.trim() && attachments.length === 0)
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageThread;
