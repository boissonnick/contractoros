/**
 * Dashboard Layout Manager
 * Handles saving and loading dashboard layouts from Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DashboardLayout, Widget, WidgetType } from './types';
import { createWidget } from './widget-registry';

const COLLECTION_PATH = 'users';
const SUBCOLLECTION = 'dashboardConfig';
const DOC_ID = 'layout';

/**
 * Save dashboard layout to Firestore
 */
export async function saveDashboardLayout(
  userId: string,
  orgId: string,
  layout: Omit<DashboardLayout, 'userId' | 'orgId' | 'lastModified'>
): Promise<void> {
  const docRef = doc(db, COLLECTION_PATH, userId, SUBCOLLECTION, DOC_ID);

  const data = {
    userId,
    orgId,
    widgets: layout.widgets,
    gridColumns: layout.gridColumns,
    lastModified: Timestamp.now(),
  };

  await setDoc(docRef, data, { merge: true });
}

/**
 * Load dashboard layout from Firestore
 */
export async function loadDashboardLayout(
  userId: string,
  orgId: string
): Promise<DashboardLayout | null> {
  const docRef = doc(db, COLLECTION_PATH, userId, SUBCOLLECTION, DOC_ID);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    userId: data.userId,
    orgId: data.orgId,
    widgets: data.widgets || [],
    gridColumns: data.gridColumns || 12,
    lastModified: data.lastModified?.toDate() || new Date(),
  };
}

/**
 * Get default dashboard layout for new users
 */
export function getDefaultLayout(userId: string, orgId: string): DashboardLayout {
  const defaultWidgets: Widget[] = [
    createWidget('revenue', { x: 0, y: 0 }),
    createWidget('projects', { x: 6, y: 0 }),
    createWidget('tasks', { x: 0, y: 3 }),
    createWidget('quick-actions', { x: 6, y: 3 }),
  ];

  return {
    userId,
    orgId,
    widgets: defaultWidgets,
    gridColumns: 12,
    lastModified: new Date(),
  };
}

/**
 * Add a widget to the layout
 */
export function addWidgetToLayout(
  layout: DashboardLayout,
  type: WidgetType
): DashboardLayout {
  // Find the next available position
  const position = findNextAvailablePosition(layout.widgets, layout.gridColumns);
  const newWidget = createWidget(type, position);

  return {
    ...layout,
    widgets: [...layout.widgets, newWidget],
    lastModified: new Date(),
  };
}

/**
 * Remove a widget from the layout
 */
export function removeWidgetFromLayout(
  layout: DashboardLayout,
  widgetId: string
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.filter((w) => w.id !== widgetId),
    lastModified: new Date(),
  };
}

/**
 * Update a widget in the layout
 */
export function updateWidgetInLayout(
  layout: DashboardLayout,
  widgetId: string,
  updates: Partial<Widget>
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    ),
    lastModified: new Date(),
  };
}

/**
 * Reorder widgets in the layout
 */
export function reorderWidgets(
  layout: DashboardLayout,
  sourceIndex: number,
  destinationIndex: number
): DashboardLayout {
  const widgets = [...layout.widgets];
  const [removed] = widgets.splice(sourceIndex, 1);
  widgets.splice(destinationIndex, 0, removed);

  // Recalculate positions
  const repositionedWidgets = recalculatePositions(widgets, layout.gridColumns);

  return {
    ...layout,
    widgets: repositionedWidgets,
    lastModified: new Date(),
  };
}

/**
 * Find the next available position for a new widget
 */
function findNextAvailablePosition(
  widgets: Widget[],
  gridColumns: number
): { x: number; y: number } {
  if (widgets.length === 0) {
    return { x: 0, y: 0 };
  }

  // Find the maximum y position + height
  let maxBottom = 0;
  let maxRight = 0;
  let maxRightY = 0;

  widgets.forEach((widget) => {
    const bottom = widget.position.y + widget.position.h;
    const right = widget.position.x + widget.position.w;

    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
    if (right > maxRight) {
      maxRight = right;
      maxRightY = widget.position.y;
    }
  });

  // Try to place next to the rightmost widget if there's space
  if (maxRight + 6 <= gridColumns) {
    return { x: maxRight, y: maxRightY };
  }

  // Otherwise, place below all widgets
  return { x: 0, y: maxBottom };
}

/**
 * Recalculate widget positions after reordering
 */
function recalculatePositions(widgets: Widget[], gridColumns: number): Widget[] {
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  return widgets.map((widget) => {
    // Check if widget fits in current row
    if (currentX + widget.position.w > gridColumns) {
      // Move to next row
      currentX = 0;
      currentY += rowHeight;
      rowHeight = 0;
    }

    const newPosition = {
      ...widget.position,
      x: currentX,
      y: currentY,
    };

    currentX += widget.position.w;
    rowHeight = Math.max(rowHeight, widget.position.h);

    return {
      ...widget,
      position: newPosition,
    };
  });
}
