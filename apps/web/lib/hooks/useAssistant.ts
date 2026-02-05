/**
 * useAssistant Hook
 *
 * Main hook for the ContractorOS AI Assistant providing chat functionality,
 * voice input, and context management.
 */

'use client';

// Web Speech API type declarations
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChatMessage,
  AssistantState,
  AssistantContext,
  VoiceState,
  QuickAction,
  INITIAL_ASSISTANT_STATE,
  MAX_CONVERSATION_HISTORY,
} from '@/lib/assistant/types';
import {
  buildAssistantContext,
  getContextualSuggestions,
} from '@/lib/assistant/context-builder';
import { sendMessage, sendMessageStreaming } from '@/lib/assistant/claude-client';
import { getQuickResponse } from '@/lib/assistant/prompts';
import {
  createConversation,
  saveMessage as saveMessageToFirestore,
  getConversation,
  getMostRecentConversation,
  deleteConversation,
  Conversation,
} from '@/lib/assistant/conversation-service';

// Generate unique ID for messages
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface UseAssistantOptions {
  /** Active project data if viewing a project */
  activeProject?: {
    id: string;
    name: string;
    type?: string;
    status: string;
    clientName?: string;
    budget?: number;
    address?: { city?: string; state?: string };
    startDate?: Date;
    endDate?: Date;
  } | null;
  /** Active estimate data if editing an estimate */
  activeEstimate?: {
    id: string;
    name?: string;
    total?: number;
    status?: string;
    lineItems?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total?: number;
    }>;
  } | null;
}

interface UseAssistantReturn {
  /** Whether the assistant panel is open */
  isOpen: boolean;
  /** Open the assistant panel */
  open: () => void;
  /** Close the assistant panel */
  close: () => void;
  /** Toggle the assistant panel */
  toggle: () => void;
  /** Chat messages */
  messages: ChatMessage[];
  /** Whether the assistant is processing a request */
  isProcessing: boolean;
  /** Whether currently streaming a response */
  isStreaming: boolean;
  /** Current voice state */
  voiceState: VoiceState;
  /** Send a text message */
  sendMessage: (text: string) => Promise<void>;
  /** Send a text message with streaming response */
  sendMessageStream: (text: string) => Promise<void>;
  /** Start voice input */
  startVoice: () => void;
  /** Stop voice input */
  stopVoice: () => void;
  /** Clear chat history */
  clearHistory: () => void;
  /** Handle quick action */
  handleAction: (action: QuickAction) => void;
  /** Contextual suggestions based on current page */
  suggestions: string[];
  /** Error message if any */
  error: string | null;
  /** Current conversation ID */
  conversationId: string | null;
  /** Start a new conversation */
  newConversation: () => Promise<void>;
  /** Load an existing conversation */
  loadConversation: (id: string) => Promise<void>;
  /** List of past conversations */
  conversations: Conversation[];
  /** Whether showing time entry modal */
  showTimeEntryModal: boolean;
  /** Close time entry modal */
  closeTimeEntryModal: () => void;
  /** File input ref for photo capture */
  photoInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useAssistant(options: UseAssistantOptions = {}): UseAssistantReturn {
  const { profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<AssistantState>(INITIAL_ASSISTANT_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations] = useState<Conversation[]>([]);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const conversationLoadedRef = useRef(false);

  // Build context from current state
  const buildContext = useCallback((): AssistantContext => {
    // Map activeProject to the format expected by buildAssistantContext
    const projectForContext = options.activeProject ? {
      id: options.activeProject.id,
      name: options.activeProject.name,
      projectType: options.activeProject.type,
      status: options.activeProject.status,
      clientName: options.activeProject.clientName,
      budget: options.activeProject.budget,
      address: options.activeProject.address,
      startDate: options.activeProject.startDate,
      endDate: options.activeProject.endDate,
      updatedAt: new Date(),
    } : null;

    // Map activeEstimate to the format expected by buildAssistantContext
    const estimateForContext = options.activeEstimate ? {
      id: options.activeEstimate.id,
      name: options.activeEstimate.name,
      total: options.activeEstimate.total,
      status: options.activeEstimate.status,
      lineItems: options.activeEstimate.lineItems,
      updatedAt: new Date(),
    } : null;

    return buildAssistantContext({
      profile,
      organization: null, // Will be enhanced when organization hook is added
      activeProject: projectForContext as never,
      activeEstimate: estimateForContext as never,
      currentRoute: pathname || undefined,
    });
  }, [profile, options.activeProject, options.activeEstimate, pathname]);

  // Get contextual suggestions
  const suggestions = getContextualSuggestions(pathname || '/dashboard');

  // Open panel
  const open = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  // Close panel
  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Toggle panel
  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  // Load most recent conversation on mount
  useEffect(() => {
    if (!profile?.orgId || !profile?.uid || conversationLoadedRef.current) return;

    const loadRecentConversation = async () => {
      try {
        const recent = await getMostRecentConversation(profile.orgId, profile.uid);
        if (recent) {
          setConversationId(recent.id);
          const messages = await getConversation(profile.orgId, recent.id);
          setState((prev) => ({ ...prev, messages }));
        }
        conversationLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load recent conversation:', err);
        conversationLoadedRef.current = true;
      }
    };

    loadRecentConversation();
  }, [profile?.orgId, profile?.uid]);

  // Save message to Firestore
  const _persistMessage = useCallback(
    async (message: ChatMessage) => {
      if (!profile?.orgId || !conversationId) return;

      try {
        await saveMessageToFirestore(profile.orgId, conversationId, message);
      } catch (err) {
        console.error('Failed to persist message:', err);
      }
    },
    [profile?.orgId, conversationId]
  );

  // Start a new conversation
  const newConversation = useCallback(async () => {
    if (!profile?.orgId || !profile?.uid) return;

    try {
      const newId = await createConversation(profile.orgId, profile.uid);
      setConversationId(newId);
      setState((prev) => ({ ...prev, messages: [] }));
      setError(null);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      setError('Failed to create new conversation');
    }
  }, [profile?.orgId, profile?.uid]);

  // Load an existing conversation
  const loadConversation = useCallback(
    async (id: string) => {
      if (!profile?.orgId) return;

      try {
        const messages = await getConversation(profile.orgId, id);
        setConversationId(id);
        setState((prev) => ({ ...prev, messages }));
        setError(null);
      } catch (err) {
        console.error('Failed to load conversation:', err);
        setError('Failed to load conversation');
      }
    },
    [profile?.orgId]
  );

  // Close time entry modal
  const closeTimeEntryModal = useCallback(() => {
    setShowTimeEntryModal(false);
  }, []);

  // Clear history
  const clearHistory = useCallback(async () => {
    // Delete from Firestore if we have a conversation
    if (profile?.orgId && conversationId) {
      try {
        await deleteConversation(profile.orgId, conversationId);
      } catch (err) {
        console.error('Failed to delete conversation:', err);
      }
    }

    // Clear local state
    setState((prev) => ({
      ...prev,
      messages: [],
    }));
    setConversationId(null);
    setError(null);
  }, [profile?.orgId, conversationId]);

  // Send a message
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setError(null);

      // Create a conversation if we don't have one
      let currentConvId = conversationId;
      if (!currentConvId && profile?.orgId && profile?.uid) {
        try {
          currentConvId = await createConversation(profile.orgId, profile.uid);
          setConversationId(currentConvId);
        } catch (err) {
          console.error('Failed to create conversation:', err);
        }
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        status: 'sent',
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isProcessing: true,
      }));

      // Persist user message
      if (profile?.orgId && currentConvId) {
        saveMessageToFirestore(profile.orgId, currentConvId, userMessage).catch((err) =>
          console.error('Failed to persist user message:', err)
        );
      }

      // Check for quick responses first
      const quickResponse = getQuickResponse(text);
      if (quickResponse) {
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: quickResponse,
          timestamp: new Date(),
          status: 'sent',
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isProcessing: false,
        }));

        // Persist quick response
        if (profile?.orgId && currentConvId) {
          saveMessageToFirestore(profile.orgId, currentConvId, assistantMessage).catch((err) =>
            console.error('Failed to persist assistant message:', err)
          );
        }
        return;
      }

      try {
        // Build conversation history for context
        const conversationHistory = state.messages
          .slice(-MAX_CONVERSATION_HISTORY)
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        // Build context
        const context = buildContext();

        // Send to API
        const response = await sendMessage({
          message: text,
          context,
          conversationHistory,
        });

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            sources: response.sources,
            suggestedActions: response.suggestedActions,
          },
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isProcessing: false,
        }));

        // Persist assistant response
        if (profile?.orgId && currentConvId) {
          saveMessageToFirestore(profile.orgId, currentConvId, assistantMessage).catch((err) =>
            console.error('Failed to persist assistant message:', err)
          );
        }
      } catch (err) {
        console.error('Assistant error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get response');

        // Add error message
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          status: 'error',
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isProcessing: false,
        }));
      }
    },
    [buildContext, state.messages, conversationId, profile?.orgId, profile?.uid]
  );

  // Send a message with streaming response
  const handleSendMessageStream = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setError(null);
      setIsStreaming(true);

      // Create a conversation if we don't have one
      let currentConvId = conversationId;
      if (!currentConvId && profile?.orgId && profile?.uid) {
        try {
          currentConvId = await createConversation(profile.orgId, profile.uid);
          setConversationId(currentConvId);
        } catch (err) {
          console.error('Failed to create conversation:', err);
        }
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        status: 'sent',
      };

      // Add placeholder assistant message for streaming
      const assistantMessageId = generateId();
      const assistantTimestamp = new Date();
      streamingMessageIdRef.current = assistantMessageId;

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: assistantTimestamp,
        status: 'streaming',
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        isProcessing: true,
      }));

      // Persist user message
      if (profile?.orgId && currentConvId) {
        saveMessageToFirestore(profile.orgId, currentConvId, userMessage).catch((err) =>
          console.error('Failed to persist user message:', err)
        );
      }

      // Check for quick responses first
      const quickResponse = getQuickResponse(text);
      if (quickResponse) {
        const finalMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: quickResponse,
          timestamp: assistantTimestamp,
          status: 'sent',
        };

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessageId ? finalMessage : m
          ),
          isProcessing: false,
        }));
        setIsStreaming(false);

        // Persist quick response
        if (profile?.orgId && currentConvId) {
          saveMessageToFirestore(profile.orgId, currentConvId, finalMessage).catch((err) =>
            console.error('Failed to persist assistant message:', err)
          );
        }
        return;
      }

      try {
        // Build conversation history for context
        const conversationHistory = state.messages
          .slice(-MAX_CONVERSATION_HISTORY)
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        // Build context
        const context = buildContext();

        // Stream the response
        let fullContent = '';
        for await (const chunk of sendMessageStreaming({
          message: text,
          context,
          conversationHistory,
        })) {
          if (chunk.type === 'delta' && 'text' in chunk) {
            fullContent += chunk.text;
            // Update the message content incrementally
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: fullContent }
                  : m
              ),
            }));
          } else if (chunk.type === 'error') {
            throw new Error(chunk.content || 'Stream error');
          } else if (chunk.type === 'done') {
            // Mark message as complete
            const finalMessage: ChatMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: fullContent,
              timestamp: assistantTimestamp,
              status: 'sent',
            };

            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMessageId ? finalMessage : m
              ),
              isProcessing: false,
            }));

            // Persist final assistant message
            if (profile?.orgId && currentConvId) {
              saveMessageToFirestore(profile.orgId, currentConvId, finalMessage).catch((err) =>
                console.error('Failed to persist assistant message:', err)
              );
            }
          }
        }
      } catch (err) {
        console.error('Assistant stream error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get response');

        // Update the message with error
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: 'Sorry, I encountered an error processing your request. Please try again.',
                  status: 'error' as const,
                }
              : m
          ),
          isProcessing: false,
        }));
      } finally {
        setIsStreaming(false);
        streamingMessageIdRef.current = null;
      }
    },
    [buildContext, state.messages, conversationId, profile?.orgId, profile?.uid]
  );

  // Start voice input
  const startVoice = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Check for browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('Voice input is not supported in your browser');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setState((prev) => ({ ...prev, voiceState: 'listening' }));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;

        if (event.results[last].isFinal) {
          // Send the final transcript
          handleSendMessage(transcript);
          setState((prev) => ({ ...prev, voiceState: 'idle' }));
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(`Voice error: ${event.error}`);
        setState((prev) => ({ ...prev, voiceState: 'error' }));

        // Reset after a moment
        setTimeout(() => {
          setState((prev) => ({ ...prev, voiceState: 'idle' }));
        }, 2000);
      };

      recognition.onend = () => {
        setState((prev) => {
          if (prev.voiceState === 'listening') {
            return { ...prev, voiceState: 'idle' };
          }
          return prev;
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setError('Failed to start voice input');
    }
  }, [handleSendMessage]);

  // Stop voice input
  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState((prev) => ({ ...prev, voiceState: 'idle' }));
  }, []);

  // Handle quick action
  const handleAction = useCallback(
    (action: QuickAction) => {
      switch (action.type) {
        case 'pricing_query':
          // Open panel for pricing query
          open();
          break;

        case 'create_estimate':
          // Navigate to create new estimate
          router.push('/dashboard/estimates/new');
          break;

        case 'log_time':
          // Open time entry modal
          setShowTimeEntryModal(true);
          break;

        case 'take_photo':
          // Trigger file input with camera capture on mobile
          if (photoInputRef.current) {
            photoInputRef.current.click();
          }
          break;

        case 'view_report':
          // Navigate to reports with specific type
          const reportType = action.payload?.reportType as string || 'overview';
          router.push(`/dashboard/reports/${reportType}`);
          break;

        case 'send_message':
          // Navigate to messages
          router.push('/dashboard/messages');
          break;

        case 'schedule_event':
          // Navigate to schedule
          router.push('/dashboard/schedule');
          break;

        case 'navigate':
          // Navigate to a specific page
          if (action.payload?.route) {
            router.push(action.payload.route as string);
          }
          break;

        default:
          // For other actions, just open the panel
          open();
      }
    },
    [open, router]
  );

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    isOpen: state.isOpen,
    open,
    close,
    toggle,
    messages: state.messages,
    isProcessing: state.isProcessing,
    isStreaming,
    voiceState: state.voiceState,
    sendMessage: handleSendMessage,
    sendMessageStream: handleSendMessageStream,
    startVoice,
    stopVoice,
    clearHistory,
    handleAction,
    suggestions,
    error,
    conversationId,
    newConversation,
    loadConversation,
    conversations,
    showTimeEntryModal,
    closeTimeEntryModal,
    photoInputRef,
  };
}

export default useAssistant;
