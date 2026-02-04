# Sprint 38 - CLI 4: Critical Bugs & Backend

**Role:** Backend / Infrastructure / Permissions
**Focus:** Firebase rules, permission errors, calculation bugs, notifications, future integrations research
**Estimated Hours:** 90-140h
**Priority:** START FIRST - Unblocks other CLIs

---

## Prerequisites

- Access to Firebase Console (contractoros-483812)
- Firebase CLI configured
- Understanding of Firestore security rules

---

## CRITICAL - Fix First (Unblocks Everything)

### Task 1: Firebase Permission Errors - Multiple Features (Issue #13)
**Effort:** 6-10h
**Priority:** HIGHEST - Do this first!

Multiple features showing "Missing or insufficient permissions" Firebase errors.

**Affected Features:**
- Change Orders (`useChangeOrders`)
- Sub Assignments (`useSubAssignments`)
- Bids (`useBids`)
- Solicitations (`useBidSolicitations`)
- Submittals
- Finances
- Tasks
- Scopes (`useScopes`)

**Steps:**
1. Identify all collections that need rules
2. Add rules to `firestore.rules`
3. Test each feature
4. Deploy rules

**Collections to verify/add:**
```javascript
// In firestore.rules, under organizations/{orgId}:
match /changeOrders/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /subAssignments/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /bids/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /solicitations/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /submittals/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /scopes/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /finances/{docId} {
  allow read, write: if isSameOrg(orgId);
}
match /jobCostingData/{docId} {
  allow read, write: if isSameOrg(orgId);
}
```

**Acceptance Criteria:**
- [ ] All affected features load without permission errors
- [ ] No console errors for permission-related features
- [ ] All demo data accessible to demo user account

**Deploy Command:**
```bash
firebase deploy --only firestore:rules --project contractoros-483812
```

---

### Task 2: Finances Page Error + Job Costing (Issue #26)
**Effort:** 6-8h

"Failed to load financial data" error + "No cost data available"

**Steps:**
1. Fix permission issue (part of Task 1)
2. Verify job costing data structure
3. Create/seed job costing data: materials, labor, equipment, subcontractor costs
4. Cost tracking shows budget vs. actual

**Acceptance Criteria:**
- [ ] Finances page loads without error
- [ ] Job costing data displays
- [ ] Budget vs actual shows correctly

---

### Task 3: Comparison Functionality Testing (Issue #27)
**Effort:** 2-3h

Subs > Compare tab exists but couldn't test without demo bids/solicitations.

**Acceptance Criteria:**
- [ ] With demo bids created (CLI 1), Compare tab functional
- [ ] Can compare multiple bids, amounts, line items
- [ ] Comparison displays clearly with visual indicators

---

### Task 4: Profit Margin Calculation Bug (Issue #53)
**Effort:** 2-3h

Gross Profit is -$109,369 but Profit Margin shows 0.0% instead of negative percentage.

**Location:** Finance dashboard components

**Fix:**
```typescript
// Current (broken):
const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

// Fixed:
const profitMargin = revenue !== 0 ? (grossProfit / revenue) * 100 : 0;
// Handle display of negative values
```

**Acceptance Criteria:**
- [ ] Profit Margin calculation correctly reflects negative values
- [ ] Formula: (Gross Profit / Revenue) * 100
- [ ] Handle edge cases (zero revenue)
- [ ] Display properly formatted with negative indicator

---

### Task 5: Payroll "NaNh total" Display Bug (Issue #57)
**Effort:** 1-2h

Payroll details showing "NaNh total" indicating missing/invalid hours field data.

**Location:** Payroll components

**Fix:**
```typescript
// Add validation before display
const totalHours = typeof hours === 'number' && !isNaN(hours) ? hours : 0;
const displayHours = `${totalHours.toFixed(1)}h total`;
```

**Acceptance Criteria:**
- [ ] Display actual hours worked, properly formatted
- [ ] Validate data before display
- [ ] Handle null/undefined gracefully

---

## Notification System (Issues #98-101)

### Task 6: Browser Notification Permissions (Issue #98)
**Effort:** 3-4h

Request and configure browser notifications.

**Implementation:**
```typescript
// lib/notifications/browser-notifications.ts
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
```

**Acceptance Criteria:**
- [ ] Enable toggle triggers permission request
- [ ] Store permission state
- [ ] Graceful denied handling
- [ ] Re-request option

---

### Task 7: OS-Level Notification Pass-Through (Issue #99)
**Effort:** 4-6h

Browser notifications to OS notifications.

**Acceptance Criteria:**
- [ ] Windows notification center integration
- [ ] Mac notification center integration
- [ ] Sounds configurable
- [ ] Click handling (opens app to relevant page)

---

### Task 8: Granular Notification Type Control (Issue #100)
**Effort:** 4-6h

Control notifications by type.

**Notification Types:**
- Task assignments
- Task completions
- RFI responses
- Change order approvals
- Schedule changes
- Messages

**Acceptance Criteria:**
- [ ] Enable/disable by type
- [ ] Per-project settings
- [ ] Per-contact settings
- [ ] Sound/silent preference

---

### Task 9: Do Not Disturb & Quiet Hours (Issue #101)
**Effort:** 4-6h

DND scheduling for notifications.

**Acceptance Criteria:**
- [ ] Set quiet hours (e.g., 6pm - 8am)
- [ ] Override for high-priority
- [ ] Recurring vs one-time DND
- [ ] Notification queueing during DND

---

## Future Integrations Research

### Task 10: Microanimation Sprint Planning (Issue #28)
**Effort:** 2-3h (planning only)

Create animation design guidelines and plan replacements.

**Deliverable:** `docs/ANIMATION_GUIDELINES.md`

**Acceptance Criteria:**
- [ ] Animation design guidelines documented
- [ ] Replacement plan for bouncing animations
- [ ] Sprint scope defined

---

### Task 11: Bank Integration Research - Plaid/Yodlee (Issue #51)
**Effort:** 20-30h (research + planning)

Enable bank transaction connectivity.

**Research Areas:**
- Plaid vs Yodlee vs alternatives
- Pricing comparison
- API capabilities
- Security requirements (PCI, encryption)
- Implementation complexity

**Deliverable:** `docs/research/BANK_INTEGRATION.md`

**Acceptance Criteria:**
- [ ] Vendor comparison complete
- [ ] API documentation reviewed
- [ ] Security requirements documented
- [ ] Implementation estimate provided

---

### Task 12: Neobank & Purchasing Card Research (Issue #52)
**Effort:** 4-6h (research)

Explore neobank integrations (Brex, Ramp, etc.)

**Deliverable:** `docs/research/NEOBANK_INTEGRATION.md`

**Acceptance Criteria:**
- [ ] Compatible neobanks identified
- [ ] API capabilities documented
- [ ] Implementation scope estimated

---

### Task 13: Payroll Integration Planning (Issue #58)
**Effort:** 8-12h (research + planning)

Map ContractorOS payroll data to Gusto, ADP, QuickBooks.

**Deliverable:** `docs/research/PAYROLL_INTEGRATION.md`

**Acceptance Criteria:**
- [ ] Target payroll platforms identified
- [ ] API capabilities documented
- [ ] Data mapping designed
- [ ] OAuth strategy planned

---

### Task 14: Messaging Architecture Research (Issue #61)
**Effort:** 40-60h

Comprehensive messaging platform research.

**Research Areas:**
- Competitive analysis (Slack, Teams, Asana, Monday.com)
- Open source evaluation (Rocket.Chat, Mattermost, Zulip)
- Multi-channel integration architecture
- Context persistence model
- Notification routing strategy

**Deliverable:** `docs/research/MESSAGING_ARCHITECTURE.md`

**Acceptance Criteria:**
- [ ] Competitive analysis complete
- [ ] Open source evaluation matrix
- [ ] Architecture proposal
- [ ] Design mockups
- [ ] Implementation roadmap

---

### Task 15: Custom Reports Builder Research (Issue #67)
**Effort:** 30-40h

Build custom reports capability research.

**Evaluate:**
- Metabase
- Superset
- BIRT
- JasperReports
- Grafana
- Chart libraries (Recharts, Plotly, D3)

**Deliverable:** `docs/research/CUSTOM_REPORTS.md`

**Acceptance Criteria:**
- [ ] Tools evaluated
- [ ] Recommendation made
- [ ] Implementation plan created

---

### Task 16: AI-Powered Insights Research (Issue #73)
**Effort:** 12-16h

Contextual analysis, anomalies, recommendations.

**Deliverable:** `docs/research/AI_INSIGHTS.md`

**Features to design:**
- Anomaly detection algorithms
- Predictive insights
- Natural language summaries
- Actionable alerts

**Acceptance Criteria:**
- [ ] Approach documented
- [ ] Model selection made
- [ ] Implementation plan created

---

### Task 17: AI Settings & Provider Management (Issues #88, #90-93)
**Effort:** 20-30h

AI provider configuration and security.

**Features:**
- Default AI contribution toggle (#88)
- User AI Model OAuth connection (#90)
- User API Key Management (#91)
- Multiple AI Provider Support (#92)
- Secure AI Credential Storage (#93)

**Deliverable:** `docs/research/AI_PROVIDER_MANAGEMENT.md`

**Acceptance Criteria:**
- [ ] OAuth flows designed for OpenAI, Anthropic, Google
- [ ] API key security plan (AES-256)
- [ ] Multi-provider architecture designed

---

### Task 18: Directory Integration Research (Issues #94-97)
**Effort:** 40-60h

SSO and user provisioning research.

**Features:**
- Google Workspace Integration (#94)
- Microsoft 365/AD Integration (#95)
- Automated User Onboarding (#96)
- Automated User Offboarding (#97)

**Deliverable:** `docs/research/DIRECTORY_INTEGRATION.md`

**Acceptance Criteria:**
- [ ] SAML/OAuth flows documented
- [ ] SCIM protocol evaluated
- [ ] User lifecycle automation designed
- [ ] Implementation roadmap created

---

### Task 19: Payroll Provider Integration (Issue #81)
**Effort:** 15-25h

Integrate with Gusto, ADP, etc.

**Deliverable:** `docs/research/PAYROLL_PROVIDER_INTEGRATION.md`

**Acceptance Criteria:**
- [ ] OAuth connection flow designed
- [ ] Bi-directional sync architecture
- [ ] Implementation estimate

---

## Status Updates

```
CRITICAL (Do First):
[ ] Task 1: Firebase Permission Errors
[ ] Task 2: Finances Page Error + Job Costing
[ ] Task 3: Comparison Functionality Testing
[ ] Task 4: Profit Margin Calculation Bug
[ ] Task 5: Payroll "NaNh total" Display Bug

Notification System:
[ ] Task 6: Browser Notification Permissions
[ ] Task 7: OS-Level Notification Pass-Through
[ ] Task 8: Granular Notification Type Control
[ ] Task 9: Do Not Disturb & Quiet Hours

Future Integrations Research:
[ ] Task 10: Microanimation Sprint Planning
[ ] Task 11: Bank Integration Research
[ ] Task 12: Neobank Research
[ ] Task 13: Payroll Integration Planning
[ ] Task 14: Messaging Architecture Research
[ ] Task 15: Custom Reports Builder Research
[ ] Task 16: AI-Powered Insights Research
[ ] Task 17: AI Settings & Provider Management
[ ] Task 18: Directory Integration Research
[ ] Task 19: Payroll Provider Integration
```

---

## Commands

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project contractoros-483812

# Deploy indexes
firebase deploy --only firestore:indexes --project contractoros-483812

# TypeScript check
cd apps/web && npx tsc --noEmit

# Test locally
cd apps/web && npm run dev
```

---

## Research Document Template

```markdown
# [Feature Name] Research

## Executive Summary
Brief overview of findings and recommendation.

## Requirements
- Requirement 1
- Requirement 2

## Options Evaluated
| Option | Pros | Cons | Cost | Complexity |
|--------|------|------|------|------------|
| A | ... | ... | ... | ... |
| B | ... | ... | ... | ... |

## Recommendation
Recommended approach and rationale.

## Implementation Plan
1. Phase 1: ...
2. Phase 2: ...

## Estimated Effort
X-Y hours

## Security Considerations
- Consideration 1
- Consideration 2

## Open Questions
- Question 1
- Question 2
```
