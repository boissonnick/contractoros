# ContractorOS UX Research: Navigation Restructure & User Onboarding

> **Research Date:** February 2026
> **Purpose:** Guide redesign of navigation and onboarding to improve user experience

---

## Executive Summary

ContractorOS's current navigation has grown organically to ~50+ menu items across 7 collapsible sections, creating cognitive overload for users. The onboarding flow is minimal (name + phone only) with no guided setup or personalization.

**Key Recommendations:**
1. Restructure navigation around **Jobs-to-be-Done** (JTBD) instead of feature categories
2. Implement a **progressive onboarding wizard** with role-specific flows
3. Add a **persistent setup checklist** that guides users to their "aha moment"
4. Create **persona-based navigation presets** that adapt to user role

---

## Part 1: Current State Analysis

### Current Navigation Structure (Dashboard Portal)

```
Projects & Work (4 items)
├── Dashboard, Projects, Schedule, Daily Logs

Sales & Clients (3 items) [if canViewClients]
├── Clients, Estimates, E-Signatures

Finance (5 items) [if canViewAllFinances]
├── Overview, Invoices, Expenses, Payroll, Reports

Operations (6+ items) [if canViewTeam]
├── Team → Directory, Time Tracking, Availability, Time Off
├── Subcontractors → Directory, Bids, Compare
├── Equipment, Materials

Documents (2 items)
├── Messages, Documents

Reports (6 items) [if canViewProjectReports]
├── Overview, Financial, Operational, Benchmarking, Detailed, Builder

Settings & Help (4+ items)
├── Settings, Getting Started, Shortcuts, Contact, What's New
```

**Problems Identified:**
1. **Feature-centric, not task-centric** — Organized by what the software does, not what users need to accomplish
2. **Too many sections** — 7 collapsible sections create decision paralysis
3. **Inconsistent depth** — Some items have children (Team, Subs), others don't
4. **Reports duplication** — Financial reports appear in both Finance and Reports sections
5. **No contextual adaptation** — Navigation doesn't change based on active projects or user activity

### Current Onboarding Flow

```
1. User receives invite → clicks link
2. Login page (email/password or OAuth)
3. Generic onboarding page → Name + Phone (optional)
4. Redirect to role-appropriate dashboard
```

**Problems Identified:**
1. **No company setup wizard** for Owners
2. **No project creation guidance**
3. **No team invitation flow**
4. **No "aha moment"** — users land on empty dashboard
5. **No role-specific guidance** — PM and Owner see same flow
6. **No setup checklist** to drive engagement
7. **No feature discovery** — tooltips, hotspots, or tours missing

---

## Part 2: User Research — Jobs-to-be-Done Analysis

### Persona 1: Business Owner (OWNER)

**Core Jobs:**
| Job | Frequency | Current Navigation Path |
|-----|-----------|------------------------|
| "See how my business is doing" | Daily | Dashboard → scattered across Finance, Reports |
| "Review cash flow" | Weekly | Finance → Overview (buried) |
| "Check project profitability" | Weekly | Reports → Financial (3 clicks) |
| "Manage my team" | Weekly | Operations → Team (2 clicks) |
| "Win new work" | Ongoing | Sales → Clients/Estimates (2 clicks) |

**Pain Points:**
- Wants executive summary, gets feature list
- Financial health scattered across 3+ locations
- No single "command center" view

**Ideal Navigation:**
```
Business Health (primary focus)
├── Executive Dashboard (KPIs, alerts, action items)
├── Cash Flow & Profitability
├── Revenue Pipeline

Active Work
├── Projects (filtered to active)
├── Schedule (today/this week focus)

Grow Revenue
├── Leads & Estimates
├── Client Relationships

Manage Team
├── People & Payroll
├── Subcontractors
```

---

### Persona 2: Project Manager (PM)

**Core Jobs:**
| Job | Frequency | Current Navigation Path |
|-----|-----------|------------------------|
| "See my projects status" | Daily | Dashboard (generic), then Projects |
| "Check today's schedule" | Daily | Schedule (full calendar view) |
| "Manage tasks & assignments" | Daily | Projects → [Project] → Tasks |
| "Handle RFIs & changes" | Weekly | Documents (mixed with other docs) |
| "Track project budget" | Weekly | Projects → [Project] → Budget |

**Pain Points:**
- Dashboard shows business metrics they don't control
- No "my projects" focused view
- Task management buried inside projects
- RFIs/Change Orders mixed with general documents

**Ideal Navigation:**
```
My Work Today
├── Today's Schedule
├── My Tasks (due today/overdue)
├── Pending Approvals

My Projects
├── Active Projects (list with health indicators)
├── Project Calendar
├── Daily Logs

Coordination
├── RFIs & Submittals
├── Change Orders
├── Team Schedules

Resources
├── Subcontractors
├── Materials & Equipment
```

---

### Persona 3: Field Employee (EMPLOYEE)

**Core Jobs:**
| Job | Frequency | Current Navigation Path |
|-----|-----------|------------------------|
| "Clock in/out" | Daily (2x) | Field → Time (1 click) |
| "See my tasks" | Daily | Field → Tasks (1 click) |
| "Document my work" | Daily | Field → Photos (1 click) |
| "Check my schedule" | Daily | Field → Schedule (1 click) |

**Current State: GOOD** — Field portal is already simplified and task-focused

**Minor Improvements:**
- Add voice-activated shortcuts
- Add quick "log issue" action
- Show today's tasks on home screen

---

### Persona 4: Subcontractor (SUB)

**Core Jobs:**
| Job | Frequency | Current Navigation Path |
|-----|-----------|------------------------|
| "Check for new bid opportunities" | Weekly | Sub → Bids (1 click) |
| "Track my payments" | Weekly | Sub → Invoices (1 click) |
| "See my assigned work" | Daily | Sub → Schedule (1 click) |
| "Submit progress photos" | Daily | Sub → Photos (1 click) |

**Current State: ACCEPTABLE** — Sub portal is focused

**Improvements Needed:**
- Add bid notifications/alerts
- Show payment status prominently
- Add schedule integration with their calendar

---

### Persona 5: Client/Homeowner (CLIENT)

**Core Jobs:**
| Job | Frequency | Current Navigation Path |
|-----|-----------|------------------------|
| "See how my project is going" | Daily/Weekly | Client → Home (dashboard) |
| "View recent photos" | Weekly | Client → Photos (1 click) |
| "Review & approve changes" | As needed | Client → Documents (mixed) |
| "Check what I owe" | Monthly | Client → Invoices (1 click) |

**Current State: ACCEPTABLE** — Client portal is appropriately simplified

**Improvements Needed:**
- Separate "Approvals" from general documents
- Add progress timeline visualization
- Show next milestone/upcoming work

---

## Part 3: Recommended Navigation Architecture

### Principle: Jobs-to-be-Done Orientation

Instead of organizing by **features** (Finance, Operations, Documents), organize by **user goals**:

| Old (Feature-Centric) | New (JTBD-Centric) |
|-----------------------|--------------------|
| Finance → Invoices | Get Paid → Invoicing |
| Finance → Expenses | Control Costs → Expenses |
| Operations → Team | Manage People → Team |
| Reports → Financial | Know Your Numbers → Reports |

---

### Proposed Navigation: OWNER/PM Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  ContractorOS           [Search] [Notifications] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HOME                                                   │
│  ├── Dashboard (context-aware landing)                  │
│  ├── Inbox (messages, approvals, alerts)                │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  WORK                                                   │
│  ├── Projects                                           │
│  │   ├── Active Projects                                │
│  │   ├── All Projects                                   │
│  │   └── Templates                                      │
│  ├── Schedule                                           │
│  │   ├── Calendar                                       │
│  │   └── Gantt                                          │
│  ├── Tasks                                              │
│  │   ├── My Tasks                                       │
│  │   └── All Tasks                                      │
│  └── Daily Logs                                         │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  SALES & CLIENTS                          [Role: Owner] │
│  ├── Clients                                            │
│  │   ├── All Clients                                    │
│  │   └── Leads                                          │
│  ├── Estimates & Proposals                              │
│  └── E-Signatures                                       │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  MONEY                                    [Role: Owner] │
│  ├── Overview (cash flow, AR/AP)                        │
│  ├── Invoices                                           │
│  ├── Expenses                                           │
│  └── Payroll                                            │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  TEAM & RESOURCES                                       │
│  ├── People                                             │
│  │   ├── Directory                                      │
│  │   ├── Time Tracking                                  │
│  │   └── Time Off                                       │
│  ├── Subcontractors                                     │
│  │   ├── Directory                                      │
│  │   └── Bids                                           │
│  └── Equipment & Materials                              │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  DOCUMENTS                                              │
│  ├── All Documents                                      │
│  ├── RFIs                                               │
│  ├── Change Orders                                      │
│  └── Submittals                                         │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  [collapse] REPORTS                                     │
│  └── (moved to secondary — accessed via Dashboard)      │
│                                                         │
│  ─────────────────────────────────────                  │
│                                                         │
│  [bottom]                                               │
│  ├── Settings                                           │
│  └── Help                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Changes:

1. **HOME section** — Unified inbox for all action items (messages, approvals, alerts)
2. **WORK section** — Everything about getting work done
3. **SALES & CLIENTS** — Revenue generation (Owner-only by default)
4. **MONEY** — Clear financial focus (renamed from "Finance")
5. **TEAM & RESOURCES** — People and physical resources combined
6. **DOCUMENTS** — Elevated RFIs, Change Orders, Submittals as first-class items
7. **REPORTS** — Collapsed/hidden, accessible from Dashboard widgets

### Role-Based Visibility

| Section | OWNER | PM | EMPLOYEE | CONTRACTOR |
|---------|-------|-----|----------|------------|
| HOME | ✓ | ✓ | ✓ | ✓ |
| WORK | ✓ | ✓ | ✓ (limited) | ✓ (limited) |
| SALES & CLIENTS | ✓ | ✓ (view) | ✗ | ✗ |
| MONEY | ✓ | ✓ (view) | ✗ | ✗ |
| TEAM & RESOURCES | ✓ | ✓ | ✗ | ✗ |
| DOCUMENTS | ✓ | ✓ | ✓ (assigned) | ✓ (assigned) |
| REPORTS | ✓ | ✓ (project) | ✗ | ✗ |

---

## Part 4: Recommended Onboarding Flow

### Guiding Principles (from [SaaS Onboarding Best Practices 2025](https://www.insaim.design/blog/saas-onboarding-best-practices-for-2025-examples)):

1. **Time to First Value < 2 minutes** — Show value immediately
2. **Personalization is critical** — Different flows for different roles
3. **Progressive disclosure** — Don't overwhelm with features
4. **Celebrate milestones** — Gamification increases completion
5. **Persistent checklist** — Guides ongoing engagement

### Onboarding Flow: Business Owner (New Account)

```
┌─────────────────────────────────────────────────────────┐
│                    WELCOME TO CONTRACTOROS              │
│                                                         │
│  Let's get you set up in about 5 minutes.               │
│                                                         │
│  [Get Started]                                          │
└─────────────────────────────────────────────────────────┘

Step 1: ABOUT YOU (30 sec)
├── Your name
├── Your role (Owner / PM / Other)
├── Phone (optional)
└── [Continue]

Step 2: YOUR COMPANY (1 min)
├── Company name
├── Company type (GC / Remodeler / Specialty / Other)
├── Typical project size (< $50K / $50-250K / $250K-1M / $1M+)
├── Team size (Just me / 2-5 / 6-20 / 20+)
└── [Continue]

Step 3: QUICK WINS - Choose Your Path (30 sec)
├── [ ] I want to track a project
├── [ ] I want to create an estimate/proposal
├── [ ] I want to invite my team
├── [ ] I want to send an invoice
├── [Skip for now — I'll explore]
└── [Let's Go!]

Step 4: GUIDED ACTION (based on Step 3 selection)
├── If "track a project" → Create First Project wizard
├── If "create estimate" → Estimate Builder intro
├── If "invite team" → Team invitation flow
├── If "send invoice" → Quick Invoice creator
└── If "skip" → Dashboard with setup checklist

Step 5: DASHBOARD with SETUP CHECKLIST
├── Welcome modal: "Here's your dashboard. Complete these steps to get the most out of ContractorOS."
├── Checklist (pinned to sidebar or top):
│   ├── [ ] Complete your company profile
│   ├── [ ] Create your first project
│   ├── [ ] Add a team member or sub
│   ├── [ ] Send your first invoice
│   └── [ ] Download mobile app
└── Progress indicator: "20% complete"
```

### Onboarding Flow: Team Member (Invited User)

```
Step 1: WELCOME
├── "[Company Name] has invited you to ContractorOS"
├── Your name (pre-filled from invite)
├── Create password / Use SSO
└── [Continue]

Step 2: ABOUT YOUR WORK (30 sec)
├── Your role: Employee / Contractor / Subcontractor
├── Your trade (if applicable)
├── Phone (for notifications)
└── [Continue]

Step 3: QUICK ORIENTATION (45 sec)
├── Interactive tooltip tour of key features:
│   ├── "This is your dashboard — see your schedule and tasks"
│   ├── "Use this to clock in and out"
│   ├── "Photos you take appear here"
│   └── "Need help? Click here anytime"
└── [Got it, let's go!]

Step 4: FIELD PORTAL (for EMPLOYEE/CONTRACTOR)
├── Direct to field portal with day's schedule
├── Persistent "Getting Started" checklist:
│   ├── [ ] View your schedule
│   ├── [ ] Clock in for the first time
│   ├── [ ] Upload a photo
│   └── [ ] Complete a task
└── Progress indicator
```

### Onboarding Flow: Client (Magic Link)

```
Step 1: WELCOME TO YOUR PROJECT PORTAL
├── "Hi [Name], [Company] has invited you to view your project"
├── Magic link authentication (no password required)
└── [View My Project]

Step 2: QUICK TOUR (30 sec — skippable)
├── "Here's what you can do:"
│   ├── "See progress photos and updates"
│   ├── "Review and approve changes"
│   ├── "View invoices and make payments"
│   └── "Message your contractor directly"
└── [Show Me My Project]

Step 3: PROJECT DASHBOARD
├── Project status overview
├── Recent photos carousel
├── Upcoming milestones
└── Any pending approvals highlighted
```

---

## Part 5: UI Components Needed

### 1. Onboarding Wizard Component

```typescript
interface OnboardingWizardProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepComplete: (stepId: string, data: any) => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  isRequired: boolean;
  estimatedTime: string; // "30 sec"
}
```

### 2. Setup Checklist Component

```typescript
interface SetupChecklistProps {
  items: ChecklistItem[];
  onItemClick: (itemId: string) => void;
  isCollapsible: boolean;
  position: 'sidebar' | 'banner' | 'modal';
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
  reward?: string; // "Unlock team features"
}
```

### 3. Feature Tooltip Tour Component

```typescript
interface FeatureTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete: () => void;
  onDismiss: () => void;
}

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}
```

### 4. Progress Celebration Component

```typescript
interface MilestoneCelebrationProps {
  milestone: string;
  message: string;
  nextAction?: { label: string; href: string };
  animation: 'confetti' | 'checkmark' | 'fireworks';
}
```

---

## Part 6: Data Model Changes

### New: User Onboarding State

```typescript
interface UserOnboardingState {
  // Wizard completion
  wizardCompleted: boolean;
  wizardCompletedAt?: Timestamp;
  wizardSkipped: boolean;

  // Setup checklist
  checklistItems: {
    [itemId: string]: {
      completed: boolean;
      completedAt?: Timestamp;
    };
  };
  checklistDismissed: boolean;

  // Feature tours
  completedTours: string[];
  dismissedTours: string[];

  // Personalization choices
  selectedQuickWin?: 'project' | 'estimate' | 'team' | 'invoice';
  companyType?: 'gc' | 'remodeler' | 'specialty' | 'other';
  projectSize?: 'small' | 'medium' | 'large' | 'enterprise';
  teamSize?: 'solo' | 'small' | 'medium' | 'large';
}
```

### New: Organization Onboarding State

```typescript
interface OrganizationOnboardingState {
  setupProgress: number; // 0-100
  setupItems: {
    companyProfile: boolean;
    firstProject: boolean;
    firstTeamMember: boolean;
    firstInvoice: boolean;
    mobileAppDownloaded: boolean;
    bankConnected: boolean;
  };
  completedAt?: Timestamp;
}
```

---

## Part 7: Implementation Roadmap

### Phase 1: Navigation Restructure (2-3 weeks)

**Week 1:**
- [ ] Create new navigation config structure
- [ ] Implement HOME section with Inbox
- [ ] Restructure WORK section
- [ ] Add role-based section visibility

**Week 2:**
- [ ] Implement MONEY section (rename Finance)
- [ ] Restructure TEAM & RESOURCES
- [ ] Elevate document types (RFIs, COs, Submittals)
- [ ] Collapse REPORTS section

**Week 3:**
- [ ] User testing and feedback
- [ ] Iterate based on feedback
- [ ] Mobile navigation updates
- [ ] Deploy to production

### Phase 2: Onboarding Wizard (2-3 weeks)

**Week 1:**
- [ ] Build OnboardingWizard component
- [ ] Implement Owner onboarding flow
- [ ] Build company setup wizard
- [ ] Add quick-win selection

**Week 2:**
- [ ] Build Team Member onboarding flow
- [ ] Build Client onboarding flow (magic link)
- [ ] Implement role-specific redirects
- [ ] Add analytics tracking

**Week 3:**
- [ ] A/B testing setup
- [ ] Iterate based on completion rates
- [ ] Deploy to production

### Phase 3: Setup Checklist & Tours (1-2 weeks)

**Week 1:**
- [ ] Build SetupChecklist component
- [ ] Build FeatureTour component
- [ ] Build MilestoneCelebration component
- [ ] Integrate with onboarding state

**Week 2:**
- [ ] Add to all portal dashboards
- [ ] Implement persistence (Firestore)
- [ ] Add dismissal and completion tracking
- [ ] Deploy to production

### Phase 4: Analytics & Optimization (Ongoing)

- [ ] Track onboarding completion rates
- [ ] Track time-to-first-value metrics
- [ ] Track checklist item completion
- [ ] A/B test different flows
- [ ] Iterate based on data

---

## Part 8: Success Metrics

### Onboarding Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Onboarding completion rate | Unknown | > 80% | % users completing wizard |
| Time to first project | Unknown | < 10 min | Time from signup to first project |
| Checklist completion | N/A | > 60% | % completing 4/5 items in 7 days |
| Day 1 retention | Unknown | > 70% | % returning within 24 hours |
| Day 7 retention | Unknown | > 50% | % active at day 7 |

### Navigation Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Navigation clicks to complete task | Unknown | < 3 | Avg clicks to common tasks |
| Time to find feature | Unknown | < 10 sec | User testing measurement |
| Support tickets re: navigation | Unknown | -50% | Support ticket categorization |
| Search usage | Unknown | < 20% | % using search vs nav |

---

## Part 9: Competitor Reference

### Buildertrend Navigation (Reference)
- Uses top-level tabs: Dashboard, Financials, Project Management, Scheduling, Communication
- Clean, cloud-based interface accessible on all devices
- Customer Portal for client visibility
- Document scanner for field use

### Procore Navigation (Reference)
- Modular structure by function: Preconstruction, Project Management, Financials, Analytics
- Deep bid management and financial tools
- Designed for large commercial contractors
- Enterprise-grade but complex

### Key Takeaways from Competitors:
1. **Buildertrend** — Clean, accessible, residential-focused (our closest comp)
2. **Procore** — Powerful but complex, enterprise-focused
3. **CoConstruct** — Custom home builder focus, now owned by Buildertrend

**Our Differentiation:**
- Jobs-to-be-Done navigation (vs. feature-centric)
- Role-adaptive experience (vs. one-size-fits-all)
- Mobile-first field portal (vs. desktop-adapted mobile)
- Guided onboarding with quick wins (vs. feature dumping)

---

## Part 10: Open Questions

1. **Navigation persistence**: Should we save user's collapsed/expanded section states per device?
2. **Onboarding skip**: How aggressive should we be about showing the checklist after skip?
3. **Mobile navigation**: Should mobile bottom nav items be customizable?
4. **AI integration**: Should we add an AI assistant to the onboarding flow?
5. **Demo data**: Should new accounts start with sample project data?

---

## Appendix: Resources

### Industry Research
- [34 Best Construction Project Management Software For 2026](https://thedigitalprojectmanager.com/tools/best-construction-project-management-software/)
- [SaaS Onboarding Best Practices 2025](https://www.insaim.design/blog/saas-onboarding-best-practices-for-2025-examples)
- [Jobs to Be Done Framework](https://uxplanet.org/jobs-to-be-done-jtbd-in-product-design-6065e7bec122)
- [Information Architecture for Navigation](https://abbycovert.com/writing/information-architecture-for-navigation/)

### Internal References
- Current navigation: `apps/web/app/dashboard/layout.tsx`
- Current onboarding: `apps/web/app/onboarding/page.tsx`
- User types: `apps/web/types/user.ts`
- Permissions: `apps/web/types/user.ts` (lines 252-642)

---

*Document created: February 2026*
*Last updated: February 2026*
