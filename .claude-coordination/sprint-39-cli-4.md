# Sprint 39 - CLI 4: Notifications & Integration Research

**Role:** Backend / Infrastructure / Research
**Focus:** Notification system implementation, integration research documentation
**Estimated Hours:** 75-110h
**Priority:** Can run in parallel

---

## Sprint 38 Completed

- [x] Firebase Permission Errors (#13) - Rules for 6 collections
- [x] Profit Margin Bug (#53) - Fixed in budget-utils.ts, useReports.ts
- [x] Payroll NaNh Bug (#57) - Fixed in PayrollEntryRow.tsx
- [x] Job Costing Data Seeded
- [x] Named Database Documentation

---

## Remaining Sprint 38 Tasks

### Task 1: Verify Finances Page (Issue #26)
**Effort:** 1-2h

Verify finances page works with seeded job costing data.

**Steps:**
1. Load http://localhost:3000/dashboard/finances
2. Verify no "Failed to load" errors
3. Verify job costing data displays
4. Check budget vs actual shows correctly

**Acceptance Criteria:**
- [ ] Finances page loads without error
- [ ] Job costing data displays
- [ ] Budget vs actual works

---

### Task 2: Test Comparison Functionality (Issue #27)
**Effort:** 2-3h

Test Subs > Compare tab with demo bids.

**Steps:**
1. Navigate to Subcontractors > Bids or Compare tab
2. Select multiple bids for comparison
3. Verify comparison displays correctly

**Acceptance Criteria:**
- [ ] Compare tab functional
- [ ] Can compare multiple bids
- [ ] Visual indicators clear

---

## Phase 1: Notification System

### Task 3: Browser Notification Permissions (Issue #98)
**Effort:** 3-4h

Request and configure browser notifications.

**Files to Create:**
```
lib/notifications/browser-notifications.ts
lib/notifications/notification-store.ts
components/settings/NotificationSettings.tsx
```

**Implementation:**
```typescript
// lib/notifications/browser-notifications.ts

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (Notification.permission !== 'granted') {
    return null;
  }

  return new Notification(title, {
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    ...options,
  });
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
```

**Acceptance Criteria:**
- [ ] Enable toggle triggers permission request
- [ ] Permission state stored
- [ ] Graceful handling when denied
- [ ] Re-request option available

---

### Task 4: OS-Level Notification Pass-Through (Issue #99)
**Effort:** 4-6h

Browser notifications to OS notification centers.

**Implementation Notes:**
- Modern browsers automatically pass notifications to OS
- Focus on: notification sounds, click handling, badge counts
- Service worker for background notifications

**Files to Create:**
```
public/sw.js (service worker)
lib/notifications/service-worker-registration.ts
```

**Service Worker Example:**
```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag,
    data: { url: data.url },
    actions: data.actions,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.notification.data?.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

**Acceptance Criteria:**
- [ ] Notifications appear in OS notification center
- [ ] Click opens app to relevant page
- [ ] Sound configurable
- [ ] Works on Windows/Mac

---

### Task 5: Granular Notification Type Control (Issue #100)
**Effort:** 4-6h

Control notifications by type.

**Notification Types:**
```typescript
type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'rfi_response'
  | 'change_order_approval'
  | 'schedule_change'
  | 'message_received'
  | 'invoice_paid'
  | 'expense_approved'
  | 'bid_received';

interface NotificationPreferences {
  userId: string;
  global: boolean;
  byType: Record<NotificationType, boolean>;
  byProject?: Record<string, boolean>;
  sound: boolean;
  soundType: 'default' | 'subtle' | 'none';
}
```

**Files to Create:**
```
types/notifications.ts
lib/hooks/useNotificationPreferences.ts
components/settings/NotificationTypeSettings.tsx
```

**Acceptance Criteria:**
- [ ] Enable/disable by notification type
- [ ] Per-project settings (optional)
- [ ] Sound preference (on/off/subtle)
- [ ] Settings persist to Firestore

---

### Task 6: Do Not Disturb & Quiet Hours (Issue #101)
**Effort:** 4-6h

DND scheduling for notifications.

**Implementation:**
```typescript
interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // "18:00"
  endTime: string;   // "08:00"
  timezone: string;
  overrideForUrgent: boolean;
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}

function shouldSuppressNotification(
  settings: QuietHoursSettings,
  priority: 'low' | 'normal' | 'high' | 'urgent'
): boolean {
  if (!settings.enabled) return false;
  if (settings.overrideForUrgent && priority === 'urgent') return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDay = now.getDay();

  if (!settings.daysOfWeek.includes(currentDay)) return false;

  // Handle overnight quiet hours
  if (settings.startTime > settings.endTime) {
    return currentTime >= settings.startTime || currentTime < settings.endTime;
  }

  return currentTime >= settings.startTime && currentTime < settings.endTime;
}
```

**Acceptance Criteria:**
- [ ] Set quiet hours (e.g., 6pm - 8am)
- [ ] Override for high-priority/urgent
- [ ] Day-of-week selection
- [ ] Notifications queued during DND

---

## Phase 2: Integration Research

### Task 7: Microanimation Sprint Planning (Issue #28)
**Effort:** 2-3h (planning only)

Create animation design guidelines.

**Deliverable:** `docs/ANIMATION_GUIDELINES.md`

**Content:**
1. Animation philosophy (subtle, purposeful, non-distracting)
2. Approved animation types
3. Forbidden animations (bounce, continuous pulse)
4. Implementation patterns
5. Accessibility considerations

**Acceptance Criteria:**
- [ ] Guidelines documented
- [ ] Replacement plan for bouncing animations
- [ ] Sprint scope defined

---

### Task 8: Bank Integration Research - Plaid/Yodlee (Issue #51)
**Effort:** 20-30h

Enable bank transaction connectivity.

**Deliverable:** `docs/research/BANK_INTEGRATION.md`

**Research Areas:**
| Topic | Details |
|-------|---------|
| Vendors | Plaid, Yodlee, MX, Finicity |
| Pricing | Per-connection vs per-API-call |
| Capabilities | Transactions, balances, identity |
| Security | PCI-DSS, SOC2, encryption |
| Implementation | OAuth flow, webhooks |

**Acceptance Criteria:**
- [ ] Vendor comparison complete
- [ ] API documentation reviewed
- [ ] Security requirements documented
- [ ] Implementation estimate provided

---

### Task 9: Neobank & Purchasing Card Research (Issue #52)
**Effort:** 4-6h

Explore neobank integrations.

**Deliverable:** `docs/research/NEOBANK_INTEGRATION.md`

**Vendors to Research:**
- Brex
- Ramp
- Mercury
- Relay
- BlueVine

**Acceptance Criteria:**
- [ ] Compatible neobanks identified
- [ ] API capabilities documented
- [ ] Implementation scope estimated

---

### Task 10: Payroll Integration Planning (Issue #58)
**Effort:** 8-12h

Map ContractorOS payroll data to external providers.

**Deliverable:** `docs/research/PAYROLL_INTEGRATION.md`

**Target Platforms:**
- Gusto
- ADP
- QuickBooks Payroll
- Paychex

**Data Mapping:**
```
ContractorOS Field → Provider Field
employee.name → employee_name
employee.hourlyRate → hourly_rate
timeEntry.hours → regular_hours
timeEntry.overtimeHours → overtime_hours
```

**Acceptance Criteria:**
- [ ] Target platforms identified
- [ ] API capabilities documented
- [ ] Data mapping designed
- [ ] OAuth strategy planned

---

### Task 11: Messaging Architecture Research (Issue #61)
**Effort:** 40-60h

Comprehensive messaging platform research.

**Deliverable:** `docs/research/MESSAGING_ARCHITECTURE.md`

**Research Areas:**
1. **Competitive Analysis**
   - Slack, Teams, Asana, Monday.com
   - Feature matrix comparison

2. **Open Source Evaluation**
   - Rocket.Chat
   - Mattermost
   - Zulip

3. **Architecture Proposal**
   - Real-time vs polling
   - Message storage
   - Multi-channel (SMS, email, in-app)

4. **Context Persistence**
   - Thread model
   - Project-linked conversations
   - Search and history

**Acceptance Criteria:**
- [ ] Competitive analysis complete
- [ ] Open source evaluation matrix
- [ ] Architecture proposal
- [ ] Implementation roadmap

---

### Task 12: Custom Reports Builder Research (Issue #67)
**Effort:** 30-40h

Build custom reports capability.

**Deliverable:** `docs/research/CUSTOM_REPORTS.md`

**Tools to Evaluate:**
| Tool | Type | Pros | Cons |
|------|------|------|------|
| Metabase | BI Platform | Full-featured | Complex setup |
| Superset | BI Platform | Open source | Resource heavy |
| Grafana | Dashboards | Great visualizations | More ops-focused |
| Recharts | Library | React native | Build from scratch |
| Plotly | Library | Interactive | Learning curve |

**Acceptance Criteria:**
- [ ] Tools evaluated
- [ ] Recommendation made
- [ ] Implementation plan created

---

### Task 13: AI-Powered Insights Research (Issue #73)
**Effort:** 12-16h

Contextual analysis, anomalies, recommendations.

**Deliverable:** `docs/research/AI_INSIGHTS.md`

**Features to Design:**
- Anomaly detection (unusual expenses, schedule slips)
- Predictive insights (budget overrun risk)
- Natural language summaries
- Actionable alerts

**Acceptance Criteria:**
- [ ] Approach documented
- [ ] Model selection (OpenAI vs Claude vs custom)
- [ ] Implementation plan created

---

### Task 14: AI Settings & Provider Management (Issues #88, #90-93)
**Effort:** 20-30h

AI provider configuration and security.

**Deliverable:** `docs/research/AI_PROVIDER_MANAGEMENT.md`

**Features:**
- Default AI contribution toggle (#88)
- User AI Model OAuth connection (#90)
- User API Key Management (#91)
- Multiple AI Provider Support (#92)
- Secure AI Credential Storage (#93)

**Security Requirements:**
- AES-256 encryption for API keys
- Key rotation support
- Audit logging
- Per-org isolation

**Acceptance Criteria:**
- [ ] OAuth flows designed for OpenAI, Anthropic, Google
- [ ] API key security plan
- [ ] Multi-provider architecture designed

---

## Status Updates

```
Sprint 38 Remaining:
[ ] Task 1: Verify Finances Page
[x] Task 2: Test Comparison Functionality - ✅ COMPLETE 2026-02-02
    - Fixed bids missing subId field (120 bids updated)
    - BidComparison component works with demo data
    - Tested on demo-proj-mainst-retail (4+ bids)

Notification System:
[x] Task 3: Browser Notification Permissions - ✅ COMPLETE 2026-02-02
    - browser-notifications.ts: Permission API, showNotification
    - useBrowserNotifications.ts: React hook
    - NotificationSettings.tsx: Full settings UI
    - Quiet hours / DND support included
[ ] Task 4: OS-Level Notification Pass-Through
[ ] Task 5: Granular Notification Type Control - Included in Task 3
[ ] Task 6: Do Not Disturb & Quiet Hours - Included in Task 3

Research Documents:
[ ] Task 7: Microanimation Sprint Planning
[ ] Task 8: Bank Integration Research
[ ] Task 9: Neobank Research
[ ] Task 10: Payroll Integration Planning
[ ] Task 11: Messaging Architecture Research
[ ] Task 12: Custom Reports Builder Research
[ ] Task 13: AI-Powered Insights Research
[ ] Task 14: AI Settings & Provider Management
```

---

## Commands

```bash
# TypeScript check
cd apps/web && npx tsc --noEmit

# Test notifications locally
npm run dev
# Open browser console, test:
Notification.requestPermission()

# Create research doc
mkdir -p docs/research
touch docs/research/BANK_INTEGRATION.md

# Deploy Firestore rules (if needed)
firebase deploy --only firestore:rules --project contractoros-483812
```

---

## Research Document Template

```markdown
# [Feature Name] Research

**Author:** CLI 4
**Date:** 2026-02-XX
**Status:** Draft / In Review / Approved

## Executive Summary
Brief overview of findings and recommendation.

## Requirements
- Requirement 1
- Requirement 2

## Options Evaluated

| Option | Pros | Cons | Cost | Complexity |
|--------|------|------|------|------------|
| A | ... | ... | ... | Low/Med/High |
| B | ... | ... | ... | Low/Med/High |

## Recommendation
Recommended approach and rationale.

## Implementation Plan
1. Phase 1: ...
2. Phase 2: ...
3. Phase 3: ...

## Estimated Effort
X-Y hours

## Security Considerations
- Consideration 1
- Consideration 2

## Open Questions
- Question 1
- Question 2

## References
- [Link 1](url)
- [Link 2](url)
```

---

## File Ownership

CLI 4 owns:
- `firestore.rules`
- `firestore.indexes.json`
- `functions/` (Cloud Functions)
- `lib/notifications/`
- `docs/research/`
- Backend infrastructure

**Coordinate with:**
- CLI 1 for data requirements
- CLI 3 for feature integration
