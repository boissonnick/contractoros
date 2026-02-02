'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useVoiceCommands, type VoiceCommandsContext, type VoiceCommandResult, type VoiceCommandType } from '@/lib/voice/useVoiceCommands';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceActivationFABProps {
  /** Context for parsing voice commands */
  context: VoiceCommandsContext;
  /** Type of command to parse (auto-detect by default) */
  commandType?: VoiceCommandType;
  /** Callback when a command is successfully parsed */
  onResult?: (result: VoiceCommandResult) => void;
  /** Callback when user confirms the parsed result */
  onConfirm?: (result: VoiceCommandResult) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Position offset from bottom (to account for bottom nav) */
  bottomOffset?: number;
  /** Whether to show confirmation UI before executing */
  requireConfirmation?: boolean;
  /** Custom label for the button */
  label?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoiceActivationFAB({
  context,
  commandType = 'auto',
  onResult,
  onConfirm,
  onCancel,
  className = '',
  bottomOffset = 80,
  requireConfirmation = true,
  label,
}: VoiceActivationFABProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingResult, setPendingResult] = useState<VoiceCommandResult | null>(null);

  const handleResult = useCallback((result: VoiceCommandResult) => {
    onResult?.(result);

    if (requireConfirmation && result.success) {
      setPendingResult(result);
      setShowConfirmation(true);
    } else if (!requireConfirmation && result.success) {
      onConfirm?.(result);
    }
  }, [onResult, onConfirm, requireConfirmation]);

  const {
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
  } = useVoiceCommands(context, {
    onResult: handleResult,
    commandType,
  });

  const handleConfirm = useCallback(() => {
    if (pendingResult) {
      onConfirm?.(pendingResult);
    }
    setShowConfirmation(false);
    setPendingResult(null);
    reset();
  }, [pendingResult, onConfirm, reset]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setPendingResult(null);
    onCancel?.();
    reset();
  }, [onCancel, reset]);

  // Auto-dismiss success/error states
  useEffect(() => {
    if (state === 'success' && !requireConfirmation) {
      const timer = setTimeout(reset, 2000);
      return () => clearTimeout(timer);
    }
    if (state === 'error') {
      const timer = setTimeout(reset, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, reset, requireConfirmation]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Button colors and icons based on state
  const getStateStyles = () => {
    switch (state) {
      case 'listening':
        return {
          bgClass: 'bg-red-500 hover:bg-red-600',
          ringClass: 'ring-red-300',
          Icon: StopIcon,
          pulse: true,
        };
      case 'processing':
        return {
          bgClass: 'bg-yellow-500',
          ringClass: 'ring-yellow-300',
          Icon: MicrophoneIcon,
          pulse: false,
        };
      case 'success':
        return {
          bgClass: 'bg-green-500',
          ringClass: 'ring-green-300',
          Icon: CheckCircleIcon,
          pulse: false,
        };
      case 'error':
        return {
          bgClass: 'bg-red-500',
          ringClass: 'ring-red-300',
          Icon: ExclamationTriangleIcon,
          pulse: false,
        };
      default:
        return {
          bgClass: 'bg-violet-600 hover:bg-violet-700',
          ringClass: 'ring-violet-300',
          Icon: MicrophoneIcon,
          pulse: false,
        };
    }
  };

  const { bgClass, ringClass, Icon, pulse } = getStateStyles();

  const handleClick = () => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'idle' || state === 'error') {
      startListening();
    } else if (state === 'success' && showConfirmation) {
      // Do nothing, let user use the confirmation UI
    }
  };

  // Format the result for display
  const formatResultPreview = (res: VoiceCommandResult) => {
    if (!res.success || !res.data) return null;

    switch (res.type) {
      case 'time_entry': {
        const data = res.data as { hours: number; description: string; projectName?: string };
        return (
          <div className="text-sm">
            <p className="font-medium">{data.hours} hours</p>
            <p className="text-gray-600">{data.description}</p>
            {data.projectName && (
              <p className="text-gray-500 text-xs">at {data.projectName}</p>
            )}
          </div>
        );
      }
      case 'daily_log': {
        const data = res.data as { title: string; category: string; crewCount?: number };
        return (
          <div className="text-sm">
            <p className="font-medium">{data.title}</p>
            <p className="text-gray-600 capitalize">{data.category}</p>
            {data.crewCount && (
              <p className="text-gray-500 text-xs">{data.crewCount} crew members</p>
            )}
          </div>
        );
      }
      case 'task': {
        const data = res.data as { taskTitle?: string; action: string };
        return (
          <div className="text-sm">
            <p className="font-medium capitalize">{data.action}</p>
            <p className="text-gray-600">{data.taskTitle}</p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmation && pendingResult && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ paddingBottom: bottomOffset + 80 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleCancel}
          />

          {/* Confirmation Card */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-4 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Confirm Voice Command</h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Transcript */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600 italic">
                &quot;{pendingResult.transcript}&quot;
              </p>
            </div>

            {/* Parsed Result */}
            <div className="mb-4">
              {formatResultPreview(pendingResult)}
            </div>

            {/* Warnings */}
            {pendingResult.data && 'warnings' in pendingResult.data && pendingResult.data.warnings && (
              <div className="mb-4 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                {(pendingResult.data.warnings as string[]).map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 text-white bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listening Overlay */}
      {(state === 'listening' || state === 'processing') && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-violet-600/95 to-violet-700/95 text-white p-6 pb-safe animate-slide-up"
          style={{ paddingBottom: bottomOffset + 24 }}
        >
          <div className="max-w-md mx-auto text-center">
            {/* Animated Icon */}
            <div className="relative mb-4 flex justify-center">
              {state === 'listening' && (
                <>
                  <div className="absolute w-16 h-16 rounded-full bg-white/20 animate-ping" />
                  <div className="absolute w-14 h-14 rounded-full bg-white/30 animate-pulse" />
                </>
              )}
              <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center">
                {state === 'listening' ? (
                  <MicrophoneIcon className="h-6 w-6 text-violet-600 animate-pulse" />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Status Text */}
            <p className="text-lg font-medium mb-1">
              {state === 'listening' ? 'Listening...' : 'Processing...'}
            </p>
            <p className="text-sm text-white/70 mb-4">
              {state === 'listening'
                ? 'Speak your command'
                : 'Understanding your request'}
            </p>

            {/* Transcript */}
            {(transcript || interimTranscript) && (
              <div className="bg-white/10 rounded-lg px-4 py-2 mb-4">
                <p className="text-sm text-white/90 italic">
                  &quot;{transcript || interimTranscript}&quot;
                </p>
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={cancel}
              className="flex items-center gap-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors mx-auto"
            >
              <StopIcon className="h-5 w-5" />
              <span className="font-medium">Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state === 'error' && !showConfirmation && (
        <div
          className="fixed left-4 right-4 z-40 bg-red-500 text-white rounded-xl p-4 shadow-xl animate-slide-up"
          style={{ bottom: bottomOffset + 80 }}
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Could not understand</p>
              <p className="text-sm text-white/80">{error || 'Please try again'}</p>
            </div>
            <button onClick={reset} className="text-white/80 hover:text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={handleClick}
        disabled={state === 'processing'}
        className={`
          fixed z-30 right-4 w-14 h-14 rounded-full
          flex items-center justify-center
          shadow-lg transition-all duration-200
          focus:outline-none focus:ring-4 ${ringClass}
          ${bgClass}
          ${pulse ? 'animate-pulse' : ''}
          ${state === 'processing' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
          ${className}
        `}
        style={{ bottom: bottomOffset }}
        aria-label={label || 'Voice command'}
      >
        <Icon className="h-6 w-6 text-white" />
      </button>
    </>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default VoiceActivationFAB;
