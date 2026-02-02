'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { PlusIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Widget, DashboardLayout, DragState, SIZE_TO_GRID } from '@/lib/dashboard-widgets/types';
import { WidgetContainer } from './WidgetContainer';
import { RevenueWidget } from './widgets/RevenueWidget';
import { ProjectStatusWidget } from './widgets/ProjectStatusWidget';
import { TasksWidget } from './widgets/TasksWidget';

interface WidgetGridProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onAddWidget: () => void;
}

// Widget component map
const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ widget: Widget }>> = {
  revenue: RevenueWidget,
  projects: ProjectStatusWidget,
  tasks: TasksWidget,
  // Add more widget components as they're created
};

export function WidgetGrid({ layout, onLayoutChange, onAddWidget }: WidgetGridProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    dropTargetId: null,
  });

  // Handle widget removal
  const handleRemove = useCallback(
    (widgetId: string) => {
      const newWidgets = layout.widgets.filter((w) => w.id !== widgetId);
      onLayoutChange({
        ...layout,
        widgets: newWidgets,
        lastModified: new Date(),
      });
    },
    [layout, onLayoutChange]
  );

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    setDragState({
      isDragging: true,
      draggedId: widgetId,
      dropTargetId: null,
    });
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedId: null,
      dropTargetId: null,
    });
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((widgetId: string) => {
    setDragState((prev) => ({
      ...prev,
      dropTargetId: widgetId,
    }));
  }, []);

  // Handle drop - reorder widgets
  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      const sourceId = dragState.draggedId;
      if (!sourceId || sourceId === targetId) {
        handleDragEnd();
        return;
      }

      const widgets = [...layout.widgets];
      const sourceIndex = widgets.findIndex((w) => w.id === sourceId);
      const targetIndex = widgets.findIndex((w) => w.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        handleDragEnd();
        return;
      }

      // Swap positions
      const [removed] = widgets.splice(sourceIndex, 1);
      widgets.splice(targetIndex, 0, removed);

      // Recalculate positions
      let currentX = 0;
      let currentY = 0;
      let rowHeight = 0;

      const repositionedWidgets = widgets.map((widget) => {
        if (currentX + widget.position.w > layout.gridColumns) {
          currentX = 0;
          currentY += rowHeight;
          rowHeight = 0;
        }

        const newWidget = {
          ...widget,
          position: {
            ...widget.position,
            x: currentX,
            y: currentY,
          },
        };

        currentX += widget.position.w;
        rowHeight = Math.max(rowHeight, widget.position.h);

        return newWidget;
      });

      onLayoutChange({
        ...layout,
        widgets: repositionedWidgets,
        lastModified: new Date(),
      });

      handleDragEnd();
    },
    [dragState.draggedId, layout, onLayoutChange, handleDragEnd]
  );

  // Calculate grid styles for each widget
  const getWidgetGridStyle = useCallback((widget: Widget): React.CSSProperties => {
    const { w, h } = widget.position;
    return {
      gridColumn: `span ${w}`,
      gridRow: `span ${h}`,
    };
  }, []);

  // Render widget content based on type
  const renderWidgetContent = useCallback((widget: Widget) => {
    const WidgetComponent = WIDGET_COMPONENTS[widget.type];
    if (WidgetComponent) {
      return <WidgetComponent widget={widget} />;
    }
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        Widget type &quot;{widget.type}&quot; not implemented
      </div>
    );
  }, []);

  // Check if there's space for more widgets
  const hasSpace = useMemo(() => {
    const totalUnits = layout.widgets.reduce(
      (sum, w) => sum + w.position.w * w.position.h,
      0
    );
    // Assume max of 5 rows
    const maxUnits = layout.gridColumns * 5;
    return totalUnits < maxUnits;
  }, [layout]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2">
          {hasSpace && (
            <button
              onClick={onAddWidget}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Widget
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${
                isEditing
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {isEditing ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4" />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${layout.gridColumns}, minmax(0, 1fr))`,
        }}
      >
        {layout.widgets.map((widget) => (
          <div key={widget.id} style={getWidgetGridStyle(widget)}>
            <WidgetContainer
              widget={widget}
              isEditing={isEditing}
              isDragging={dragState.draggedId === widget.id}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={() => handleDragOver(widget.id)}
              onDrop={handleDrop}
            >
              {renderWidgetContent(widget)}
            </WidgetContainer>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {layout.widgets.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No widgets added yet</p>
          <button
            onClick={onAddWidget}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Your First Widget
          </button>
        </div>
      )}
    </div>
  );
}

export default WidgetGrid;
