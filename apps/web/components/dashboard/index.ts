// Dashboard Components Export
export { default as ProjectTimelineWidget } from './ProjectTimelineWidget';
export type { ProjectTimelineWidgetProps, ProjectMilestone } from './ProjectTimelineWidget';

export { default as QuickActionsWidget, QuickActionsWidget as QuickActionsWidgetComponent } from './QuickActionsWidget';
export type { QuickActionsWidgetProps, QuickAction } from './QuickActionsWidget';

export { default as RecentActivityFeed } from './RecentActivityFeed';
export type {
  RecentActivityFeedProps,
  Activity,
  ActivityType,
  ActivityAction,
  FilterCategory,
} from './RecentActivityFeed';
