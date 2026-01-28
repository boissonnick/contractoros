declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string;
    name: string;
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
    progress: number; // 0-100
    dependencies?: string; // comma-separated task IDs
    custom_class?: string;
  }

  export interface GanttOptions {
    header_height?: number;
    column_width?: number;
    step?: number;
    view_modes?: string[];
    bar_height?: number;
    bar_corner_radius?: number;
    arrow_curve?: number;
    padding?: number;
    view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
    date_format?: string;
    language?: string;
    custom_popup_html?: (task: GanttTask) => string;
    on_click?: (task: GanttTask) => void;
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: GanttTask, progress: number) => void;
    on_view_change?: (mode: string) => void;
  }

  export default class Gantt {
    constructor(
      wrapper: string | SVGElement | HTMLElement,
      tasks: GanttTask[],
      options?: GanttOptions
    );
    change_view_mode(mode: string): void;
    refresh(tasks: GanttTask[]): void;
  }
}
