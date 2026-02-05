# ContractorOS Help Documentation Plan

> **Purpose:** Framework for building comprehensive user documentation and help system.
> **Last Updated:** 2026-01-28
> **Status:** Planning Phase

---

## Overview

ContractorOS requires a comprehensive help system including:
1. **In-App Help Center** - Searchable help articles
2. **Onboarding Flows** - Guided setup wizards
3. **Feature Documentation** - How-to guides
4. **FAQ System** - Common questions
5. **Bug Reporting** - User feedback mechanism
6. **Analytics** - User behavior tracking

---

## Documentation Structure

### 1. Feature Areas to Document

| Area | Priority | Pages/Features | Status |
|------|----------|----------------|--------|
| **Dashboard Overview** | P1 | Home, navigation, quick actions | Pending |
| **Projects** | P1 | Create, edit, phases, status | Pending |
| **Tasks** | P1 | Kanban, list, Gantt, assignments | Pending |
| **Clients** | P1 | CRM, communication logs, notes | Pending |
| **Estimates** | P1 | Create, line items, send | Pending |
| **E-Signatures** | P1 | Send for signature, tracking | Pending |
| **Invoices** | P2 | Create, send, payment tracking | Pending |
| **Subcontractors** | P2 | Management, assignments, payments | Pending |
| **Settings** | P2 | Organization, integrations, tax rates | Pending |
| **Team** | P3 | User management, roles, invites | Pending |
| **Reports** | P3 | Financial, project, time tracking | Pending |

### 2. Documentation Types

#### Quick Start Guides (Onboarding)
```
/help/getting-started/
├── welcome.md
├── first-project.md
├── invite-team.md
├── connect-accounting.md
└── mobile-setup.md
```

#### Feature Guides (How-To)
```
/help/features/
├── projects/
│   ├── create-project.md
│   ├── manage-phases.md
│   ├── track-progress.md
│   └── archive-project.md
├── tasks/
│   ├── create-task.md
│   ├── kanban-view.md
│   ├── assign-tasks.md
│   └── track-time.md
├── clients/
│   ├── add-client.md
│   ├── communication-logs.md
│   └── client-portal.md
└── ...
```

#### FAQs
```
/help/faq/
├── billing.md
├── permissions.md
├── integrations.md
├── mobile.md
└── troubleshooting.md
```

#### Troubleshooting
```
/help/troubleshooting/
├── login-issues.md
├── sync-problems.md
├── permission-errors.md
└── performance.md
```

---

## In-App Help System Design

### Help Center Page (`/dashboard/help`)

```typescript
// Proposed structure
interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  tags: string[];
  content: string;        // Markdown
  videoUrl?: string;      // Optional video tutorial
  relatedArticles: string[];
  lastUpdated: Date;
  views: number;
  helpful: number;        // Thumbs up count
  notHelpful: number;     // Thumbs down count
}

type HelpCategory =
  | 'getting-started'
  | 'projects'
  | 'tasks'
  | 'clients'
  | 'estimates'
  | 'invoices'
  | 'signatures'
  | 'team'
  | 'settings'
  | 'integrations'
  | 'troubleshooting';
```

### UI Components Needed

1. **HelpSearchBar** - Full-text search across articles
2. **HelpCategoryNav** - Category sidebar
3. **HelpArticleCard** - Preview card for article list
4. **HelpArticleView** - Full article with markdown rendering
5. **HelpFeedback** - "Was this helpful?" component
6. **ContextualHelp** - Tooltip/popover help on features

### Contextual Help System

Add help icons throughout the app that link to relevant articles:

```typescript
// Example usage
<HelpTooltip articleId="create-project">
  <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />
</HelpTooltip>
```

---

## Onboarding System Design

### First-Time User Flow

```
1. Welcome Screen
   - Platform overview
   - Key benefits
   - "Let's get started" CTA

2. Organization Setup
   - Company name
   - Logo upload
   - Brand colors

3. First Project (Guided)
   - Create sample project
   - Explain phases
   - Create first task

4. Invite Team (Optional)
   - Explain roles
   - Send first invite

5. Connect Tools (Optional)
   - QuickBooks/Xero
   - Calendar sync

6. Setup Complete
   - Checklist summary
   - Links to key docs
```

### Progress Tracking

```typescript
interface OnboardingProgress {
  userId: string;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  currentStep: string;
}
```

### Checklist Component

Display persistent checklist until onboarding complete:

```typescript
const ONBOARDING_STEPS = [
  { id: 'profile', label: 'Complete your profile', required: true },
  { id: 'org', label: 'Set up your company', required: true },
  { id: 'project', label: 'Create your first project', required: false },
  { id: 'team', label: 'Invite a team member', required: false },
  { id: 'integration', label: 'Connect accounting', required: false },
];
```

---

## Bug Reporting System

### User-Facing Bug Report

```typescript
interface BugReport {
  id: string;
  userId: string;
  orgId: string;

  // User input
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: 'critical' | 'major' | 'minor' | 'cosmetic';

  // Auto-captured
  url: string;
  userAgent: string;
  screenSize: string;
  timestamp: Date;
  consoleErrors: string[];      // Last 10 console errors
  networkErrors: string[];      // Recent failed requests

  // Admin fields
  status: 'new' | 'investigating' | 'in-progress' | 'resolved' | 'wont-fix';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
}
```

### Bug Report Modal

Accessible from help menu or keyboard shortcut (Cmd+Shift+B):

```typescript
function BugReportModal() {
  // Auto-capture context
  const context = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    consoleErrors: getRecentConsoleErrors(),
  };

  // Form fields...
}
```

---

## User Analytics Plan

### Events to Track

| Event Category | Events | Purpose |
|----------------|--------|---------|
| **Navigation** | page_view, menu_click | Understand user flows |
| **Projects** | project_created, project_viewed, phase_added | Feature usage |
| **Tasks** | task_created, task_completed, view_changed | Productivity patterns |
| **Clients** | client_added, communication_logged | CRM usage |
| **Estimates** | estimate_created, estimate_sent, signature_requested | Sales flow |
| **Help** | help_searched, article_viewed, article_helpful | Documentation gaps |
| **Errors** | error_displayed, retry_clicked | Pain points |

### Analytics Integration Options

1. **Firebase Analytics** (recommended - already in stack)
2. **Mixpanel** - Advanced funnel analysis
3. **PostHog** - Open source, self-hostable
4. **Amplitude** - Product analytics

### Privacy Considerations

```typescript
// Only track non-PII data
const safeEventData = {
  // Include
  projectCount: 5,
  taskCount: 23,
  viewType: 'kanban',
  featureUsed: 'signature',

  // Never include
  // clientName: 'John Doe',    // PII
  // email: 'john@example.com', // PII
  // amount: 50000,             // Sensitive
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Sprint 6)
- [ ] Create `/dashboard/help` page structure
- [ ] Implement HelpArticle type and storage
- [ ] Build HelpSearchBar component
- [ ] Write 5 core getting-started articles
- [ ] Add bug report modal

### Phase 2: Content (Sprint 7)
- [ ] Write feature documentation (all P1 areas)
- [ ] Create FAQ content
- [ ] Add contextual help icons to main features
- [ ] Build onboarding checklist component

### Phase 3: Analytics (Sprint 8)
- [ ] Integrate Firebase Analytics
- [ ] Define event tracking plan
- [ ] Build analytics dashboard for internal use
- [ ] Add article feedback tracking

### Phase 4: Enhancement (Sprint 9+)
- [ ] Video tutorials for complex features
- [ ] Interactive walkthroughs (product tours)
- [ ] AI-powered help suggestions
- [ ] Community forum integration

---

## Content Template

### Help Article Template

```markdown
# [Article Title]

> **Difficulty:** Beginner | Intermediate | Advanced
> **Time:** X minutes
> **Last Updated:** YYYY-MM-DD

## Overview

Brief description of what this article covers.

## Prerequisites

- Requirement 1
- Requirement 2

## Step-by-Step Guide

### Step 1: [Action]

Description of step.

![Screenshot description](./images/step1.png)

### Step 2: [Action]

Description of step.

## Tips & Best Practices

- Tip 1
- Tip 2

## Troubleshooting

### Common Issue 1
Solution...

### Common Issue 2
Solution...

## Related Articles

- [Related Article 1](link)
- [Related Article 2](link)

## Was this helpful?

[👍 Yes] [👎 No]
```

---

## Metrics & Success Criteria

### Documentation Health Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Help search success rate | >80% | Searches that result in article click |
| Article helpfulness | >70% | Thumbs up ratio |
| Support ticket reduction | -30% | Before/after comparison |
| Onboarding completion | >60% | Users completing all steps |
| Time to first project | <10 min | New user to first project |

### Content Coverage

| Coverage Area | Target | Current |
|---------------|--------|---------|
| Getting started guides | 5 | 0 |
| Feature how-tos | 30 | 0 |
| FAQ entries | 20 | 0 |
| Troubleshooting guides | 10 | 0 |
| Video tutorials | 10 | 0 |

---

## File Structure Proposal

```
apps/web/
├── app/dashboard/help/
│   ├── page.tsx                    # Help center home
│   ├── [category]/page.tsx         # Category listing
│   ├── [category]/[articleId]/page.tsx  # Article view
│   └── search/page.tsx             # Search results
├── components/help/
│   ├── HelpSearchBar.tsx
│   ├── HelpCategoryNav.tsx
│   ├── HelpArticleCard.tsx
│   ├── HelpArticleView.tsx
│   ├── HelpFeedback.tsx
│   ├── ContextualHelp.tsx
│   ├── BugReportModal.tsx
│   └── OnboardingChecklist.tsx
├── lib/hooks/
│   ├── useHelpArticles.ts
│   ├── useBugReports.ts
│   └── useOnboarding.ts
└── content/help/                   # Markdown content
    ├── getting-started/
    ├── features/
    ├── faq/
    └── troubleshooting/
```

---

## Next Steps

1. **Approve this plan** - Review with stakeholders
2. **Prioritize content** - Which articles to write first
3. **Design mockups** - Help center UI design
4. **Create Sprint ticket** - Add to backlog for implementation
