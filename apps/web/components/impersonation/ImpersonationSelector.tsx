'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { ImpersonationRole, IMPERSONATION_ROLE_INFO } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronUpIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const ROLES: ImpersonationRole[] = [
  'owner',
  'project_manager',
  'finance',
  'employee',
  'contractor',
  'client',
  'assistant',
];

export function ImpersonationSelector() {
  const {
    isImpersonating,
    currentRole,
    switchRole,
    resetImpersonation,
    canImpersonate,
    roleInfo,
  } = useImpersonation();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Don't render if user can't impersonate
  if (!canImpersonate) {
    return null;
  }

  const currentRoleInfo = roleInfo[currentRole];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          'border shadow-sm',
          isImpersonating
            ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        )}
      >
        <span className="text-base">{currentRoleInfo.icon}</span>
        <span>{currentRoleInfo.label}</span>
        <ChevronUpIcon
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen ? 'rotate-180' : ''
          )}
        />
        {isImpersonating && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-amber-200 text-amber-800 rounded">
            DEMO
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              View As
            </p>
          </div>

          <div className="py-1">
            {ROLES.map((role) => {
              const info = roleInfo[role];
              const isSelected = currentRole === role;
              const isActualRole = !isImpersonating && role === 'owner';

              return (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className="text-lg">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{info.label}</span>
                      {isActualRole && (
                        <span className="text-xs text-gray-400">(You)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {info.description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-blue-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isImpersonating && (
            <>
              <div className="border-t border-gray-100" />
              <div className="p-2">
                <button
                  onClick={() => {
                    resetImpersonation();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                  Exit Impersonation Mode
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Banner component to show at top of screen when impersonating
export function ImpersonationBanner() {
  const { isImpersonating, currentRole, resetImpersonation, roleInfo } = useImpersonation();

  if (!isImpersonating) {
    return null;
  }

  const info = roleInfo[currentRole];

  return (
    <div className="bg-amber-500 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{info.icon}</span>
          <span className="font-medium">
            Viewing as: {info.label}
          </span>
          <span className="text-amber-200 text-sm">
            &mdash; {info.description}
          </span>
        </div>
        <button
          onClick={resetImpersonation}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 rounded-md text-sm font-medium transition-colors"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
          Exit
        </button>
      </div>
    </div>
  );
}
