/**
 * Seed Daily Logs
 * Creates daily log entries for demo projects
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  generateId,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

const db = getDb();

// Demo projects - only active ones have recent logs
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', active: false },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', active: false },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', active: false },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', active: true },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200', active: true },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish', active: true },
];

// Daily log categories
type DailyLogCategory = 'general' | 'progress' | 'issue' | 'safety' | 'weather' | 'delivery' | 'inspection' | 'client_interaction' | 'subcontractor' | 'equipment';

// Weather conditions
type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy';

// Log entry templates by category
const LOG_TEMPLATES: Record<DailyLogCategory, { title: string; description: string }[]> = {
  general: [
    { title: 'Daily Site Setup', description: 'Crew arrived on time. Site secured and tools staged.' },
    { title: 'End of Day Summary', description: 'All tasks completed as planned. Site cleaned and secured.' },
    { title: 'Morning Briefing', description: 'Reviewed daily objectives with crew. Safety moment discussed.' },
  ],
  progress: [
    { title: 'Framing Progress', description: 'Completed framing of interior walls. On schedule.' },
    { title: 'Electrical Rough-In', description: 'Rough electrical 75% complete. Wire pulled to all boxes.' },
    { title: 'Drywall Installation', description: 'Hung drywall in main living areas. Ready for taping tomorrow.' },
    { title: 'Flooring Installation', description: 'LVP flooring installed in bedrooms. Moving to hallway tomorrow.' },
    { title: 'Plumbing Progress', description: 'Supply lines installed. Drain lines 50% complete.' },
  ],
  issue: [
    { title: 'Material Shortage', description: 'Running low on drywall screws. Order placed for delivery tomorrow.' },
    { title: 'Weather Delay', description: 'Rain delay - unable to pour concrete. Rescheduled to tomorrow.' },
    { title: 'Code Clarification Needed', description: 'Need clarification on egress window requirements. RFI submitted.' },
    { title: 'Schedule Conflict', description: 'HVAC sub delayed by 1 day. Adjusting schedule accordingly.' },
  ],
  safety: [
    { title: 'Safety Observation', description: 'All PPE being worn. No safety concerns today.' },
    { title: 'Near Miss Report', description: 'Worker nearly tripped on extension cord. Cord management improved.' },
    { title: 'Safety Meeting', description: 'Weekly toolbox talk on ladder safety conducted with crew.' },
  ],
  weather: [
    { title: 'Weather Update', description: 'Morning fog cleared by 9am. Full day of work completed.' },
    { title: 'Heat Advisory', description: 'Implemented heat breaks every hour. Extra water provided.' },
    { title: 'Storm Warning', description: 'Secured site early due to incoming storm. No damage reported.' },
  ],
  delivery: [
    { title: 'Material Delivery', description: 'Lumber delivery received. Materials staged and counted.' },
    { title: 'Appliance Delivery', description: 'Kitchen appliances delivered. Stored in garage per plan.' },
    { title: 'Cabinet Delivery', description: 'Custom cabinets delivered. Minor damage to one door - replacement ordered.' },
  ],
  inspection: [
    { title: 'Inspection Passed', description: 'Rough electrical inspection passed with no corrections.' },
    { title: 'Inspection Scheduled', description: 'Framing inspection scheduled for tomorrow 10am.' },
    { title: 'Inspection Notes', description: 'Inspector noted minor corrections needed. Will address today.' },
  ],
  client_interaction: [
    { title: 'Client Site Visit', description: 'Homeowner visited site. Discussed progress and answered questions.' },
    { title: 'Client Approval', description: 'Client approved tile layout and grout color selection.' },
    { title: 'Change Request', description: 'Client requested additional outlet in kitchen island. Change order prepared.' },
  ],
  subcontractor: [
    { title: 'Sub Work Complete', description: 'Plumbing sub completed rough-in. Ready for inspection.' },
    { title: 'Sub Coordination', description: 'Met with HVAC contractor to review duct routing.' },
    { title: 'Sub Quality Check', description: 'Reviewed electrical work. Minor corrections requested.' },
  ],
  equipment: [
    { title: 'Equipment Rental', description: 'Scissor lift delivered for ceiling work.' },
    { title: 'Tool Maintenance', description: 'Table saw blade replaced. Back in operation.' },
    { title: 'Equipment Return', description: 'Returned concrete mixer after foundation work.' },
  ],
};

// Weather data
const WEATHER_OPTIONS: { condition: WeatherCondition; tempHigh: number; tempLow: number }[] = [
  { condition: 'sunny', tempHigh: 75, tempLow: 55 },
  { condition: 'partly_cloudy', tempHigh: 70, tempLow: 50 },
  { condition: 'cloudy', tempHigh: 65, tempLow: 48 },
  { condition: 'rainy', tempHigh: 55, tempLow: 45 },
  { condition: 'windy', tempHigh: 60, tempLow: 42 },
];

async function seedDailyLogs(): Promise<number> {
  logSection('Seeding Daily Logs');

  const logsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('dailyLogs');
  const logs: any[] = [];

  // Create logs for each project
  for (const project of DEMO_PROJECTS) {
    const numDays = project.active ? 14 : randomInt(20, 40);
    const startDaysAgo = project.active ? numDays : randomInt(60, 120);

    for (let dayOffset = 0; dayOffset < numDays; dayOffset++) {
      const logDate = daysAgo(startDaysAgo - dayOffset);
      const dayOfWeek = logDate.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Format date as YYYY-MM-DD
      const dateStr = logDate.toISOString().split('T')[0];

      // Random weather
      const weather = randomItem(WEATHER_OPTIONS);

      // Create 2-4 log entries per day
      const numEntries = randomInt(2, 4);
      const categories: DailyLogCategory[] = ['progress', 'general', 'safety', 'delivery', 'inspection', 'client_interaction', 'subcontractor'];

      for (let i = 0; i < numEntries; i++) {
        const category = randomItem(categories);
        const templates = LOG_TEMPLATES[category];
        const template = randomItem(templates);

        const crewMembers = [
          DEMO_USERS.foreman.uid,
          DEMO_USERS.fieldWorker1.uid,
          DEMO_USERS.fieldWorker2.uid,
        ].slice(0, randomInt(2, 3));

        logs.push({
          id: generateId('log'),
          orgId: DEMO_ORG_ID,
          projectId: project.id,
          projectName: project.name,
          userId: DEMO_USERS.foreman.uid,
          userName: DEMO_USERS.foreman.displayName,
          date: dateStr,
          category,
          title: template.title,
          description: template.description,
          photos: [],
          weather: {
            condition: weather.condition,
            temperatureHigh: weather.tempHigh + randomInt(-5, 10),
            temperatureLow: weather.tempLow + randomInt(-5, 5),
            precipitation: weather.condition === 'rainy' ? randomInt(20, 80) : 0,
          },
          crewCount: crewMembers.length + randomInt(0, 2),
          crewMembers,
          hoursWorked: randomInt(6, 9),
          workPerformed: [template.description],
          safetyIncidents: 0,
          issues: category === 'issue' ? [template.description] : [],
          notes: '',
          createdAt: logDate,
          isDemoData: true,
        });
      }
    }

    logProgress(`Created daily logs for ${project.name}`);
  }

  await executeBatchWrites(
    db,
    logs,
    (batch, log) => {
      const ref = logsRef.doc(log.id);
      batch.set(ref, {
        ...log,
        createdAt: toTimestamp(log.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Daily Logs'
  );

  logSuccess(`Created ${logs.length} daily log entries`);
  return logs.length;
}

export { seedDailyLogs };

// Run if executed directly
if (require.main === module) {
  seedDailyLogs()
    .then((count) => {
      console.log(`\n✅ Created ${count} daily log entries`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding daily logs:', error);
      process.exit(1);
    });
}
