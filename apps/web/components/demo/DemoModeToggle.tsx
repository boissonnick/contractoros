'use client';

import { useDemoMode } from '@/lib/contexts/DemoContext';

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Demo Mode
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Show demo banner and highlight key features
        </span>
      </div>
      <button
        role="switch"
        aria-checked={isDemoMode}
        onClick={toggleDemoMode}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isDemoMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDemoMode ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
