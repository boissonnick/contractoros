/**
 * TagInput Component
 *
 * Input for managing a list of tags/chips with add/remove functionality.
 * Commonly used for skills, categories, labels, etc.
 *
 * @example
 * // Basic usage
 * <TagInput
 *   label="Tags"
 *   tags={tags}
 *   onTagsChange={setTags}
 *   placeholder="Add a tag..."
 * />
 *
 * @example
 * // With suggestions
 * <TagInput
 *   label="Skills"
 *   tags={skills}
 *   onTagsChange={setSkills}
 *   suggestions={['Plumbing', 'Electrical', 'HVAC', 'Carpentry']}
 * />
 *
 * @example
 * // With max tags
 * <TagInput
 *   label="Categories"
 *   tags={categories}
 *   onTagsChange={setCategories}
 *   maxTags={5}
 *   helperText="Select up to 5 categories"
 * />
 */

'use client';

import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon, PlusIcon } from '@heroicons/react/20/solid';

export interface TagInputProps {
  /**
   * Label text displayed above the input
   */
  label?: string;

  /**
   * Current tags array
   */
  tags: string[];

  /**
   * Callback when tags change
   */
  onTagsChange: (tags: string[]) => void;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;

  /**
   * Suggested tags to show as quick-add buttons
   */
  suggestions?: string[];

  /**
   * Maximum number of tags allowed
   */
  maxTags?: number;

  /**
   * Whether to allow duplicate tags (default: false)
   */
  allowDuplicates?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text displayed below the input
   */
  helperText?: string;

  /**
   * Tag color variant
   */
  tagVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';

  /**
   * Additional className for the container
   */
  className?: string;

  /**
   * Required field indicator
   */
  required?: boolean;
}

const tagVariantClasses = {
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  primary: 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20',
  success: 'bg-green-100 text-green-800 hover:bg-green-200',
  warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  danger: 'bg-red-100 text-red-800 hover:bg-red-200',
};

export function TagInput({
  label,
  tags,
  onTagsChange,
  placeholder = 'Add tag...',
  suggestions = [],
  maxTags,
  allowDuplicates = false,
  disabled = false,
  error,
  helperText,
  tagVariant = 'default',
  className,
  required,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = !maxTags || tags.length < maxTags;

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag) return;
      if (!canAddMore) return;
      if (!allowDuplicates && tags.includes(trimmedTag)) return;

      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
    },
    [tags, onTagsChange, canAddMore, allowDuplicates]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags, onTagsChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [inputValue, tags, addTag, removeTag]
  );

  // Filter suggestions to show only those not already selected
  const availableSuggestions = suggestions.filter(
    (s) => !tags.includes(s)
  );

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Tags container */}
      <div
        className={cn(
          'min-h-[42px] p-2 rounded-lg border bg-white',
          'focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary',
          'transition-colors',
          error
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20'
            : 'border-gray-300',
          disabled && 'bg-gray-50 cursor-not-allowed'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-2">
          {/* Existing tags */}
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
                'transition-colors',
                tagVariantClasses[tagVariant],
                disabled && 'opacity-50'
              )}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}

          {/* Input field */}
          {canAddMore && !disabled && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={tags.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            />
          )}
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && availableSuggestions.length > 0 && canAddMore && !disabled && (
        <div className="mt-2 flex flex-wrap gap-2">
          {availableSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm',
                'border border-dashed border-gray-300 text-gray-600',
                'hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5',
                'transition-colors'
              )}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error / Helper text */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      {maxTags && !error && !helperText && (
        <p className="mt-1 text-sm text-gray-500">
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

export default TagInput;
