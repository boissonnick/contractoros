"use client";

import React, { useState } from 'react';
import { TaskChecklistItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface TaskChecklistProps {
  checklist: TaskChecklistItem[];
  onChange: (checklist: TaskChecklistItem[]) => void;
  editable?: boolean;
  userId?: string;
}

export default function TaskChecklist({
  checklist,
  onChange,
  editable = true,
  userId,
}: TaskChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const completedCount = checklist.filter(item => item.isCompleted).length;
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem: TaskChecklistItem = {
      id: `checklist-${Date.now()}`,
      title: newItemTitle.trim(),
      isCompleted: false,
      order: checklist.length,
    };

    onChange([...checklist, newItem]);
    setNewItemTitle('');
  };

  const handleToggleItem = (itemId: string) => {
    onChange(
      checklist.map(item =>
        item.id === itemId
          ? {
              ...item,
              isCompleted: !item.isCompleted,
              completedAt: !item.isCompleted ? new Date() : undefined,
              completedBy: !item.isCompleted ? userId : undefined,
            }
          : item
      )
    );
  };

  const handleUpdateItemTitle = (itemId: string, title: string) => {
    onChange(
      checklist.map(item =>
        item.id === itemId ? { ...item, title } : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    onChange(checklist.filter(item => item.id !== itemId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newChecklist = [...checklist];
    const [draggedItem] = newChecklist.splice(draggedIndex, 1);
    newChecklist.splice(index, 0, draggedItem);

    // Update order values
    newChecklist.forEach((item, i) => {
      item.order = i;
    });

    onChange(newChecklist);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {checklist.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {completedCount}/{checklist.length}
          </span>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-1">
        {checklist
          .sort((a, b) => a.order - b.order)
          .map((item, index) => (
            <div
              key={item.id}
              draggable={editable}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg group transition-colors',
                draggedIndex === index ? 'opacity-50 bg-brand-50' : 'hover:bg-gray-50',
                item.isCompleted && 'opacity-60'
              )}
            >
              {/* Drag handle */}
              {editable && (
                <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bars3Icon className="h-4 w-4 text-gray-400" />
                </div>
              )}

              {/* Checkbox */}
              <button
                onClick={() => handleToggleItem(item.id)}
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  item.isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-brand-primary'
                )}
              >
                {item.isCompleted && <CheckIcon className="h-3 w-3" />}
              </button>

              {/* Title */}
              {editable ? (
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                  className={cn(
                    'flex-1 text-sm bg-transparent border-none focus:ring-0 p-0',
                    item.isCompleted && 'line-through text-gray-400'
                  )}
                />
              ) : (
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.isCompleted && 'line-through text-gray-400'
                  )}
                >
                  {item.title}
                </span>
              )}

              {/* Delete button */}
              {editable && (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
      </div>

      {/* Add new item */}
      {editable && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem();
              }
            }}
            placeholder="Add checklist item..."
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            disabled={!newItemTitle.trim()}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Empty state */}
      {checklist.length === 0 && !editable && (
        <p className="text-sm text-gray-400 italic">No checklist items</p>
      )}
    </div>
  );
}
