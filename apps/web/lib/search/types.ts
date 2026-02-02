/**
 * Global Search System Types
 */

export type SearchEntityType =
  | 'project'
  | 'client'
  | 'invoice'
  | 'task'
  | 'estimate'
  | 'subcontractor';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  url: string;
  highlight?: string;
  score: number;
}

export interface SearchFilter {
  entityTypes: SearchEntityType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  query: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  filters: SearchFilter;
}

export const ENTITY_TYPE_LABELS: Record<SearchEntityType, string> = {
  project: 'Project',
  client: 'Client',
  invoice: 'Invoice',
  task: 'Task',
  estimate: 'Estimate',
  subcontractor: 'Subcontractor',
};

export const ENTITY_TYPE_ICONS: Record<SearchEntityType, string> = {
  project: 'BuildingOffice2Icon',
  client: 'UserGroupIcon',
  invoice: 'DocumentTextIcon',
  task: 'ClipboardDocumentListIcon',
  estimate: 'CalculatorIcon',
  subcontractor: 'WrenchScrewdriverIcon',
};
