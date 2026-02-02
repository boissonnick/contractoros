'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EMAIL_VARIABLES, EmailVariable } from '@/lib/email/types';
import { ChevronDownIcon, VariableIcon } from '@heroicons/react/24/outline';

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  className?: string;
}

export function VariablePicker({ onSelect, className = '' }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVariables = EMAIL_VARIABLES.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (variable: EmailVariable) => {
    onSelect(`{{${variable.name}}}`);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        <VariableIcon className="h-4 w-4" />
        Insert Variable
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              autoFocus
            />
          </div>

          {/* Variables list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredVariables.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                No variables found
              </div>
            ) : (
              filteredVariables.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => handleSelect(variable)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {variable.label}
                    </span>
                    <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                      {`{{${variable.name}}}`}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{variable.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Example: {variable.example}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VariablePicker;
