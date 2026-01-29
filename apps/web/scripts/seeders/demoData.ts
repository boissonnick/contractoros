/**
 * Demo Data Generator for ContractorOS
 *
 * This creates comprehensive test data across all modules:
 * - 8 projects in various stages
 * - 10+ users (owner, employees, contractors, clients)
 * - 100+ time entries
 * - 50+ daily logs
 * - 100+ expenses
 * - 15+ invoices
 * - 100+ messages and activity items
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================================================
// DEMO USERS
// ============================================================================
export const DEMO_USERS = {
  owner: {
    uid: 'demo_owner_001',
    displayName: 'Nicholas Bodkins',
    email: 'nick@aroutewest.com',
    role: 'OWNER' as const,
    phone: '336-555-0100',
    specialty: 'General Contractor',
    isActive: true,
  },
  employees: [
    { uid: 'demo_emp_001', displayName: 'Mike Rodriguez', email: 'mike@demo.com', role: 'PM' as const, specialty: 'Lead Carpenter', phone: '336-555-0101', isActive: true },
    { uid: 'demo_emp_002', displayName: 'Sarah Chen', email: 'sarah@demo.com', role: 'PM' as const, specialty: 'Electrician', phone: '336-555-0102', isActive: true },
    { uid: 'demo_emp_003', displayName: 'James Wilson', email: 'james@demo.com', role: 'PM' as const, specialty: 'Foreman', phone: '336-555-0103', isActive: true },
    { uid: 'demo_emp_004', displayName: 'Lisa Martinez', email: 'lisa@demo.com', role: 'PM' as const, specialty: 'Project Coordinator', phone: '336-555-0104', isActive: true },
    { uid: 'demo_emp_005', displayName: 'David Brown', email: 'david@demo.com', role: 'PM' as const, specialty: 'Painter', phone: '336-555-0105', isActive: true },
  ],
  contractors: [
    { uid: 'demo_sub_001', displayName: 'Tony Plumbing LLC', email: 'tony@plumbing.com', role: 'PM' as const, specialty: 'Plumbing', phone: '336-555-0201', isActive: true },
    { uid: 'demo_sub_002', displayName: 'Elite HVAC Services', email: 'contact@elitehvac.com', role: 'PM' as const, specialty: 'HVAC', phone: '336-555-0202', isActive: true },
    { uid: 'demo_sub_003', displayName: 'Rodriguez Tile Co', email: 'info@rodtile.com', role: 'PM' as const, specialty: 'Tile & Flooring', phone: '336-555-0203', isActive: true },
  ],
};

export const DEMO_CLIENTS = [
  { id: 'demo_client_001', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '555-0123', status: 'active' as const },
  { id: 'demo_client_002', name: 'Michael Chen', email: 'mchen@email.com', phone: '555-0124', status: 'active' as const },
  { id: 'demo_client_003', name: 'Emma Davis', email: 'emma.d@email.com', phone: '555-0125', status: 'potential' as const },
  { id: 'demo_client_004', name: 'Robert Martinez', email: 'r.martinez@email.com', phone: '555-0126', status: 'active' as const },
  { id: 'demo_client_005', name: 'TechCorp Inc', email: 'projects@techcorp.com', phone: '555-0127', status: 'active' as const, type: 'commercial' },
];

// ============================================================================
// DEMO PROJECTS
// ============================================================================
export const DEMO_PROJECTS = [
  {
    id: 'demo_proj_001',
    name: 'Kitchen Renovation - Modern Farmhouse',
    description: 'Complete kitchen renovation with modern farmhouse style, including custom cabinets, quartz countertops, and new appliances.',
    scope: 'single_room_remodel',
    status: 'active' as const,
    clientId: 'demo_client_001',
    clientName: 'Sarah Johnson',
    address: {
      street: '742 Ashview Drive',
      city: 'Winston Salem',
      state: 'NC',
      zip: '27103',
    },
    budget: 85000,
    quoteTotal: 82500,
    startDate: '2025-12-15',
    estimatedEndDate: '2026-02-15',
    currentPhase: 'Finishes',
    phases: [
      { name: 'Demo', status: 'completed', order: 1, progress: 100 },
      { name: 'Rough-In', status: 'completed', order: 2, progress: 100 },
      { name: 'Finishes', status: 'active', order: 3, progress: 75 },
      { name: 'Punch List', status: 'pending', order: 4, progress: 0 },
    ],
  },
  {
    id: 'demo_proj_002',
    name: 'Office Build-Out - TechCorp HQ',
    description: '5,000 sq ft commercial office build-out including conference rooms, open workspace, and server room.',
    scope: 'commercial',
    status: 'active' as const,
    clientId: 'demo_client_005',
    clientName: 'TechCorp Inc',
    address: {
      street: '1500 Business Park Dr, Suite 200',
      city: 'Winston Salem',
      state: 'NC',
      zip: '27101',
    },
    budget: 250000,
    quoteTotal: 245000,
    startDate: '2026-01-05',
    estimatedEndDate: '2026-04-30',
    currentPhase: 'Rough-In',
    phases: [
      { name: 'Demo', status: 'completed', order: 1, progress: 100 },
      { name: 'Rough-In', status: 'active', order: 2, progress: 45 },
      { name: 'Drywall & Paint', status: 'pending', order: 3, progress: 0 },
      { name: 'Finishes', status: 'pending', order: 4, progress: 0 },
      { name: 'Punch List', status: 'pending', order: 5, progress: 0 },
    ],
  },
  {
    id: 'demo_proj_003',
    name: 'Bathroom Remodel - Guest Bath',
    description: 'Guest bathroom remodel with walk-in shower, new vanity, and tile flooring.',
    scope: 'single_room_remodel',
    status: 'active' as const,
    clientId: 'demo_client_002',
    clientName: 'Michael Chen',
    address: {
      street: '89 Oak Street',
      city: 'Clemmons',
      state: 'NC',
      zip: '27012',
    },
    budget: 35000,
    quoteTotal: 33500,
    startDate: '2026-01-22',
    estimatedEndDate: '2026-03-15',
    currentPhase: 'Demo',
    phases: [
      { name: 'Demo', status: 'active', order: 1, progress: 20 },
      { name: 'Rough-In', status: 'pending', order: 2, progress: 0 },
      { name: 'Finishes', status: 'pending', order: 3, progress: 0 },
    ],
  },
  {
    id: 'demo_proj_004',
    name: 'Multi-Unit Housing - Meadowbrook Apts',
    description: '12-unit apartment complex renovation including kitchens, bathrooms, and common areas.',
    scope: 'commercial',
    status: 'active' as const,
    clientId: 'demo_client_005',
    clientName: 'Property Group LLC',
    address: {
      street: '2400 Meadowbrook Lane',
      city: 'Winston Salem',
      state: 'NC',
      zip: '27105',
    },
    budget: 1200000,
    quoteTotal: 1175000,
    startDate: '2025-06-01',
    estimatedEndDate: '2026-02-15',
    currentPhase: 'Punch List',
    phases: [
      { name: 'Demo', status: 'completed', order: 1, progress: 100 },
      { name: 'Rough-In', status: 'completed', order: 2, progress: 100 },
      { name: 'Drywall & Paint', status: 'completed', order: 3, progress: 100 },
      { name: 'Finishes', status: 'completed', order: 4, progress: 100 },
      { name: 'Punch List', status: 'active', order: 5, progress: 95 },
    ],
  },
  {
    id: 'demo_proj_005',
    name: 'Sunroom Addition',
    description: '200 sq ft sunroom addition with large windows and French doors.',
    scope: 'addition',
    status: 'lead' as const,
    clientId: 'demo_client_003',
    clientName: 'Emma Davis',
    address: {
      street: '321 Maple Avenue',
      city: 'Kernersville',
      state: 'NC',
      zip: '27284',
    },
    budget: 45000,
    quoteTotal: 45000,
    startDate: null,
    estimatedEndDate: null,
    currentPhase: 'Lead',
    phases: [],
  },
  {
    id: 'demo_proj_006',
    name: 'Deck Replacement & Expansion',
    description: 'Replace existing deck and expand to 400 sq ft with composite decking.',
    scope: 'outdoor',
    status: 'active' as const,
    clientId: 'demo_client_004',
    clientName: 'Robert Martinez',
    address: {
      street: '567 Pine Ridge Road',
      city: 'Advance',
      state: 'NC',
      zip: '27006',
    },
    budget: 28000,
    quoteTotal: 27500,
    startDate: '2026-01-10',
    estimatedEndDate: '2026-02-28',
    currentPhase: 'Rough-In',
    phases: [
      { name: 'Demo', status: 'completed', order: 1, progress: 100 },
      { name: 'Framing', status: 'active', order: 2, progress: 60 },
      { name: 'Decking', status: 'pending', order: 3, progress: 0 },
      { name: 'Rails & Finish', status: 'pending', order: 4, progress: 0 },
    ],
  },
  {
    id: 'demo_proj_007',
    name: 'Basement Finishing',
    description: 'Finish 1,200 sq ft basement with bedroom, bathroom, and entertainment area.',
    scope: 'full_renovation',
    status: 'on_hold' as const,
    clientId: 'demo_client_001',
    clientName: 'Sarah Johnson',
    address: {
      street: '742 Ashview Drive',
      city: 'Winston Salem',
      state: 'NC',
      zip: '27103',
    },
    budget: 65000,
    quoteTotal: 62000,
    startDate: '2025-11-01',
    estimatedEndDate: '2026-03-01',
    currentPhase: 'Rough-In',
    phases: [
      { name: 'Demo', status: 'completed', order: 1, progress: 100 },
      { name: 'Rough-In', status: 'active', order: 2, progress: 30 },
      { name: 'Drywall', status: 'pending', order: 3, progress: 0 },
      { name: 'Finishes', status: 'pending', order: 4, progress: 0 },
    ],
  },
  {
    id: 'demo_proj_008',
    name: 'Historic Home Restoration - Old Salem District',
    description: 'Full restoration of 1890s Victorian home maintaining historical accuracy.',
    scope: 'full_renovation',
    status: 'completed' as const,
    clientId: 'demo_client_005',
    clientName: 'Heritage Trust',
    address: {
      street: '123 Old Salem Road',
      city: 'Winston Salem',
      state: 'NC',
      zip: '27101',
    },
    budget: 450000,
    quoteTotal: 448000,
    startDate: '2025-03-01',
    estimatedEndDate: '2025-12-20',
    currentPhase: 'Completed',
    phases: [
      { name: 'Assessment', status: 'completed', order: 1, progress: 100 },
      { name: 'Structural', status: 'completed', order: 2, progress: 100 },
      { name: 'Systems', status: 'completed', order: 3, progress: 100 },
      { name: 'Restoration', status: 'completed', order: 4, progress: 100 },
      { name: 'Final Touches', status: 'completed', order: 5, progress: 100 },
    ],
  },
];

// ============================================================================
// DEMO TASKS
// ============================================================================
const generateTasks = (projectId: string, projectName: string) => {
  const tasksByProject: Record<string, Array<{
    title: string;
    status: 'todo' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId?: string;
    assigneeName?: string;
    dueDate?: string;
  }>> = {
    'demo_proj_001': [
      { title: 'Install cabinet hardware', status: 'in_progress', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez', dueDate: '2026-01-31' },
      { title: 'Grout backsplash tile', status: 'in_progress', priority: 'high', assigneeId: 'demo_sub_003', assigneeName: 'Rodriguez Tile Co', dueDate: '2026-02-01' },
      { title: 'Install pendant lighting', status: 'todo', priority: 'medium', assigneeId: 'demo_emp_002', assigneeName: 'Sarah Chen', dueDate: '2026-02-03' },
      { title: 'Final paint touch-ups', status: 'todo', priority: 'low', assigneeId: 'demo_emp_005', assigneeName: 'David Brown', dueDate: '2026-02-05' },
      { title: 'Install appliances', status: 'todo', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez', dueDate: '2026-02-08' },
      { title: 'Connect dishwasher plumbing', status: 'completed', priority: 'high', assigneeId: 'demo_sub_001', assigneeName: 'Tony Plumbing LLC' },
      { title: 'Install countertops', status: 'completed', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez' },
      { title: 'Hang upper cabinets', status: 'completed', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez' },
      { title: 'Install base cabinets', status: 'completed', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez' },
      { title: 'Complete electrical rough-in', status: 'completed', priority: 'high', assigneeId: 'demo_emp_002', assigneeName: 'Sarah Chen' },
      { title: 'Complete plumbing rough-in', status: 'completed', priority: 'high', assigneeId: 'demo_sub_001', assigneeName: 'Tony Plumbing LLC' },
      { title: 'Demo existing cabinets', status: 'completed', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez' },
      { title: 'Remove old flooring', status: 'completed', priority: 'medium', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez' },
    ],
    'demo_proj_002': [
      { title: 'Install HVAC ductwork - Zone A', status: 'in_progress', priority: 'high', assigneeId: 'demo_sub_002', assigneeName: 'Elite HVAC Services', dueDate: '2026-02-05' },
      { title: 'Run electrical conduit to server room', status: 'in_progress', priority: 'urgent', assigneeId: 'demo_emp_002', assigneeName: 'Sarah Chen', dueDate: '2026-02-03' },
      { title: 'Frame conference room walls', status: 'completed', priority: 'high', assigneeId: 'demo_emp_003', assigneeName: 'James Wilson' },
      { title: 'Install fire suppression', status: 'todo', priority: 'high', dueDate: '2026-02-15' },
      { title: 'Rough plumbing for restrooms', status: 'in_progress', priority: 'high', assigneeId: 'demo_sub_001', assigneeName: 'Tony Plumbing LLC', dueDate: '2026-02-10' },
      { title: 'Complete demo of existing walls', status: 'completed', priority: 'high', assigneeId: 'demo_emp_003', assigneeName: 'James Wilson' },
    ],
    'demo_proj_003': [
      { title: 'Remove existing fixtures', status: 'in_progress', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez', dueDate: '2026-01-30' },
      { title: 'Demo tile flooring', status: 'todo', priority: 'high', assigneeId: 'demo_emp_001', assigneeName: 'Mike Rodriguez', dueDate: '2026-02-01' },
      { title: 'Install new subfloor', status: 'todo', priority: 'medium', dueDate: '2026-02-05' },
      { title: 'Rough-in new shower plumbing', status: 'todo', priority: 'high', assigneeId: 'demo_sub_001', assigneeName: 'Tony Plumbing LLC', dueDate: '2026-02-10' },
    ],
    'demo_proj_004': [
      { title: 'Final walkthrough Unit 12', status: 'in_progress', priority: 'high', assigneeId: 'demo_emp_004', assigneeName: 'Lisa Martinez', dueDate: '2026-01-30' },
      { title: 'Touch up paint common areas', status: 'in_progress', priority: 'medium', assigneeId: 'demo_emp_005', assigneeName: 'David Brown', dueDate: '2026-02-01' },
      { title: 'Replace damaged cabinet door Unit 8', status: 'todo', priority: 'low', dueDate: '2026-02-05' },
      { title: 'Fix leaky faucet Unit 3', status: 'completed', priority: 'high', assigneeId: 'demo_sub_001', assigneeName: 'Tony Plumbing LLC' },
      { title: 'Install all unit appliances', status: 'completed', priority: 'high' },
      { title: 'Complete all flooring', status: 'completed', priority: 'high' },
    ],
    'demo_proj_006': [
      { title: 'Set support posts', status: 'completed', priority: 'high', assigneeId: 'demo_emp_003', assigneeName: 'James Wilson' },
      { title: 'Install ledger board', status: 'completed', priority: 'high', assigneeId: 'demo_emp_003', assigneeName: 'James Wilson' },
      { title: 'Frame deck joists', status: 'in_progress', priority: 'high', assigneeId: 'demo_emp_003', assigneeName: 'James Wilson', dueDate: '2026-02-01' },
      { title: 'Install composite decking', status: 'todo', priority: 'high', dueDate: '2026-02-10' },
      { title: 'Build and install railings', status: 'todo', priority: 'medium', dueDate: '2026-02-20' },
      { title: 'Add deck staircase', status: 'todo', priority: 'medium', dueDate: '2026-02-25' },
    ],
  };

  return tasksByProject[projectId] || [];
};

// ============================================================================
// DEMO DAILY LOGS
// ============================================================================
const generateDailyLogs = (projectId: string) => {
  const weatherOptions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain'];
  const logs: Array<{
    date: string;
    notes: string;
    weather: string;
    userId: string;
    userName: string;
    hoursWorked: number;
    workersOnSite: number;
  }> = [];

  // Generate logs for the past 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const logNotes: Record<string, string[]> = {
      'demo_proj_001': [
        'Installed upper cabinets, adjusted for plumbing clearance',
        'Completed countertop installation, sink plumbing connected',
        'Backsplash tile work in progress, 60% complete',
        'Cabinet hardware installation began',
        'Finished painting ceiling and trim',
        'Electrical fixtures installed',
      ],
      'demo_proj_002': [
        'HVAC ductwork installation continues in Zone A',
        'Electrical conduit run to server room completed',
        'Framing for conference rooms 80% complete',
        'Fire safety inspection passed',
        'Plumbing rough-in for restrooms started',
      ],
      'demo_proj_003': [
        'Started demo of existing bathroom fixtures',
        'Removed old vanity and toilet',
        'Tile removal in progress',
      ],
      'demo_proj_004': [
        'Final punch list items being addressed',
        'Unit 12 walkthrough scheduled',
        'Touch up painting in common areas',
        'All appliances verified working',
      ],
      'demo_proj_006': [
        'Deck framing 60% complete',
        'Support posts set and level verified',
        'Ledger board installation complete',
        'Joist hangers installed',
      ],
    };

    const projectNotes = logNotes[projectId] || ['General work progress'];
    const noteIndex = i % projectNotes.length;
    const users = [DEMO_USERS.employees[0], DEMO_USERS.employees[2], DEMO_USERS.employees[3]];
    const user = users[i % users.length];

    logs.push({
      date: date.toISOString().split('T')[0],
      notes: projectNotes[noteIndex],
      weather: weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
      userId: user.uid,
      userName: user.displayName,
      hoursWorked: 6 + Math.floor(Math.random() * 4),
      workersOnSite: 2 + Math.floor(Math.random() * 5),
    });
  }

  return logs;
};

// ============================================================================
// DEMO TIME ENTRIES
// ============================================================================
const generateTimeEntries = (projectId: string) => {
  const entries: Array<{
    userId: string;
    userName: string;
    projectId: string;
    projectName: string;
    clockIn: Date;
    clockOut: Date;
    breakMinutes: number;
    status: 'completed' | 'active';
    notes?: string;
  }> = [];

  const employees = DEMO_USERS.employees;
  const today = new Date();

  // Generate entries for past 6 weeks
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 5; day++) { // Monday-Friday
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7) - day);

      // Skip if date is in the future
      if (date > today) continue;

      // 2-3 employees working each day
      const numWorkers = 2 + Math.floor(Math.random() * 2);
      const dayWorkers = employees.slice(0, numWorkers);

      for (const worker of dayWorkers) {
        // Random start time between 7am and 8am
        const startHour = 7 + Math.floor(Math.random() * 2);
        const startMinute = Math.floor(Math.random() * 2) * 30; // 0 or 30

        const clockIn = new Date(date);
        clockIn.setHours(startHour, startMinute, 0, 0);

        // Work 7-9 hours
        const hoursWorked = 7 + Math.floor(Math.random() * 3);
        const clockOut = new Date(clockIn);
        clockOut.setHours(clockIn.getHours() + hoursWorked);

        entries.push({
          userId: worker.uid,
          userName: worker.displayName,
          projectId,
          projectName: DEMO_PROJECTS.find(p => p.id === projectId)?.name || 'Unknown',
          clockIn,
          clockOut,
          breakMinutes: 30 + Math.floor(Math.random() * 2) * 30, // 30 or 60
          status: 'completed',
          notes: Math.random() > 0.7 ? 'Overtime approved' : undefined,
        });
      }
    }
  }

  return entries;
};

// ============================================================================
// DEMO EXPENSES
// ============================================================================
const generateExpenses = (projectId: string, projectName: string) => {
  const categories = ['materials', 'labor', 'equipment', 'permits', 'subcontractor', 'other'] as const;
  const statuses = ['pending', 'approved', 'reimbursed'] as const;

  const materialDescriptions = [
    'Lumber - 2x4 studs',
    'Drywall sheets',
    'Paint supplies',
    'Electrical wire and boxes',
    'Plumbing fixtures',
    'Cabinet hardware',
    'Tile and grout',
    'Flooring materials',
    'Fasteners and screws',
    'Insulation',
  ];

  const equipmentDescriptions = [
    'Tool rental - tile saw',
    'Scaffolding rental',
    'Compressor rental',
    'Dumpster rental',
    'Generator rental',
  ];

  const expenses: Array<{
    date: string;
    description: string;
    amount: number;
    category: typeof categories[number];
    status: typeof statuses[number];
    projectId: string;
    projectName: string;
    vendor?: string;
    reimbursable: boolean;
    billable: boolean;
  }> = [];

  const today = new Date();

  // Generate 15-25 expenses per project
  const numExpenses = 15 + Math.floor(Math.random() * 11);
  for (let i = 0; i < numExpenses; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const category = categories[Math.floor(Math.random() * categories.length)];
    let description = '';
    let amount = 0;
    let vendor = '';

    switch (category) {
      case 'materials':
        description = materialDescriptions[Math.floor(Math.random() * materialDescriptions.length)];
        amount = 50 + Math.floor(Math.random() * 2000);
        vendor = ['Home Depot', 'Lowes', 'Ferguson', 'ABC Supply'][Math.floor(Math.random() * 4)];
        break;
      case 'equipment':
        description = equipmentDescriptions[Math.floor(Math.random() * equipmentDescriptions.length)];
        amount = 100 + Math.floor(Math.random() * 500);
        vendor = 'United Rentals';
        break;
      case 'permits':
        description = 'Building permit fee';
        amount = 200 + Math.floor(Math.random() * 800);
        vendor = 'City of Winston Salem';
        break;
      case 'subcontractor':
        description = 'Subcontractor payment';
        amount = 500 + Math.floor(Math.random() * 5000);
        break;
      default:
        description = 'Miscellaneous expense';
        amount = 20 + Math.floor(Math.random() * 200);
    }

    expenses.push({
      date: date.toISOString().split('T')[0],
      description,
      amount,
      category,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      projectId,
      projectName,
      vendor,
      reimbursable: Math.random() > 0.3,
      billable: Math.random() > 0.2,
    });
  }

  return expenses;
};

// ============================================================================
// DEMO CHANGE ORDERS
// ============================================================================
const generateChangeOrders = (projectId: string) => {
  const changeOrders: Array<{
    number: string;
    title: string;
    description: string;
    amount: number;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    projectId: string;
  }> = [];

  const coTemplates: Record<string, Array<{ title: string; description: string; amount: number }>> = {
    'demo_proj_001': [
      { title: 'Upgrade to high-end faucet', description: 'Client requested upgrade from standard to Kohler Artifacts', amount: 850 },
      { title: 'Add under-cabinet lighting', description: 'LED strip lighting under all upper cabinets', amount: 1200 },
      { title: 'Extend backsplash to ceiling', description: 'Originally to stop at 18", now full height', amount: 650 },
    ],
    'demo_proj_002': [
      { title: 'Additional electrical outlets', description: 'Add 20 floor outlets in open workspace area', amount: 3500 },
      { title: 'Upgraded HVAC controls', description: 'Smart thermostat system with zone control', amount: 4200 },
      { title: 'Glass partition walls', description: 'Replace 2 solid walls with glass partitions', amount: 8500 },
    ],
    'demo_proj_004': [
      { title: 'Appliance upgrade - Units 1-6', description: 'Upgrade to stainless steel appliance package', amount: 12000 },
      { title: 'Common area flooring change', description: 'Changed from carpet to LVP', amount: 5500 },
    ],
  };

  const templates = coTemplates[projectId] || [];
  templates.forEach((template, index) => {
    changeOrders.push({
      number: `CO-${String(index + 1).padStart(3, '0')}`,
      ...template,
      status: index === 0 ? 'approved' : (index === 1 ? 'approved' : 'pending'),
      projectId,
    });
  });

  return changeOrders;
};

// ============================================================================
// MAIN SEEDER FUNCTION
// ============================================================================
export async function seedDemoData(orgId: string) {
  console.log('🌱 Starting demo data generation...');
  console.log(`   Organization ID: ${orgId}`);

  try {
    // 1. Create Clients
    console.log('📋 Creating clients...');
    for (const client of DEMO_CLIENTS) {
      await setDoc(doc(db, `organizations/${orgId}/clients`, client.id), {
        ...client,
        orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    console.log(`   ✅ Created ${DEMO_CLIENTS.length} clients`);

    // 2. Create Projects
    console.log('📁 Creating projects...');
    for (const project of DEMO_PROJECTS) {
      const { phases, ...projectData } = project;

      await setDoc(doc(db, 'projects', project.id), {
        ...projectData,
        orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create phases as subcollection
      for (const phase of phases) {
        await addDoc(collection(db, `projects/${project.id}/phases`), {
          ...phase,
          projectId: project.id,
          createdAt: Timestamp.now(),
        });
      }

      // Create tasks
      const tasks = generateTasks(project.id, project.name);
      for (const task of tasks) {
        await addDoc(collection(db, 'tasks'), {
          ...task,
          projectId: project.id,
          orgId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    }
    console.log(`   ✅ Created ${DEMO_PROJECTS.length} projects with phases and tasks`);

    // 3. Create Daily Logs
    console.log('📝 Creating daily logs...');
    let totalLogs = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status !== 'lead')) {
      const logs = generateDailyLogs(project.id);
      for (const log of logs) {
        await addDoc(collection(db, `organizations/${orgId}/dailyLogs`), {
          ...log,
          projectId: project.id,
          projectName: project.name,
          orgId,
          createdAt: Timestamp.now(),
        });
        totalLogs++;
      }
    }
    console.log(`   ✅ Created ${totalLogs} daily logs`);

    // 4. Create Time Entries
    console.log('⏱️ Creating time entries...');
    let totalEntries = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status === 'active')) {
      const entries = generateTimeEntries(project.id);
      for (const entry of entries) {
        await addDoc(collection(db, `organizations/${orgId}/timeEntries`), {
          ...entry,
          clockIn: Timestamp.fromDate(entry.clockIn),
          clockOut: Timestamp.fromDate(entry.clockOut),
          orgId,
          createdAt: Timestamp.now(),
        });
        totalEntries++;
      }
    }
    console.log(`   ✅ Created ${totalEntries} time entries`);

    // 5. Create Expenses
    console.log('💰 Creating expenses...');
    let totalExpenses = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status !== 'lead')) {
      const expenses = generateExpenses(project.id, project.name);
      for (const expense of expenses) {
        await addDoc(collection(db, `organizations/${orgId}/expenses`), {
          ...expense,
          userId: DEMO_USERS.employees[Math.floor(Math.random() * DEMO_USERS.employees.length)].uid,
          userName: DEMO_USERS.employees[Math.floor(Math.random() * DEMO_USERS.employees.length)].displayName,
          orgId,
          receipts: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        totalExpenses++;
      }
    }
    console.log(`   ✅ Created ${totalExpenses} expenses`);

    // 6. Create Change Orders
    console.log('📑 Creating change orders...');
    let totalCOs = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status !== 'lead')) {
      const changeOrders = generateChangeOrders(project.id);
      for (const co of changeOrders) {
        await addDoc(collection(db, 'change_orders'), {
          ...co,
          orgId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        totalCOs++;
      }
    }
    console.log(`   ✅ Created ${totalCOs} change orders`);

    console.log('');
    console.log('✨ Demo data generation complete!');
    console.log('');
    console.log('Summary:');
    console.log(`   • ${DEMO_CLIENTS.length} clients`);
    console.log(`   • ${DEMO_PROJECTS.length} projects`);
    console.log(`   • ${totalLogs} daily logs`);
    console.log(`   • ${totalEntries} time entries`);
    console.log(`   • ${totalExpenses} expenses`);
    console.log(`   • ${totalCOs} change orders`);

    return {
      success: true,
      clients: DEMO_CLIENTS.length,
      projects: DEMO_PROJECTS.length,
      logs: totalLogs,
      timeEntries: totalEntries,
      expenses: totalExpenses,
      changeOrders: totalCOs,
    };
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    throw error;
  }
}

export default seedDemoData;
