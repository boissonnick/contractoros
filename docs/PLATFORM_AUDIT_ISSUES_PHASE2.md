# ContractorOS Platform Audit Phase 2 - Issue Tracker

> **Generated:** 2026-02-02
> **Issues:** 61-101 (41 issues)
> **Focus Areas:** Messaging, Reporting & Analytics, Settings
> **Estimated Effort:** 196-282 hours (~5-7 weeks for 2-3 developers)

---

## Issue Status Legend

| Status | Description |
|--------|-------------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[!]` | Blocked |

---

## CATEGORY 1: MESSAGING MODULE (Strategic Research)

### Issue #61: Comprehensive Messaging Architecture Research & Redesign
- **Status:** `[ ]`
- **Severity:** HIGH (Strategic)
- **Type:** Research Project + Feature Redesign
- **Effort:** 40-60 hours
- **Description:** Current SMS messaging is basic. Need unified, context-aware messaging platform to address communication fragmentation across texts, calls, emails, in-app.
- **Research Requirements:**
  - [ ] Competitive analysis (Slack, Teams, Asana, Monday.com)
  - [ ] Open source evaluation (Rocket.Chat, Mattermost, Zulip)
  - [ ] Multi-channel integration architecture
  - [ ] Context persistence model
  - [ ] Notification routing strategy
- **Deliverables:**
  - [ ] Architectural documentation
  - [ ] Competitive analysis report
  - [ ] Open source evaluation matrix
  - [ ] Design mockups
  - [ ] Implementation roadmap

---

## CATEGORY 2: REPORTING & ANALYTICS

### 2A: Critical Bugs (Fix First)

#### Issue #69: Operational Reports Load Error
- **Status:** `[x]` ✅ Fixed 2026-02-02
- **Severity:** CRITICAL
- **Type:** Bug
- **Effort:** 2-4 hours
- **Location:** `app/dashboard/reports/operational/`
- **Description:** "Failed to load operational data" error - likely Firebase permissions
- **Related:** Issue #13 (Firebase permissions)
- **Acceptance Criteria:**
  - [ ] Verify Firebase rules for operational_data collection
  - [ ] Error resolved, data loads correctly
  - [ ] No console permission errors

#### Issue #76: Payroll Data Load Error in Reports
- **Status:** `[x]` ✅ Fixed 2026-02-02
- **Severity:** CRITICAL
- **Type:** Bug
- **Effort:** 2-4 hours
- **Location:** Reports payroll section
- **Description:** "Failed to load payroll data" error in Reports
- **Related:** Issue #13 (Firebase permissions)
- **Acceptance Criteria:**
  - [ ] Firebase rules updated for payroll_reports collection
  - [ ] Payroll data loads without error
  - [ ] Payroll metrics display correctly

### 2B: Navigation & Structure

#### Issue #62: Reports Top Navigation to Sidebar
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** UI Navigation
- **Effort:** 2-3 hours
- **Location:** `app/dashboard/reports/`
- **Description:** Reports has top nav (Overview, Financial, Operational) that should be sidebar sub-nav for consistency
- **Acceptance Criteria:**
  - [ ] Sidebar expanded with report type sub-items
  - [ ] Top navigation removed/repurposed
  - [ ] Consistent with other module patterns

### 2C: Demo Data Requirements

#### Issue #63: Reports Demo Data - Historical Revenue & Completed Projects
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 12-16 hours
- **Description:** Reports need backdated revenue, completed project data, detailed cost breakdowns
- **Acceptance Criteria:**
  - [ ] 3-5 completed demo projects with full P&L data
  - [ ] Backdated revenue entries (3-6 months)
  - [ ] Detailed cost breakdowns (materials, labor, equipment, subs, overhead)
  - [ ] Invoice aging data (current, 30-60-90+ days)
  - [ ] Historical expense data by category

#### Issue #64: Project Profitability Demo Data - Realistic Labor Costs
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 6-8 hours
- **Description:** Project Profitability shows $0 labor costs and inflated variances
- **Acceptance Criteria:**
  - [ ] Labor costs populated (20-50% of budget)
  - [ ] Variance calculations accurate
  - [ ] Mix of on-budget, under, and over-budget projects
  - [ ] Progress percentages realistic

#### Issue #65: Invoice Aging Demo Data
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Data Quality
- **Effort:** 3-4 hours
- **Description:** Invoice Aging needs realistic aging breakdown
- **Acceptance Criteria:**
  - [ ] 70% current invoices
  - [ ] 20% 1-30 days past
  - [ ] 5% 31-60 days past
  - [ ] 3-5% 61-90+ days past

#### Issue #70: Detailed Reports Demo Data - Complete P&Ls
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 10-14 hours
- **Description:** Detailed Reports needs comprehensive P&Ls by project
- **Acceptance Criteria:**
  - [ ] Project-level P&Ls (Revenue, Labor, Materials, Equipment, Subs, Overhead, Profit)
  - [ ] Realistic labor allocation
  - [ ] Material costs tied to quote line items
  - [ ] Subcontractor costs from demo assignments
  - [ ] 6+ months historical data

#### Issue #74: Team Productivity Demo Data
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 8-12 hours
- **Description:** Team Productivity needs time tracking tied to tasks, employee rates
- **Acceptance Criteria:**
  - [ ] Time entries for all employees across projects
  - [ ] Entries linked to specific tasks
  - [ ] Employee rates in calculations
  - [ ] Actual vs estimated hours
  - [ ] Overtime tracking
  - [ ] 4-8 weeks of data

#### Issue #75: Task Performance Metrics Demo Data
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Data Quality
- **Effort:** 6-8 hours
- **Description:** Task performance metrics - actual vs estimated hours
- **Acceptance Criteria:**
  - [ ] 50+ completed tasks with actual vs estimated
  - [ ] Mix of on-time, late, early completions
  - [ ] Productivity rates calculated
  - [ ] Performance trends visible

### 2D: UX & Feature Enhancements

#### Issue #66: Financial Reporting Customization
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature Enhancement
- **Effort:** 6-8 hours
- **Description:** Owner should customize which metrics they see
- **Acceptance Criteria:**
  - [ ] Add/remove/reorder metric cards
  - [ ] Favorite reports feature
  - [ ] Custom metric definitions
  - [ ] Save report configurations

#### Issue #67: Custom Reports Builder (Future)
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Research + Feature
- **Effort:** 30-40 hours (implementation after research)
- **Description:** Build custom reports with open source reporting library
- **Research:**
  - [ ] Evaluate: Metabase, Superset, BIRT, JasperReports, Grafana
  - [ ] SQL builder vs visual builder
  - [ ] Chart library (Recharts, Plotly, D3)

#### Issue #68: Reports as Owner's Source of Truth
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Architecture + UX
- **Effort:** 8-12 hours
- **Description:** Reports should be owner's primary dashboard with drill-down
- **Acceptance Criteria:**
  - [ ] Executive summary dashboard
  - [ ] Drill-down capability (project → task level)
  - [ ] Real-time data / configurable refresh
  - [ ] Alert system for at-risk metrics
  - [ ] Forecasting/trending features

#### Issue #71: Profitability Analysis & Percentages
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature Enhancement
- **Effort:** 4-6 hours
- **Description:** Demo data needs profitability percentages and margins
- **Acceptance Criteria:**
  - [ ] Gross profit margin % by project
  - [ ] Net profit margin % by project
  - [ ] Cost variance %
  - [ ] Labor efficiency %

#### Issue #72: Benchmarking & Comparative Analysis
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature Enhancement
- **Effort:** 8-12 hours
- **Description:** Project-to-project comparisons, trends
- **Acceptance Criteria:**
  - [ ] Project comparison view
  - [ ] Trend analysis
  - [ ] Best/worst performers highlighted
  - [ ] Budget accuracy trending

#### Issue #73: AI-Powered Insights & Anomaly Detection
- **Status:** `[ ]`
- **Severity:** MEDIUM (Future)
- **Type:** AI Feature
- **Effort:** 12-16 hours
- **Description:** Contextual analysis, anomalies, recommendations
- **Acceptance Criteria:**
  - [ ] Anomaly detection
  - [ ] Predictive insights
  - [ ] Natural language summaries
  - [ ] Actionable alerts

#### Issue #77: Enhanced Date Picker UI/UX
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** UI Enhancement
- **Effort:** 3-4 hours
- **Description:** Date picker needs quick select buttons and better UX
- **Acceptance Criteria:**
  - [ ] Quick selects: This Week, Month, Quarter, YTD
  - [ ] Custom date range picker
  - [ ] Keyboard shortcuts
  - [ ] Save to user preferences

#### Issue #78: Relative Date Selection
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature Enhancement
- **Effort:** 2-3 hours
- **Description:** Reporting should use relative dates ("Last 30 days")
- **Acceptance Criteria:**
  - [ ] Dynamic date ranges
  - [ ] Comparison periods
  - [ ] Scheduled reports use relative dates

---

## CATEGORY 3: SETTINGS & CONFIGURATION

### 3A: Organization & Tax Configuration

#### Issue #79: Fiscal Year Configuration
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature
- **Effort:** 2-3 hours
- **Description:** Allow custom fiscal year start date
- **Acceptance Criteria:**
  - [ ] Select fiscal year start month
  - [ ] Applies across all reports
  - [ ] YTD based on fiscal year
  - [ ] Period naming reflects fiscal year

#### Issue #80: Payroll Period Configuration
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature
- **Effort:** 2-3 hours
- **Description:** Define payroll frequency and start dates
- **Acceptance Criteria:**
  - [ ] Configure frequency: Weekly, Bi-weekly, Semi-monthly, Monthly
  - [ ] Set period start day
  - [ ] Configure pay date offset
  - [ ] Multiple schedule support

#### Issue #81: Payroll Provider Configuration (Future)
- **Status:** `[ ]`
- **Severity:** MEDIUM (Future)
- **Type:** Integration
- **Effort:** 15-25 hours
- **Description:** Integrate with Gusto, ADP, etc.
- **Acceptance Criteria:**
  - [ ] OAuth connection to provider
  - [ ] Auto-pull payroll periods
  - [ ] Bi-directional sync

#### Issue #83: Tax Configuration
- **Status:** `[ ]`
- **Severity:** HIGH
- **Type:** Feature
- **Effort:** 3-4 hours
- **Description:** Consolidate tax configuration into Organization settings
- **Acceptance Criteria:**
  - [ ] Federal tax rates
  - [ ] State tax rates
  - [ ] Local tax rates
  - [ ] Tax entity type

#### Issue #84: Corporate Structure Settings
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature
- **Effort:** 2-3 hours
- **Description:** Corporate structure info with integration capability
- **Acceptance Criteria:**
  - [ ] Legal name, DBA, EIN
  - [ ] Business address, type
  - [ ] Pull from QuickBooks if available

#### Issue #85: Workers Comp & Insurance Settings
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature
- **Effort:** 2-3 hours
- **Description:** Payroll tax and insurance configuration
- **Acceptance Criteria:**
  - [ ] State unemployment rates
  - [ ] FUTA rates
  - [ ] Workers comp rates

### 3B: Team & Permissions UI

#### Issue #86: Team Dropdown Layout
- **Status:** `[ ]`
- **Severity:** LOW
- **Type:** UI Layout
- **Effort:** 1-2 hours
- **Description:** Team dropdown, Roles, Permissions on one line
- **Acceptance Criteria:**
  - [ ] Single row on 1200px+ screens
  - [ ] Responsive wrapping
  - [ ] No functionality loss

### 3C: Intelligence & AI Settings

#### Issue #87: Move AI Intelligence to Organization Preferences
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Settings Organization
- **Effort:** 2-3 hours
- **Description:** "Contribute anonymized data" setting should be in Org Preferences
- **Acceptance Criteria:**
  - [ ] Move setting to Organization Preferences
  - [ ] Enabled by default (opt-out)
  - [ ] Not prominently highlighted

#### Issue #88: Default AI Intelligence Contribution
- **Status:** `[ ]`
- **Severity:** LOW
- **Type:** Configuration
- **Effort:** 1 hour
- **Description:** Setting enabled by default, not prominently displayed
- **Acceptance Criteria:**
  - [ ] Default: enabled
  - [ ] Clear explanation of data usage
  - [ ] Easy toggle off

#### Issue #89: Settings Consolidation
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Architecture
- **Effort:** 4-6 hours
- **Description:** Consolidate settings into logical groups
- **Acceptance Criteria:**
  - [ ] Audit all settings pages
  - [ ] Reorganize: User, Organization, Team, Integrations, Templates
  - [ ] Remove redundant settings
  - [ ] Document taxonomy

#### Issue #90: User AI Model Connection - OAuth (Future)
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Feature
- **Effort:** 8-12 hours
- **Description:** Users connect own AI models via OAuth
- **Acceptance Criteria:**
  - [ ] OpenAI OAuth for GPT-4
  - [ ] Anthropic OAuth for Claude
  - [ ] Google Gemini OAuth
  - [ ] Local model config (Ollama)
  - [ ] Test connection before save

#### Issue #91: User API Key Management (Future)
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Feature
- **Effort:** 4-6 hours
- **Description:** Securely input/store API keys
- **Acceptance Criteria:**
  - [ ] Input with masking
  - [ ] Key validation
  - [ ] Encrypted storage (AES-256)
  - [ ] Clear/revoke option

#### Issue #92: Multiple AI Provider Support (Future)
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Feature
- **Effort:** 6-8 hours
- **Description:** Support multiple AI providers with fallbacks
- **Acceptance Criteria:**
  - [ ] Add/remove providers
  - [ ] Set primary/fallback
  - [ ] Per-task model override
  - [ ] Cost tracking

#### Issue #93: Secure AI Credential Storage
- **Status:** `[ ]`
- **Severity:** HIGH (Security)
- **Type:** Feature
- **Effort:** 3-4 hours
- **Description:** Secure persistence of credentials
- **Acceptance Criteria:**
  - [ ] Encrypted at rest (AES-256)
  - [ ] Encrypted in transit (TLS 1.3+)
  - [ ] Access controls
  - [ ] Audit logging

### 3D: User Directory & Provisioning (Future)

#### Issue #94: Google Workspace Integration
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Integration
- **Effort:** 15-20 hours
- **Description:** SSO/SAML for user directory from Google Workspace
- **Acceptance Criteria:**
  - [ ] SAML 2.0 configuration
  - [ ] OAuth 2.0 for directory sync
  - [ ] User provisioning from Groups
  - [ ] Group-to-role mapping

#### Issue #95: Microsoft 365/AD Integration
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Integration
- **Effort:** 15-20 hours
- **Description:** Azure AD/Entra ID for enterprise provisioning
- **Acceptance Criteria:**
  - [ ] Azure AD SAML and OAuth
  - [ ] User provisioning from AD groups
  - [ ] SCIM protocol support

#### Issue #96: Automated User Onboarding
- **Status:** `[ ]`
- **Severity:** HIGH (Future)
- **Type:** Workflow
- **Effort:** 6-8 hours
- **Description:** Auto-create users from directory sync
- **Acceptance Criteria:**
  - [ ] Auto-create on group membership
  - [ ] Role assignment by group
  - [ ] Welcome email automation

#### Issue #97: Automated User Offboarding
- **Status:** `[ ]`
- **Severity:** MEDIUM (Future)
- **Type:** Workflow
- **Effort:** 4-6 hours
- **Description:** Auto-deactivate users on directory removal
- **Acceptance Criteria:**
  - [ ] Auto-deactivate on removal
  - [ ] Reassign open tasks
  - [ ] Archive user access
  - [ ] Generate offboarding checklist

### 3E: Notifications & Browser Integration

#### Issue #98: Browser Notification Permissions
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature
- **Effort:** 3-4 hours
- **Description:** Request/configure browser notifications
- **Acceptance Criteria:**
  - [ ] Enable toggle triggers permission request
  - [ ] Store permission state
  - [ ] Graceful denied handling
  - [ ] Re-request option

#### Issue #99: OS-Level Notification Pass-Through
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature
- **Effort:** 4-6 hours
- **Description:** Browser notifications to OS notifications
- **Acceptance Criteria:**
  - [ ] Windows notification center
  - [ ] Mac notification center
  - [ ] Sounds configurable
  - [ ] Click handling

#### Issue #100: Granular Notification Type Control
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature
- **Effort:** 4-6 hours
- **Description:** Control notifications by type
- **Acceptance Criteria:**
  - [ ] Enable/disable by type
  - [ ] Per-project settings
  - [ ] Per-contact settings
  - [ ] Sound/silent preference

#### Issue #101: Do Not Disturb & Quiet Hours
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Feature
- **Effort:** 4-6 hours
- **Description:** DND scheduling for notifications
- **Acceptance Criteria:**
  - [ ] Set quiet hours
  - [ ] Override for high-priority
  - [ ] Recurring vs one-time
  - [ ] Notification queueing

### 3F: Template Management

#### Issue #82: Template Management Consolidation
- **Status:** `[ ]`
- **Severity:** MEDIUM
- **Type:** Settings Organization
- **Effort:** 3-4 hours
- **Description:** Consolidate ALL templates into dedicated section
- **Acceptance Criteria:**
  - [ ] Dedicated Templates section
  - [ ] All template types: SMS, Email, Estimate, Invoice, Report, Document
  - [ ] Searchable list
  - [ ] Versioning/history
  - [ ] Sharing (public/private)

---

## PRIORITY SUMMARY

### CRITICAL (Blocks Functionality)
| ID | Issue | Effort |
|----|-------|--------|
| #69 | Operational Reports Load Error | 2-4h |
| #76 | Payroll Reports Load Error | 2-4h |

### HIGH PRIORITY (Sprint 1-2)
| ID | Issue | Effort |
|----|-------|--------|
| #61 | Messaging Research & Redesign | 40-60h |
| #62 | Reports navigation restructure | 2-3h |
| #63 | Historical revenue demo data | 12-16h |
| #64 | Labor costs demo data | 6-8h |
| #65 | Invoice aging demo data | 3-4h |
| #68 | Reports as source of truth | 8-12h |
| #70 | Detailed reports demo data | 10-14h |
| #74 | Team productivity demo data | 8-12h |
| #75 | Task performance demo data | 6-8h |
| #79 | Fiscal year configuration | 2-3h |
| #80 | Payroll period configuration | 2-3h |
| #83 | Tax configuration | 3-4h |

### MEDIUM PRIORITY (Sprint 3-4)
| ID | Issue | Effort |
|----|-------|--------|
| #66 | Financial reporting customization | 6-8h |
| #71 | Profitability analysis | 4-6h |
| #72 | Benchmarking analysis | 8-12h |
| #77 | Date picker UX | 3-4h |
| #78 | Relative date selection | 2-3h |
| #82 | Template consolidation | 3-4h |
| #84 | Corporate structure settings | 2-3h |
| #85 | Workers comp settings | 2-3h |
| #87 | AI settings reorganization | 2-3h |
| #89 | Settings consolidation | 4-6h |
| #98 | Browser notifications | 3-4h |
| #99 | OS notifications | 4-6h |
| #100 | Granular notification control | 4-6h |
| #101 | Do Not Disturb | 4-6h |

### LOW PRIORITY / FUTURE
| ID | Issue | Effort |
|----|-------|--------|
| #67 | Custom Reports Builder | 30-40h |
| #73 | AI-Powered Insights | 12-16h |
| #81 | Payroll Provider Integration | 15-25h |
| #86 | Team dropdown layout | 1-2h |
| #88 | AI contribution default | 1h |
| #90 | User AI Model OAuth | 8-12h |
| #91 | User API Key Management | 4-6h |
| #92 | Multiple AI Providers | 6-8h |
| #93 | Secure AI Credentials | 3-4h |
| #94 | Google Workspace Integration | 15-20h |
| #95 | Microsoft 365 Integration | 15-20h |
| #96 | Auto User Onboarding | 6-8h |
| #97 | Auto User Offboarding | 4-6h |

---

## EFFORT SUMMARY

| Category | Hours |
|----------|-------|
| Messaging Research | 40-60h |
| Reports Bugs | 4-8h |
| Reports Demo Data | 46-62h |
| Reports Features | 54-74h |
| Organization Settings | 12-16h |
| AI Settings (Future) | 20-30h |
| Directory Integration (Future) | 40-60h |
| Notification System | 15-20h |
| **TOTAL** | **196-282h** |

---

## RECOMMENDED SPRINT PLAN

### Sprint 38: Critical Reports & Configuration (1-2 weeks)
- Fix #69, #76 (reports load errors)
- Implement #62 (reports navigation)
- Implement #79, #80 (fiscal/payroll configuration)
- Implement #83 (tax configuration)

### Sprint 39: Reports Demo Data (2-3 weeks)
- Issues #63, #64, #65, #70, #74, #75
- Complete historical financial data
- Labor cost and productivity data

### Sprint 40: Settings Consolidation (1-2 weeks)
- Issues #82, #84, #85, #87, #89
- Template management
- Settings reorganization

### Sprint 41: Reporting Enhancements (2 weeks)
- Issues #66, #68, #71, #72
- Customization features
- Benchmarking and analysis

### Sprint 42: Notification System (1-2 weeks)
- Issues #98, #99, #100, #101
- Browser/OS notifications
- Granular controls and DND

### Sprint 43: Date UX & Polish (1 week)
- Issues #77, #78
- Date picker enhancements
- Relative date selection

### Future Sprints
- Sprint F1: Messaging Research (#61)
- Sprint F2: AI Model Integration (#90-93)
- Sprint F3: Directory Integration (#94-97)
- Sprint F4: Custom Reports Builder (#67)
- Sprint F5: AI-Powered Insights (#73)
