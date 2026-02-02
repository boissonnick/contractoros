'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BulkCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (id: string, checked: boolean, shiftKey: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function BulkCheckbox({
  id,
  checked,
  onChange,
  disabled = false,
  className,
}: BulkCheckboxProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(id, e.target.checked, false);
    },
    [id, onChange]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      // Prevent the change event from firing, we'll handle it manually
      e.stopPropagation();
      const target = e.target as HTMLInputElement;
      onChange(id, !checked, e.shiftKey);
    },
    [id, checked, onChange]
  );

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-blue-600',
        'focus:ring-blue-500 focus:ring-2 focus:ring-offset-0',
        'transition-colors cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  );
}

// Header checkbox for select all
interface BulkSelectAllCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function BulkSelectAllCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  className,
}: BulkSelectAllCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600',
          'focus:ring-blue-500 focus:ring-2 focus:ring-offset-0',
          'transition-colors cursor-pointer',
          'disabled:cursor-not-allowed'
        )}
      />
      {label && (
        <span className="text-sm text-gray-600">{label}</span>
      )}
    </label>
  );
}

// Hook for managing bulk selection state with shift-click support
interface UseBulkSelectionOptions {
  items: { id: string }[];
  initialSelection?: string[];
}

interface UseBulkSelectionReturn {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string, checked: boolean, shiftKey: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectRange: (startId: string, endId: string) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export function useBulkSelection({
  items,
  initialSelection = [],
}: UseBulkSelectionOptions): UseBulkSelectionReturn {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(initialSelection)
  );
  const lastSelectedRef = useRef<string | null>(null);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectRange = useCallback(
    (startId: string, endId: string) => {
      const startIndex = items.findIndex((item) => item.id === startId);
      const endIndex = items.findIndex((item) => item.id === endId);

      if (startIndex === -1 || endIndex === -1) return;

      const [minIndex, maxIndex] =
        startIndex < endIndex
          ? [startIndex, endIndex]
          : [endIndex, startIndex];

      const rangeIds = items
        .slice(minIndex, maxIndex + 1)
        .map((item) => item.id);

      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        rangeIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    },
    [items]
  );

  const toggleSelection = useCallback(
    (id: string, checked: boolean, shiftKey: boolean) => {
      if (shiftKey && lastSelectedRef.current && checked) {
        // Shift-click: select range
        selectRange(lastSelectedRef.current, id);
      } else {
        // Regular click: toggle single item
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          if (checked) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
      }

      if (checked) {
        lastSelectedRef.current = id;
      }
    },
    [selectRange]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  }, []);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    isAllSelected,
    isIndeterminate,
  };
}

// Row wrapper with selection highlight
interface BulkSelectableRowProps {
  id: string;
  isSelected: boolean;
  onToggle: (id: string, checked: boolean, shiftKey: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function BulkSelectableRow({
  id,
  isSelected,
  onToggle,
  children,
  className,
}: BulkSelectableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
        className
      )}
    >
      <td className="px-4 py-3 w-10">
        <BulkCheckbox id={id} checked={isSelected} onChange={onToggle} />
      </td>
      {children}
    </tr>
  );
}

export default BulkCheckbox;
