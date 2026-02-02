'use client';

import React from 'react';
import { ChatMessage as ChatMessageType, DataSource, QuickAction } from '@/lib/assistant/types';
import { UserCircleIcon, SparklesIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick?: (action: QuickAction) => void;
}

export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isStreaming = message.status === 'streaming';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-brand-primary text-white'
            : isError
            ? 'bg-red-100 text-red-600'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        }`}
      >
        {isUser ? (
          <UserCircleIcon className="w-5 h-5" />
        ) : isError ? (
          <ExclamationCircleIcon className="w-5 h-5" />
        ) : (
          <SparklesIcon className="w-5 h-5" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl ${
            isUser
              ? 'bg-brand-primary text-white rounded-br-md'
              : isError
              ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          {/* Message text */}
          <div
            className={`text-sm ${isUser ? '' : 'prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0'}`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  // Custom rendering for code blocks
                  code: (props) => {
                    const { className, children } = props;
                    return (
                      <code
                        className={`${className || ''} bg-gray-200 px-1 py-0.5 rounded text-xs`}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Custom rendering for tables
                  table: (props) => {
                    return (
                      <table className="text-xs border-collapse my-2">
                        {props.children}
                      </table>
                    );
                  },
                  th: (props) => {
                    return (
                      <th className="border border-gray-300 px-2 py-1 bg-gray-50 text-left font-medium">
                        {props.children}
                      </th>
                    );
                  },
                  td: (props) => {
                    return (
                      <td className="border border-gray-300 px-2 py-1">
                        {props.children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Streaming indicator */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-gray-400 animate-pulse rounded" />
            )}
          </div>
        </div>

        {/* Data sources */}
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.metadata.sources.map((source, index) => (
              <SourceBadge key={index} source={source} />
            ))}
          </div>
        )}

        {/* Suggested actions */}
        {message.metadata?.suggestedActions &&
          message.metadata.suggestedActions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.metadata.suggestedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onActionClick?.(action)}
                  className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

        {/* Timestamp */}
        <div
          className={`mt-1 text-[10px] text-gray-400 ${isUser ? 'text-right' : ''}`}
        >
          {formatTime(message.timestamp)}
          {message.metadata?.isVoiceInput && (
            <span className="ml-1">via voice</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Source badge component
 */
function SourceBadge({ source }: { source: DataSource }) {
  const colors: Record<DataSource['type'], string> = {
    material_price: 'bg-blue-50 text-blue-700 border-blue-200',
    labor_rate: 'bg-green-50 text-green-700 border-green-200',
    market_benchmark: 'bg-purple-50 text-purple-700 border-purple-200',
    project_data: 'bg-orange-50 text-orange-700 border-orange-200',
    estimate_data: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border ${
        colors[source.type] || 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      {source.label}
      {source.confidence && (
        <span className="ml-1 opacity-70">
          ({source.confidence})
        </span>
      )}
    </span>
  );
}

/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default ChatMessage;
