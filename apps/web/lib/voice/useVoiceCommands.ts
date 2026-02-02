/**
 * useVoiceCommands Hook
 *
 * Provides voice command functionality for field pages.
 * Supports time entries, daily logs, and task commands.
 *
 * @module lib/voice/useVoiceCommands
 *
 * @example
 * ```tsx
 * const { state, startListening, result } = useVoiceCommands(
 *   { timeEntry: { projects, userId } },
 *   { commandType: 'time_entry', onResult: handleResult }
 * );
 * ```
 *
 * ## Features
 * - Auto-detects command type from transcript keywords
 * - Fuzzy matching for project names and tasks
 * - Real-time interim transcript display
 * - Confidence scoring for parse results
 *
 * ## Browser Support
 * Requires Web Speech API (Chrome, Edge, Safari)
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

import { useState, useCallback, useRef, useEffect } from 'react';
import { parseTimeEntryVoice, type ParsedTimeEntry, type TimeEntryParserContext } from './time-entry-parser';
import { parseDailyLogVoice, type ParsedDailyLog, type DailyLogParserContext } from './daily-log-parser';
import { parseTaskVoice, type ParsedTaskCommand, type TaskParserContext } from './task-parser';

// ============================================================================
// TYPES
// ============================================================================

export type VoiceCommandState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export type VoiceCommandType = 'time_entry' | 'daily_log' | 'task' | 'auto';

export interface VoiceCommandResult {
  type: VoiceCommandType;
  transcript: string;
  success: boolean;
  data?: ParsedTimeEntry | ParsedDailyLog | ParsedTaskCommand;
  error?: string;
  suggestions?: string[];
}

export interface UseVoiceCommandsOptions {
  onResult?: (result: VoiceCommandResult) => void;
  onError?: (error: string) => void;
  commandType?: VoiceCommandType;
  autoDetect?: boolean;
  language?: string;
}

export interface UseVoiceCommandsReturn {
  state: VoiceCommandState;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  result: VoiceCommandResult | null;
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
  reset: () => void;
}

export interface VoiceCommandsContext {
  timeEntry?: TimeEntryParserContext;
  dailyLog?: DailyLogParserContext;
  task?: TaskParserContext;
}

// ============================================================================
// COMMAND DETECTION
// ============================================================================

/**
 * Detect what type of command the user is trying to give.
 * Uses keyword scoring with bonus points for specific patterns.
 *
 * @param transcript - The speech recognition transcript
 * @returns The detected command type ('time_entry' | 'daily_log' | 'task')
 *
 * @example
 * detectCommandType("Log 4 hours framing") // returns 'time_entry'
 * detectCommandType("Mark drywall complete") // returns 'task'
 * detectCommandType("Today was sunny, 5 crew") // returns 'daily_log'
 */
function detectCommandType(transcript: string): VoiceCommandType {
  const normalized = transcript.toLowerCase();

  // Time entry indicators
  const timeEntryKeywords = [
    'log', 'record', 'add', 'enter', 'hours', 'hour', 'minutes', 'time',
    'worked', 'spent', 'clocked',
  ];

  // Daily log indicators
  const dailyLogKeywords = [
    'today', 'weather', 'crew', 'progress', 'summary', 'daily', 'end of day',
    'report', 'inspection', 'delivery', 'issue', 'problem',
  ];

  // Task indicators
  const taskKeywords = [
    'mark', 'complete', 'completed', 'done', 'finish', 'finished', 'task',
    'start', 'begin', 'pause', 'stop',
  ];

  // Score each type
  const scores = {
    time_entry: timeEntryKeywords.filter((k) => normalized.includes(k)).length,
    daily_log: dailyLogKeywords.filter((k) => normalized.includes(k)).length,
    task: taskKeywords.filter((k) => normalized.includes(k)).length,
  };

  // Check for explicit patterns
  if (/\d+\s*(?:hours?|hrs?|minutes?|mins?)/.test(normalized)) {
    scores.time_entry += 3;
  }

  if (/mark.*(?:complete|done|finished)/.test(normalized)) {
    scores.task += 3;
  }

  if (/(?:today|weather|crew|inspection|delivery)/.test(normalized)) {
    scores.daily_log += 2;
  }

  // Return highest scoring type
  if (scores.time_entry >= scores.daily_log && scores.time_entry >= scores.task) {
    return 'time_entry';
  }
  if (scores.task >= scores.daily_log) {
    return 'task';
  }
  return 'daily_log';
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * React hook for voice command functionality.
 *
 * Manages the speech recognition lifecycle, parses transcripts into structured
 * commands, and provides state for UI feedback.
 *
 * @param context - Context data for parsers (projects, tasks, etc.)
 * @param options - Configuration options
 * @param options.onResult - Callback when parsing completes
 * @param options.onError - Callback on recognition error
 * @param options.commandType - Force specific command type ('auto' by default)
 * @param options.language - BCP-47 language tag (default: 'en-US')
 *
 * @returns Object with state, controls, and results
 *
 * @example
 * ```tsx
 * const {
 *   state,           // 'idle' | 'listening' | 'processing' | 'success' | 'error'
 *   isSupported,     // Browser supports Web Speech API
 *   transcript,      // Final recognized text
 *   interimTranscript, // Real-time in-progress text
 *   error,           // Error message if applicable
 *   result,          // Parsed VoiceCommandResult
 *   startListening,  // Begin recording
 *   stopListening,   // Stop and process
 *   cancel,          // Cancel without processing
 *   reset,           // Reset to idle state
 * } = useVoiceCommands(context, options);
 * ```
 */
export function useVoiceCommands(
  context: VoiceCommandsContext,
  options: UseVoiceCommandsOptions = {}
): UseVoiceCommandsReturn {
  const {
    onResult,
    onError,
    commandType = 'auto',
    language = 'en-US',
  } = options;

  const [state, setState] = useState<VoiceCommandState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const contextRef = useRef(context);

  // Update context ref when it changes
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setIsSupported(supported);
    }
  }, []);

  /**
   * Process the transcript and return a result
   */
  const processTranscript = useCallback((finalTranscript: string): VoiceCommandResult => {
    const ctx = contextRef.current;
    const detectedType = commandType === 'auto' ? detectCommandType(finalTranscript) : commandType;

    let parseResult: VoiceCommandResult;

    switch (detectedType) {
      case 'time_entry': {
        if (!ctx.timeEntry) {
          parseResult = {
            type: 'time_entry',
            transcript: finalTranscript,
            success: false,
            error: 'Time entry context not available',
          };
        } else {
          const parsed = parseTimeEntryVoice(finalTranscript, ctx.timeEntry);
          parseResult = {
            type: 'time_entry',
            transcript: finalTranscript,
            success: parsed.success,
            data: parsed.data,
            error: parsed.error,
            suggestions: parsed.suggestions,
          };
        }
        break;
      }

      case 'daily_log': {
        if (!ctx.dailyLog) {
          parseResult = {
            type: 'daily_log',
            transcript: finalTranscript,
            success: false,
            error: 'Daily log context not available',
          };
        } else {
          const parsed = parseDailyLogVoice(finalTranscript, ctx.dailyLog);
          parseResult = {
            type: 'daily_log',
            transcript: finalTranscript,
            success: parsed.success,
            data: parsed.data,
            error: parsed.error,
            suggestions: parsed.suggestions,
          };
        }
        break;
      }

      case 'task': {
        if (!ctx.task) {
          parseResult = {
            type: 'task',
            transcript: finalTranscript,
            success: false,
            error: 'Task context not available',
          };
        } else {
          const parsed = parseTaskVoice(finalTranscript, ctx.task);
          parseResult = {
            type: 'task',
            transcript: finalTranscript,
            success: parsed.success,
            data: parsed.data,
            error: parsed.error,
            suggestions: parsed.suggestions,
          };
        }
        break;
      }

      default:
        parseResult = {
          type: 'auto',
          transcript: finalTranscript,
          success: false,
          error: 'Could not determine command type',
        };
    }

    return parseResult;
  }, [commandType]);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice input is not supported in your browser');
      setState('error');
      return;
    }

    // Reset state
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setResult(null);

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setError('Speech recognition not available');
        setState('error');
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState('listening');
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setTranscript((prev) => prev + finalText);
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Voice recognition error';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your settings.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please enable it in settings.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            // User cancelled, not an error
            setState('idle');
            return;
        }

        setError(errorMessage);
        setState('error');
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        // Process the final transcript
        const finalTranscript = transcript || interimTranscript;

        if (finalTranscript && state === 'listening') {
          setState('processing');

          // Small delay to show processing state
          setTimeout(() => {
            const commandResult = processTranscript(finalTranscript);
            setResult(commandResult);

            if (commandResult.success) {
              setState('success');
            } else {
              setState('error');
              setError(commandResult.error || 'Could not understand command');
            }

            onResult?.(commandResult);
          }, 300);
        } else if (state === 'listening') {
          setState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Trigger haptic feedback on mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setError('Failed to start voice input');
      setState('error');
    }
  }, [isSupported, language, transcript, interimTranscript, state, processTranscript, onResult, onError]);

  /**
   * Stop listening (triggers processing)
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /**
   * Cancel without processing
   */
  const cancel = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setState('idle');
    setTranscript('');
    setInterimTranscript('');
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel();
    setError(null);
    setResult(null);
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    isSupported,
    transcript,
    interimTranscript,
    error,
    result,
    startListening,
    stopListening,
    cancel,
    reset,
  };
}

export default useVoiceCommands;
