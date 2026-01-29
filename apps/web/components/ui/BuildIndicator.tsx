"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

// These are set at build time
const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

export default function BuildIndicator() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  // Don't render on dashboard routes - DevToolsWidget handles it there
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 cursor-pointer select-none"
      onClick={() => setExpanded(!expanded)}
    >
      <div className={`
        bg-gray-900/90 text-white text-xs font-mono rounded-lg shadow-lg backdrop-blur-sm
        transition-all duration-200 ease-in-out
        ${expanded ? 'px-3 py-2' : 'px-2 py-1'}
      `}>
        {expanded ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Build:</span>
              <span className="text-green-400">{BUILD_VERSION}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Time:</span>
              <span className="text-blue-400">{new Date(BUILD_TIME).toLocaleString()}</span>
            </div>
            <div className="text-gray-500 text-[10px] mt-1">Click to collapse</div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-300">v{BUILD_VERSION.slice(0, 7)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
