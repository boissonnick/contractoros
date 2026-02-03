# Sub-Agent Prompts - Sprint 40

> **Purpose:** Ready-to-use prompts for launching parallel sub-agents
> **Usage:** Copy prompts to Task tool calls, launch multiple in single message for parallelism

---

## Data Seeding Agents (Bash)

### Seed Demo Tasks
```
You are a data seeding agent. Run the demo tasks seed script.

EXECUTE:
cd /Users/nickbodkins/contractoros/scripts/seed-demo && npx ts-node seed-tasks.ts

CONTEXT:
- Creates 15-25 tasks per project for Gantt view
- Uses named database "contractoros" via db.ts
- OrgId from utils.ts

REPORT: Number of tasks created per project
```

### Seed Demo RFIs
```
You are a data seeding agent. Run the RFI seed script.

EXECUTE:
cd /Users/nickbodkins/contractoros/scripts/seed-demo && npx ts-node seed-rfis.ts

CONTEXT:
- Creates RFI records for demo projects
- Uses named database "contractoros"

REPORT: Number of RFIs created
```

### Seed Demo Photos
```
You are a data seeding agent. Create and run a photo seed script.

LOCATION: /Users/nickbodkins/contractoros/scripts/seed-demo/seed-photos.ts

REQUIREMENTS:
- Import { getDb } from './db'
- Import { DEMO_ORG_ID, DEMO_PROJECTS } from './utils'
- Create 5-10 photo records per active project
- Photos should have: url (placeholder), caption, projectId, createdAt, createdBy

EXECUTE after creating: npx ts-node seed-photos.ts

REPORT: Number of photos created
```

---

## Feature Development Agents (general-purpose)

### SubcontractorCard Component
```
You are a feature development agent for ContractorOS.

TASK: Create SubcontractorCard component for directory listing

LOCATION: /Users/nickbodkins/contractoros/apps/web/components/subcontractors/SubcontractorCard.tsx

REQUIREMENTS:
- Display: company name, trade, contact info, rating
- Action buttons: View Details, Send Message
- Status badge: Active, Pending, Inactive
- Follow pattern in components/clients/ClientCard.tsx

IMPORTS:
- Use Heroicons (outline)
- Use existing Badge, Button from components/ui/

TYPES: Subcontractor type exists in types/index.ts (lines 1231-1390)

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Working component with no TypeScript errors
```

### SubcontractorDirectory Page
```
You are a feature development agent for ContractorOS.

TASK: Create Subcontractors directory page

LOCATION: /Users/nickbodkins/contractoros/apps/web/app/dashboard/subcontractors/page.tsx

REQUIREMENTS:
- PageHeader with "Subcontractors" title and "Add Subcontractor" button
- FilterBar with search and trade filter
- Grid of SubcontractorCard components
- Empty state when no subcontractors
- Use useSubcontractors hook (or create if missing)

PATTERNS TO FOLLOW:
- See app/dashboard/clients/page.tsx for list page pattern
- See components/ui/PageHeader.tsx for header
- See components/ui/FilterBar.tsx for filters

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Working page accessible at /dashboard/subcontractors
```

### WeatherWidget Component
```
You are a feature development agent for ContractorOS.

TASK: Create WeatherWidget component for schedule page

LOCATION: /Users/nickbodkins/contractoros/apps/web/components/schedule/WeatherWidget.tsx

REQUIREMENTS:
- Display current weather + 5-day forecast
- Show: temperature, conditions icon, precipitation chance
- Compact design for schedule sidebar
- Loading and error states
- Props: latitude, longitude (or zip code)

WEATHER API OPTIONS (research first):
- OpenWeatherMap (free tier available)
- WeatherAPI.com (free tier available)
- Visual Crossing (free tier available)

CREATE SERVICE: lib/services/weather.ts with fetch function

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Working widget with mock data (API key can be added later)
```

### Schedule Day View
```
You are a feature development agent for ContractorOS.

TASK: Add day view to schedule calendar

LOCATION: /Users/nickbodkins/contractoros/apps/web/components/schedule/

REQUIREMENTS:
- Add "Day" option to existing view toggle (Week/Month/Day)
- DayView component showing hourly breakdown
- Event cards with full details visible
- Crew assignments visible per event
- Navigation: Previous Day / Today / Next Day

PATTERNS:
- See components/schedule/ScheduleCalendar.tsx for existing views
- See components/schedule/CalendarEvent.tsx for event display

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Day view accessible via toggle on schedule page
```

---

## UI Polish Agents (general-purpose)

### Help Menu in Sidebar
```
You are a UI development agent for ContractorOS.

TASK: Add Help menu item to sidebar navigation

LOCATION: /Users/nickbodkins/contractoros/apps/web/components/layout/Sidebar.tsx

REQUIREMENTS:
- Add "Help & Support" item near bottom of sidebar
- Icon: QuestionMarkCircleIcon from Heroicons
- Dropdown or link to /dashboard/help
- Include: Documentation, Contact Support, Keyboard Shortcuts

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Help menu visible in sidebar
```

### Online Status Indicator
```
You are a UI development agent for ContractorOS.

TASK: Add online/offline status indicator

LOCATION: /Users/nickbodkins/contractoros/apps/web/components/ui/OnlineStatus.tsx

REQUIREMENTS:
- Hook into navigator.onLine
- Listen for online/offline events
- Display small indicator (green dot online, red dot offline)
- Optional toast when connection status changes
- Add to header/navbar area

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Working online status indicator
```

### Date Picker Presets
```
You are a UI development agent for ContractorOS.

TASK: Add quick date range presets to date pickers

LOCATION: /Users/nickbodkins/contractoros/apps/web/components/ui/DateRangePicker.tsx

REQUIREMENTS:
- Add preset buttons: Today, This Week, This Month, Last 30 Days, This Quarter, This Year
- Clicking preset sets both start and end dates
- Presets appear above or beside calendar
- Mobile-friendly layout

PATTERNS: Check if DateRangePicker exists, create if not

VERIFICATION: Run `cd /Users/nickbodkins/contractoros/apps/web && npx tsc --noEmit`

DELIVERABLE: Date picker with working presets
```

---

## Database Agents (general-purpose)

### Subcontractor Indexes
```
You are a database agent for ContractorOS.

TASK: Add Firestore indexes for subcontractor queries

FILE: /Users/nickbodkins/contractoros/firestore.indexes.json

INDEXES TO ADD:
1. subcontractors: orgId ASC, trade ASC, company ASC
2. subcontractors: orgId ASC, status ASC, createdAt DESC
3. subcontractors: orgId ASC, rating DESC

VERIFICATION:
1. Validate JSON syntax
2. Deploy: firebase deploy --only firestore:indexes --project contractoros-483812

DELIVERABLE: Indexes deployed successfully
```

---

## Research Agents (Explore)

### Weather API Research
```
Research weather API integration options for ContractorOS schedule.

FIND:
1. Which weather APIs have free tiers suitable for small SaaS
2. How to get weather by lat/long or zip code
3. What data format they return (temperature, conditions, forecast)
4. Rate limits and pricing tiers

CHECK EXISTING:
- Any weather-related files in lib/services/
- Any environment variables for weather APIs
- Any existing weather components

DELIVERABLE: Summary of best API option with implementation approach
```

### Subcontractor Module Research
```
Research existing subcontractor implementation in ContractorOS.

FIND:
1. All subcontractor-related files (components, hooks, pages)
2. Subcontractor type definition in types/index.ts
3. Current routes that handle subcontractors
4. How subcontractors relate to projects and bids

QUESTIONS TO ANSWER:
- Is there an org-level subcontractor collection?
- How are subcontractors currently linked to projects?
- What data already exists in the demo account?

DELIVERABLE: Summary of current implementation with gaps identified
```

---

## Execution Patterns

### Pattern A: Full Parallel Sprint
Launch all 4 in single message:
1. Task(Bash, background): Seed tasks
2. Task(Bash, background): Seed RFIs
3. Task(general-purpose): SubcontractorCard
4. Task(general-purpose): WeatherWidget

### Pattern B: Research Then Build
Step 1: Task(Explore): Research subcontractor module
Step 2: Use findings for Task(general-purpose): Build SubcontractorDirectory

### Pattern C: Sequential Dependencies
Step 1: Task(general-purpose): Add Firestore indexes
Step 2: After deploy, Task(general-purpose): Build component using indexed queries

---

## Notes

- All agents should run `npx tsc --noEmit` before completing
- Named database: always use "contractoros"
- Check existing patterns before creating new ones
- Report blockers immediately rather than guessing
