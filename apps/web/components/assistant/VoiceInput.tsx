'use client';

import React from 'react';
import { MicrophoneIcon, StopIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { VoiceState } from '@/lib/assistant/types';

interface VoiceInputProps {
  voiceState: VoiceState;
  transcript?: string;
  onStop: () => void;
}

export function VoiceInput({ voiceState, transcript, onStop }: VoiceInputProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-violet-600 to-purple-700 flex flex-col items-center justify-center p-8 text-white">
      {/* Animated circles */}
      <div className="relative mb-8">
        <div
          className={`absolute inset-0 rounded-full bg-white/20 ${
            voiceState === 'listening' ? 'animate-ping' : ''
          }`}
          style={{
            width: '120px',
            height: '120px',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />
        <div
          className={`absolute inset-0 rounded-full bg-white/30 ${
            voiceState === 'listening' ? 'animate-pulse' : ''
          }`}
          style={{
            width: '100px',
            height: '100px',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />

        {/* Main icon */}
        <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center">
          {voiceState === 'listening' && (
            <MicrophoneIcon className="h-10 w-10 text-violet-600 animate-pulse" />
          )}
          {voiceState === 'processing' && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {voiceState === 'speaking' && (
            <SpeakerWaveIcon className="h-10 w-10 text-violet-600 animate-pulse" />
          )}
          {voiceState === 'error' && (
            <span className="text-2xl">!</span>
          )}
        </div>
      </div>

      {/* Status text */}
      <div className="text-center mb-6">
        {voiceState === 'listening' && (
          <>
            <p className="text-lg font-medium">Listening...</p>
            <p className="text-sm text-white/70 mt-1">Speak your question</p>
          </>
        )}
        {voiceState === 'processing' && (
          <>
            <p className="text-lg font-medium">Processing...</p>
            <p className="text-sm text-white/70 mt-1">Understanding your question</p>
          </>
        )}
        {voiceState === 'speaking' && (
          <>
            <p className="text-lg font-medium">Speaking...</p>
            <p className="text-sm text-white/70 mt-1">Playing response</p>
          </>
        )}
        {voiceState === 'error' && (
          <>
            <p className="text-lg font-medium">Error</p>
            <p className="text-sm text-white/70 mt-1">Could not recognize speech</p>
          </>
        )}
      </div>

      {/* Transcript preview */}
      {transcript && (
        <div className="bg-white/10 rounded-lg px-4 py-2 max-w-xs mb-6">
          <p className="text-sm text-white/90 italic">&quot;{transcript}&quot;</p>
        </div>
      )}

      {/* Stop button */}
      <button
        onClick={onStop}
        className="flex items-center gap-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
      >
        <StopIcon className="h-5 w-5" />
        <span className="font-medium">
          {voiceState === 'listening' ? 'Cancel' : 'Stop'}
        </span>
      </button>
    </div>
  );
}

export default VoiceInput;
