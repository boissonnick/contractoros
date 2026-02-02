/**
 * Dashboard Widget Types
 * Core type definitions for customizable dashboard widgets
 */

// Widget size options
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

// Available widget types
export type WidgetType =
  | 'revenue'
  | 'projects'
  | 'tasks'
  | 'activity'
  | 'calendar'
  | 'quick-actions';

// Widget position in grid
export interface WidgetPosition {
  x: number; // Column position (0-11 in 12-column grid)
  y: number; // Row position
  w: number; // Width in grid units
  h: number; // Height in grid units
}

// Widget configuration
export interface WidgetConfig {
  [key: string]: unknown;
  // Common config options
  showHeader?: boolean;
  refreshInterval?: number; // in seconds
  limit?: number; // for list widgets
}

// Individual widget definition
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  config: WidgetConfig;
}

// Dashboard layout stored per user
export interface DashboardLayout {
  userId: string;
  orgId: string;
  widgets: Widget[];
  gridColumns: number;
  lastModified: Date;
}

// Widget definition for registry
export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  icon: string; // Heroicon name
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  defaultConfig: WidgetConfig;
}

// Size to grid units mapping
export const SIZE_TO_GRID: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 9, h: 4 },
  full: { w: 12, h: 4 },
};

// Widget drag state
export interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  dropTargetId: string | null;
}

// Widget component props
export interface WidgetComponentProps {
  widget: Widget;
  isEditing?: boolean;
  onConfigChange?: (config: WidgetConfig) => void;
}
