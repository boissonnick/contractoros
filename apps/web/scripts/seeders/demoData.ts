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
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Prefix for all demo data IDs - used to identify demo data for cleanup
export const DEMO_DATA_PREFIX = 'demo_';

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
    employeeType: 'salaried' as const,
    hourlyRate: 75,
    salary: 120000,
    paySchedule: 'bi-weekly' as const,
    taxClassification: 'W2' as const,
  },
  employees: [
    { uid: 'demo_emp_001', displayName: 'Mike Rodriguez', email: 'mike@demo.com', role: 'EMPLOYEE' as const, specialty: 'Lead Carpenter', phone: '336-555-0101', isActive: true, employeeType: 'hourly' as const, hourlyRate: 35, trade: 'Carpentry', paySchedule: 'weekly' as const, taxClassification: 'W2' as const, ptoBalance: 40, sickLeaveBalance: 24 },
    { uid: 'demo_emp_002', displayName: 'Sarah Chen', email: 'sarah@demo.com', role: 'EMPLOYEE' as const, specialty: 'Electrician', phone: '336-555-0102', isActive: true, employeeType: 'hourly' as const, hourlyRate: 42, trade: 'Electrical', paySchedule: 'weekly' as const, taxClassification: 'W2' as const, ptoBalance: 56, sickLeaveBalance: 24 },
    { uid: 'demo_emp_003', displayName: 'James Wilson', email: 'james@demo.com', role: 'PM' as const, specialty: 'Foreman', phone: '336-555-0103', isActive: true, employeeType: 'salaried' as const, hourlyRate: 45, salary: 75000, paySchedule: 'bi-weekly' as const, taxClassification: 'W2' as const, ptoBalance: 80, sickLeaveBalance: 40 },
    { uid: 'demo_emp_004', displayName: 'Lisa Martinez', email: 'lisa@demo.com', role: 'PM' as const, specialty: 'Project Coordinator', phone: '336-555-0104', isActive: true, employeeType: 'salaried' as const, hourlyRate: 38, salary: 65000, paySchedule: 'bi-weekly' as const, taxClassification: 'W2' as const, ptoBalance: 72, sickLeaveBalance: 40 },
    { uid: 'demo_emp_005', displayName: 'David Brown', email: 'david@demo.com', role: 'EMPLOYEE' as const, specialty: 'Painter', phone: '336-555-0105', isActive: true, employeeType: 'hourly' as const, hourlyRate: 28, trade: 'Painting', paySchedule: 'weekly' as const, taxClassification: 'W2' as const, ptoBalance: 32, sickLeaveBalance: 24 },
  ],
  contractors: [
    { uid: 'demo_sub_001', displayName: 'Tony Plumbing LLC', email: 'tony@plumbing.com', role: 'SUB' as const, specialty: 'Plumbing', phone: '336-555-0201', isActive: true, trade: 'Plumbing', taxClassification: '1099' as const, companyName: 'Tony Plumbing LLC' },
    { uid: 'demo_sub_002', displayName: 'Elite HVAC Services', email: 'contact@elitehvac.com', role: 'SUB' as const, specialty: 'HVAC', phone: '336-555-0202', isActive: true, trade: 'HVAC', taxClassification: '1099' as const, companyName: 'Elite HVAC Services' },
    { uid: 'demo_sub_003', displayName: 'Rodriguez Tile Co', email: 'info@rodtile.com', role: 'SUB' as const, specialty: 'Tile & Flooring', phone: '336-555-0203', isActive: true, trade: 'Tile & Flooring', taxClassification: '1099' as const, companyName: 'Rodriguez Tile & Flooring' },
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
// DEMO DAILY LOGS - Enhanced with comprehensive detail
// ============================================================================
interface EnhancedDailyLog {
  date: string;
  notes: string;
  weather: string;
  weatherTemperature?: number;
  weatherNotes?: string;
  userId: string;
  userName: string;
  hoursWorked: number;
  workersOnSite: number;
  category: 'general' | 'progress' | 'issue' | 'safety' | 'weather' | 'delivery' | 'inspection' | 'client_interaction' | 'subcontractor' | 'equipment';
  workPerformed?: string[];       // Bullet list of work done
  crewMembers?: string[];         // Names of crew on site
  materialsDelivered?: string[];  // List of deliveries
  visitorsOnSite?: string[];      // Inspector, client visits, etc.
  safetyNotes?: string;           // Safety observations
  issueDescription?: string;      // If there's an issue
  issueImpact?: 'low' | 'medium' | 'high';
  followUpRequired?: boolean;
  followUpDate?: string;
  tags?: string[];
  isPrivate?: boolean;
}

const generateDailyLogs = (projectId: string): EnhancedDailyLog[] => {
  const weatherOptions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Overcast', 'Sunny'];
  const categories: EnhancedDailyLog['category'][] = ['progress', 'delivery', 'inspection', 'safety', 'issue', 'client_interaction', 'subcontractor'];
  const logs: EnhancedDailyLog[] = [];

  // Generate logs for the past 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Rich log data per project
    const projectLogData: Record<string, Array<Partial<EnhancedDailyLog>>> = {
      'demo_proj_001': [
        {
          category: 'progress',
          notes: 'Kitchen renovation progressing well. Upper cabinet installation completed.',
          workPerformed: [
            'Installed all 8 upper cabinets',
            'Leveled and shimmed cabinets for plumbing clearance',
            'Secured cabinets to wall studs with 3" screws',
            'Applied caulking at wall joints',
          ],
          crewMembers: ['Mike Rodriguez', 'David Brown'],
          safetyNotes: 'All team members wearing safety glasses during installation.',
          tags: ['cabinets', 'installation'],
        },
        {
          category: 'delivery',
          notes: 'Major materials delivery received and staged.',
          workPerformed: [
            'Unloaded delivery truck',
            'Staged countertops in garage',
            'Inspected all materials for damage',
            'Signed off on delivery manifest',
          ],
          materialsDelivered: [
            'Quartz countertops (3 pieces)',
            'Undermount sink',
            'Faucet and drain assembly',
            'Cabinet hardware (48 pieces)',
          ],
          crewMembers: ['Mike Rodriguez', 'James Wilson'],
          tags: ['delivery', 'countertops', 'materials'],
        },
        {
          category: 'inspection',
          notes: 'Electrical rough-in inspection passed.',
          workPerformed: [
            'Met with inspector at 9am',
            'Walked through all electrical work',
            'Received green tag approval',
            'Updated permit board',
          ],
          visitorsOnSite: ['Building Inspector - Tom Harris', 'Homeowner - Sarah Johnson'],
          crewMembers: ['Sarah Chen'],
          tags: ['inspection', 'electrical', 'permit'],
        },
        {
          category: 'client_interaction',
          notes: 'Client walkthrough to review progress and select final finishes.',
          workPerformed: [
            'Walked client through completed framing',
            'Reviewed backsplash tile options',
            'Discussed lighting fixture placement',
            'Got approval on cabinet hardware selection',
          ],
          visitorsOnSite: ['Sarah Johnson (Client)', 'Lisa Martinez (PM)'],
          crewMembers: ['Lisa Martinez'],
          tags: ['client', 'selections', 'walkthrough'],
        },
        {
          category: 'progress',
          notes: 'Countertop installation and plumbing connection.',
          workPerformed: [
            'Set quartz countertops with level verified',
            'Applied adhesive and secured to cabinets',
            'Cut sink opening with template',
            'Connected sink plumbing and tested for leaks',
            'Installed garbage disposal',
          ],
          crewMembers: ['Mike Rodriguez', 'Tony Plumbing LLC'],
          safetyNotes: 'Proper lifting techniques used for heavy countertop slabs. Two-person lift.',
          tags: ['countertops', 'plumbing', 'installation'],
        },
        {
          category: 'safety',
          notes: 'Weekly safety review conducted.',
          workPerformed: [
            'Conducted toolbox talk on ladder safety',
            'Inspected all extension cords',
            'Verified fire extinguisher accessible',
            'Reviewed emergency exit routes with crew',
          ],
          crewMembers: ['James Wilson', 'Mike Rodriguez', 'David Brown'],
          safetyNotes: 'No incidents reported. All PPE in good condition.',
          tags: ['safety', 'training'],
        },
      ],
      'demo_proj_002': [
        {
          category: 'progress',
          notes: 'Commercial buildout - HVAC work continues.',
          workPerformed: [
            'Installed main trunk ductwork in Zone A',
            'Connected 6 supply registers',
            'Began work on Zone B return air',
            'Coordinated with electrical for chase locations',
          ],
          crewMembers: ['Elite HVAC Services', 'Sarah Chen'],
          tags: ['hvac', 'mechanical', 'commercial'],
        },
        {
          category: 'issue',
          notes: 'Discovered conflict between HVAC duct routing and fire sprinkler head.',
          issueDescription: 'HVAC main trunk conflicts with existing sprinkler head location in conference room B. Need to relocate either duct or sprinkler.',
          issueImpact: 'medium',
          workPerformed: [
            'Identified conflict during duct installation',
            'Documented with photos',
            'Called fire protection contractor',
            'Scheduled coordination meeting for tomorrow',
          ],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          crewMembers: ['Elite HVAC Services', 'James Wilson'],
          tags: ['issue', 'hvac', 'coordination', 'sprinkler'],
        },
        {
          category: 'inspection',
          notes: 'Fire marshal inspection for rough-in work.',
          workPerformed: [
            'Met fire marshal at 10:30am',
            'Reviewed fire stopping and rated assemblies',
            'Minor correction needed on one penetration seal',
            'Re-inspection scheduled for next week',
          ],
          visitorsOnSite: ['Fire Marshal - Deputy Chief Roberts', 'TechCorp Facilities - John Miller'],
          crewMembers: ['James Wilson'],
          tags: ['inspection', 'fire', 'safety'],
        },
        {
          category: 'subcontractor',
          notes: 'Multiple trades on site coordinating work.',
          workPerformed: [
            'HVAC continuing ductwork installation',
            'Electricians pulling wire in server room',
            'Plumbers setting rough-in for restrooms',
            'Drywall crew measuring for material order',
          ],
          crewMembers: ['Elite HVAC Services', 'Sarah Chen', 'Tony Plumbing LLC', 'Mike Rodriguez'],
          safetyNotes: 'Held morning coordination meeting to discuss work zones and avoid conflicts.',
          tags: ['coordination', 'multi-trade'],
        },
      ],
      'demo_proj_003': [
        {
          category: 'progress',
          notes: 'Bathroom demo continues.',
          workPerformed: [
            'Removed old vanity and sink',
            'Disconnected and removed toilet',
            'Demolished tile surround',
            'Hauled debris to dumpster',
          ],
          crewMembers: ['Mike Rodriguez', 'David Brown'],
          safetyNotes: 'Dust control measures in place - plastic sheeting on all openings.',
          tags: ['demo', 'bathroom'],
        },
        {
          category: 'issue',
          notes: 'Found water damage behind shower wall.',
          issueDescription: 'Discovered significant water damage and mold behind tile surround. Approximately 6 sq ft of drywall and subfloor affected. Will need remediation before proceeding.',
          issueImpact: 'high',
          workPerformed: [
            'Documented damage with photos and measurements',
            'Called mold remediation specialist',
            'Notified client immediately',
            'Obtained preliminary estimate for additional work',
          ],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          visitorsOnSite: ['Michael Chen (Client)'],
          crewMembers: ['Mike Rodriguez', 'James Wilson'],
          tags: ['issue', 'water-damage', 'mold', 'change-order'],
        },
      ],
      'demo_proj_004': [
        {
          category: 'progress',
          notes: 'Final punch list items in progress.',
          workPerformed: [
            'Touched up paint in Unit 8 living room',
            'Adjusted cabinet doors in Unit 12 kitchen',
            'Fixed loose door handle in Unit 5',
            'Cleaned all window tracks in Units 1-4',
          ],
          crewMembers: ['David Brown', 'Lisa Martinez'],
          tags: ['punch-list', 'final'],
        },
        {
          category: 'client_interaction',
          notes: 'Final walkthrough with property manager.',
          workPerformed: [
            'Conducted final walkthrough all 12 units',
            'Created punch list with property manager',
            '18 minor items identified',
            'Scheduled completion for end of week',
          ],
          visitorsOnSite: ['Property Manager - Margaret Lee', 'Building Owner Rep'],
          crewMembers: ['Lisa Martinez', 'James Wilson'],
          tags: ['walkthrough', 'punch-list', 'client'],
        },
        {
          category: 'inspection',
          notes: 'Certificate of Occupancy inspection.',
          workPerformed: [
            'Met with building inspector at 8am',
            'Toured all 12 units',
            'Reviewed all life safety systems',
            'Received conditional approval - 2 minor items',
          ],
          visitorsOnSite: ['Building Inspector - Frank Torres'],
          crewMembers: ['James Wilson'],
          tags: ['inspection', 'CO', 'final'],
        },
      ],
      'demo_proj_006': [
        {
          category: 'progress',
          notes: 'Deck framing substantial progress.',
          workPerformed: [
            'Set remaining 4x4 support posts',
            'Verified all posts plumb and level',
            'Installed ledger board with lag bolts',
            'Applied flashing tape at ledger',
            'Began installing joist hangers',
          ],
          crewMembers: ['James Wilson', 'Mike Rodriguez'],
          safetyNotes: 'Fall protection setup for elevated work areas.',
          tags: ['deck', 'framing', 'structural'],
        },
        {
          category: 'delivery',
          notes: 'Composite decking materials delivered.',
          workPerformed: [
            'Received Trex composite decking delivery',
            'Inspected all boards for damage',
            'Staged materials in backyard',
            'Covered with tarp for weather protection',
          ],
          materialsDelivered: [
            'Trex Select Pebble Grey (200 ln ft)',
            'Hidden fastener clips (400 pc)',
            'Start/stop clips (50 pc)',
            'Stainless steel screws (3 boxes)',
          ],
          crewMembers: ['James Wilson'],
          tags: ['delivery', 'decking', 'materials'],
        },
      ],
    };

    const projectLogs = projectLogData[projectId] || [
      {
        category: 'progress' as const,
        notes: 'General work progress',
        workPerformed: ['Continued standard project work'],
        crewMembers: ['Crew'],
      },
    ];

    const logIndex = i % projectLogs.length;
    const logTemplate = projectLogs[logIndex];
    const users = [DEMO_USERS.employees[0], DEMO_USERS.employees[2], DEMO_USERS.employees[3]];
    const user = users[i % users.length];

    const temperature = 45 + Math.floor(Math.random() * 40); // 45-85°F
    const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    logs.push({
      date: date.toISOString().split('T')[0],
      notes: logTemplate.notes || 'General work progress',
      weather,
      weatherTemperature: temperature,
      weatherNotes: weather === 'Heavy Rain' ? 'Rain delay - crew sent home at 2pm' : undefined,
      userId: user.uid,
      userName: user.displayName,
      hoursWorked: 6 + Math.floor(Math.random() * 4),
      workersOnSite: 2 + Math.floor(Math.random() * 5),
      category: logTemplate.category || 'progress',
      workPerformed: logTemplate.workPerformed,
      crewMembers: logTemplate.crewMembers,
      materialsDelivered: logTemplate.materialsDelivered,
      visitorsOnSite: logTemplate.visitorsOnSite,
      safetyNotes: logTemplate.safetyNotes,
      issueDescription: logTemplate.issueDescription,
      issueImpact: logTemplate.issueImpact,
      followUpRequired: logTemplate.followUpRequired,
      followUpDate: logTemplate.followUpDate,
      tags: logTemplate.tags,
      isPrivate: false,
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
// PROGRESS CALLBACK TYPE
// ============================================================================
export interface SeedProgress {
  step: string;
  status: 'pending' | 'in_progress' | 'completed';
  count?: number;
  total?: number;
}

export type ProgressCallback = (progress: SeedProgress) => void;

// ============================================================================
// CHECK IF DEMO DATA EXISTS
// ============================================================================
export async function checkDemoDataExists(orgId: string): Promise<boolean> {
  // Check if any demo project exists
  const firstDemoProjectId = DEMO_PROJECTS[0].id;
  const projectDoc = await getDoc(doc(db, 'projects', firstDemoProjectId));
  return projectDoc.exists();
}

// ============================================================================
// RESET (DELETE) DEMO DATA
// ============================================================================
export async function resetDemoData(orgId: string, onProgress?: ProgressCallback): Promise<{
  success: boolean;
  deletedCounts: {
    teamMembers: number;
    clients: number;
    projects: number;
    tasks: number;
    dailyLogs: number;
    timeEntries: number;
    expenses: number;
    changeOrders: number;
  };
}> {
  console.log('🗑️ Starting demo data cleanup...');
  console.log(`   Organization ID: ${orgId}`);

  const progress = (step: string, status: 'pending' | 'in_progress' | 'completed', count?: number, total?: number) => {
    console.log(`   ${status === 'completed' ? '✅' : status === 'in_progress' ? '⏳' : '⏸️'} ${step}${count !== undefined ? ` (${count}${total ? `/${total}` : ''})` : ''}`);
    onProgress?.({ step, status, count, total });
  };

  const deletedCounts = {
    teamMembers: 0,
    clients: 0,
    projects: 0,
    tasks: 0,
    dailyLogs: 0,
    timeEntries: 0,
    expenses: 0,
    changeOrders: 0,
  };

  try {
    // 0. Delete demo team members (by known IDs)
    const allDemoUsers = [...DEMO_USERS.employees, ...DEMO_USERS.contractors];
    progress('Deleting demo team members', 'in_progress', 0, allDemoUsers.length);
    for (let i = 0; i < allDemoUsers.length; i++) {
      const userRef = doc(db, 'users', allDemoUsers[i].uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await deleteDoc(userRef);
        deletedCounts.teamMembers++;
      }
      progress('Deleting demo team members', 'in_progress', i + 1, allDemoUsers.length);
    }
    progress('Deleting demo team members', 'completed', deletedCounts.teamMembers);

    // 1. Delete demo clients (by known IDs)
    progress('Deleting demo clients', 'in_progress', 0, DEMO_CLIENTS.length);
    for (let i = 0; i < DEMO_CLIENTS.length; i++) {
      const clientRef = doc(db, `organizations/${orgId}/clients`, DEMO_CLIENTS[i].id);
      const clientDoc = await getDoc(clientRef);
      if (clientDoc.exists()) {
        await deleteDoc(clientRef);
        deletedCounts.clients++;
      }
      progress('Deleting demo clients', 'in_progress', i + 1, DEMO_CLIENTS.length);
    }
    progress('Deleting demo clients', 'completed', deletedCounts.clients);

    // 2. Delete demo projects and their phases (by known IDs)
    progress('Deleting demo projects', 'in_progress', 0, DEMO_PROJECTS.length);
    for (let i = 0; i < DEMO_PROJECTS.length; i++) {
      const projectId = DEMO_PROJECTS[i].id;
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        // Delete phases subcollection first
        const phasesSnap = await getDocs(collection(db, `projects/${projectId}/phases`));
        for (const phaseDoc of phasesSnap.docs) {
          await deleteDoc(phaseDoc.ref);
        }

        // Delete project
        await deleteDoc(projectRef);
        deletedCounts.projects++;
      }
      progress('Deleting demo projects', 'in_progress', i + 1, DEMO_PROJECTS.length);
    }
    progress('Deleting demo projects', 'completed', deletedCounts.projects);

    // 3. Delete tasks for demo projects
    progress('Deleting demo tasks', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('projectId', '==', project.id)
      );
      const tasksSnap = await getDocs(tasksQuery);
      for (const taskDoc of tasksSnap.docs) {
        await deleteDoc(taskDoc.ref);
        deletedCounts.tasks++;
      }
    }
    progress('Deleting demo tasks', 'completed', deletedCounts.tasks);

    // 4. Delete daily logs for demo projects
    progress('Deleting demo daily logs', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const logsQuery = query(
        collection(db, `organizations/${orgId}/dailyLogs`),
        where('projectId', '==', project.id)
      );
      const logsSnap = await getDocs(logsQuery);
      for (const logDoc of logsSnap.docs) {
        await deleteDoc(logDoc.ref);
        deletedCounts.dailyLogs++;
      }
    }
    progress('Deleting demo daily logs', 'completed', deletedCounts.dailyLogs);

    // 5. Delete time entries for demo projects
    progress('Deleting demo time entries', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const entriesQuery = query(
        collection(db, `organizations/${orgId}/timeEntries`),
        where('projectId', '==', project.id)
      );
      const entriesSnap = await getDocs(entriesQuery);
      for (const entryDoc of entriesSnap.docs) {
        await deleteDoc(entryDoc.ref);
        deletedCounts.timeEntries++;
      }
    }
    progress('Deleting demo time entries', 'completed', deletedCounts.timeEntries);

    // 6. Delete expenses for demo projects
    progress('Deleting demo expenses', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const expensesQuery = query(
        collection(db, `organizations/${orgId}/expenses`),
        where('projectId', '==', project.id)
      );
      const expensesSnap = await getDocs(expensesQuery);
      for (const expenseDoc of expensesSnap.docs) {
        await deleteDoc(expenseDoc.ref);
        deletedCounts.expenses++;
      }
    }
    progress('Deleting demo expenses', 'completed', deletedCounts.expenses);

    // 7. Delete change orders for demo projects
    progress('Deleting demo change orders', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const cosQuery = query(
        collection(db, 'change_orders'),
        where('projectId', '==', project.id)
      );
      const cosSnap = await getDocs(cosQuery);
      for (const coDoc of cosSnap.docs) {
        await deleteDoc(coDoc.ref);
        deletedCounts.changeOrders++;
      }
    }
    progress('Deleting demo change orders', 'completed', deletedCounts.changeOrders);

    progress('Cleanup complete', 'completed');

    console.log('');
    console.log('✨ Demo data cleanup complete!');
    console.log('');
    console.log('Deleted:');
    console.log(`   • ${deletedCounts.teamMembers} team members`);
    console.log(`   • ${deletedCounts.clients} clients`);
    console.log(`   • ${deletedCounts.projects} projects`);
    console.log(`   • ${deletedCounts.tasks} tasks`);
    console.log(`   • ${deletedCounts.dailyLogs} daily logs`);
    console.log(`   • ${deletedCounts.timeEntries} time entries`);
    console.log(`   • ${deletedCounts.expenses} expenses`);
    console.log(`   • ${deletedCounts.changeOrders} change orders`);

    return { success: true, deletedCounts };
  } catch (error) {
    console.error('❌ Error cleaning up demo data:', error);
    throw error;
  }
}

// ============================================================================
// MAIN SEEDER FUNCTION
// ============================================================================
export async function seedDemoData(orgId: string, onProgress?: ProgressCallback) {
  console.log('🌱 Starting demo data generation...');
  console.log(`   Organization ID: ${orgId}`);

  // Check if demo data already exists
  const alreadyExists = await checkDemoDataExists(orgId);
  if (alreadyExists) {
    throw new Error('Demo data already exists. Please reset the demo data first before generating new data.');
  }

  const progress = (step: string, status: 'pending' | 'in_progress' | 'completed', count?: number, total?: number) => {
    console.log(`   ${status === 'completed' ? '✅' : status === 'in_progress' ? '⏳' : '⏸️'} ${step}${count !== undefined ? ` (${count}${total ? `/${total}` : ''})` : ''}`);
    onProgress?.({ step, status, count, total });
  };

  try {
    // 0. Create Team Members (employees and subcontractors)
    const allUsers = [...DEMO_USERS.employees, ...DEMO_USERS.contractors];
    const totalUsers = allUsers.length;
    progress('Creating team members', 'in_progress', 0, totalUsers);
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      progress('Creating team members', 'in_progress', i + 1, totalUsers);
    }
    progress('Creating team members', 'completed', totalUsers);

    // 1. Create Clients
    progress('Creating clients', 'in_progress', 0, DEMO_CLIENTS.length);
    for (let i = 0; i < DEMO_CLIENTS.length; i++) {
      const client = DEMO_CLIENTS[i];
      await setDoc(doc(db, `organizations/${orgId}/clients`, client.id), {
        ...client,
        orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      progress('Creating clients', 'in_progress', i + 1, DEMO_CLIENTS.length);
    }
    progress('Creating clients', 'completed', DEMO_CLIENTS.length);

    // 2. Create Projects
    progress('Creating projects', 'in_progress', 0, DEMO_PROJECTS.length);
    for (let i = 0; i < DEMO_PROJECTS.length; i++) {
      const project = DEMO_PROJECTS[i];
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
      progress('Creating projects', 'in_progress', i + 1, DEMO_PROJECTS.length);
    }
    progress('Creating projects', 'completed', DEMO_PROJECTS.length);

    // 3. Create Daily Logs
    progress('Creating daily logs', 'in_progress', 0);
    let totalLogs = 0;
    const activeProjects = DEMO_PROJECTS.filter(p => p.status !== 'lead');
    for (const project of activeProjects) {
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
      progress('Creating daily logs', 'in_progress', totalLogs);
    }
    progress('Creating daily logs', 'completed', totalLogs);

    // 4. Create Time Entries
    progress('Creating time entries', 'in_progress', 0);
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
      progress('Creating time entries', 'in_progress', totalEntries);
    }
    progress('Creating time entries', 'completed', totalEntries);

    // 5. Create Expenses
    progress('Creating expenses', 'in_progress', 0);
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
      progress('Creating expenses', 'in_progress', totalExpenses);
    }
    progress('Creating expenses', 'completed', totalExpenses);

    // 6. Create Change Orders
    progress('Creating change orders', 'in_progress', 0);
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
      progress('Creating change orders', 'in_progress', totalCOs);
    }
    progress('Creating change orders', 'completed', totalCOs);

    // Final completion callback
    progress('Complete', 'completed');

    console.log('');
    console.log('✨ Demo data generation complete!');
    console.log('');
    console.log('Summary:');
    console.log(`   • ${totalUsers} team members`);
    console.log(`   • ${DEMO_CLIENTS.length} clients`);
    console.log(`   • ${DEMO_PROJECTS.length} projects`);
    console.log(`   • ${totalLogs} daily logs`);
    console.log(`   • ${totalEntries} time entries`);
    console.log(`   • ${totalExpenses} expenses`);
    console.log(`   • ${totalCOs} change orders`);

    return {
      success: true,
      teamMembers: totalUsers,
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
