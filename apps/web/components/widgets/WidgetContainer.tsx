'use client';

import React, { useState, useCallback } from 'react';
import {
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { Widget, WidgetConfig } from '@/lib/dashboard-widgets/types';

interface WidgetContainerProps {
  widget: Widget;
  children: React.ReactNode;
  isEditing?: boolean;
  isDragging?: boolean;
  onRemove?: (widgetId: string) => void;
  onSettings?: (widgetId: string) => void;
  onConfigChange?: (widgetId: string, config: WidgetConfig) => void;
  onDragStart?: (e: React.DragEvent, widgetId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, widgetId: string) => void;
}

export function WidgetContainer({
  widget,
  children,
  isEditing = false,
  isDragging = false,
  onRemove,
  onSettings,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: WidgetContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (onDragStart) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', widget.id);
        onDragStart(e, widget.id);
      }
    },
    [onDragStart, widget.id]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      if (onDragEnd) {
        onDragEnd(e);
      }
    },
    [onDragEnd]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (onDragOver) {
        onDragOver(e);
      }
    },
    [onDragOver]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (onDrop) {
        onDrop(e, widget.id);
      }
    },
    [onDrop, widget.id]
  );

  const showControls = isEditing || isHovered;

  return (
    <div
      className={`
        relative bg-white rounded-lg border shadow-sm overflow-hidden
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95 border-blue-400 border-2' : 'border-gray-200'}
        ${isEditing ? 'ring-2 ring-blue-100' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      {widget.config.showHeader !== false && (
        <div
          className={`
            flex items-center justify-between px-4 py-3 border-b border-gray-100
            ${isEditing ? 'cursor-move bg-gray-50' : 'bg-white'}
          `}
          draggable={isEditing}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-center gap-2">
            {isEditing && (
              <Bars3Icon className="h-4 w-4 text-gray-400 cursor-grab" />
            )}
            <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex items-center gap-1">
              {onSettings && (
                <button
                  onClick={() => onSettings(widget.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Widget settings"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
              )}
              {onRemove && isEditing && (
                <button
                  onClick={() => onRemove(widget.id)}
                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove widget"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Widget Content */}
      <div className="p-4">{children}</div>

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center">
          <span className="text-blue-600 font-medium text-sm">Drop here</span>
        </div>
      )}
    </div>
  );
}

export default WidgetContainer;
