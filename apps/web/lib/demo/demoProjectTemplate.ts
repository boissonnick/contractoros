import { TaskStatus, TaskPriority } from '@/types';

export interface DemoPhase {
  name: string;
  order: number;
  estimatedDuration: number;
  budgetAmount: number;
  tasks: DemoTask[];
}

export interface DemoTask {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  duration: number;
  estimatedHours: number;
}

export const DEMO_PROJECT = {
  name: 'Kitchen Renovation Demo',
  description: 'Full kitchen remodel including new cabinets, countertops, appliances, and flooring. This is a demo project to help you explore ContractorOS.',
  address: {
    street: '456 Oak Lane',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
  },
  status: 'active' as const,
  budget: 85000,
};

export const DEMO_PHASES: DemoPhase[] = [
  {
    name: 'Planning & Design',
    order: 0,
    estimatedDuration: 14,
    budgetAmount: 5000,
    tasks: [
      { title: 'Create project scope document', status: 'completed', priority: 'high', duration: 2, estimatedHours: 4 },
      { title: 'Finalize kitchen layout', status: 'completed', priority: 'high', duration: 3, estimatedHours: 6 },
      { title: 'Select materials and finishes', status: 'in_progress', priority: 'medium', duration: 5, estimatedHours: 8 },
    ],
  },
  {
    name: 'Demolition',
    order: 1,
    estimatedDuration: 5,
    budgetAmount: 8000,
    tasks: [
      { title: 'Remove existing cabinets', status: 'pending', priority: 'high', duration: 1, estimatedHours: 8 },
      { title: 'Remove countertops and backsplash', status: 'pending', priority: 'high', duration: 1, estimatedHours: 6 },
    ],
  },
  {
    name: 'Rough-In',
    order: 2,
    estimatedDuration: 10,
    budgetAmount: 22000,
    tasks: [
      { title: 'Electrical rough-in', status: 'pending', priority: 'high', duration: 3, estimatedHours: 24 },
      { title: 'Plumbing rough-in', status: 'pending', priority: 'high', duration: 2, estimatedHours: 16 },
      { title: 'HVAC adjustments', status: 'pending', priority: 'medium', duration: 1, estimatedHours: 8 },
      { title: 'Framing modifications', status: 'pending', priority: 'medium', duration: 2, estimatedHours: 12 },
    ],
  },
  {
    name: 'Finish Work',
    order: 3,
    estimatedDuration: 15,
    budgetAmount: 50000,
    tasks: [
      { title: 'Install cabinets', status: 'pending', priority: 'high', duration: 3, estimatedHours: 24 },
      { title: 'Install countertops', status: 'pending', priority: 'high', duration: 2, estimatedHours: 16 },
      { title: 'Install flooring', status: 'pending', priority: 'medium', duration: 3, estimatedHours: 24 },
      { title: 'Install appliances', status: 'pending', priority: 'medium', duration: 1, estimatedHours: 8 },
      { title: 'Paint and touch-up', status: 'pending', priority: 'low', duration: 2, estimatedHours: 12 },
      { title: 'Final inspection', status: 'pending', priority: 'high', duration: 1, estimatedHours: 4 },
    ],
  },
];
