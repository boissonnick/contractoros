'use client';

import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface AssistantTriggerProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export function AssistantTrigger({ onClick, hasUnread }: AssistantTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-36 md:bottom-6 right-4 md:right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-brand-600 to-brand-800 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
      aria-label="Open AI Assistant"
    >
      <SparklesIcon className="h-6 w-6" />

      {/* Unread indicator */}
      {hasUnread && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}

      {/* Tooltip */}
      <span className="sr-only">Open AI Assistant</span>
    </button>
  );
}

/**
 * Mini trigger variant for inline use
 */
export function AssistantTriggerMini({
  onClick,
  label = 'Ask AI',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
    >
      <SparklesIcon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default AssistantTrigger;
