'use client';

import React, { useRef, useEffect, useState, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  SparklesIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  ChatMessage as ChatMessageType,
  QuickAction,
  DEFAULT_QUICK_ACTIONS,
  GREETING_MESSAGES,
  VoiceState,
} from '@/lib/assistant/types';
import { ChatMessage } from './ChatMessage';
import { VoiceInput } from './VoiceInput';
import { speak, isTTSSupported } from '@/lib/assistant/tts-service';

interface TTSSettings {
  enabled: boolean;
  voiceURI: string;
  rate: number;
  autoSpeak: boolean;
}

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  isProcessing: boolean;
  voiceState: VoiceState;
  onSendMessage: (message: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onClearHistory: () => void;
  onActionClick?: (action: QuickAction) => void;
  contextSuggestions?: string[];
  ttsSettings?: TTSSettings;
}

export function AssistantPanel({
  isOpen,
  onClose,
  messages,
  isProcessing,
  voiceState,
  onSendMessage,
  onStartVoice,
  onStopVoice,
  onClearHistory,
  onActionClick,
  contextSuggestions,
  ttsSettings,
}: AssistantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak new assistant messages if enabled
  useEffect(() => {
    if (!ttsSettings?.enabled || !ttsSettings?.autoSpeak || !isTTSSupported()) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      lastMessage.status === 'sent' &&
      lastMessage.id !== lastMessageIdRef.current
    ) {
      lastMessageIdRef.current = lastMessage.id;
      speak(lastMessage.content, {
        voiceURI: ttsSettings.voiceURI,
        rate: ttsSettings.rate,
      });
    }
  }, [messages, ttsSettings]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !isProcessing) {
      onSendMessage(trimmed);
      setInputValue('');
    }
  }, [inputValue, isProcessing, onSendMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle quick action click
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (onActionClick) {
        onActionClick(action);
      } else if (action.type === 'pricing_query') {
        setInputValue('What should I charge for ');
        inputRef.current?.focus();
      } else if (action.type === 'create_estimate') {
        setInputValue('Help me create an estimate for ');
        inputRef.current?.focus();
      }
    },
    [onActionClick]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSendMessage(suggestion);
    },
    [onSendMessage]
  );

  // Get greeting message
  const greetingMessage = GREETING_MESSAGES[0];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
              <div className="flex h-full flex-col bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-violet-500 to-purple-600">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-white" />
                    <Dialog.Title className="text-base font-semibold text-white">
                      AI Assistant
                    </Dialog.Title>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClearHistory}
                      className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title="Clear history"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Empty state with greeting */}
                  {messages.length === 0 && (
                    <div className="space-y-4">
                      {/* Greeting */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                          <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="inline-block px-4 py-2.5 rounded-2xl rounded-bl-md bg-gray-100 text-gray-900">
                            <p className="text-sm">{greetingMessage}</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Quick actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_QUICK_ACTIONS.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleQuickAction(action)}
                              className="text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Context suggestions */}
                      {contextSuggestions && contextSuggestions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            Suggested questions
                          </p>
                          <div className="space-y-1.5">
                            {contextSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full text-left text-sm px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg text-violet-700 hover:bg-violet-100 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message list */}
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onActionClick={onActionClick}
                      showTTSButton={ttsSettings?.enabled && isTTSSupported()}
                      ttsOptions={ttsSettings ? {
                        voiceURI: ttsSettings.voiceURI,
                        rate: ttsSettings.rate,
                      } : undefined}
                    />
                  ))}

                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <ArrowPathIcon className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-block px-4 py-2.5 rounded-2xl rounded-bl-md bg-gray-100">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Voice input overlay */}
                {voiceState !== 'idle' && (
                  <VoiceInput
                    voiceState={voiceState}
                    onStop={onStopVoice}
                  />
                )}

                {/* Input area */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-end gap-2">
                    {/* Voice button */}
                    <button
                      onClick={onStartVoice}
                      disabled={isProcessing || voiceState !== 'idle'}
                      className="flex-shrink-0 p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Voice input"
                    >
                      <MicrophoneIcon className="h-5 w-5" />
                    </button>

                    {/* Text input */}
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        rows={1}
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                        style={{
                          minHeight: '40px',
                          maxHeight: '120px',
                        }}
                      />
                    </div>

                    {/* Send button */}
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isProcessing}
                      className="flex-shrink-0 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-gray-400 text-center">
                    AI responses may not always be accurate. Verify important information.
                  </p>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default AssistantPanel;
