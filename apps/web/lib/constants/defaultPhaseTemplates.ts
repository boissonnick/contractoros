import { PhaseTemplatePhase } from '@/types';

export interface DefaultTemplate {
  name: string;
  scopeType: string;
  phases: PhaseTemplatePhase[];
}

export const DEFAULT_PHASE_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Single Room Remodel',
    scopeType: 'single_room',
    phases: [
      { name: 'Demo', order: 1 },
      { name: 'Rough-In', order: 2 },
      { name: 'Finishes', order: 3 },
      { name: 'Punch List', order: 4 },
    ],
  },
  {
    name: 'Addition',
    scopeType: 'addition',
    phases: [
      { name: 'Design', order: 1 },
      { name: 'Permitting', order: 2 },
      { name: 'Foundation', order: 3 },
      { name: 'Framing', order: 4 },
      { name: 'MEP Rough', order: 5 },
      { name: 'Insulation / Drywall', order: 6 },
      { name: 'Finishes', order: 7 },
      { name: 'Punch List', order: 8 },
    ],
  },
  {
    name: 'Full Renovation',
    scopeType: 'full_renovation',
    phases: [
      { name: 'Demo', order: 1 },
      { name: 'Design', order: 2 },
      { name: 'Permitting', order: 3 },
      { name: 'Rough-In', order: 4 },
      { name: 'Insulation / Drywall', order: 5 },
      { name: 'Finishes', order: 6 },
      { name: 'Punch List', order: 7 },
    ],
  },
  {
    name: 'New Construction',
    scopeType: 'new_construction',
    phases: [
      { name: 'Site Prep', order: 1 },
      { name: 'Foundation', order: 2 },
      { name: 'Framing', order: 3 },
      { name: 'Roofing', order: 4 },
      { name: 'MEP Rough', order: 5 },
      { name: 'Insulation', order: 6 },
      { name: 'Drywall', order: 7 },
      { name: 'Exterior', order: 8 },
      { name: 'Interior Finishes', order: 9 },
      { name: 'Landscaping', order: 10 },
      { name: 'Punch List', order: 11 },
    ],
  },
];
