'use client';

import { useDemoMode } from '@/lib/contexts/DemoContext';

export default function DemoModeBanner() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide">
            🎯 Demo Mode — Exploring ContractorOS
          </span>
        </div>
        <button
          onClick={toggleDemoMode}
          className="rounded-md px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
