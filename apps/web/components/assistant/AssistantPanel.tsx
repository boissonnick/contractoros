'use client';

import React, { useRef, useEffect, useState, useCallback, Fragment } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  SparklesIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  ChatMessage as ChatMessageType,
  QuickAction,
  DEFAULT_QUICK_ACTIONS,
  GREETING_MESSAGES,
  VoiceState,
  DocumentAnalysis,
  PhotoAnalysis,
  ProactiveSuggestion,
} from '@/lib/assistant/types';
import { ChatMessage } from './ChatMessage';
import { VoiceInput } from './VoiceInput';
import { DocumentUpload } from './DocumentUpload';
import { PhotoAnalysisCard } from './PhotoAnalysisCard';
import { ProactiveSuggestions } from './ProactiveSuggestions';
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
  // New props for V2 features
  onDocumentUpload?: (file: File) => Promise<void>;
  onPhotoUpload?: (file: File) => Promise<void>;
  currentDocumentAnalysis?: DocumentAnalysis | null;
  currentPhotoAnalysis?: PhotoAnalysis | null;
  photoAnalyses?: PhotoAnalysis[];
  onAddPhotoToProject?: (analysis: PhotoAnalysis, tags: string[]) => void;
  onDismissPhotoAnalysis?: (id: string) => void;
  proactiveSuggestions?: ProactiveSuggestion[];
  onDismissSuggestion?: (id: string) => void;
  onAcknowledgeSuggestion?: (id: string) => void;
  onDismissAllSuggestions?: () => void;
}

type PanelTab = 'chat' | 'suggestions';

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
  // V2 props
  onDocumentUpload,
  onPhotoUpload,
  currentDocumentAnalysis,
  currentPhotoAnalysis,
  photoAnalyses = [],
  onAddPhotoToProject,
  onDismissPhotoAnalysis,
  proactiveSuggestions = [],
  onDismissSuggestion,
  onAcknowledgeSuggestion,
  onDismissAllSuggestions,
}: AssistantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Count unread suggestions
  const unreadSuggestionsCount = proactiveSuggestions.filter(
    (s) => !s.isRead && !s.isDismissed
  ).length;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentDocumentAnalysis, currentPhotoAnalysis]);

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
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

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

  // Handle document upload
  const handleDocumentUpload = useCallback(
    async (file: File) => {
      if (onDocumentUpload) {
        await onDocumentUpload(file);
        setShowUploadOptions(false);
      }
    },
    [onDocumentUpload]
  );

  // Handle photo upload
  const handlePhotoUpload = useCallback(
    async (file: File) => {
      if (onPhotoUpload) {
        await onPhotoUpload(file);
        setShowUploadOptions(false);
      }
    },
    [onPhotoUpload]
  );

  // Handle file input change for documents
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onDocumentUpload) {
      handleDocumentUpload(file);
    }
    e.target.value = '';
  };

  // Handle file input change for photos
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpload) {
      handlePhotoUpload(file);
    }
    e.target.value = '';
  };

  // Get greeting message
  const greetingMessage = GREETING_MESSAGES[0];

  // Check if V2 features are enabled
  const hasV2Features = onDocumentUpload || onPhotoUpload || proactiveSuggestions.length > 0;

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
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-brand-700 to-brand-900">
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

                {/* Tabs (only show if V2 features enabled) */}
                {hasV2Features && proactiveSuggestions.length > 0 && (
                  <Tab.Group
                    selectedIndex={activeTab === 'chat' ? 0 : 1}
                    onChange={(index) => setActiveTab(index === 0 ? 'chat' : 'suggestions')}
                  >
                    <Tab.List className="flex border-b border-gray-200 bg-gray-50">
                      <Tab
                        className={({ selected }) =>
                          `flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors outline-none
                          ${selected
                            ? 'text-brand-600 border-b-2 border-brand-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span>Chat</span>
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          `flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors outline-none
                          ${selected
                            ? 'text-brand-600 border-b-2 border-brand-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <LightBulbIcon className="h-4 w-4" />
                        <span>Suggestions</span>
                        {unreadSuggestionsCount > 0 && (
                          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium text-white bg-amber-500 rounded-full">
                            {unreadSuggestionsCount}
                          </span>
                        )}
                      </Tab>
                    </Tab.List>
                  </Tab.Group>
                )}

                {/* Content area */}
                {activeTab === 'chat' ? (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Empty state with greeting */}
                      {messages.length === 0 && !currentDocumentAnalysis && !currentPhotoAnalysis && (
                        <div className="space-y-4">
                          {/* Greeting */}
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
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

                          {/* Upload hint */}
                          {(onDocumentUpload || onPhotoUpload) && (
                            <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-lg">
                              <p className="text-xs text-brand-700">
                                <span className="font-medium">Tip:</span> You can upload documents or photos for AI analysis using the buttons below.
                              </p>
                            </div>
                          )}

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
                                    className="w-full text-left text-sm px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg text-brand-700 hover:bg-brand-100 transition-colors"
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

                      {/* Current document analysis */}
                      {currentDocumentAnalysis && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500">Document Analysis</p>
                          <DocumentUpload
                            onUpload={handleDocumentUpload}
                            onAnalysisComplete={() => {}}
                            currentAnalysis={currentDocumentAnalysis}
                          />
                        </div>
                      )}

                      {/* Current photo analysis */}
                      {currentPhotoAnalysis && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500">Photo Analysis</p>
                          <PhotoAnalysisCard
                            analysis={currentPhotoAnalysis}
                            onAddToProject={onAddPhotoToProject}
                            onDismiss={
                              onDismissPhotoAnalysis
                                ? () => onDismissPhotoAnalysis(currentPhotoAnalysis.id)
                                : undefined
                            }
                          />
                        </div>
                      )}

                      {/* Recent photo analyses */}
                      {photoAnalyses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500">Recent Photos</p>
                          {photoAnalyses.slice(0, 3).map((analysis) => (
                            <PhotoAnalysisCard
                              key={analysis.id}
                              analysis={analysis}
                              onAddToProject={onAddPhotoToProject}
                              onDismiss={
                                onDismissPhotoAnalysis
                                  ? () => onDismissPhotoAnalysis(analysis.id)
                                  : undefined
                              }
                              compact
                            />
                          ))}
                        </div>
                      )}

                      {/* Processing indicator */}
                      {isProcessing && (
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
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
                      {/* Upload options */}
                      {showUploadOptions && (onDocumentUpload || onPhotoUpload) && (
                        <div className="mb-3 flex gap-2">
                          {onDocumentUpload && (
                            <button
                              onClick={() => documentInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <DocumentIcon className="h-4 w-4" />
                              <span>Document</span>
                            </button>
                          )}
                          {onPhotoUpload && (
                            <button
                              onClick={() => photoInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <PhotoIcon className="h-4 w-4" />
                              <span>Photo</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Hidden file inputs */}
                      <input
                        ref={documentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls"
                        onChange={handleDocumentFileChange}
                        className="hidden"
                      />
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFileChange}
                        className="hidden"
                      />

                      <div className="flex items-end gap-2">
                        {/* Voice button */}
                        <button
                          onClick={onStartVoice}
                          disabled={isProcessing || voiceState !== 'idle'}
                          className="flex-shrink-0 p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Voice input"
                        >
                          <MicrophoneIcon className="h-5 w-5" />
                        </button>

                        {/* Upload button (V2) */}
                        {(onDocumentUpload || onPhotoUpload) && (
                          <button
                            onClick={() => setShowUploadOptions(!showUploadOptions)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                              showUploadOptions
                                ? 'text-brand-600 bg-brand-50'
                                : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'
                            }`}
                            title="Upload document or photo"
                          >
                            <DocumentIcon className="h-5 w-5" />
                          </button>
                        )}

                        {/* Text input */}
                        <div className="flex-1 relative">
                          <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            rows={1}
                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
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
                          className="flex-shrink-0 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="mt-2 text-[10px] text-gray-400 text-center">
                        AI responses may not always be accurate. Verify important information.
                      </p>
                    </div>
                  </>
                ) : (
                  /* Suggestions Tab */
                  <div className="flex-1 overflow-y-auto p-4">
                    {proactiveSuggestions.length > 0 && onDismissSuggestion && onAcknowledgeSuggestion ? (
                      <ProactiveSuggestions
                        suggestions={proactiveSuggestions}
                        onDismiss={onDismissSuggestion}
                        onAcknowledge={onAcknowledgeSuggestion}
                        onDismissAll={onDismissAllSuggestions}
                        defaultCollapsed={false}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <LightBulbIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">No suggestions yet</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs">
                          AI will analyze your projects and provide proactive suggestions to help you stay on track.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default AssistantPanel;
