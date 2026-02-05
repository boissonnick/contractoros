# ContractorOS - Production Testing Sprint Plan

> **Source:** Live production walkthrough - February 3, 2026
> **Tester:** Nick Bodkins
> **Environment:** Cloud Docker deployment
> **Focus:** UI/UX, Usability, Bugs, Feature Gaps

---

## Sprint Context

**Current Sprint:** 37B (UI/Layout + Animations)
**Existing Audit Plan:** Sprints 37-46 (see `SPRINT_STATUS.md`)
**Future Roadmap:** Sprints 47-64 (see `IMPLEMENTATION_ROADMAP_2026.md`)

**This document adds Phase 3 audit findings** to be integrated into existing sprint plan.

---

## Executive Summary

**Total Issues Identified:** 35 items (Phase 3 Audit)
- **Critical Bugs (P0):** 2
- **High-Priority Bugs (P1):** 6
- **UI/UX Improvements:** 11
- **Navigation/IA:** 3
- **Data Architecture:** 2
- **Integrations/Features:** 4
- **Research Epics:** 7

**Recommended Integration into Existing Sprints:**
| Existing Sprint | Add These Items | Notes |
|-----------------|-----------------|-------|
| Sprint 37B (Current) | PROD-001, PROD-002 (P0 bugs) | Critical blockers - fix immediately |
| Sprint 38 (Demo Data Core) | PROD-003 to PROD-014 | Quick UI wins alongside demo data |
| Sprint 40 (Navigation) | PROD-015 to PROD-017 | Already planned for nav work |
| Sprint 47+ (Future) | PROD-028 to PROD-036 | Integrations & research epics |

---

## Immediate: Add to Sprint 37B (Current)

**Priority:** CRITICAL - Fix before continuing other work
**Goal:** Fix P0 blockers discovered in production testing

### P0 - Critical Bugs (MUST FIX IN 37B)

| ID | Issue | Location | Root Cause | Fix |
|----|-------|----------|------------|-----|
| PROD-001 | **Create Client Button Error** | Client creation flow | Required field not populated | Debug error, make field optional or provide default |
| PROD-002 | **Finance Reports Dashboard Error** | Dashboard > Reports > Financial | Unknown (query/API/data) | Debug and fix data loading |

---

## Add to Sprint 38: Demo Data Core

**Existing Sprint 38 Focus:** Demo Data (Core) - 40-55h
**Add These Items:** P1 bugs + Quick UI wins (can be done alongside demo data work)

### P1 - High-Priority Bugs

| ID | Issue | Location | Fix | Effort |
|----|-------|----------|-----|--------|
| PROD-003 | State text truncation | Client form/address | Expand field width/responsive | Small |
| PROD-004 | Fred data not live/updated | Dashboard/Data feeds | Verify API/data pipeline refresh | Medium |
| PROD-005 | Weather showing in two locations | Schedule page | Consolidate to single location | Small |
| PROD-006 | Side menu accordion behavior | Side navigation | Implement single-open accordion | Small |
| PROD-007 | Finance module duplicate menu | Finance side nav | Remove duplicate entry | Small |
| PROD-008 | Settings & Help/Support duplicates | Side navigation | Consolidate Settings; separate Help | Small |

### Quick UI Wins

| ID | Issue | Location | Fix | Effort |
|----|-------|----------|-----|--------|
| PROD-009 | Phone number formatting | Contact/Client forms | Real-time formatting on input | Small |
| PROD-010 | Form field requirement indicators | All forms | Add asterisk/Optional labels | Small |
| PROD-011 | Materials vs Equipment navigation | Side navigation | Separate or clarify structure | Small |
| PROD-012 | Messaging navigation | Side navigation | Move to own top-level section | Small |
| PROD-013 | Operations navigation nesting | Operations section | Flatten navigation | Small |
| PROD-014 | Weather integration in calendar | Schedule page calendar | Layer weather into calendar header | Medium |

---

## Add to Sprint 40: Navigation Architecture

**Existing Sprint 40 Focus:** Navigation Architecture - 18-26h
**Add These Items:** Navigation restructure items from production testing

### Navigation & Information Architecture (Add to Sprint 40)

| ID | Issue | Scope | Research Needed | Effort |
|----|-------|-------|-----------------|--------|
| PROD-015 | **Primary Navigation Restructuring** | Main sidebar | YES - Competitive analysis (Asana, Monday, Procore) | Large |
| PROD-016 | Estimates module location | Sales & Clients → Projects | No | Small |
| PROD-017 | Clients module reorganization | Split by status: Leads/Active/Past/Inactive | YES - State machine design | Medium |

### Dashboard & Core UX

| ID | Issue | Scope | Effort |
|----|-------|-------|--------|
| PROD-018 | **Dashboard customization** | Customizable widgets, reduce blank space, add KPIs | Large |
| PROD-019 | Dashboard content redesign | Better information density, visual hierarchy | Large |
| PROD-020 | Irrelevant metrics in Client view | Remove Lifetime Revenue/Outstanding Balance | Small |

### Data Architecture

| ID | Issue | Scope | Database Changes | Effort |
|----|-------|-------|------------------|--------|
| PROD-021 | **Lead-to-Client State Machine** | Define states: Lead → Active → Past → Inactive | YES | Medium |
| PROD-022 | Address API standardization | Integrate Google Maps/SmartyStreets | No (API integration) | Medium |

### Additional Items (Add to Sprint 38-39)

| ID | Issue | Scope | Add to Sprint | Effort |
|----|-------|-------|---------------|--------|
| PROD-023 | Signature request testing mode | Build test/demo mode for signatures | 39 | Small |
| PROD-024 | Estimate follow-up automation | Suggested follow-ups based on age | 41 (Finance) | Small-Medium |
| PROD-025 | Estimate viewing tracker (DocSend-style) | Track views, notifications, analytics | 41 (Finance) | Medium |
| PROD-026 | Subcontractor insurance management | Upload, track expiration, alerts | 39 | Medium |
| PROD-027 | Demo data seeding | Comprehensive test dataset | 38-39 | Medium |

---

## Future Sprints (47+): Major Features & Integrations

**Note:** These align with the existing Implementation Roadmap (Sprints 47-64)
**Priority:** Strategic - Add to future roadmap
**Duration:** Ongoing (multi-sprint epics)

### Integration Epics

| ID | Epic | Scope | Research | Effort |
|----|------|-------|----------|--------|
| PROD-028 | **Lead Generation Integrations** | Google My Business, Houzz, Angi, Local Ads | YES - API capabilities | Large |
| PROD-029 | **Subcontractor Invoice Ingestion** | QuickBooks, Bill.com, Email, Manual upload | YES - Integration patterns | Large |
| PROD-030 | **Pricing & Supplier Catalog** | Pro pricing, user uploads, UPC/SKU lookups | YES - Supplier APIs | Large |
| PROD-031 | **Payroll Integration Strategy** | ADP, Gusto, Paychex, Rippling, QB Payroll | YES - Data flow architecture | Medium (research first) |

### AI/ML Epic

| ID | Epic | Scope | Research | Effort |
|----|------|-------|----------|--------|
| PROD-032 | **Expense Management with OCR/AI** | Receipt OCR, categorization, bank feeds, Plaid | YES - OCR solutions (Google Vision, AWS Textract) | Large |

### Research & Strategic Epics

| ID | Epic | Scope | Priority |
|----|------|-------|----------|
| PROD-033 | **Advanced BI Analytics** | Quote accuracy, change orders, cost trends | Medium-High |
| PROD-034 | **Marketing Module** | Comprehensive marketing management | Medium |
| PROD-035 | **Reviews & Reputation Management** | Google/Yelp/Angi integration, solicitation | Medium |
| PROD-036 | **Documents/File Storage Strategy** | Define scope, storage approach, limitations | HIGH (decision needed) |

---

## Research Spikes Required

Before implementing major features, these research spikes are needed:

| ID | Research Topic | Questions to Answer | Sprint |
|----|----------------|---------------------|--------|
| RS-01 | Navigation Architecture | How do Procore, Buildr, Monday structure nav? | Sprint 39 |
| RS-02 | Payroll Integration | Common platforms, API capabilities, data flow | Sprint 40 |
| RS-03 | BI Analytics | Benchmark metrics, best practices for contractors | Sprint 40 |
| RS-04 | Documents/File Storage | What's in/out of scope? Integration vs native? | Sprint 39 |
| RS-05 | Pricing Integration | Supplier APIs, data formats, standards | Sprint 40+ |
| RS-06 | Lead Generation | Integration points with Google, Houzz, Angi | Sprint 40+ |
| RS-07 | Expense OCR | Best AI solutions, categorization approaches | Sprint 40+ |
| RS-08 | Marketing Module | Scope definition, competitive analysis | Sprint 41+ |
| RS-09 | Reviews Management | Third-party platform APIs, capabilities | Sprint 41+ |

---

## Detailed Issue Descriptions

### PROD-001: Create Client Button Error (CRITICAL)

**Location:** Client creation flow (post-onboarding)
**Severity:** CRITICAL - Blocks core workflow
**Symptoms:** Error when clicking "Create Client"

**Root Cause Analysis (Investigated 2026-02-03):**

The client creation flow involves:
- **Modal:** `apps/web/components/clients/AddClientModal.tsx`
- **Function:** `createClient()` in `apps/web/lib/hooks/useClients.ts:433-462`
- **Collection Path:** `organizations/{orgId}/clients`
- **Firestore Rules:** Lines 2043-2054 in `firestore.rules`

**Potential Root Causes (in order of likelihood):**

1. **Missing User Profile (HIGH)** - User authenticated but `/users/{uid}` document doesn't exist
   - Firestore rule `userProfileExists()` check fails
   - Error: `Missing or insufficient permissions`
   - **Fix:** Ensure user profile created during onboarding

2. **Role Permission Issue (MEDIUM)** - User role is not OWNER or PM
   - Rule: `getUserProfile().role in ['OWNER', 'PM']`
   - **Fix:** Verify user's role, update if needed

3. **Missing orgId (MEDIUM)** - `profile?.orgId` is undefined when modal opens
   - Function throws: `Organization ID required`
   - **Fix:** Add loading state, don't show modal until profile loaded

4. **Schema Mismatch (LOW)** - Form not providing all required fields
   - Required by schema: `firstName`, `lastName`, `email`, `status`, `source`, `isCommercial`, `preferredCommunication`, `contacts`, `addresses`
   - Form provides defaults for: `status` (potential), `source` (other), `contacts` ([]), `addresses` ([])
   - **Fix:** Verify `isCommercial` and `preferredCommunication` have defaults

**Debug Steps:**
```javascript
// In browser console, check for:
1. FirebaseError: Missing or insufficient permissions
2. Error: Organization ID required
3. Zod validation errors in console
```

**Key Files:**
| File | Lines | Purpose |
|------|-------|---------|
| `components/clients/AddClientModal.tsx` | 82-128 | Form submission |
| `lib/hooks/useClients.ts` | 433-462 | createClient function |
| `firestore.rules` | 2043-2054 | Security rules |
| `types/domains/client.ts` | 105-146 | Client type definition |

---

### PROD-002: Finance Reports Dashboard Error (CRITICAL)

**Location:** Dashboard > Reports > Financial
**Severity:** CRITICAL - Blocks feature access
**Symptoms:** Error when accessing finance reports page

**Root Cause Analysis (Investigated 2026-02-03):**

The finance reports page uses:
- **Page:** `apps/web/app/dashboard/reports/financial/page.tsx`
- **Hook:** `useFinancialReports()` in `lib/hooks/reports/useFinancialReports.ts`

**Data Queries (7 collections queried in parallel):**
```typescript
// Line 40-47 in useFinancialReports.ts
projects, expenses, invoices, timeEntries, users, clients, subAssignments
```

**CRITICAL FINDING:** The hook queries **TOP-LEVEL collections** with `where('orgId', '==', orgId)`:
```typescript
getDocs(query(collection(db, 'invoices'), where('orgId', '==', orgId)))
```

However, other hooks use **ORG-SCOPED collections**:
```typescript
// useInvoices.ts uses:
`organizations/${orgId}/invoices`
```

**Potential Root Causes (in order of likelihood):**

1. **Collection Path Inconsistency (HIGH)** - Data may be stored in org-scoped paths but queried at top-level
   - Hook queries: `invoices`, `expenses`, `clients`
   - Data stored in: `organizations/{orgId}/invoices`, etc.
   - **Fix:** Align collection paths across all hooks

2. **Missing Firestore Rules (MEDIUM)** - Top-level collection rules may be incomplete
   - Rules exist for: `projects`, `expenses`, `invoices`, `timeEntries`, `users`, `clients`, `subAssignments`
   - All have read rules checking `resource.data.orgId == getUserProfile().orgId`
   - **Fix:** Verify rules deployed, check for rule evaluation errors

3. **Empty/Missing Data (MEDIUM)** - No demo data in these collections
   - Page expects data but finds none
   - Division by zero or null reference errors
   - **Fix:** Seed demo data for all 7 collections

4. **Missing orgId (LOW)** - `profile?.orgId` undefined when hook runs
   - Hook early-returns if no orgId
   - **Fix:** Add loading state to page

**Debug Steps:**
```javascript
// In browser console, look for:
1. "Failed to fetch financial data:" error message
2. FirebaseError: Missing or insufficient permissions
3. TypeError: Cannot read properties of undefined
```

**Key Files:**
| File | Lines | Purpose |
|------|-------|---------|
| `app/dashboard/reports/financial/page.tsx` | 326-384 | Page with error handling |
| `lib/hooks/reports/useFinancialReports.ts` | 33-351 | Data fetching hook |
| `firestore.rules` | 87, 435, 720, etc. | Collection rules |

---

### PROD-015: Primary Navigation Restructuring

**Current Problems:**
- "Home" vs "Dashboard" terminology confusing
- "Projects" and "Work" don't make conceptual sense
- Navigation doesn't align with user workflows

**Research Required:**
- Analyze Asana, Monday.com, Procore, Buildr navigation patterns
- Map user "jobs to be done" to navigation structure
- Consider: Clients → Projects → Jobs → Tasks hierarchy

**Deliverable:** Navigation architecture proposal document

---

### PROD-018: Dashboard Customization

**Current State:** Fixed layout with ~50% blank space
**Target State:** Customizable dashboard similar to Spotify visual dashboard

**Features Needed:**
- Drag-and-drop widget arrangement
- Widget library: KPIs, recent activities, upcoming jobs, weather, alerts
- User preference persistence
- Responsive grid layout

---

### PROD-021: Lead-to-Client State Machine

**Defined States:**
1. **Lead** - Newly captured from integrations
2. **Active** - Current/ongoing client relationship
3. **Past** - Completed work, historical record
4. **Inactive** - Dormant, no longer active

**Database Changes:**
- Add `status` field to Client type
- Add `leadSource` field for attribution tracking
- Add `statusHistory` for tracking transitions

**Benefits:**
- Clear CRM workflow
- Lead source attribution
- Conversion metrics by source
- Separate views by client status

---

### PROD-032: Expense Management with OCR/AI (Epic)

**Input Methods:**
1. Manual upload (receipt images/PDFs)
2. Credit card import (direct connections)
3. Bank/CC feed integrations (automatic)
4. OCR from store receipts (AI-powered)
5. Plaid integration option

**OCR & AI Capabilities:**
- Automatic expense categorization
- Supplier extraction from receipts
- PO/Invoice number extraction
- Job/Project tagging
- Amount & date parsing
- Tax information capture

**Research Needed:**
- Best AI OCR solutions (Google Vision, AWS Textract, Azure Computer Vision)
- Categorization taxonomies
- Plaid vs other bank connectivity options

---

## Effort Estimates Summary

| Category | Count | Typical Effort |
|----------|-------|----------------|
| Quick Fixes (< 1 day) | 12 | 1-4 hours each |
| Small (1-3 days) | 8 | 8-24 hours each |
| Medium (1-2 weeks) | 7 | 40-80 hours each |
| Large (2-4 weeks/Epic) | 6 | 80-160 hours each |
| Research Spikes | 9 | 8-24 hours each |

---

## Success Metrics

### Sprint 38 Success Criteria
- [ ] Create Client flow works without errors
- [ ] Finance Reports page loads successfully
- [ ] All duplicate navigation entries removed
- [ ] Phone numbers format correctly in forms
- [ ] Form fields clearly indicate required vs optional

### Sprint 39 Success Criteria
- [ ] Navigation restructure proposal approved
- [ ] Client state machine implemented
- [ ] Dashboard has at least 3 customizable widgets
- [ ] Address autocomplete working
- [ ] Insurance tracking for subcontractors operational

### Long-term Success Criteria
- [ ] Lead generation integrations live (at least 2 platforms)
- [ ] Expense OCR achieving >90% accuracy
- [ ] Payroll integration with at least 1 major provider
- [ ] BI dashboard with key metrics operational

---

## Related Documentation

- `docs/SPRINT_STATUS.md` - Overall sprint tracking
- `docs/PLATFORM_AUDIT_ISSUES.md` - Phase 1 audit (60 issues)
- `docs/PLATFORM_AUDIT_ISSUES_PHASE2.md` - Phase 2 audit (41 issues)
- `docs/MASTER_ROADMAP.md` - Complete feature backlog
- `docs/ARCHITECTURE.md` - Technical architecture

---

## Next Actions

1. **Immediate:** Investigate PROD-001 and PROD-002 (Critical bugs)
2. **This Week:** Complete all Sprint 38 quick wins
3. **Next Week:** Begin navigation research spike (RS-01)
4. **Ongoing:** Update this document as issues are resolved

---

## Overnight Research Tasks

**Full Details:** `docs/RESEARCH_TASKS_OVERNIGHT.md`

| ID | Research Topic | Priority | Output File |
|----|----------------|----------|-------------|
| RS-01 | Navigation Architecture | HIGH | `docs/research/RS-01-navigation-architecture.md` |
| RS-02 | Payroll Integration | HIGH | `docs/research/RS-02-payroll-integration.md` |
| RS-03 | BI Analytics | MEDIUM | `docs/research/RS-03-bi-analytics.md` |
| RS-04 | File Storage Strategy | HIGH | `docs/research/RS-04-file-storage.md` |
| RS-05 | Subcontractor Invoices | HIGH | `docs/research/RS-05-subcontractor-invoices.md` |
| RS-06 | Lead Generation | HIGH | `docs/research/RS-06-lead-generation.md` |
| RS-07 | Expense OCR | MEDIUM | `docs/research/RS-07-expense-ocr.md` |
| RS-08 | Pricing Catalogs | MEDIUM | `docs/research/RS-08-pricing-catalogs.md` |
| RS-09 | Marketing/Reviews | LOW | `docs/research/RS-09-marketing-reviews.md` |

---

*Document created: 2026-02-03*
*Last updated: 2026-02-03*
