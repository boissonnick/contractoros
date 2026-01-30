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
  {
    id: 'demo_client_001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    displayName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '555-0123',
    status: 'active' as const,
    isCommercial: false,
    source: 'referral' as const,
    preferredCommunication: 'email' as const,
    contacts: [],
    addresses: [{ type: 'home' as const, street: '123 Oak Street', city: 'Greensboro', state: 'NC', zip: '27401', isPrimary: true }],
    notes: [],
    projectIds: ['demo_proj_001'],
    financials: { totalProposals: 1, totalAccepted: 1, totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0 },
  },
  {
    id: 'demo_client_002',
    firstName: 'Michael',
    lastName: 'Chen',
    displayName: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '555-0124',
    status: 'active' as const,
    isCommercial: false,
    source: 'google' as const,
    preferredCommunication: 'phone' as const,
    contacts: [],
    addresses: [{ type: 'home' as const, street: '456 Pine Ave', city: 'Winston-Salem', state: 'NC', zip: '27101', isPrimary: true }],
    notes: [],
    projectIds: ['demo_proj_004'],
    financials: { totalProposals: 1, totalAccepted: 1, totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0 },
  },
  {
    id: 'demo_client_003',
    firstName: 'Emma',
    lastName: 'Davis',
    displayName: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '555-0125',
    status: 'potential' as const,
    isCommercial: false,
    source: 'website' as const,
    preferredCommunication: 'email' as const,
    contacts: [],
    addresses: [{ type: 'home' as const, street: '789 Maple Dr', city: 'High Point', state: 'NC', zip: '27260', isPrimary: true }],
    notes: [],
    projectIds: ['demo_proj_005'],
    financials: { totalProposals: 1, totalAccepted: 0, totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0 },
  },
  {
    id: 'demo_client_004',
    firstName: 'Robert',
    lastName: 'Martinez',
    displayName: 'Robert Martinez',
    email: 'r.martinez@email.com',
    phone: '555-0126',
    status: 'active' as const,
    isCommercial: false,
    source: 'repeat' as const,
    preferredCommunication: 'text' as const,
    contacts: [],
    addresses: [{ type: 'home' as const, street: '321 Elm Blvd', city: 'Greensboro', state: 'NC', zip: '27408', isPrimary: true }],
    notes: [],
    projectIds: ['demo_proj_003'],
    financials: { totalProposals: 2, totalAccepted: 2, totalInvoiced: 45000, totalPaid: 45000, outstandingBalance: 0 },
  },
  {
    id: 'demo_client_005',
    firstName: 'Property',
    lastName: 'Group',
    displayName: 'TechCorp Properties LLC',
    companyName: 'TechCorp Properties LLC',
    email: 'projects@techcorp.com',
    phone: '555-0127',
    status: 'active' as const,
    isCommercial: true,
    source: 'referral' as const,
    preferredCommunication: 'email' as const,
    contacts: [{ name: 'John Smith', title: 'Property Manager', email: 'jsmith@techcorp.com', phone: '555-0128', isPrimary: true }],
    addresses: [{ type: 'business' as const, street: '500 Commerce Center', city: 'Greensboro', state: 'NC', zip: '27401', isPrimary: true }],
    notes: [],
    projectIds: ['demo_proj_002'],
    financials: { totalProposals: 3, totalAccepted: 2, totalInvoiced: 125000, totalPaid: 100000, outstandingBalance: 25000 },
  },
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

    // Build log object, filtering out undefined values (Firestore doesn't accept undefined)
    const logEntry: EnhancedDailyLog = {
      date: date.toISOString().split('T')[0],
      notes: logTemplate.notes || 'General work progress',
      weather,
      weatherTemperature: temperature,
      userId: user.uid,
      userName: user.displayName,
      hoursWorked: 6 + Math.floor(Math.random() * 4),
      workersOnSite: 2 + Math.floor(Math.random() * 5),
      category: logTemplate.category || 'progress',
      isPrivate: false,
    };

    // Only add optional fields if they have values (Firestore rejects undefined)
    if (weather === 'Heavy Rain') {
      logEntry.weatherNotes = 'Rain delay - crew sent home at 2pm';
    }
    if (logTemplate.workPerformed) logEntry.workPerformed = logTemplate.workPerformed;
    if (logTemplate.crewMembers) logEntry.crewMembers = logTemplate.crewMembers;
    if (logTemplate.materialsDelivered) logEntry.materialsDelivered = logTemplate.materialsDelivered;
    if (logTemplate.visitorsOnSite) logEntry.visitorsOnSite = logTemplate.visitorsOnSite;
    if (logTemplate.safetyNotes) logEntry.safetyNotes = logTemplate.safetyNotes;
    if (logTemplate.issueDescription) logEntry.issueDescription = logTemplate.issueDescription;
    if (logTemplate.issueImpact) logEntry.issueImpact = logTemplate.issueImpact;
    if (logTemplate.followUpRequired) logEntry.followUpRequired = logTemplate.followUpRequired;
    if (logTemplate.followUpDate) logEntry.followUpDate = logTemplate.followUpDate;
    if (logTemplate.tags) logEntry.tags = logTemplate.tags;

    logs.push(logEntry);
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
// DEMO RFIs (Request for Information)
// ============================================================================
const generateRFIs = (projectId: string) => {
  const rfiTemplates: Record<string, Array<{
    number: string;
    subject: string;
    question: string;
    status: 'draft' | 'open' | 'answered' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;
    assignedToName?: string;
    response?: string;
  }>> = {
    'demo_proj_001': [
      {
        number: 'RFI-001',
        subject: 'Cabinet Hardware Finish Clarification',
        question: 'Plans show "brushed nickel" hardware but spec sheet mentions "satin chrome". Please clarify which finish is correct.',
        status: 'answered',
        priority: 'medium',
        assignedTo: 'demo_emp_004',
        assignedToName: 'Lisa Martinez',
        response: 'Use brushed nickel as shown on plans. Spec sheet has been updated.',
      },
      {
        number: 'RFI-002',
        subject: 'Electrical Panel Location',
        question: 'New appliances require 50A circuit. Existing panel is full. Do we need to upgrade main panel or add sub-panel?',
        status: 'answered',
        priority: 'high',
        assignedTo: 'demo_emp_002',
        assignedToName: 'Sarah Chen',
        response: 'Add 100A sub-panel in garage. Client approved additional cost via CO-001.',
      },
      {
        number: 'RFI-003',
        subject: 'Backsplash Height at Window',
        question: 'How should tile backsplash terminate at kitchen window? Wrap around sill or stop at window frame?',
        status: 'open',
        priority: 'medium',
        assignedTo: 'demo_sub_003',
        assignedToName: 'Rodriguez Tile Co',
      },
    ],
    'demo_proj_002': [
      {
        number: 'RFI-001',
        subject: 'Server Room Cooling Requirements',
        question: 'IT dept requires 2-ton dedicated AC unit for server room. Plans show 1-ton unit. Please advise.',
        status: 'answered',
        priority: 'urgent',
        assignedTo: 'demo_sub_002',
        assignedToName: 'Elite HVAC Services',
        response: 'Upgrade to 2-ton mini-split. Change order submitted for approval.',
      },
      {
        number: 'RFI-002',
        subject: 'Fire Suppression in Server Room',
        question: 'Should server room have clean agent (FM-200) suppression instead of water sprinkler?',
        status: 'open',
        priority: 'high',
        assignedTo: 'demo_emp_003',
        assignedToName: 'James Wilson',
      },
      {
        number: 'RFI-003',
        subject: 'Conference Room A/V Rough-In',
        question: 'Plans show 2 data drops for conference room. Client now wants ceiling-mounted projector. Need additional conduit and power?',
        status: 'open',
        priority: 'medium',
        assignedTo: 'demo_emp_002',
        assignedToName: 'Sarah Chen',
      },
      {
        number: 'RFI-004',
        subject: 'ADA Compliance - Restroom Clearances',
        question: 'As-built conditions show 58" turning radius. ADA requires 60". Need to reconfigure layout?',
        status: 'answered',
        priority: 'urgent',
        assignedTo: 'demo_emp_003',
        assignedToName: 'James Wilson',
        response: 'Relocate partition 3" to achieve 60" clearance. No additional cost.',
      },
    ],
    'demo_proj_003': [
      {
        number: 'RFI-001',
        subject: 'Water Damage Discovery',
        question: 'Found water damage behind shower. Is mold remediation required before proceeding?',
        status: 'answered',
        priority: 'urgent',
        assignedTo: 'demo_emp_001',
        assignedToName: 'Mike Rodriguez',
        response: 'Yes. Professional mold remediation required. Change order for additional scope.',
      },
    ],
    'demo_proj_004': [
      {
        number: 'RFI-001',
        subject: 'Unit 8 Flooring Transition',
        question: 'LVP flooring is 8mm, existing hallway is 10mm. How to handle transition?',
        status: 'closed',
        priority: 'low',
        response: 'Use reducer transition strip. Color matched to LVP.',
      },
      {
        number: 'RFI-002',
        subject: 'Common Area Lighting Control',
        question: 'Occupancy sensors or timers for hallway lighting?',
        status: 'closed',
        priority: 'medium',
        response: 'Use combination - occupancy sensors with backup timer.',
      },
    ],
    'demo_proj_006': [
      {
        number: 'RFI-001',
        subject: 'Deck Footing Depth',
        question: 'Soil conditions appear to have more clay than anticipated. Should footings go deeper than 36"?',
        status: 'answered',
        priority: 'high',
        assignedTo: 'demo_emp_003',
        assignedToName: 'James Wilson',
        response: 'Increase footing depth to 42" and add 4" of gravel for drainage.',
      },
    ],
  };

  return rfiTemplates[projectId] || [];
};

// ============================================================================
// DEMO SUBCONTRACTOR BIDS/QUOTES
// ============================================================================
const generateSubcontractorBids = (projectId: string) => {
  const bidTemplates: Record<string, Array<{
    subId: string;
    subName: string;
    trade: string;
    scopeDescription: string;
    bidAmount: number;
    status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'awarded';
    submittedDate: string;
    validUntil: string;
    notes?: string;
    lineItems?: Array<{ description: string; quantity: number; unit: string; unitPrice: number; total: number }>;
  }>> = {
    'demo_proj_001': [
      {
        subId: 'demo_sub_001',
        subName: 'Tony Plumbing LLC',
        trade: 'Plumbing',
        scopeDescription: 'Kitchen rough-in, sink installation, dishwasher connection, disposal installation',
        bidAmount: 4850,
        status: 'awarded',
        submittedDate: '2025-12-01',
        validUntil: '2026-01-31',
        lineItems: [
          { description: 'Kitchen sink rough-in', quantity: 1, unit: 'ea', unitPrice: 1200, total: 1200 },
          { description: 'Dishwasher connection', quantity: 1, unit: 'ea', unitPrice: 450, total: 450 },
          { description: 'Garbage disposal install', quantity: 1, unit: 'ea', unitPrice: 350, total: 350 },
          { description: 'Water line relocation', quantity: 1, unit: 'ea', unitPrice: 850, total: 850 },
          { description: 'Gas line for range', quantity: 1, unit: 'ea', unitPrice: 2000, total: 2000 },
        ],
      },
      {
        subId: 'demo_sub_003',
        subName: 'Rodriguez Tile & Flooring',
        trade: 'Tile & Flooring',
        scopeDescription: 'Backsplash tile installation - subway tile, full height behind range',
        bidAmount: 3200,
        status: 'awarded',
        submittedDate: '2025-12-05',
        validUntil: '2026-02-05',
        lineItems: [
          { description: 'Backsplash tile (material)', quantity: 45, unit: 'sf', unitPrice: 18, total: 810 },
          { description: 'Backsplash tile (labor)', quantity: 45, unit: 'sf', unitPrice: 35, total: 1575 },
          { description: 'Grout and sealer', quantity: 1, unit: 'lot', unitPrice: 285, total: 285 },
          { description: 'Edge trim pieces', quantity: 24, unit: 'lf', unitPrice: 22, total: 528 },
        ],
      },
    ],
    'demo_proj_002': [
      {
        subId: 'demo_sub_002',
        subName: 'Elite HVAC Services',
        trade: 'HVAC',
        scopeDescription: 'Complete HVAC installation - 10-ton RTU, ductwork, controls, startup',
        bidAmount: 68500,
        status: 'awarded',
        submittedDate: '2025-12-10',
        validUntil: '2026-03-10',
        lineItems: [
          { description: '10-ton RTU (equipment)', quantity: 1, unit: 'ea', unitPrice: 28000, total: 28000 },
          { description: 'Ductwork fabrication & install', quantity: 1, unit: 'lot', unitPrice: 22500, total: 22500 },
          { description: 'Controls & thermostat system', quantity: 1, unit: 'lot', unitPrice: 8500, total: 8500 },
          { description: 'Startup, balancing, commissioning', quantity: 1, unit: 'lot', unitPrice: 4500, total: 4500 },
          { description: 'Permits and inspections', quantity: 1, unit: 'lot', unitPrice: 5000, total: 5000 },
        ],
      },
      {
        subId: 'demo_sub_001',
        subName: 'Tony Plumbing LLC',
        trade: 'Plumbing',
        scopeDescription: 'Restroom rough-in and fixtures - 2 ADA compliant restrooms',
        bidAmount: 18750,
        status: 'awarded',
        submittedDate: '2025-12-12',
        validUntil: '2026-03-12',
        lineItems: [
          { description: 'Restroom rough-in (2 locations)', quantity: 2, unit: 'ea', unitPrice: 4500, total: 9000 },
          { description: 'ADA toilet fixtures', quantity: 4, unit: 'ea', unitPrice: 850, total: 3400 },
          { description: 'ADA lavatory fixtures', quantity: 4, unit: 'ea', unitPrice: 650, total: 2600 },
          { description: 'Water heater (50 gal)', quantity: 1, unit: 'ea', unitPrice: 2250, total: 2250 },
          { description: 'Floor drain install', quantity: 2, unit: 'ea', unitPrice: 750, total: 1500 },
        ],
      },
    ],
    'demo_proj_003': [
      {
        subId: 'demo_sub_001',
        subName: 'Tony Plumbing LLC',
        trade: 'Plumbing',
        scopeDescription: 'Bathroom remodel - move shower, new vanity, toilet replacement',
        bidAmount: 6200,
        status: 'awarded',
        submittedDate: '2026-01-15',
        validUntil: '2026-04-15',
      },
      {
        subId: 'demo_sub_003',
        subName: 'Rodriguez Tile & Flooring',
        trade: 'Tile & Flooring',
        scopeDescription: 'Shower tile, floor tile, vanity backsplash',
        bidAmount: 5800,
        status: 'under_review',
        submittedDate: '2026-01-18',
        validUntil: '2026-04-18',
      },
    ],
  };

  return bidTemplates[projectId] || [];
};

// ============================================================================
// DEMO PUNCH LIST ITEMS
// ============================================================================
const generatePunchListItems = (projectId: string) => {
  const punchTemplates: Record<string, Array<{
    title: string;
    description: string;
    location: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'completed' | 'verified';
    assignedTo?: string;
    assignedToName?: string;
    dueDate?: string;
  }>> = {
    'demo_proj_001': [
      { title: 'Cabinet door alignment', description: 'Lower cabinet door on left side of sink is slightly crooked', location: 'Kitchen - Base Cabinets', priority: 'medium', status: 'completed', assignedTo: 'demo_emp_001', assignedToName: 'Mike Rodriguez' },
      { title: 'Grout touch-up', description: 'Small area behind range has thin grout', location: 'Kitchen - Backsplash', priority: 'low', status: 'in_progress', assignedTo: 'demo_sub_003', assignedToName: 'Rodriguez Tile Co' },
      { title: 'Paint touch-up', description: 'Minor scuffs on wall near refrigerator', location: 'Kitchen - North Wall', priority: 'low', status: 'open', assignedTo: 'demo_emp_005', assignedToName: 'David Brown' },
    ],
    'demo_proj_004': [
      { title: 'Unit 3 - Faucet drip', description: 'Kitchen faucet has slow drip', location: 'Unit 3 - Kitchen', priority: 'high', status: 'completed', assignedTo: 'demo_sub_001', assignedToName: 'Tony Plumbing LLC' },
      { title: 'Unit 8 - Cabinet door', description: 'Cabinet door hinge needs adjustment', location: 'Unit 8 - Kitchen', priority: 'medium', status: 'open' },
      { title: 'Unit 12 - Paint', description: 'Missed spot on ceiling corner', location: 'Unit 12 - Living Room', priority: 'low', status: 'in_progress', assignedTo: 'demo_emp_005', assignedToName: 'David Brown' },
      { title: 'Hallway - Light fixture', description: 'One fixture flickering', location: 'Building A - Hallway', priority: 'high', status: 'completed', assignedTo: 'demo_emp_002', assignedToName: 'Sarah Chen' },
      { title: 'Unit 5 - Door strike', description: 'Bedroom door not latching properly', location: 'Unit 5 - Bedroom', priority: 'medium', status: 'completed' },
    ],
  };

  return punchTemplates[projectId] || [];
};

// ============================================================================
// ENHANCED TIME ENTRIES WITH TASK TRACKING
// ============================================================================
const generateEnhancedTimeEntries = (projectId: string, tasks: Array<{ id: string; title: string; assigneeId?: string; assigneeName?: string }>) => {
  const entries: Array<{
    userId: string;
    userName: string;
    userRole: string;
    projectId: string;
    projectName: string;
    taskId?: string;
    taskName?: string;
    clockIn: Date;
    clockOut: Date | null;
    breakMinutes: number;
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    status: 'active' | 'completed' | 'approved' | 'pending_approval';
    type: 'clock' | 'manual';
    notes?: string;
    hourlyRate: number;
    breaks: Array<{ id: string; type: 'lunch' | 'break'; startTime: Date; endTime: Date; duration: number; isPaid: boolean }>;
  }> = [];

  const employees = DEMO_USERS.employees;
  const today = new Date();
  const project = DEMO_PROJECTS.find(p => p.id === projectId);
  if (!project) return entries;

  // Generate 8 weeks of time entries for payroll testing
  for (let week = 0; week < 8; week++) {
    for (let day = 0; day < 5; day++) { // Monday-Friday
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7) - day);

      // Skip future dates
      if (date > today) continue;

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // 2-4 employees working each day
      const numWorkers = 2 + Math.floor(Math.random() * 3);
      const shuffledEmployees = [...employees].sort(() => Math.random() - 0.5);
      const dayWorkers = shuffledEmployees.slice(0, numWorkers);

      for (const worker of dayWorkers) {
        // Random start time between 6:30am and 8am
        const startHour = 6 + Math.floor(Math.random() * 2);
        const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45

        const clockIn = new Date(date);
        clockIn.setHours(startHour, startMinute, 0, 0);

        // Work 7-10 hours (some overtime days)
        const hoursWorked = 7 + Math.floor(Math.random() * 4);
        const clockOut = new Date(clockIn);
        clockOut.setHours(clockIn.getHours() + hoursWorked);

        // Calculate break
        const breakMinutes = hoursWorked >= 8 ? 60 : 30;
        const totalMinutes = hoursWorked * 60 - breakMinutes;
        const totalHours = totalMinutes / 60;
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(0, totalHours - 8);

        // Assign to a task if worker matches
        const workerTasks = tasks.filter(t => t.assigneeId === worker.uid);
        const assignedTask = workerTasks.length > 0 ? workerTasks[Math.floor(Math.random() * workerTasks.length)] : null;

        // Create break record
        const lunchStart = new Date(clockIn);
        lunchStart.setHours(12, 0, 0, 0);
        const lunchEnd = new Date(lunchStart);
        lunchEnd.setMinutes(lunchStart.getMinutes() + breakMinutes);

        // Determine status based on how old the entry is
        let status: 'completed' | 'approved' | 'pending_approval' = 'completed';
        if (week <= 1) {
          status = 'pending_approval';
        } else if (week <= 3) {
          status = Math.random() > 0.3 ? 'approved' : 'pending_approval';
        } else {
          status = 'approved';
        }

        entries.push({
          userId: worker.uid,
          userName: worker.displayName,
          userRole: worker.role,
          projectId,
          projectName: project.name,
          taskId: assignedTask?.id,
          taskName: assignedTask?.title,
          clockIn,
          clockOut,
          breakMinutes,
          totalHours: parseFloat(totalHours.toFixed(2)),
          regularHours: parseFloat(regularHours.toFixed(2)),
          overtimeHours: parseFloat(overtimeHours.toFixed(2)),
          status,
          type: 'clock',
          notes: overtimeHours > 0 ? 'Overtime pre-approved by PM' : undefined,
          hourlyRate: worker.hourlyRate || 25,
          breaks: [{
            id: `break_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'lunch',
            startTime: lunchStart,
            endTime: lunchEnd,
            duration: breakMinutes,
            isPaid: false,
          }],
        });
      }
    }
  }

  return entries;
};

// ============================================================================
// DEMO PAYROLL SETTINGS
// ============================================================================
const generatePayrollSettings = (orgId: string) => {
  return {
    id: 'default',
    orgId,
    paySchedule: 'bi-weekly' as const,
    defaultPayDay: 'Friday',
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
    weeklyOvertimeThreshold: 40,
    dailyOvertimeThreshold: 8,
    enableDailyOvertime: false,
    stateCode: 'NC',
    federalFilingStatus: 'single',
    defaultRetirementPercent: 3,
    healthInsuranceAmount: 150,
    autoApproveTimesheets: false,
    requireManagerApproval: true,
    payrollEmail: 'payroll@aroutewest.com',
  };
};

// ============================================================================
// DEMO PAYROLL RUNS
// ============================================================================
const generatePayrollRuns = (orgId: string) => {
  const runs: Array<{
    runNumber: number;
    payPeriod: {
      type: 'bi-weekly';
      startDate: Date;
      endDate: Date;
      payDate: Date;
      label: string;
    };
    status: 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed';
    entries: Array<{
      employeeId: string;
      employeeName: string;
      employeeType: 'hourly' | 'salaried';
      regularHours: number;
      overtimeHours: number;
      regularRate: number;
      regularPay: number;
      overtimePay: number;
      grossPay: number;
      federalWithholding: number;
      stateWithholding: number;
      socialSecurity: number;
      medicare: number;
      retirement401k: number;
      healthInsurance: number;
      totalDeductions: number;
      netPay: number;
    }>;
    employeeCount: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    createdBy: string;
    createdByName: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
  }> = [];

  const employees = DEMO_USERS.employees;
  const today = new Date();

  // Generate 6 bi-weekly pay periods
  for (let period = 0; period < 6; period++) {
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - (period * 14) - 7);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 13);
    const payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + 5);

    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const label = `${formatDate(startDate)} - ${formatDate(endDate)}, ${endDate.getFullYear()}`;

    const entries = employees.map(emp => {
      const isHourly = emp.employeeType === 'hourly';
      const regularHours = 72 + Math.floor(Math.random() * 8); // 72-80 hours per 2 weeks
      const overtimeHours = Math.random() > 0.7 ? Math.floor(Math.random() * 8) : 0;
      const regularRate = emp.hourlyRate || 25;

      const regularPay = isHourly ? regularHours * regularRate : (emp.salary || 65000) / 26;
      const overtimePay = overtimeHours * regularRate * 1.5;
      const grossPay = regularPay + overtimePay;

      // Tax calculations (simplified)
      const federalWithholding = grossPay * 0.12;
      const stateWithholding = grossPay * 0.0525;
      const socialSecurity = grossPay * 0.062;
      const medicare = grossPay * 0.0145;
      const retirement401k = grossPay * 0.03;
      const healthInsurance = 150;
      const totalDeductions = federalWithholding + stateWithholding + socialSecurity + medicare + retirement401k + healthInsurance;
      const netPay = grossPay - totalDeductions;

      return {
        employeeId: emp.uid,
        employeeName: emp.displayName,
        employeeType: emp.employeeType || 'hourly',
        regularHours,
        overtimeHours,
        regularRate,
        regularPay: Math.round(regularPay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        grossPay: Math.round(grossPay * 100) / 100,
        federalWithholding: Math.round(federalWithholding * 100) / 100,
        stateWithholding: Math.round(stateWithholding * 100) / 100,
        socialSecurity: Math.round(socialSecurity * 100) / 100,
        medicare: Math.round(medicare * 100) / 100,
        retirement401k: Math.round(retirement401k * 100) / 100,
        healthInsurance,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netPay: Math.round(netPay * 100) / 100,
      };
    });

    const totalRegularHours = entries.reduce((sum, e) => sum + e.regularHours, 0);
    const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);
    const totalGrossPay = entries.reduce((sum, e) => sum + e.grossPay, 0);
    const totalDeductions = entries.reduce((sum, e) => sum + e.totalDeductions, 0);
    const totalNetPay = entries.reduce((sum, e) => sum + e.netPay, 0);

    // Determine status based on age
    let status: 'draft' | 'pending_approval' | 'approved' | 'completed' = 'completed';
    if (period === 0) status = 'draft';
    else if (period === 1) status = 'pending_approval';
    else if (period === 2) status = 'approved';

    runs.push({
      runNumber: 6 - period,
      payPeriod: {
        type: 'bi-weekly',
        startDate,
        endDate,
        payDate,
        label,
      },
      status,
      entries,
      employeeCount: entries.length,
      totalRegularHours,
      totalOvertimeHours,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      createdBy: DEMO_USERS.employees[3].uid,
      createdByName: DEMO_USERS.employees[3].displayName,
      ...(status !== 'draft' && status !== 'pending_approval' ? {
        approvedBy: DEMO_USERS.owner.uid,
        approvedByName: DEMO_USERS.owner.displayName,
        approvedAt: new Date(endDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      } : {}),
    });
  }

  return runs;
};

// ============================================================================
// DEMO SCHEDULE EVENTS
// ============================================================================
const generateScheduleEvents = () => {
  const events: Array<{
    title: string;
    description?: string;
    type: 'work' | 'meeting' | 'inspection' | 'delivery' | 'milestone';
    projectId: string;
    projectName: string;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    assignedUserIds: string[];
    assignedUserNames: string[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    color?: string;
    location?: string;
  }> = [];

  const today = new Date();
  const activeProjects = DEMO_PROJECTS.filter(p => p.status === 'active');

  // Generate events for next 4 weeks
  for (let week = -1; week < 4; week++) {
    for (const project of activeProjects) {
      // 2-3 events per project per week
      const numEvents = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numEvents; i++) {
        const dayOffset = week * 7 + Math.floor(Math.random() * 5) + 1; // Mon-Fri
        const eventDate = new Date(today);
        eventDate.setDate(eventDate.getDate() + dayOffset);

        // Skip weekends
        if (eventDate.getDay() === 0 || eventDate.getDay() === 6) continue;

        const eventTypes: Array<'work' | 'meeting' | 'inspection' | 'delivery' | 'milestone'> = ['work', 'work', 'work', 'meeting', 'inspection', 'delivery'];
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        const startHour = 7 + Math.floor(Math.random() * 3);
        const startDate = new Date(eventDate);
        startDate.setHours(startHour, 0, 0, 0);

        const duration = type === 'meeting' ? 1 : (type === 'inspection' ? 2 : 8);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + duration);

        const assignees = DEMO_USERS.employees.slice(0, 2 + Math.floor(Math.random() * 3));

        const titles: Record<string, string[]> = {
          work: ['Framing work', 'Electrical rough-in', 'Plumbing install', 'Drywall install', 'Finish carpentry', 'Painting', 'Flooring install'],
          meeting: ['Client walkthrough', 'Team standup', 'Sub coordination', 'Design review'],
          inspection: ['Framing inspection', 'Electrical inspection', 'Plumbing inspection', 'Final inspection'],
          delivery: ['Material delivery', 'Appliance delivery', 'Cabinet delivery', 'Flooring delivery'],
          milestone: ['Phase complete', 'Rough-in complete', 'Final walkthrough'],
        };

        const status = dayOffset < 0 ? 'completed' : (dayOffset === 0 ? 'in_progress' : 'scheduled');

        events.push({
          title: titles[type][Math.floor(Math.random() * titles[type].length)],
          type,
          projectId: project.id,
          projectName: project.name,
          startDate,
          endDate,
          allDay: false,
          assignedUserIds: assignees.map(a => a.uid),
          assignedUserNames: assignees.map(a => a.displayName),
          status,
          location: `${project.address.street}, ${project.address.city}`,
        });
      }
    }
  }

  return events;
};

// ============================================================================
// DEMO CREW AVAILABILITY
// ============================================================================
const generateCrewAvailability = () => {
  const availability: Array<{
    userId: string;
    userName: string;
    date: Date;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    notes?: string;
    type: 'available' | 'unavailable' | 'partial' | 'time_off';
  }> = [];

  const employees = DEMO_USERS.employees;
  const today = new Date();

  // Generate availability for next 4 weeks
  for (let day = 0; day < 28; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const emp of employees) {
      // 90% chance available, 5% time off, 5% partial
      const rand = Math.random();
      let type: 'available' | 'unavailable' | 'partial' | 'time_off' = 'available';
      let isAvailable = true;
      let startTime = '07:00';
      let endTime = '16:00';
      let notes: string | undefined;

      if (rand > 0.95) {
        type = 'time_off';
        isAvailable = false;
        notes = 'PTO';
      } else if (rand > 0.90) {
        type = 'partial';
        isAvailable = true;
        startTime = '10:00';
        notes = 'Doctor appointment AM';
      }

      availability.push({
        userId: emp.uid,
        userName: emp.displayName,
        date,
        isAvailable,
        startTime,
        endTime,
        notes,
        type,
      });
    }
  }

  return availability;
};

// ============================================================================
// DEMO TIME OFF REQUESTS
// ============================================================================
const generateTimeOffRequests = () => {
  const requests: Array<{
    userId: string;
    userName: string;
    type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty';
    startDate: Date;
    endDate: Date;
    totalDays: number;
    totalHours: number;
    status: 'pending' | 'approved' | 'denied' | 'cancelled';
    reason?: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
  }> = [];

  const employees = DEMO_USERS.employees;
  const today = new Date();

  // Past approved time off
  requests.push({
    userId: employees[0].uid,
    userName: employees[0].displayName,
    type: 'vacation',
    startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(today.getTime() - 26 * 24 * 60 * 60 * 1000),
    totalDays: 5,
    totalHours: 40,
    status: 'approved',
    reason: 'Family vacation',
    approvedBy: DEMO_USERS.employees[2].uid,
    approvedByName: DEMO_USERS.employees[2].displayName,
    approvedAt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
  });

  // Pending request
  requests.push({
    userId: employees[1].uid,
    userName: employees[1].displayName,
    type: 'personal',
    startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
    totalDays: 1,
    totalHours: 8,
    status: 'pending',
    reason: 'Moving day',
  });

  // Future approved
  requests.push({
    userId: employees[4].uid,
    userName: employees[4].displayName,
    type: 'vacation',
    startDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(today.getTime() + 37 * 24 * 60 * 60 * 1000),
    totalDays: 5,
    totalHours: 40,
    status: 'approved',
    reason: 'Spring break with kids',
    approvedBy: DEMO_USERS.employees[2].uid,
    approvedByName: DEMO_USERS.employees[2].displayName,
    approvedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  });

  return requests;
};

// ============================================================================
// DEMO INVOICES
// ============================================================================
const generateInvoices = () => {
  const invoices: Array<{
    invoiceNumber: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
    issueDate: Date;
    dueDate: Date;
    paidDate?: Date;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    notes?: string;
    terms?: string;
  }> = [];

  const today = new Date();
  let invoiceNum = 1001;

  // Generate invoices for projects with matching clients
  const projectsWithClients = DEMO_PROJECTS.filter(p => p.clientId && p.status !== 'lead');

  for (const project of projectsWithClients) {
    const client = DEMO_CLIENTS.find(c => c.id === project.clientId);
    if (!client) continue;

    // 1-3 invoices per project
    const numInvoices = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numInvoices; i++) {
      const daysAgo = i * 30 + Math.floor(Math.random() * 15);
      const issueDate = new Date(today);
      issueDate.setDate(issueDate.getDate() - daysAgo);

      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Generate line items
      const lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }> = [];

      if (i === 0) {
        // First invoice - deposit
        lineItems.push({
          description: 'Project deposit (50%)',
          quantity: 1,
          unitPrice: project.quoteTotal * 0.5,
          total: project.quoteTotal * 0.5,
        });
      } else {
        // Progress payments
        const descriptions = [
          'Framing and structural work',
          'Rough-in (electrical, plumbing, HVAC)',
          'Drywall and insulation',
          'Finish work and trim',
          'Final completion payment',
        ];
        const numItems = 2 + Math.floor(Math.random() * 3);
        for (let j = 0; j < numItems; j++) {
          const unitPrice = 2000 + Math.floor(Math.random() * 8000);
          lineItems.push({
            description: descriptions[j % descriptions.length],
            quantity: 1,
            unitPrice,
            total: unitPrice,
          });
        }
      }

      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const taxRate = 0; // Most construction invoices are tax exempt
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Determine status and payment
      let status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' = 'sent';
      let amountPaid = 0;
      let paidDate: Date | undefined;

      if (daysAgo > 45) {
        status = 'paid';
        amountPaid = total;
        paidDate = new Date(dueDate);
        paidDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 10));
      } else if (daysAgo > 30 && Math.random() > 0.5) {
        status = 'paid';
        amountPaid = total;
        paidDate = new Date(today);
        paidDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 5));
      } else if (dueDate < today) {
        status = 'overdue';
      } else if (Math.random() > 0.7) {
        status = 'viewed';
      }

      invoices.push({
        invoiceNumber: `INV-${invoiceNum++}`,
        projectId: project.id,
        projectName: project.name,
        clientId: client.id,
        clientName: client.displayName,
        clientEmail: client.email,
        status,
        issueDate,
        dueDate,
        paidDate,
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        amountPaid: Math.round(amountPaid * 100) / 100,
        amountDue: Math.round((total - amountPaid) * 100) / 100,
        lineItems,
        notes: 'Thank you for your business!',
        terms: 'Net 30',
      });
    }
  }

  return invoices;
};

// ============================================================================
// DEMO PAYMENTS
// ============================================================================
const generatePayments = (invoices: ReturnType<typeof generateInvoices>) => {
  const payments: Array<{
    invoiceId?: string;
    invoiceNumber?: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    amount: number;
    method: 'check' | 'ach' | 'card' | 'cash' | 'wire';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentDate: Date;
    reference?: string;
    notes?: string;
  }> = [];

  // Create payments for paid invoices
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  for (const invoice of paidInvoices) {
    const methods: Array<'check' | 'ach' | 'card'> = ['check', 'ach', 'card'];
    const method = methods[Math.floor(Math.random() * methods.length)];

    payments.push({
      invoiceId: invoice.invoiceNumber,
      invoiceNumber: invoice.invoiceNumber,
      projectId: invoice.projectId,
      projectName: invoice.projectName,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      amount: invoice.total,
      method,
      status: 'completed',
      paymentDate: invoice.paidDate || new Date(),
      reference: method === 'check' ? `Check #${1000 + Math.floor(Math.random() * 9000)}` :
                 method === 'ach' ? `ACH-${Date.now().toString(36).toUpperCase()}` :
                 `TXN-${Date.now().toString(36).toUpperCase()}`,
    });
  }

  return payments;
};

// ============================================================================
// DEMO WEEKLY TIMESHEETS
// ============================================================================
const generateWeeklyTimesheets = () => {
  const timesheets: Array<{
    userId: string;
    userName: string;
    weekStartDate: Date;
    weekEndDate: Date;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
    projectBreakdown: Array<{
      projectId: string;
      projectName: string;
      hours: number;
    }>;
    submittedAt?: Date;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    notes?: string;
  }> = [];

  const employees = DEMO_USERS.employees;
  const today = new Date();
  const activeProjects = DEMO_PROJECTS.filter(p => p.status === 'active');

  // Generate 8 weeks of timesheets
  for (let week = 0; week < 8; week++) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (week * 7) - today.getDay()); // Last Sunday
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    for (const emp of employees) {
      const regularHours = 36 + Math.floor(Math.random() * 8); // 36-44 hours
      const overtimeHours = regularHours > 40 ? regularHours - 40 : 0;
      const totalHours = regularHours;

      // Distribute hours across projects
      const projectBreakdown: Array<{ projectId: string; projectName: string; hours: number }> = [];
      let remainingHours = totalHours;
      const shuffledProjects = [...activeProjects].sort(() => Math.random() - 0.5).slice(0, 2);

      for (let i = 0; i < shuffledProjects.length && remainingHours > 0; i++) {
        const hours = i === shuffledProjects.length - 1 ? remainingHours :
                      Math.floor(remainingHours * (0.4 + Math.random() * 0.3));
        projectBreakdown.push({
          projectId: shuffledProjects[i].id,
          projectName: shuffledProjects[i].name,
          hours,
        });
        remainingHours -= hours;
      }

      // Determine status based on week
      let status: 'draft' | 'submitted' | 'approved' = 'approved';
      if (week === 0) status = 'draft';
      else if (week === 1) status = 'submitted';

      timesheets.push({
        userId: emp.uid,
        userName: emp.displayName,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        status,
        regularHours: Math.min(regularHours, 40),
        overtimeHours,
        totalHours,
        projectBreakdown,
        ...(status !== 'draft' ? {
          submittedAt: new Date(weekEnd.getTime() + 2 * 24 * 60 * 60 * 1000),
        } : {}),
        ...(status === 'approved' ? {
          approvedBy: DEMO_USERS.employees[2].uid,
          approvedByName: DEMO_USERS.employees[2].displayName,
          approvedAt: new Date(weekEnd.getTime() + 4 * 24 * 60 * 60 * 1000),
        } : {}),
      });
    }
  }

  return timesheets;
};

// ============================================================================
// DEMO MATERIALS
// ============================================================================
const generateMaterials = () => {
  const materials: Array<{
    name: string;
    description?: string;
    category: string;
    unit: string;
    unitCost: number;
    quantityOnHand: number;
    reorderLevel: number;
    preferredVendor?: string;
    sku?: string;
  }> = [
    { name: '2x4 Stud 8ft', category: 'Lumber', unit: 'each', unitCost: 4.50, quantityOnHand: 150, reorderLevel: 50, preferredVendor: 'Home Depot', sku: 'LUM-2X4-8' },
    { name: '2x6 Stud 8ft', category: 'Lumber', unit: 'each', unitCost: 6.75, quantityOnHand: 80, reorderLevel: 30, preferredVendor: 'Home Depot', sku: 'LUM-2X6-8' },
    { name: 'Plywood 4x8 3/4"', category: 'Lumber', unit: 'sheet', unitCost: 45.00, quantityOnHand: 25, reorderLevel: 10, preferredVendor: 'Lowes', sku: 'PLY-48-34' },
    { name: 'Drywall 4x8 1/2"', category: 'Drywall', unit: 'sheet', unitCost: 12.50, quantityOnHand: 100, reorderLevel: 40, preferredVendor: 'ABC Supply', sku: 'DRY-48-12' },
    { name: 'Joint Compound 5gal', category: 'Drywall', unit: 'bucket', unitCost: 18.00, quantityOnHand: 12, reorderLevel: 5, preferredVendor: 'ABC Supply', sku: 'JC-5GAL' },
    { name: 'Drywall Tape 500ft', category: 'Drywall', unit: 'roll', unitCost: 8.50, quantityOnHand: 20, reorderLevel: 8, sku: 'DT-500' },
    { name: 'Romex 12/2 250ft', category: 'Electrical', unit: 'roll', unitCost: 95.00, quantityOnHand: 8, reorderLevel: 3, preferredVendor: 'Ferguson', sku: 'ROM-12-2' },
    { name: 'Romex 14/2 250ft', category: 'Electrical', unit: 'roll', unitCost: 75.00, quantityOnHand: 10, reorderLevel: 4, preferredVendor: 'Ferguson', sku: 'ROM-14-2' },
    { name: 'Single Gang Box', category: 'Electrical', unit: 'each', unitCost: 0.85, quantityOnHand: 200, reorderLevel: 50, sku: 'BOX-SG' },
    { name: 'Outlet Receptacle', category: 'Electrical', unit: 'each', unitCost: 2.50, quantityOnHand: 100, reorderLevel: 30, sku: 'OUT-STD' },
    { name: 'PVC Pipe 2" 10ft', category: 'Plumbing', unit: 'each', unitCost: 8.50, quantityOnHand: 40, reorderLevel: 15, preferredVendor: 'Ferguson', sku: 'PVC-2-10' },
    { name: 'PVC Pipe 4" 10ft', category: 'Plumbing', unit: 'each', unitCost: 18.00, quantityOnHand: 20, reorderLevel: 8, preferredVendor: 'Ferguson', sku: 'PVC-4-10' },
    { name: 'PEX Tubing 1/2" 100ft', category: 'Plumbing', unit: 'roll', unitCost: 55.00, quantityOnHand: 6, reorderLevel: 2, sku: 'PEX-12-100' },
    { name: 'Interior Paint - White', category: 'Paint', unit: 'gallon', unitCost: 35.00, quantityOnHand: 15, reorderLevel: 5, preferredVendor: 'Sherwin Williams', sku: 'PNT-INT-WHT' },
    { name: 'Primer', category: 'Paint', unit: 'gallon', unitCost: 25.00, quantityOnHand: 10, reorderLevel: 4, sku: 'PNT-PRM' },
    { name: 'Construction Adhesive', category: 'Adhesives', unit: 'tube', unitCost: 6.50, quantityOnHand: 30, reorderLevel: 12, sku: 'ADH-CON' },
    { name: 'Wood Screws #8 3"', category: 'Fasteners', unit: 'box', unitCost: 12.00, quantityOnHand: 25, reorderLevel: 10, sku: 'SCR-8-3' },
    { name: 'Deck Screws #10 3"', category: 'Fasteners', unit: 'box', unitCost: 45.00, quantityOnHand: 8, reorderLevel: 3, sku: 'SCR-DK-10' },
    { name: 'R-19 Insulation', category: 'Insulation', unit: 'roll', unitCost: 28.00, quantityOnHand: 20, reorderLevel: 8, sku: 'INS-R19' },
    { name: 'R-13 Insulation', category: 'Insulation', unit: 'roll', unitCost: 22.00, quantityOnHand: 25, reorderLevel: 10, sku: 'INS-R13' },
  ];

  return materials;
};

// ============================================================================
// DEMO PURCHASE ORDERS
// ============================================================================
const generatePurchaseOrders = (materials: ReturnType<typeof generateMaterials>) => {
  const purchaseOrders: Array<{
    poNumber: string;
    vendor: string;
    vendorEmail?: string;
    projectId?: string;
    projectName?: string;
    status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
    orderDate: Date;
    expectedDate: Date;
    receivedDate?: Date;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    lineItems: Array<{
      materialName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    notes?: string;
  }> = [];

  const today = new Date();
  const projects = DEMO_PROJECTS.filter(p => p.status === 'active');
  let poNum = 5001;

  // Generate 6-8 POs
  for (let i = 0; i < 7; i++) {
    const daysAgo = i * 8 + Math.floor(Math.random() * 5);
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - daysAgo);

    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + 3 + Math.floor(Math.random() * 4));

    // Select 3-6 materials
    const numItems = 3 + Math.floor(Math.random() * 4);
    const shuffledMaterials = [...materials].sort(() => Math.random() - 0.5).slice(0, numItems);

    const lineItems = shuffledMaterials.map(mat => {
      const quantity = 5 + Math.floor(Math.random() * 20);
      return {
        materialName: mat.name,
        quantity,
        unitPrice: mat.unitCost,
        total: quantity * mat.unitCost,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.07;
    const shipping = subtotal > 500 ? 0 : 45;
    const total = subtotal + tax + shipping;

    // Determine status
    let status: 'draft' | 'sent' | 'confirmed' | 'received' = 'received';
    let receivedDate: Date | undefined;
    if (daysAgo < 3) status = 'sent';
    else if (daysAgo < 7) status = 'confirmed';
    else {
      receivedDate = new Date(expectedDate);
      receivedDate.setDate(receivedDate.getDate() + Math.floor(Math.random() * 2));
    }

    const project = projects[i % projects.length];

    purchaseOrders.push({
      poNumber: `PO-${poNum++}`,
      vendor: shuffledMaterials[0].preferredVendor || 'General Supplier',
      projectId: project.id,
      projectName: project.name,
      status,
      orderDate,
      expectedDate,
      receivedDate,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping,
      total: Math.round(total * 100) / 100,
      lineItems,
    });
  }

  return purchaseOrders;
};

// ============================================================================
// DEMO TOOLS/EQUIPMENT
// ============================================================================
const generateToolsAndEquipment = () => {
  const tools: Array<{
    name: string;
    category: string;
    serialNumber?: string;
    status: 'available' | 'checked_out' | 'maintenance' | 'retired';
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    purchaseDate?: Date;
    purchaseCost?: number;
    currentValue?: number;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    assignedTo?: string;
    assignedToName?: string;
    location?: string;
  }> = [
    { name: 'DeWalt Circular Saw', category: 'Power Tools', serialNumber: 'DW-CS-001', status: 'checked_out', condition: 'good', purchaseCost: 189, assignedTo: 'demo_emp_001', assignedToName: 'Mike Rodriguez', location: 'Job Site - Kitchen Reno' },
    { name: 'DeWalt Miter Saw 12"', category: 'Power Tools', serialNumber: 'DW-MS-001', status: 'available', condition: 'excellent', purchaseCost: 599 },
    { name: 'Milwaukee Drill/Driver', category: 'Power Tools', serialNumber: 'MIL-DD-001', status: 'checked_out', condition: 'good', purchaseCost: 149, assignedTo: 'demo_emp_003', assignedToName: 'James Wilson', location: 'Job Site - Office Buildout' },
    { name: 'Milwaukee Impact Driver', category: 'Power Tools', serialNumber: 'MIL-ID-001', status: 'available', condition: 'good', purchaseCost: 179 },
    { name: 'Makita Jigsaw', category: 'Power Tools', serialNumber: 'MAK-JS-001', status: 'available', condition: 'fair', purchaseCost: 159 },
    { name: 'Bosch Rotary Hammer', category: 'Power Tools', serialNumber: 'BOS-RH-001', status: 'maintenance', condition: 'fair', purchaseCost: 299 },
    { name: 'Air Compressor 6gal', category: 'Pneumatic', serialNumber: 'AC-6G-001', status: 'available', condition: 'good', purchaseCost: 199 },
    { name: 'Framing Nailer', category: 'Pneumatic', serialNumber: 'FN-001', status: 'checked_out', condition: 'excellent', purchaseCost: 299, assignedTo: 'demo_emp_001', assignedToName: 'Mike Rodriguez' },
    { name: 'Finish Nailer', category: 'Pneumatic', serialNumber: 'FIN-001', status: 'available', condition: 'good', purchaseCost: 249 },
    { name: 'Extension Ladder 28ft', category: 'Ladders', serialNumber: 'LAD-28-001', status: 'checked_out', condition: 'good', purchaseCost: 350, assignedTo: 'demo_emp_005', assignedToName: 'David Brown' },
    { name: 'Step Ladder 8ft', category: 'Ladders', serialNumber: 'LAD-8-001', status: 'available', condition: 'excellent', purchaseCost: 125 },
    { name: 'Scaffolding Set', category: 'Scaffolding', serialNumber: 'SCAF-001', status: 'available', condition: 'good', purchaseCost: 450 },
    { name: 'Laser Level', category: 'Measuring', serialNumber: 'LL-001', status: 'checked_out', condition: 'excellent', purchaseCost: 175, assignedTo: 'demo_emp_003', assignedToName: 'James Wilson' },
    { name: 'Measuring Tape 25ft', category: 'Measuring', status: 'available', condition: 'good', purchaseCost: 25 },
    { name: 'Speed Square', category: 'Measuring', status: 'available', condition: 'excellent', purchaseCost: 15 },
    { name: 'Hammer Drill', category: 'Power Tools', serialNumber: 'HD-001', status: 'available', condition: 'good', purchaseCost: 189 },
    { name: 'Oscillating Multi-Tool', category: 'Power Tools', serialNumber: 'OMT-001', status: 'available', condition: 'excellent', purchaseCost: 159 },
    { name: 'Shop Vac 12gal', category: 'Cleanup', serialNumber: 'SV-12-001', status: 'available', condition: 'good', purchaseCost: 129 },
    { name: 'Tile Saw', category: 'Specialty', serialNumber: 'TS-001', status: 'checked_out', condition: 'good', purchaseCost: 450, assignedTo: 'demo_sub_003', assignedToName: 'Rodriguez Tile Co' },
    { name: 'Generator 3500W', category: 'Power', serialNumber: 'GEN-3500', status: 'available', condition: 'good', purchaseCost: 599 },
  ];

  // Add dates
  const today = new Date();
  return tools.map(tool => ({
    ...tool,
    purchaseDate: new Date(today.getTime() - Math.floor(Math.random() * 365 * 2) * 24 * 60 * 60 * 1000),
    currentValue: tool.purchaseCost ? Math.round(tool.purchaseCost * (0.5 + Math.random() * 0.4)) : undefined,
    lastMaintenanceDate: tool.status === 'maintenance' ? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) : undefined,
    nextMaintenanceDate: new Date(today.getTime() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
  }));
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
    subcontractors: number;
    clients: number;
    projects: number;
    tasks: number;
    dailyLogs: number;
    timeEntries: number;
    expenses: number;
    changeOrders: number;
    rfis: number;
    bids: number;
    punchItems: number;
    payrollConfig: number;
    payrollRuns: number;
    scheduleEvents: number;
    crewAvailability: number;
    timeOffRequests: number;
    invoices: number;
    payments: number;
    weeklyTimesheets: number;
    materials: number;
    purchaseOrders: number;
    tools: number;
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
    subcontractors: 0,
    clients: 0,
    projects: 0,
    tasks: 0,
    dailyLogs: 0,
    timeEntries: 0,
    expenses: 0,
    changeOrders: 0,
    rfis: 0,
    bids: 0,
    punchItems: 0,
    payrollConfig: 0,
    payrollRuns: 0,
    scheduleEvents: 0,
    crewAvailability: 0,
    timeOffRequests: 0,
    invoices: 0,
    payments: 0,
    weeklyTimesheets: 0,
    materials: 0,
    purchaseOrders: 0,
    tools: 0,
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

    // 0b. Delete demo subcontractors (by known IDs)
    progress('Deleting demo subcontractors', 'in_progress', 0, DEMO_USERS.contractors.length);
    for (let i = 0; i < DEMO_USERS.contractors.length; i++) {
      const subRef = doc(db, 'subcontractors', DEMO_USERS.contractors[i].uid);
      const subDoc = await getDoc(subRef);
      if (subDoc.exists()) {
        await deleteDoc(subRef);
        deletedCounts.subcontractors++;
      }
      progress('Deleting demo subcontractors', 'in_progress', i + 1, DEMO_USERS.contractors.length);
    }
    progress('Deleting demo subcontractors', 'completed', deletedCounts.subcontractors);

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

    // 8. Delete RFIs for demo projects
    progress('Deleting demo RFIs', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const rfisQuery = query(
        collection(db, 'rfis'),
        where('projectId', '==', project.id)
      );
      const rfisSnap = await getDocs(rfisQuery);
      for (const rfiDoc of rfisSnap.docs) {
        await deleteDoc(rfiDoc.ref);
        deletedCounts.rfis++;
      }
    }
    progress('Deleting demo RFIs', 'completed', deletedCounts.rfis);

    // 9. Delete bids for demo projects
    progress('Deleting demo bids', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const bidsQuery = query(
        collection(db, 'bids'),
        where('projectId', '==', project.id)
      );
      const bidsSnap = await getDocs(bidsQuery);
      for (const bidDoc of bidsSnap.docs) {
        await deleteDoc(bidDoc.ref);
        deletedCounts.bids++;
      }
    }
    progress('Deleting demo bids', 'completed', deletedCounts.bids);

    // 10. Delete punch list items for demo projects
    progress('Deleting demo punch items', 'in_progress', 0);
    for (const project of DEMO_PROJECTS) {
      const punchQuery = query(
        collection(db, 'punchItems'),
        where('projectId', '==', project.id)
      );
      const punchSnap = await getDocs(punchQuery);
      for (const punchDoc of punchSnap.docs) {
        await deleteDoc(punchDoc.ref);
        deletedCounts.punchItems++;
      }
    }
    progress('Deleting demo punch items', 'completed', deletedCounts.punchItems);

    // 11. Delete payroll config
    progress('Deleting payroll config', 'in_progress', 0);
    const payrollConfigQuery = query(collection(db, 'payrollConfig'), where('orgId', '==', orgId));
    const payrollConfigSnap = await getDocs(payrollConfigQuery);
    for (const configDoc of payrollConfigSnap.docs) {
      await deleteDoc(configDoc.ref);
      deletedCounts.payrollConfig++;
    }
    progress('Deleting payroll config', 'completed', deletedCounts.payrollConfig);

    // 12. Delete payroll runs
    progress('Deleting payroll runs', 'in_progress', 0);
    const payrollRunsQuery = query(collection(db, `organizations/${orgId}/payrollRuns`));
    const payrollRunsSnap = await getDocs(payrollRunsQuery);
    for (const runDoc of payrollRunsSnap.docs) {
      await deleteDoc(runDoc.ref);
      deletedCounts.payrollRuns++;
    }
    progress('Deleting payroll runs', 'completed', deletedCounts.payrollRuns);

    // 13. Delete schedule events
    progress('Deleting schedule events', 'in_progress', 0);
    const scheduleEventsQuery = query(collection(db, `organizations/${orgId}/scheduleEvents`));
    const scheduleEventsSnap = await getDocs(scheduleEventsQuery);
    for (const eventDoc of scheduleEventsSnap.docs) {
      await deleteDoc(eventDoc.ref);
      deletedCounts.scheduleEvents++;
    }
    progress('Deleting schedule events', 'completed', deletedCounts.scheduleEvents);

    // 14. Delete crew availability
    progress('Deleting crew availability', 'in_progress', 0);
    const crewAvailQuery = query(collection(db, `organizations/${orgId}/crewAvailability`));
    const crewAvailSnap = await getDocs(crewAvailQuery);
    for (const availDoc of crewAvailSnap.docs) {
      await deleteDoc(availDoc.ref);
      deletedCounts.crewAvailability++;
    }
    progress('Deleting crew availability', 'completed', deletedCounts.crewAvailability);

    // 15. Delete time off requests
    progress('Deleting time off requests', 'in_progress', 0);
    const timeOffQuery = query(collection(db, `organizations/${orgId}/timeOffRequests`));
    const timeOffSnap = await getDocs(timeOffQuery);
    for (const requestDoc of timeOffSnap.docs) {
      await deleteDoc(requestDoc.ref);
      deletedCounts.timeOffRequests++;
    }
    progress('Deleting time off requests', 'completed', deletedCounts.timeOffRequests);

    // 16. Delete invoices
    progress('Deleting invoices', 'in_progress', 0);
    const invoicesQuery = query(collection(db, `organizations/${orgId}/invoices`));
    const invoicesSnap = await getDocs(invoicesQuery);
    for (const invoiceDoc of invoicesSnap.docs) {
      await deleteDoc(invoiceDoc.ref);
      deletedCounts.invoices++;
    }
    progress('Deleting invoices', 'completed', deletedCounts.invoices);

    // 17. Delete payments
    progress('Deleting payments', 'in_progress', 0);
    const paymentsQuery = query(collection(db, `organizations/${orgId}/payments`));
    const paymentsSnap = await getDocs(paymentsQuery);
    for (const paymentDoc of paymentsSnap.docs) {
      await deleteDoc(paymentDoc.ref);
      deletedCounts.payments++;
    }
    progress('Deleting payments', 'completed', deletedCounts.payments);

    // 18. Delete weekly timesheets
    progress('Deleting weekly timesheets', 'in_progress', 0);
    const timesheetsQuery = query(collection(db, `organizations/${orgId}/weeklyTimesheets`));
    const timesheetsSnap = await getDocs(timesheetsQuery);
    for (const timesheetDoc of timesheetsSnap.docs) {
      await deleteDoc(timesheetDoc.ref);
      deletedCounts.weeklyTimesheets++;
    }
    progress('Deleting weekly timesheets', 'completed', deletedCounts.weeklyTimesheets);

    // 19. Delete materials
    progress('Deleting materials', 'in_progress', 0);
    const materialsQuery = query(collection(db, `organizations/${orgId}/materials`));
    const materialsSnap = await getDocs(materialsQuery);
    for (const materialDoc of materialsSnap.docs) {
      await deleteDoc(materialDoc.ref);
      deletedCounts.materials++;
    }
    progress('Deleting materials', 'completed', deletedCounts.materials);

    // 20. Delete purchase orders
    progress('Deleting purchase orders', 'in_progress', 0);
    const purchaseOrdersQuery = query(collection(db, `organizations/${orgId}/purchaseOrders`));
    const purchaseOrdersSnap = await getDocs(purchaseOrdersQuery);
    for (const poDoc of purchaseOrdersSnap.docs) {
      await deleteDoc(poDoc.ref);
      deletedCounts.purchaseOrders++;
    }
    progress('Deleting purchase orders', 'completed', deletedCounts.purchaseOrders);

    // 21. Delete tools and equipment
    progress('Deleting tools/equipment', 'in_progress', 0);
    const toolsQuery = query(collection(db, `organizations/${orgId}/tools`));
    const toolsSnap = await getDocs(toolsQuery);
    for (const toolDoc of toolsSnap.docs) {
      await deleteDoc(toolDoc.ref);
      deletedCounts.tools++;
    }
    progress('Deleting tools/equipment', 'completed', deletedCounts.tools);

    progress('Cleanup complete', 'completed');

    console.log('');
    console.log('✨ Demo data cleanup complete!');
    console.log('');
    console.log('Deleted:');
    console.log(`   • ${deletedCounts.teamMembers} team members`);
    console.log(`   • ${deletedCounts.subcontractors} subcontractors`);
    console.log(`   • ${deletedCounts.clients} clients`);
    console.log(`   • ${deletedCounts.projects} projects`);
    console.log(`   • ${deletedCounts.tasks} tasks`);
    console.log(`   • ${deletedCounts.dailyLogs} daily logs`);
    console.log(`   • ${deletedCounts.timeEntries} time entries`);
    console.log(`   • ${deletedCounts.expenses} expenses`);
    console.log(`   • ${deletedCounts.changeOrders} change orders`);
    console.log(`   • ${deletedCounts.rfis} RFIs`);
    console.log(`   • ${deletedCounts.bids} subcontractor bids`);
    console.log(`   • ${deletedCounts.punchItems} punch list items`);
    console.log(`   • ${deletedCounts.payrollConfig} payroll config`);
    console.log(`   • ${deletedCounts.payrollRuns} payroll runs`);
    console.log(`   • ${deletedCounts.scheduleEvents} schedule events`);
    console.log(`   • ${deletedCounts.crewAvailability} crew availability records`);
    console.log(`   • ${deletedCounts.timeOffRequests} time off requests`);
    console.log(`   • ${deletedCounts.invoices} invoices`);
    console.log(`   • ${deletedCounts.payments} payments`);
    console.log(`   • ${deletedCounts.weeklyTimesheets} weekly timesheets`);
    console.log(`   • ${deletedCounts.materials} materials`);
    console.log(`   • ${deletedCounts.purchaseOrders} purchase orders`);
    console.log(`   • ${deletedCounts.tools} tools/equipment`);

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

    // 0b. Create Subcontractor documents (in subcontractors collection)
    progress('Creating subcontractors', 'in_progress', 0, DEMO_USERS.contractors.length);
    const today = new Date();
    for (let i = 0; i < DEMO_USERS.contractors.length; i++) {
      const sub = DEMO_USERS.contractors[i];
      // Create insurance expiry 6 months from now for active subs
      const insuranceExpiry = new Date(today);
      insuranceExpiry.setMonth(insuranceExpiry.getMonth() + 6);

      await setDoc(doc(db, 'subcontractors', sub.uid), {
        orgId,
        userId: sub.uid,
        companyName: sub.companyName || sub.displayName,
        contactName: sub.displayName,
        email: sub.email,
        phone: sub.phone,
        trade: sub.trade || sub.specialty || 'General',
        licenseNumber: `LIC-${sub.uid.slice(-6).toUpperCase()}`,
        insuranceExpiry: Timestamp.fromDate(insuranceExpiry),
        address: '123 Contractor Lane, Greensboro, NC 27401',
        notes: `Demo subcontractor specializing in ${sub.trade || sub.specialty}`,
        metrics: {
          projectsCompleted: Math.floor(Math.random() * 15) + 5,
          onTimeRate: 85 + Math.floor(Math.random() * 15),
          avgRating: 4.0 + Math.random() * 1.0,
          totalPaid: Math.floor(Math.random() * 100000) + 25000,
        },
        documents: [],
        isActive: sub.isActive !== false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      progress('Creating subcontractors', 'in_progress', i + 1, DEMO_USERS.contractors.length);
    }
    progress('Creating subcontractors', 'completed', DEMO_USERS.contractors.length);

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

    // 4. Create Time Entries (enhanced with task tracking for payroll)
    progress('Creating time entries', 'in_progress', 0);
    let totalEntries = 0;

    // First get task IDs that were created
    const projectTasks: Map<string, Array<{ id: string; title: string; assigneeId?: string; assigneeName?: string }>> = new Map();
    for (const project of DEMO_PROJECTS.filter(p => p.status === 'active')) {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('projectId', '==', project.id)
      );
      const tasksSnap = await getDocs(tasksQuery);
      const tasks = tasksSnap.docs.map(d => ({
        id: d.id,
        title: d.data().title as string,
        assigneeId: d.data().assigneeId as string | undefined,
        assigneeName: d.data().assigneeName as string | undefined,
      }));
      projectTasks.set(project.id, tasks);
    }

    // Generate enhanced time entries with task tracking
    for (const project of DEMO_PROJECTS.filter(p => p.status === 'active')) {
      const tasks = projectTasks.get(project.id) || [];
      const entries = generateEnhancedTimeEntries(project.id, tasks);
      for (const entry of entries) {
        // Build entry data, filtering undefined values
        const entryData: Record<string, unknown> = {
          userId: entry.userId,
          userName: entry.userName,
          userRole: entry.userRole,
          projectId: entry.projectId,
          projectName: entry.projectName,
          clockIn: Timestamp.fromDate(entry.clockIn),
          clockOut: entry.clockOut ? Timestamp.fromDate(entry.clockOut) : null,
          breakMinutes: entry.breakMinutes,
          totalHours: entry.totalHours,
          regularHours: entry.regularHours,
          overtimeHours: entry.overtimeHours,
          status: entry.status,
          type: entry.type,
          hourlyRate: entry.hourlyRate,
          breaks: entry.breaks.map(b => ({
            ...b,
            startTime: Timestamp.fromDate(b.startTime),
            endTime: Timestamp.fromDate(b.endTime),
          })),
          orgId,
          createdAt: Timestamp.now(),
        };

        // Add optional fields only if defined
        if (entry.taskId) entryData.taskId = entry.taskId;
        if (entry.taskName) entryData.taskName = entry.taskName;
        if (entry.notes) entryData.notes = entry.notes;

        await addDoc(collection(db, `organizations/${orgId}/timeEntries`), entryData);
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

    // 7. Create RFIs
    progress('Creating RFIs', 'in_progress', 0);
    let totalRFIs = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status !== 'lead')) {
      const rfis = generateRFIs(project.id);
      for (const rfi of rfis) {
        // Filter out undefined values for Firestore
        const rfiData: Record<string, unknown> = {
          ...rfi,
          projectId: project.id,
          projectName: project.name,
          orgId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: DEMO_USERS.employees[0].uid,
          createdByName: DEMO_USERS.employees[0].displayName,
        };
        // Remove undefined values
        Object.keys(rfiData).forEach(key => {
          if (rfiData[key] === undefined) delete rfiData[key];
        });
        await addDoc(collection(db, 'rfis'), rfiData);
        totalRFIs++;
      }
      progress('Creating RFIs', 'in_progress', totalRFIs);
    }
    progress('Creating RFIs', 'completed', totalRFIs);

    // 8. Create Subcontractor Bids
    progress('Creating subcontractor bids', 'in_progress', 0);
    let totalBids = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status !== 'lead')) {
      const bids = generateSubcontractorBids(project.id);
      for (const bid of bids) {
        // Filter out undefined values for Firestore
        const bidData: Record<string, unknown> = {
          ...bid,
          projectId: project.id,
          projectName: project.name,
          orgId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        // Remove undefined values
        Object.keys(bidData).forEach(key => {
          if (bidData[key] === undefined) delete bidData[key];
        });
        await addDoc(collection(db, 'bids'), bidData);
        totalBids++;
      }
      progress('Creating subcontractor bids', 'in_progress', totalBids);
    }
    progress('Creating subcontractor bids', 'completed', totalBids);

    // 9. Create Punch List Items
    progress('Creating punch list items', 'in_progress', 0);
    let totalPunchItems = 0;
    for (const project of DEMO_PROJECTS.filter(p => p.status === 'active' || p.status === 'completed')) {
      const punchItems = generatePunchListItems(project.id);
      for (const item of punchItems) {
        // Filter out undefined values for Firestore
        const itemData: Record<string, unknown> = {
          ...item,
          projectId: project.id,
          projectName: project.name,
          orgId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: DEMO_USERS.employees[3].uid,
          createdByName: DEMO_USERS.employees[3].displayName,
        };
        // Remove undefined values
        Object.keys(itemData).forEach(key => {
          if (itemData[key] === undefined) delete itemData[key];
        });
        await addDoc(collection(db, 'punchItems'), itemData);
        totalPunchItems++;
      }
      progress('Creating punch list items', 'in_progress', totalPunchItems);
    }
    progress('Creating punch list items', 'completed', totalPunchItems);

    // 10. Create Payroll Settings
    progress('Creating payroll settings', 'in_progress', 0);
    const payrollSettings = generatePayrollSettings(orgId);
    await setDoc(doc(db, 'payrollConfig', `payroll_${orgId}`), {
      ...payrollSettings,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    progress('Creating payroll settings', 'completed', 1);

    // 11. Create Payroll Runs
    progress('Creating payroll runs', 'in_progress', 0);
    const payrollRuns = generatePayrollRuns(orgId);
    let totalPayrollRuns = 0;
    for (const run of payrollRuns) {
      const runData: Record<string, unknown> = {
        ...run,
        orgId,
        // Convert payPeriod dates to Timestamps
        payPeriod: {
          ...run.payPeriod,
          startDate: Timestamp.fromDate(run.payPeriod.startDate),
          endDate: Timestamp.fromDate(run.payPeriod.endDate),
          payDate: Timestamp.fromDate(run.payPeriod.payDate),
        },
        approvedAt: run.approvedAt ? Timestamp.fromDate(run.approvedAt) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      // Remove undefined values
      Object.keys(runData).forEach(key => {
        if (runData[key] === undefined) delete runData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/payrollRuns`), runData);
      totalPayrollRuns++;
      progress('Creating payroll runs', 'in_progress', totalPayrollRuns);
    }
    progress('Creating payroll runs', 'completed', totalPayrollRuns);

    // 12. Create Schedule Events
    progress('Creating schedule events', 'in_progress', 0);
    const scheduleEvents = generateScheduleEvents();
    let totalScheduleEvents = 0;
    for (const event of scheduleEvents) {
      const eventData: Record<string, unknown> = {
        ...event,
        orgId,
        startDate: Timestamp.fromDate(event.startDate),
        endDate: Timestamp.fromDate(event.endDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined) delete eventData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/scheduleEvents`), eventData);
      totalScheduleEvents++;
    }
    progress('Creating schedule events', 'completed', totalScheduleEvents);

    // 13. Create Crew Availability
    progress('Creating crew availability', 'in_progress', 0);
    const crewAvailability = generateCrewAvailability();
    let totalCrewAvailability = 0;
    for (const avail of crewAvailability) {
      const availData: Record<string, unknown> = {
        ...avail,
        orgId,
        date: Timestamp.fromDate(avail.date),
        createdAt: Timestamp.now(),
      };
      Object.keys(availData).forEach(key => {
        if (availData[key] === undefined) delete availData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/crewAvailability`), availData);
      totalCrewAvailability++;
    }
    progress('Creating crew availability', 'completed', totalCrewAvailability);

    // 14. Create Time Off Requests
    progress('Creating time off requests', 'in_progress', 0);
    const timeOffRequests = generateTimeOffRequests();
    let totalTimeOffRequests = 0;
    for (const request of timeOffRequests) {
      const requestData: Record<string, unknown> = {
        ...request,
        orgId,
        startDate: Timestamp.fromDate(request.startDate),
        endDate: Timestamp.fromDate(request.endDate),
        approvedAt: request.approvedAt ? Timestamp.fromDate(request.approvedAt) : null,
        createdAt: Timestamp.now(),
      };
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined) delete requestData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/timeOffRequests`), requestData);
      totalTimeOffRequests++;
    }
    progress('Creating time off requests', 'completed', totalTimeOffRequests);

    // 15. Create Invoices
    progress('Creating invoices', 'in_progress', 0);
    const invoices = generateInvoices();
    const createdInvoices: Array<{ id: string; invoiceNumber: string; status: string; total: number; paidDate?: Date }> = [];
    let totalInvoices = 0;
    for (const invoice of invoices) {
      const invoiceData: Record<string, unknown> = {
        ...invoice,
        orgId,
        issueDate: Timestamp.fromDate(invoice.issueDate),
        dueDate: Timestamp.fromDate(invoice.dueDate),
        paidDate: invoice.paidDate ? Timestamp.fromDate(invoice.paidDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      Object.keys(invoiceData).forEach(key => {
        if (invoiceData[key] === undefined) delete invoiceData[key];
      });
      const docRef = await addDoc(collection(db, `organizations/${orgId}/invoices`), invoiceData);
      createdInvoices.push({
        id: docRef.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: invoice.total,
        paidDate: invoice.paidDate,
      });
      totalInvoices++;
    }
    progress('Creating invoices', 'completed', totalInvoices);

    // 16. Create Payments (link to created invoices)
    progress('Creating payments', 'in_progress', 0);
    const payments = generatePayments(invoices);
    let totalPayments = 0;
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      // Find the matching created invoice to get the actual document ID
      const matchingInvoice = createdInvoices.find(inv => inv.invoiceNumber === payment.invoiceNumber);
      const paymentData: Record<string, unknown> = {
        ...payment,
        orgId,
        invoiceId: matchingInvoice?.id || payment.invoiceNumber, // Use actual doc ID if available
        paymentDate: Timestamp.fromDate(payment.paymentDate),
        createdAt: Timestamp.now(),
      };
      Object.keys(paymentData).forEach(key => {
        if (paymentData[key] === undefined) delete paymentData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/payments`), paymentData);
      totalPayments++;
    }
    progress('Creating payments', 'completed', totalPayments);

    // 17. Create Weekly Timesheets
    progress('Creating weekly timesheets', 'in_progress', 0);
    const weeklyTimesheets = generateWeeklyTimesheets();
    let totalWeeklyTimesheets = 0;
    for (const timesheet of weeklyTimesheets) {
      const timesheetData: Record<string, unknown> = {
        ...timesheet,
        orgId,
        weekStartDate: Timestamp.fromDate(timesheet.weekStartDate),
        weekEndDate: Timestamp.fromDate(timesheet.weekEndDate),
        submittedAt: timesheet.submittedAt ? Timestamp.fromDate(timesheet.submittedAt) : null,
        approvedAt: timesheet.approvedAt ? Timestamp.fromDate(timesheet.approvedAt) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      Object.keys(timesheetData).forEach(key => {
        if (timesheetData[key] === undefined) delete timesheetData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/weeklyTimesheets`), timesheetData);
      totalWeeklyTimesheets++;
    }
    progress('Creating weekly timesheets', 'completed', totalWeeklyTimesheets);

    // 18. Create Materials
    progress('Creating materials', 'in_progress', 0);
    const materials = generateMaterials();
    const createdMaterials: Array<{ id: string; name: string; sku?: string }> = [];
    let totalMaterials = 0;
    for (const material of materials) {
      const materialData: Record<string, unknown> = {
        ...material,
        orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      Object.keys(materialData).forEach(key => {
        if (materialData[key] === undefined) delete materialData[key];
      });
      const docRef = await addDoc(collection(db, `organizations/${orgId}/materials`), materialData);
      createdMaterials.push({ id: docRef.id, name: material.name, sku: material.sku });
      totalMaterials++;
    }
    progress('Creating materials', 'completed', totalMaterials);

    // 19. Create Purchase Orders
    progress('Creating purchase orders', 'in_progress', 0);
    const purchaseOrders = generatePurchaseOrders(materials);
    let totalPurchaseOrders = 0;
    for (const po of purchaseOrders) {
      const poData: Record<string, unknown> = {
        ...po,
        orgId,
        orderDate: Timestamp.fromDate(po.orderDate),
        expectedDate: Timestamp.fromDate(po.expectedDate),
        receivedDate: po.receivedDate ? Timestamp.fromDate(po.receivedDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      Object.keys(poData).forEach(key => {
        if (poData[key] === undefined) delete poData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/purchaseOrders`), poData);
      totalPurchaseOrders++;
    }
    progress('Creating purchase orders', 'completed', totalPurchaseOrders);

    // 20. Create Tools and Equipment
    progress('Creating tools/equipment', 'in_progress', 0);
    const tools = generateToolsAndEquipment();
    let totalTools = 0;
    for (const tool of tools) {
      const toolData: Record<string, unknown> = {
        ...tool,
        orgId,
        purchaseDate: tool.purchaseDate ? Timestamp.fromDate(tool.purchaseDate) : null,
        lastMaintenanceDate: tool.lastMaintenanceDate ? Timestamp.fromDate(tool.lastMaintenanceDate) : null,
        nextMaintenanceDate: tool.nextMaintenanceDate ? Timestamp.fromDate(tool.nextMaintenanceDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      Object.keys(toolData).forEach(key => {
        if (toolData[key] === undefined) delete toolData[key];
      });
      await addDoc(collection(db, `organizations/${orgId}/tools`), toolData);
      totalTools++;
    }
    progress('Creating tools/equipment', 'completed', totalTools);

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
    console.log(`   • ${totalRFIs} RFIs`);
    console.log(`   • ${totalBids} subcontractor bids`);
    console.log(`   • ${totalPunchItems} punch list items`);
    console.log(`   • 1 payroll config`);
    console.log(`   • ${totalPayrollRuns} payroll runs`);
    console.log(`   • ${totalScheduleEvents} schedule events`);
    console.log(`   • ${totalCrewAvailability} crew availability records`);
    console.log(`   • ${totalTimeOffRequests} time off requests`);
    console.log(`   • ${totalInvoices} invoices`);
    console.log(`   • ${totalPayments} payments`);
    console.log(`   • ${totalWeeklyTimesheets} weekly timesheets`);
    console.log(`   • ${totalMaterials} materials`);
    console.log(`   • ${totalPurchaseOrders} purchase orders`);
    console.log(`   • ${totalTools} tools/equipment`);

    return {
      success: true,
      teamMembers: totalUsers,
      clients: DEMO_CLIENTS.length,
      projects: DEMO_PROJECTS.length,
      logs: totalLogs,
      timeEntries: totalEntries,
      expenses: totalExpenses,
      changeOrders: totalCOs,
      rfis: totalRFIs,
      bids: totalBids,
      punchItems: totalPunchItems,
      payrollConfig: 1,
      payrollRuns: totalPayrollRuns,
      scheduleEvents: totalScheduleEvents,
      crewAvailability: totalCrewAvailability,
      timeOffRequests: totalTimeOffRequests,
      invoices: totalInvoices,
      payments: totalPayments,
      weeklyTimesheets: totalWeeklyTimesheets,
      materials: totalMaterials,
      purchaseOrders: totalPurchaseOrders,
      tools: totalTools,
    };
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    throw error;
  }
}

export default seedDemoData;
