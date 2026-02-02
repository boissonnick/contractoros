/**
 * Seed Daily Logs (Activities) for Demo Data
 *
 * Generates 200+ daily logs across all active and completed projects.
 * Each log includes realistic weather, work performed, workers on site,
 * hours worked, delays, and issues.
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DENVER_WEATHER,
  WORK_PERFORMED_TEMPLATES,
  SAFETY_OBSERVATIONS,
  DELAY_REASONS,
  MESSAGE_TOPICS,
} from './data/message-templates';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  randomItem,
  randomInt as randomIntUtil,
  logSection,
  logProgress,
  logSuccess,
  generateId,
  executeBatchWrites,
} from './utils';

// Demo projects reference (matching seed-projects.ts)
export const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', clientId: 'demo-client-smith', status: 'completed', startDate: monthsAgo(9), endDate: monthsAgo(8), phases: ['Demo & Prep', 'Rough-In', 'Cabinets & Countertops', 'Tile & Flooring', 'Paint & Finish'] },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Installation', clientId: 'demo-client-wilson', status: 'completed', startDate: monthsAgo(6), endDate: daysAgo(174), phases: ['Layout & Posts', 'Rails & Pickets', 'Gate & Finish'] },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', clientId: 'demo-client-main-st-retail', status: 'completed', startDate: monthsAgo(7), endDate: monthsAgo(4), phases: ['Demo', 'Storefront Install', 'MEP Rough-In', 'Drywall & Paint', 'Flooring', 'Millwork & Fixtures', 'Final Punch'] },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', clientId: 'demo-client-garcia', status: 'completed', startDate: monthsAgo(3), endDate: daysAgo(58), phases: ['Demo', 'Plumbing & Electrical', 'Tile Work', 'Vanity & Fixtures', 'Final Details'] },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', clientId: 'demo-client-downtown-cafe', status: 'completed', startDate: monthsAgo(2.5), endDate: daysAgo(28), phases: ['Demo & Site Prep', 'Framing & MEP', 'Drywall & Ceiling', 'Flooring & Paint', 'Final & Inspection'] },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', clientId: 'demo-client-thompson', status: 'active', startDate: daysAgo(14), endDate: null, phases: ['Permits & Footings', 'Framing', 'Decking', 'Railing & Stairs', 'Lighting & Punch'] },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200', clientId: 'demo-client-office-park', status: 'active', startDate: monthsAgo(1), endDate: null, phases: ['Demo', 'Framing', 'MEP Rough-In', 'Drywall', 'Flooring & Paint', 'Final Trim'] },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish', clientId: 'demo-client-garcia', status: 'active', startDate: daysAgo(21), endDate: null, phases: ['Framing & Egress', 'Rough MEP', 'Insulation & Drywall', 'Flooring', 'Bathroom Tile', 'Paint & Trim'] },
  { id: 'demo-proj-brown-kitchen', name: 'Brown Kitchen Update', clientId: 'demo-client-brown', status: 'active', startDate: daysAgo(7), endDate: null, phases: ['Prep & Demo', 'Cabinet Refacing', 'Countertops', 'Backsplash & Floor', 'Final Details'] },
  { id: 'demo-proj-wilson-pool', name: 'Wilson Pool House', clientId: 'demo-client-wilson', status: 'on_hold', startDate: daysAgo(45), endDate: null, phases: ['Foundation', 'Framing', 'Roofing & Exterior', 'MEP', 'Interior Finish'] },
];

// Demo data prefix for IDs
export const DEMO_DATA_PREFIX = 'demo-';

// Types matching the DailyLogEntry interface
export type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'heavy_rain' | 'snow' | 'thunderstorm';
export type DailyLogCategory = 'general' | 'progress' | 'issue' | 'safety' | 'weather' | 'delivery' | 'inspection' | 'client_interaction' | 'subcontractor' | 'equipment';

export interface DailyLogSeed {
  id: string;
  orgId: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  date: string; // ISO date string (YYYY-MM-DD)
  category: DailyLogCategory;
  title: string;
  description: string;
  photos: Array<{ id: string; url: string; caption?: string; uploadedAt: Date }>;
  weather?: {
    condition: WeatherCondition;
    temperatureHigh?: number;
    temperatureLow?: number;
    precipitation?: number;
    notes?: string;
  };
  crewCount?: number;
  crewMembers?: string[];
  hoursWorked?: number;
  workPerformed?: string[];
  safetyIncidents?: number;
  safetyNotes?: string;
  visitors?: Array<{
    name: string;
    company?: string;
    purpose: string;
    arrivalTime?: string;
    departureTime?: string;
  }>;
  deliveries?: Array<{
    supplier: string;
    items: string;
    quantity?: string;
    receivedBy?: string;
  }>;
  issues?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolved: boolean;
    resolution?: string;
  }>;
  delays?: Array<{
    reason: string;
    duration: string;
    impact: string;
  }>;
  tags?: string[];
  isPrivate?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Utility functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getSeasonFromDate(date: Date): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getWorkingDays(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWeekday(current)) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// Get all employees as potential crew members
const ALL_CREW = [
  DEMO_USERS.owner,
  DEMO_USERS.pm,
  DEMO_USERS.foreman,
  DEMO_USERS.fieldWorker1,
  DEMO_USERS.fieldWorker2,
  DEMO_USERS.fieldWorker3,
];

const CREW_NAMES = ALL_CREW.map(u => u.displayName);

// Generate weather for a date
function generateWeather(date: Date): DailyLogSeed['weather'] {
  const season = getSeasonFromDate(date);
  const weatherData = randomElement(DENVER_WEATHER[season]);

  // Add some variation
  const tempVariation = randomInt(-5, 5);

  return {
    condition: weatherData.condition as WeatherCondition,
    temperatureHigh: weatherData.tempHigh + tempVariation,
    temperatureLow: weatherData.tempLow + tempVariation,
    precipitation: weatherData.precipitation,
    notes: weatherData.precipitation > 30
      ? `${weatherData.condition === 'snow' ? 'Snow' : 'Rain'} expected, indoor work prioritized`
      : undefined,
  };
}

// Generate work performed based on phase
function generateWorkPerformed(phaseName: string, project: typeof DEMO_PROJECTS[0]): string[] {
  const phase = phaseName.toLowerCase();
  let templates: string[] = [];

  if (phase.includes('demo')) {
    templates = WORK_PERFORMED_TEMPLATES.demo;
  } else if (phase.includes('rough') || phase.includes('framing')) {
    templates = WORK_PERFORMED_TEMPLATES.roughIn;
  } else if (phase.includes('finish') || phase.includes('paint') || phase.includes('drywall')) {
    templates = WORK_PERFORMED_TEMPLATES.finishes;
  } else if (phase.includes('punch') || phase.includes('complete')) {
    templates = WORK_PERFORMED_TEMPLATES.punchList;
  } else {
    templates = WORK_PERFORMED_TEMPLATES.finishes;
  }

  const count = randomInt(2, 5);
  const selected = randomElements(templates, count);

  // Replace placeholders
  const areas = MESSAGE_TOPICS.areas;
  const materials = MESSAGE_TOPICS.materials;

  return selected.map(template => {
    return template
      .replace('{item}', randomElement(materials))
      .replace('{area}', randomElement(areas))
      .replace('{material}', randomElement(materials))
      .replace('{fixture}', randomElement(['sink', 'toilet', 'shower', 'faucet']))
      .replace('{purpose}', randomElement(['closet', 'bathroom', 'storage', 'office']))
      .replace('{surface}', randomElement(['walls', 'ceiling', 'trim', 'cabinets']))
      .replace('{color}', randomElement(['white', 'gray', 'beige', 'blue']))
      .replace('{issue}', randomElement(['alignment', 'gap', 'scratch', 'mark']));
  });
}

// Generate a title based on category
function generateTitle(category: DailyLogCategory, phase: string): string {
  const titles: Record<DailyLogCategory, string[]> = {
    general: [
      `${phase} phase - daily progress`,
      `Site work - ${phase}`,
      `Daily activity report`,
      `${phase} update`,
    ],
    progress: [
      `${phase} progress update`,
      `Great progress on ${phase}`,
      `${phase} milestone reached`,
      `Significant progress today`,
    ],
    issue: [
      'Issue discovered during work',
      'Challenge encountered',
      'Problem requiring attention',
      'Site condition issue',
    ],
    safety: [
      'Safety inspection completed',
      'Safety meeting held',
      'Safety protocols reviewed',
      'Safety observation report',
    ],
    weather: [
      'Weather impact on work',
      'Weather delay',
      'Weather conditions update',
      'Weather affecting schedule',
    ],
    delivery: [
      'Materials delivered',
      'Delivery received',
      'Supply delivery',
      'Equipment delivery',
    ],
    inspection: [
      'Inspection completed',
      'Inspector on site',
      'Passed inspection',
      'Inspection scheduled',
    ],
    client_interaction: [
      'Client walkthrough',
      'Client meeting',
      'Client approval received',
      'Design discussion with client',
    ],
    subcontractor: [
      'Subcontractor work',
      'Trade partner on site',
      'Subcontractor progress',
      'Specialty work completed',
    ],
    equipment: [
      'Equipment delivery',
      'Tool maintenance',
      'Equipment setup',
      'Rental equipment received',
    ],
  };

  return randomElement(titles[category] || titles.general);
}

// Generate description based on category and work
function generateDescription(
  category: DailyLogCategory,
  workPerformed: string[],
  phase: string,
  weather?: DailyLogSeed['weather']
): string {
  const workSummary = workPerformed.slice(0, 2).join('. ');

  const descriptions: Record<DailyLogCategory, string[]> = {
    general: [
      `Standard work day during ${phase} phase. ${workSummary}.`,
      `Productive day on site. Team made good progress on ${phase} work.`,
      `Work continued as planned. ${workSummary}.`,
    ],
    progress: [
      `Excellent progress today! ${workSummary}. Team exceeded expectations.`,
      `Major milestone achieved in ${phase} phase. ${workSummary}.`,
      `Strong progress - ${workSummary}. On track for schedule.`,
    ],
    issue: [
      `Encountered an issue during ${phase} work that required attention. Team addressed it promptly.`,
      `Found unexpected condition that needed resolution. Impact was minimal due to quick response.`,
      `Challenge discovered that required modification to approach. Solution implemented.`,
    ],
    safety: [
      `Conducted safety review with crew. All protocols being followed. ${workSummary}.`,
      `Safety inspection completed - no issues found. Team reminded of PPE requirements.`,
      `Held safety meeting at start of day. Discussed ${phase} specific hazards.`,
    ],
    weather: [
      `Weather impacted outdoor work today. ${weather?.notes || 'Focused on interior tasks.'}`,
      `Adjusted schedule due to ${weather?.condition?.replace('_', ' ')} conditions.`,
      `Weather delay - rescheduled outdoor activities. Completed interior prep work.`,
    ],
    delivery: [
      `Received scheduled material delivery. Inspected and staged for installation.`,
      `Major delivery arrived on schedule. ${workSummary}.`,
      `Materials received and verified against order. Ready for installation.`,
    ],
    inspection: [
      `Inspector on site for ${phase} inspection. Passed with no issues.`,
      `Completed required inspection. All work approved as compliant.`,
      `Inspection completed successfully. Proceeding to next phase.`,
    ],
    client_interaction: [
      `Met with client to review ${phase} progress. Client pleased with work quality.`,
      `Client walkthrough conducted. Discussed upcoming selections and timeline.`,
      `Design decisions finalized with client. ${workSummary}.`,
    ],
    subcontractor: [
      `Trade partner on site for specialized work. ${workSummary}.`,
      `Subcontractor completed their portion of ${phase} work.`,
      `Coordinated with specialty contractor. Work progressing as planned.`,
    ],
    equipment: [
      `Equipment delivered and set up for ${phase} work.`,
      `Tool maintenance and inventory completed.`,
      `Rental equipment received for upcoming work.`,
    ],
  };

  return randomElement(descriptions[category] || descriptions.general);
}

// Generate visitors for inspection/client interaction logs
function generateVisitors(category: DailyLogCategory): DailyLogSeed['visitors'] {
  if (category === 'inspection') {
    return [{
      name: randomElement(['John Smith', 'Mike Johnson', 'David Lee', 'Chris Brown']),
      company: 'City Building Department',
      purpose: randomElement(['Electrical inspection', 'Plumbing inspection', 'Framing inspection', 'Final inspection']),
      arrivalTime: `${randomInt(8, 11)}:${randomInt(0, 5)}0 AM`,
      departureTime: `${randomInt(9, 12)}:${randomInt(0, 5)}0 ${randomInt(9, 11) >= 10 ? 'AM' : 'PM'}`,
    }];
  }

  if (category === 'client_interaction') {
    return [{
      name: 'Client',
      purpose: randomElement(['Progress review', 'Design decisions', 'Walkthrough', 'Final review']),
      arrivalTime: `${randomInt(10, 15)}:${randomInt(0, 5)}0 ${randomInt(10, 12) >= 12 ? 'PM' : 'AM'}`,
    }];
  }

  return undefined;
}

// Generate deliveries for delivery logs
function generateDeliveries(): DailyLogSeed['deliveries'] {
  const suppliers = ['ABC Supply', 'Home Depot Pro', 'Ferguson', 'BuildPro', 'Local Lumber', 'Tile Warehouse'];
  const items = MESSAGE_TOPICS.materials;

  return [{
    supplier: randomElement(suppliers),
    items: randomElements(items, randomInt(1, 3)).join(', '),
    quantity: `${randomInt(1, 20)} ${randomElement(['units', 'boxes', 'pallets', 'pieces'])}`,
    receivedBy: randomElement(CREW_NAMES),
  }];
}

// Generate issues for issue logs
function generateIssues(): DailyLogSeed['issues'] {
  const issueDescriptions = [
    'Minor alignment issue discovered',
    'Material damage found in delivery',
    'Unexpected site condition',
    'Coordination conflict with other trade',
    'Design clarification needed',
    'Code compliance question',
  ];

  return [{
    description: randomElement(issueDescriptions),
    severity: randomElement(['low', 'medium', 'high']),
    resolved: Math.random() > 0.3,
    resolution: Math.random() > 0.3 ? 'Issue addressed and work continued' : undefined,
  }];
}

// Generate delays for certain logs
function generateDelays(): DailyLogSeed['delays'] {
  if (Math.random() > 0.15) return undefined; // 15% chance of delay

  return [{
    reason: randomElement(DELAY_REASONS),
    duration: `${randomInt(1, 4)} hours`,
    impact: randomElement(['Minimal - recovered time', 'Schedule adjusted', 'No overall impact', 'May affect completion date']),
  }];
}

// Main function to generate daily logs
export function generateDailyLogs(orgId: string): DailyLogSeed[] {
  const logs: DailyLogSeed[] = [];
  let logIdCounter = 1;

  // Filter to active and completed projects
  const projectsWithLogs = DEMO_PROJECTS.filter(p =>
    p.status === 'active' || p.status === 'completed' || p.status === 'on_hold'
  );

  for (const project of projectsWithLogs) {
    // Determine date range based on project
    const startDate = project.startDate
      ? new Date(project.startDate)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago default

    const endDate = project.status === 'completed' && project.endDate
      ? new Date(project.endDate)
      : new Date(); // Today for active projects

    // Get working days for the project
    const workingDays = getWorkingDays(startDate, endDate);

    // Generate logs for each working day (may skip some days randomly)
    for (const date of workingDays) {
      // 85% chance of having a log for any given work day
      if (Math.random() > 0.85) continue;

      // Determine current phase based on date progress
      const progressPercent = (date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
      const phases = project.phases || [];
      const phaseIndex = Math.min(Math.floor(progressPercent * phases.length), phases.length - 1);
      const currentPhase = phases[phaseIndex] || 'Construction';

      // Determine category (weighted random)
      const categoryWeights: [DailyLogCategory, number][] = [
        ['progress', 40],
        ['general', 20],
        ['delivery', 10],
        ['inspection', 8],
        ['safety', 7],
        ['issue', 5],
        ['client_interaction', 4],
        ['subcontractor', 4],
        ['weather', 2],
      ];

      let category: DailyLogCategory = 'general';
      const totalWeight = categoryWeights.reduce((sum, [_, w]) => sum + w, 0);
      let random = Math.random() * totalWeight;

      for (const [cat, weight] of categoryWeights) {
        random -= weight;
        if (random <= 0) {
          category = cat;
          break;
        }
      }

      // Select a random crew member as the author
      const author = randomElement(ALL_CREW);
      const crewOnSite = randomElements(CREW_NAMES, randomInt(2, 5));
      const hoursWorked = randomInt(6, 10);

      // Generate weather
      const weather = generateWeather(date);

      // If bad weather, adjust category
      if (weather && weather.precipitation && weather.precipitation > 40 && Math.random() > 0.5) {
        category = 'weather';
      }

      // Generate work performed
      const workPerformed = generateWorkPerformed(currentPhase, project);

      // Create the log entry
      const log: DailyLogSeed = {
        id: `${DEMO_DATA_PREFIX}log_${String(logIdCounter++).padStart(4, '0')}`,
        orgId,
        projectId: project.id,
        projectName: project.name,
        userId: author.uid,
        userName: author.displayName,
        date: formatDate(date),
        category,
        title: generateTitle(category, currentPhase),
        description: generateDescription(category, workPerformed, currentPhase, weather),
        photos: [], // Photos will be linked separately
        weather,
        crewCount: crewOnSite.length,
        crewMembers: crewOnSite,
        hoursWorked,
        workPerformed,
        safetyIncidents: 0,
        safetyNotes: category === 'safety' || Math.random() > 0.7
          ? randomElement(SAFETY_OBSERVATIONS)
          : undefined,
        visitors: generateVisitors(category),
        deliveries: category === 'delivery' ? generateDeliveries() : undefined,
        issues: category === 'issue' ? generateIssues() : undefined,
        delays: generateDelays(),
        tags: [currentPhase.toLowerCase(), category],
        isPrivate: false,
        createdAt: date,
        updatedAt: date,
      };

      logs.push(log);
    }
  }

  // Sort by date descending (most recent first)
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log(`Generated ${logs.length} daily logs across ${projectsWithLogs.length} projects`);

  return logs;
}

// Export for seeding
// DEMO_DATA_PREFIX is exported above with DEMO_PROJECTS

// Conversion function for Firestore
export function convertToFirestore(log: DailyLogSeed): Record<string, unknown> {
  return {
    ...log,
    createdAt: Timestamp.fromDate(log.createdAt),
    updatedAt: log.updatedAt ? Timestamp.fromDate(log.updatedAt) : Timestamp.now(),
    photos: log.photos.map(p => ({
      ...p,
      uploadedAt: Timestamp.fromDate(p.uploadedAt),
    })),
  };
}
