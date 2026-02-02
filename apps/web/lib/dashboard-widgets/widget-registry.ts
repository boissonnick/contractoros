/**
 * Widget Registry
 * Central registry for all available dashboard widgets
 */

import { ComponentType } from 'react';
import { WidgetType, WidgetDefinition, WidgetComponentProps, WidgetConfig } from './types';

// Widget definitions with metadata
export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  revenue: {
    type: 'revenue',
    title: 'Revenue Overview',
    description: 'View total revenue this month with comparison to previous periods',
    icon: 'CurrencyDollarIcon',
    defaultSize: 'medium',
    defaultConfig: {
      showHeader: true,
      showComparison: true,
      showChart: true,
    },
  },
  projects: {
    type: 'projects',
    title: 'Project Status',
    description: 'See projects breakdown by status with visual chart',
    icon: 'FolderIcon',
    defaultSize: 'medium',
    defaultConfig: {
      showHeader: true,
      chartType: 'pie',
    },
  },
  tasks: {
    type: 'tasks',
    title: 'Upcoming Tasks',
    description: 'List of tasks due in the next 7 days',
    icon: 'ClipboardDocumentListIcon',
    defaultSize: 'medium',
    defaultConfig: {
      showHeader: true,
      limit: 5,
      daysAhead: 7,
    },
  },
  activity: {
    type: 'activity',
    title: 'Recent Activity',
    description: 'See the latest activity across all projects',
    icon: 'BellIcon',
    defaultSize: 'medium',
    defaultConfig: {
      showHeader: true,
      limit: 10,
    },
  },
  calendar: {
    type: 'calendar',
    title: 'Calendar',
    description: 'View upcoming schedule and deadlines',
    icon: 'CalendarIcon',
    defaultSize: 'large',
    defaultConfig: {
      showHeader: true,
      view: 'week',
    },
  },
  'quick-actions': {
    type: 'quick-actions',
    title: 'Quick Actions',
    description: 'Common actions like create project, add task, etc.',
    icon: 'BoltIcon',
    defaultSize: 'small',
    defaultConfig: {
      showHeader: false,
    },
  },
};

// Lazy-loaded widget components map
type WidgetComponentMap = Record<WidgetType, ComponentType<WidgetComponentProps>>;

let widgetComponents: WidgetComponentMap | null = null;

/**
 * Get the React component for a widget type
 * Components are lazy-loaded to reduce initial bundle size
 */
export function getWidgetComponent(type: WidgetType): ComponentType<WidgetComponentProps> | null {
  // Dynamic imports would be used in production
  // For now, return null and let the WidgetContainer handle lazy loading
  if (!widgetComponents) {
    return null;
  }
  return widgetComponents[type] || null;
}

/**
 * Register widget components (called during app initialization)
 */
export function registerWidgetComponents(components: Partial<WidgetComponentMap>): void {
  widgetComponents = {
    ...widgetComponents,
    ...components,
  } as WidgetComponentMap;
}

/**
 * Get all available widget definitions
 */
export function getAvailableWidgets(): WidgetDefinition[] {
  return Object.values(WIDGET_DEFINITIONS);
}

/**
 * Get widget definition by type
 */
export function getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS[type];
}

/**
 * Create a new widget with default values
 */
export function createWidget(
  type: WidgetType,
  position: { x: number; y: number },
  overrides?: Partial<{ title: string; config: WidgetConfig }>
): {
  id: string;
  type: WidgetType;
  title: string;
  size: import('./types').WidgetSize;
  position: import('./types').WidgetPosition;
  config: WidgetConfig;
} {
  const definition = WIDGET_DEFINITIONS[type];
  const { w, h } = getSizeGridUnits(definition.defaultSize);

  return {
    id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    title: overrides?.title || definition.title,
    size: definition.defaultSize,
    position: {
      x: position.x,
      y: position.y,
      w,
      h,
    },
    config: {
      ...definition.defaultConfig,
      ...overrides?.config,
    },
  };
}

/**
 * Get grid units for a widget size
 */
function getSizeGridUnits(size: import('./types').WidgetSize): { w: number; h: number } {
  const sizeMap = {
    small: { w: 3, h: 2 },
    medium: { w: 6, h: 3 },
    large: { w: 9, h: 4 },
    full: { w: 12, h: 4 },
  };
  return sizeMap[size];
}
