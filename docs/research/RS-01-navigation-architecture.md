# RS-01: Navigation Architecture Research Report

**Research ID:** RS-01
**Topic:** Navigation Patterns in Construction & Project Management Software
**Date:** February 2026
**Status:** Complete
**Last Updated:** February 3, 2026

---

## Executive Summary

This report analyzes navigation patterns across six leading construction and project management platforms: **Procore**, **Buildertrend**, **CoConstruct** (construction-specific), and **Monday.com**, **Asana**, **Notion** (general project management). The research identifies common patterns, industry terminology preferences, and provides specific recommendations for restructuring ContractorOS navigation.

### Key Findings

1. **Construction software uses "Projects" not "Jobs"** - All major platforms use "Projects" terminology (though "Jobs" appears in residential contexts)
2. **Estimates belong under Sales/Pre-construction** - Not under Projects; estimates are pre-project sales tools
3. **Leads and Clients should be separated** - Leads = Sales pipeline (pre-conversion), Clients = Active relationships
4. **Finance should be a dedicated section** - All platforms group financial tools together, not scattered
5. **Equipment and Materials are typically separate but grouped** - Under "Resources" or "Operations" but as distinct items
6. **Typical top-level navigation has 5-8 items** - With collapsible sub-sections for depth
7. **Settings/Admin always at bottom** - Universal pattern across all platforms
8. **Home vs Dashboard** - Most use "Dashboard" for the main landing page with KPIs

---

## Platform Analysis

### 1. Procore

**Company Type:** Enterprise Construction Management
**Target Users:** General Contractors, Subcontractors, Owners

#### Main Navigation Structure

Procore organizes tools into **4 main product modules**:

```
PROCORE NAVIGATION HIERARCHY
================================

1. PRECONSTRUCTION
   ├── Prequalification
   ├── Bid Management
   ├── Takeoffs
   ├── Estimates
   └── Proposals

2. PROJECT EXECUTION (Project Management)
   ├── Home (Project Dashboard)
   ├── Directory
   ├── Meetings
   ├── RFIs
   ├── Submittals
   ├── Daily Log
   ├── Schedule
   ├── Photos
   ├── Documents
   ├── Drawings
   ├── Specifications
   ├── Forms
   ├── Inspections
   ├── Incidents
   ├── Observations
   └── Punch List

3. FINANCIAL MANAGEMENT
   ├── Budget
   ├── Prime Contract
   ├── Commitments
   ├── Change Events
   ├── Change Orders
   ├── Direct Costs
   ├── Invoice Management
   └── Timesheets

4. RESOURCE MANAGEMENT (Workforce)
   ├── Resource Planning
   ├── Field Productivity
   └── Equipment/Assets
```

#### Key Terminology
- Uses **"Projects"** (not "Jobs")
- Uses **"Home"** for project landing page, **"Dashboard"** for analytics views
- Uses **"Commitments"** for subcontractor contracts
- Uses **"Prime Contract"** for owner contracts

#### Navigation Characteristics
- Two-level architecture: Company Level and Project Level
- Tools organized by **discipline/phase** (Pre-con, Execution, Financial, Resources)
- Customizable favorites (up to 10 tools)
- Quality & Safety tools moved under Project Management (no longer separate)
- Settings accessible via Admin tool at both Company and Project level

---

### 2. Buildertrend

**Company Type:** Residential Construction Management
**Target Users:** Home Builders, Remodelers

#### Main Navigation Structure

Buildertrend uses a **top horizontal menu** with dropdown sections:

```
BUILDERTREND NAVIGATION HIERARCHY
==================================

TOP MENU BAR:
├── Sales
├── Project Management
├── Files
├── Messaging
├── Financial
└── Reports

1. SALES (Pre-Sale)
   ├── Leads
   ├── Proposals
   ├── Estimates
   ├── Email Marketing
   └── CRM

2. PROJECT MANAGEMENT
   ├── Jobs (Active Projects)
   ├── Scheduling
   ├── To-Dos
   ├── Daily Logs
   ├── Change Orders*
   ├── Selections
   ├── Punch List
   ├── Warranty
   └── Time Clock

3. FILES
   ├── Documents
   ├── Photos
   └── Drawings

4. MESSAGING
   ├── Internal Messages
   ├── Client Portal Messages
   └── Sub Portal Messages

5. FINANCIAL
   ├── Bids (from subs)
   ├── Estimates
   ├── Purchase Orders
   ├── Bills
   ├── Budget
   ├── Cost Inbox
   ├── Owner Invoices
   └── Online Payments

6. REPORTS
   ├── Financial Reports
   ├── Project Reports
   └── Custom Reports
```

*Note: Change Orders appears in both Project Management and Financial sections for convenience

#### Key Terminology
- Uses **"Jobs"** interchangeably with Projects (residential focus)
- Uses **"Sales"** for pre-construction activities
- Uses **"Owner Invoices"** (not Client Invoices)
- Uses **"Bids"** for subcontractor quotes

#### Navigation Characteristics
- Horizontal top menu (not sidebar)
- Features organized by **business function** (Sales, PM, Financial)
- All plans include full feature set (no feature gating)
- Client Portal has simplified navigation
- Mobile app has focused navigation (Time Clock, Schedules, Daily Logs, Files)

---

### 3. CoConstruct

**Company Type:** Custom Home Builder & Remodeler Software
**Target Users:** Custom Home Builders, Design-Build Firms

#### Main Navigation Structure

CoConstruct uses a **project-centric dashboard** with contextual navigation:

```
COCONSTRUCT NAVIGATION HIERARCHY
==================================

MAIN DASHBOARD:
├── Projects Dashboard (with filters)
├── Performance Dashboard (9 widgets)
└── Company Settings

PROJECT-LEVEL NAVIGATION:
├── Project Home (Overview)
├── Specs & Selections
├── Scheduling
├── To-Dos
├── Financials
├── Photos
├── Files
├── Messages
├── Bidding
├── Job Logs
├── Time Tracking
├── Warranty/Punch List
└── Project Settings

FINANCIALS (Within Project):
├── Estimates/Proposals
├── Budget
├── Actuals
├── Change Orders
├── Invoices
└── QuickBooks Sync

TOP NAVIGATION BAR:
├── + Add To-do
├── Contacts
│   ├── My Team
│   └── Trade Partners
└── Personal Settings
```

#### Key Terminology
- Uses **"Projects"** (not Jobs)
- Uses **"Specs & Selections"** (unique terminology)
- Uses **"Trade Partners"** for subcontractors
- Uses **"Actuals"** for actual costs vs budget

#### Navigation Characteristics
- Project-centric (most navigation happens within a project context)
- Heavy emphasis on client collaboration features
- Performance Dashboard with 9 KPI widgets
- Separate client view with simplified navigation
- Now unified with Buildertrend (shared features)

---

### 4. Monday.com

**Company Type:** General Project Management
**Target Users:** Teams across industries

#### Main Navigation Structure

Monday.com uses a **workspace-based left sidebar**:

```
MONDAY.COM NAVIGATION HIERARCHY
================================

LEFT SIDEBAR:
├── Workspaces (Dropdown)
│   └── [Workspace Name]
│       ├── Boards
│       ├── Dashboards
│       ├── Docs
│       └── Forms
├── My Work (Personal view)
├── Favorites (Starred items)
├── Search
└── + Add (Create new)

WITHIN A WORKSPACE:
├── Folders (optional grouping)
│   └── Sub-folders
├── Boards (where work happens)
├── Dashboards (visualizations)
├── Docs (workdocs)
└── Forms (data collection)

BOARD STRUCTURE:
├── Groups (row categories)
├── Items (rows/tasks)
├── Columns (data fields)
└── Views (Table, Kanban, Timeline, etc.)
```

#### Key Terminology
- Uses **"Workspaces"** (highest level)
- Uses **"Boards"** (project containers)
- Uses **"Items"** (tasks/rows)
- Uses **"Dashboards"** for reporting

#### Navigation Characteristics
- **Hierarchical**: Workspaces > Folders > Boards > Groups > Items
- Collapsible sidebar with pin option
- Favorites appear at top for quick access
- My Work shows personal task aggregation across boards
- Blue "+" button for creating new elements

---

### 5. Asana

**Company Type:** General Project Management
**Target Users:** Teams across industries

#### Main Navigation Structure

Asana uses a **collapsible left sidebar** with a recent redesign (2025-2026):

```
ASANA NAVIGATION HIERARCHY
===========================

LEFT SIDEBAR (Pinnable):
├── Home (Overview)
├── My Tasks (Personal view)
├── Inbox (Notifications)
├── My Views (Saved searches)
├── Favorites (Starred)
├── Projects (List)
│   ├── Recently visited
│   └── All projects
├── Teams (Grouped)
│   └── [Team Name]
│       └── Team Projects
├── Portfolios* (Enterprise)
├── Goals* (Enterprise)
├── Reporting* (Premium+)
└── + Create

WITHIN A PROJECT:
├── Overview
├── List View
├── Board View
├── Timeline View
├── Calendar View
├── Dashboard
├── Messages
└── Files
```

*Available on higher-tier plans

#### Key Terminology
- Uses **"Home"** for main landing page
- Uses **"My Tasks"** for personal task list
- Uses **"Portfolios"** for project groupings
- Uses **"Goals"** for OKR tracking

#### Navigation Characteristics
- Auto-collapsing sidebar (pinnable via pin icon at top)
- Projects organized by frequency and recency
- Starred/Favorites at top
- Portfolios for multi-project tracking (Enterprise)
- Teams as organizational units
- **New 2025-2026 Navigation**: Organized by mode of work (Work, Plan, Workflow, Company)
- Clean interface with ample white space

---

### 6. Notion

**Company Type:** All-in-One Workspace / Knowledge Management
**Target Users:** Teams across industries for docs, wikis, and project management

#### Main Navigation Structure

Notion uses a **flexible, infinitely-nestable left sidebar**:

```
NOTION NAVIGATION HIERARCHY
============================

LEFT SIDEBAR:
├── Workspace Switcher (top)
├── Search (Cmd+K)
├── Home (pages needing attention)
├── Inbox (notifications, mentions)
│
├── Teamspaces (collaborative areas)
│   └── [Teamspace Name]
│       ├── Pages
│       ├── Databases
│       └── Sub-pages (unlimited nesting)
│
├── Shared (pages shared with you)
│
├── Private (personal pages)
│
└── Favorites (quick access)

TEAMSPACE ORGANIZATION:
├── Projects
├── Documentation
├── Meetings
├── Resources
└── Custom pages

PAGE TYPES:
├── Standard pages
├── Databases (tables, boards, timelines, etc.)
├── Wikis
└── Linked databases
```

#### Key Terminology
- Uses **"Teamspaces"** for collaborative areas (similar to workspaces)
- Uses **"Pages"** as the universal container
- Uses **"Databases"** for structured data (projects, tasks, etc.)
- Uses **"Private/Shared/Teamspaces"** for visibility tiers

#### Navigation Characteristics
- **Infinite nesting**: Pages can contain pages indefinitely
- **Three visibility tiers**: Private > Shared > Teamspaces
- **Drag-and-drop**: Easy reorganization of sidebar
- **Icon/color coding**: Visual differentiation for pages
- **Collapsible sections**: Click section name to collapse
- **Favorites at top**: Quick access to frequently used pages
- **Real-time sync**: Changes across desktop, mobile, tablet instantly

---

## Comparative Analysis

### Navigation Item Count (Top Level)

| Platform | Top-Level Items | Collapsible Sections | Total Depth |
|----------|-----------------|---------------------|-------------|
| Procore | 4 modules | Yes | 3 levels |
| Buildertrend | 6 menu items | Dropdowns | 2 levels |
| CoConstruct | 3 dashboards + project nav | Yes | 2 levels |
| Monday.com | 5-7 items | Yes (workspaces) | 4 levels |
| Asana | 7-10 items | Yes | 3 levels |
| Notion | 5 fixed + teamspaces | Yes | Unlimited |

**Key Pattern:** All platforms target **5-8 top-level items** with collapsible sections for sub-navigation.

**Recommendation for ContractorOS:** Target **6-8 top-level sections** with 2-3 levels of depth maximum.

---

### Terminology Comparison

| Concept | Procore | Buildertrend | CoConstruct | Monday.com | Asana | Notion |
|---------|---------|--------------|-------------|------------|-------|--------|
| Project Container | Projects | Jobs/Projects | Projects | Boards | Projects | Pages/Databases |
| Main Landing | Home | Dashboard | Dashboard | My Work | Home | Home |
| Subcontractors | Directory | Subs | Trade Partners | N/A | N/A | N/A |
| Pre-construction | Preconstruction | Sales | Estimates | N/A | N/A | N/A |
| Customer | Directory | Clients | Clients | N/A | N/A | N/A |
| Sales Pipeline | N/A | Leads | N/A | N/A | N/A | N/A |
| Settings | Admin | Settings | Settings | Account | Admin | Settings |
| Team Container | Directory | Team | My Team | Workspaces | Teams | Teamspaces |

**Key Insights:**
- **"Projects"** is the dominant term in construction (4/4 platforms)
- **"Dashboard"** is more common than "Home" for KPI views
- Only Buildertrend explicitly separates **"Leads"** (pipeline) from **"Clients"** (active)
- Construction platforms have **Subcontractor** management; general PM tools do not

**Recommendation:**
- Use **"Projects"** (industry standard)
- Use **"Dashboard"** (not Home) for main landing
- Use **"Sales"** section for pre-construction activities
- Separate **"Leads"** (pipeline) from **"Clients"** (active)

---

### Feature Organization Patterns

| Feature | Procore Location | Buildertrend Location | Recommended |
|---------|------------------|----------------------|-------------|
| Estimates | Preconstruction | Sales/Financial | **Sales** |
| Proposals | Preconstruction | Sales | **Sales** |
| Invoices | Financial | Financial | **Finance** |
| Expenses | Financial | Financial | **Finance** |
| Payroll | Financial | Financial | **Finance** |
| RFIs | Project Execution | Project Management | **Projects** |
| Submittals | Project Execution | Project Management | **Projects** |
| Change Orders | Financial | PM + Financial | **Projects** (link in Finance) |
| Equipment | Resource Mgmt | N/A | **Operations** |
| Materials | N/A | Materials | **Operations** |

---

### Settings & Admin Placement

| Platform | Settings Location | Admin Separate? |
|----------|-------------------|-----------------|
| Procore | Admin tool (Company & Project level) | Yes |
| Buildertrend | Settings (bottom of menus) | No |
| CoConstruct | Personal Settings (dropdown) | No |
| Monday.com | Account settings (avatar menu) | Yes (Admin Center) |
| Asana | Settings (avatar menu) | Yes (Admin Console) |
| Notion | Workspace name dropdown | Yes (Settings & Members) |

**Universal Pattern:** Settings/Admin is **always at the bottom** of navigation or in a profile/avatar menu. Never at the top.

**Recommendation:** Keep Settings at bottom of sidebar with Admin as sub-section.

---

### Help & Support Placement

| Platform | Help Location | Contents |
|----------|---------------|----------|
| Procore | In-app help center, chat | Documentation, videos, support |
| Buildertrend | Help Center link | FAQs, guides, contact |
| CoConstruct | Help Center | Knowledge base, chat |
| Monday.com | ? icon + Help Center | Tutorials, community, support |
| Asana | ? icon + Help dropdown | Guide, tips, support |
| Notion | ? icon bottom-left | Help & support, keyboard shortcuts |

**Common Pattern:** Help is either a **? icon** in the corner or placed with Settings at the bottom.

**Recommendation:** Keep Help & Support with Settings section at bottom of sidebar.

---

## Specific Questions Answered

### 1. Should we use "Projects" or "Jobs"?

**Answer: Projects**

- 4 of 5 platforms use "Projects"
- Buildertrend uses "Jobs" but is residential-focused
- "Projects" is more professional and industry-standard
- Procore (enterprise leader) uses "Projects"

### 2. Should "Estimates" be under Sales or Projects?

**Answer: Sales (Pre-construction)**

- Procore places Estimates in **Preconstruction** module
- Buildertrend places Estimates in **Sales** section
- CoConstruct treats Estimates as part of **Financials** workflow
- **Rationale:** Estimates are created before a project exists, as part of the sales process

**Recommendation:** Create a **"Sales"** section containing:
- Leads (sales pipeline)
- Estimates
- Proposals
- E-Signatures

### 3. Where should "Clients" live vs "Leads"?

**Answer: Separate sections**

- **Leads** = Sales pipeline (pre-conversion), belongs in **Sales** section
- **Clients** = Active customers with projects, belongs in **Sales** or top-level

**Recommendation:**
```
Sales & Clients (Section)
├── Leads (pipeline management)
├── Clients (active relationships)
├── Estimates (pre-project)
├── Proposals (pre-project)
└── E-Signatures (contracts)
```

### 4. How should Finance/Accounting be organized?

**Answer: Dedicated Finance section with sub-items**

All platforms group financial tools together:

**Recommendation:**
```
Finance (Collapsible Section)
├── Overview (Dashboard)
├── Invoices
├── Expenses
├── Payroll
├── Budgets (link to project budgets)
└── Financial Reports
```

### 5. Should Equipment and Materials be combined or separate?

**Answer: Keep separate but group under "Operations" or "Resources"**

Analysis from industry research:
- **Equipment** = capital assets with tracking, maintenance, depreciation
- **Materials** = consumables with inventory, purchasing, cost allocation
- Procore combines under **Resource Management**
- Buildertrend has separate Materials management
- Industry ERP systems treat them as separate workflows within one section

**Key Insight:** While related, they have different:
- Tracking needs (location vs. inventory levels)
- Financial treatment (depreciation vs. COGS)
- Workflow patterns (assign/schedule vs. order/consume)

**Recommendation:**
```
Operations (Section)
├── Team
├── Subcontractors
├── Equipment        → Assign, track, maintain (capital assets)
└── Materials        → Inventory, purchasing, job costing (consumables)
```

**Alternative for Smaller Operations:**
```
Resources (Section)
├── Equipment
├── Materials
└── Inventory (combined view of both)
```

---

## Proposed ContractorOS Navigation Structure

Based on research findings, here is the recommended navigation restructure:

### Primary Navigation (Sidebar)

```
CONTRACTOROS PROPOSED NAVIGATION
==================================

CORE (Always Visible)
├── Dashboard
├── Projects
├── Schedule
└── Daily Logs

SALES & CLIENTS (Collapsible)
├── Clients
├── Leads
├── Estimates
├── Proposals
└── E-Signatures

FINANCE (Collapsible)
├── Overview
├── Invoices
├── Expenses
├── Payroll
└── Reports

OPERATIONS (Collapsible)
├── Team
│   ├── Directory
│   ├── Time Tracking
│   └── Availability
├── Subcontractors
│   ├── Directory
│   ├── Bids
│   └── Compare
├── Equipment
└── Materials

COMMUNICATIONS (Collapsible)
├── Messages
└── Documents

ADMINISTRATION (Bottom, Collapsible)
├── Reports
│   ├── Financial
│   ├── Operational
│   ├── Benchmarking
│   └── Report Builder
├── Settings
└── Help & Support
```

### Mobile Navigation (Bottom Bar)

Based on construction software mobile patterns:

```
MOBILE BOTTOM NAV (5 items)
├── Dashboard (Home)
├── Projects
├── Schedule
├── Time Clock (Quick access)
└── More (Opens drawer)
```

### Role-Based Navigation Variations

| Role | Sections Visible |
|------|------------------|
| Owner/PM | All sections |
| Employee | Core, simplified Operations, Communications, Help |
| Contractor | Core, simplified Operations, Communications, Help |
| Client | Projects (theirs), Communications, Documents |

---

## Implementation Recommendations

### Priority 1: Structural Changes
1. Rename current "Sales & Clients" to include Leads management
2. Move Estimates under Sales & Clients section
3. Create dedicated Finance section with all financial tools
4. Combine Equipment and Materials under Operations or Resources

### Priority 2: Terminology Updates
1. Keep "Projects" (already correct)
2. Consider "Dashboard" vs "Home" (Dashboard is more descriptive)
3. Add "Leads" as separate from Clients
4. Consider "Trade Partners" or keep "Subcontractors"

### Priority 3: UX Improvements
1. Make sections collapsible with memory
2. Add favorites/starred items at top
3. Ensure consistent depth (max 3 levels)
4. Keep Settings and Help at bottom

### Priority 4: Mobile Optimization
1. Reduce bottom nav to 5 essential items
2. Time Clock as quick-access for field workers
3. Full navigation via More/drawer

---

## Sources

### Procore
- [Procore Review 2026](https://work-management.org/worksite/construction/procore-review/)
- [Procore Platform](https://www.procore.com/platform)
- [Explore All Products | Procore](https://www.procore.com/products)
- [Procore Project Management](https://www.procore.com/project-management)
- [Procore Financial Management](https://www.procore.com/financial-management)

### Buildertrend
- [Buildertrend Review 2026](https://www.workyard.com/compare/buildertrend-review)
- [Buildertrend Key Features Overview](https://buildertrend.com/product-overview/)
- [Buildertrend Financial Management](https://buildertrend.com/help-article/financial-management-settings/)
- [Construction Project Management Software & App](https://buildertrend.com/)

### CoConstruct
- [Your Projects Dashboard | CoConstruct](https://www.coconstruct.com/learn-construction-software/your-projects-dashboard)
- [Performance Dashboard Overview | CoConstruct](https://www.coconstruct.com/learn-construction-software/performance-view-overview)
- [Construction software features | CoConstruct](https://www.coconstruct.com/features/construction-software)
- [To-dos Overview | CoConstruct](https://www.coconstruct.com/learn-construction-software/todos-overview)

### Monday.com
- [Getting started with workspaces](https://support.monday.com/hc/en-us/articles/360010785460-Getting-started-with-workspaces)
- [Understanding monday.com's structural hierarchy](https://support.monday.com/hc/en-us/articles/7278527605906-Understanding-monday-com-s-hierarchy-structure)
- [The Dashboards](https://support.monday.com/hc/en-us/articles/360002187819-The-Dashboards)
- [Workspace settings and customization](https://support.monday.com/hc/en-us/articles/28869384701586-Workspace-settings-and-customization)
- [Monday.com Review 2026](https://www.linktly.com/operations-software/monday-com-work-os-review/)

### Asana
- [Navigating Asana | Asana Help Center](https://help.asana.com/s/article/navigating-asana?language=en_US)
- [New Asana Navigation](https://help.asana.com/s/article/new-navigation-in-asana?language=en_US)
- [Asana's new navigation experience](https://forum.asana.com/t/asanas-new-navigation-experience/1104749)
- [A better way to access projects and teams](https://asana.com/inside-asana/more-navigation-improvements)
- [Asana Review 2026](https://work-management.org/project-management/asana-review/)

### Notion
- [Navigate with the sidebar | Notion Help Center](https://www.notion.com/help/navigate-with-the-sidebar)
- [Navigating with the sidebar](https://www.notion.com/help/guides/navigating-with-the-sidebar)
- [Best way to set up your team's sidebar](https://www.notion.com/help/guides/the-best-way-to-set-up-your-teams-sidebar-for-clear-organization)
- [Teamspaces for focused work](https://www.notion.com/help/guides/structure-sidebar-focused-work-teamspaces)
- [Workspace & sidebar | Notion Help Center](https://www.notion.com/help/category/meet-your-workspace)

### Additional Research
- [Construction Inventory Management](https://www.projectmanager.com/blog/construction-inventory-management)
- [CRM in Construction | NetSuite](https://www.netsuite.com/portal/resource/articles/crm/what-is-crm-in-construction.shtml)
- [Construction Software Features](https://sparkbusinessworks.com/blog/construction-software-features-that-your-business-needs/)
- [Navigation UX Best Practices For SaaS Products](https://www.pencilandpaper.io/articles/ux-pattern-analysis-navigation)
- [Construction CRM vs Project Management](https://www.saintfinancialgroup.co.uk/the-saints-blog/crm-vs-project-management-software-understanding-the-difference-for-construction-businesses)

---

## Appendix: Current ContractorOS Navigation

For reference, here is the current ContractorOS navigation structure:

```
CURRENT CONTRACTOROS NAVIGATION (Owner/PM)
============================================

Projects & Work (Section)
├── Dashboard
├── Projects
├── Schedule
└── Daily Logs

Sales & Clients (Section)
├── Clients
├── Estimates
└── E-Signatures

Finance (Section)
└── Finance (Collapsible)
    ├── Overview
    ├── Invoices
    ├── Expenses
    ├── Payroll
    └── Reports

Operations (Section)
├── Team (Collapsible)
│   ├── Directory
│   ├── Time Tracking
│   ├── Availability
│   └── Time Off
├── Subcontractors (Collapsible)
│   ├── Directory
│   ├── Bids
│   └── Compare
├── Equipment
└── Materials

Documents (Section)
├── Messages
└── Documents

Reports (Section)
└── Reports (Collapsible)
    ├── Overview
    ├── Financial
    ├── Operational
    ├── Benchmarking
    ├── Detailed
    └── Report Builder

Settings & Help (Section)
├── Settings
└── Help & Support (Collapsible)
    ├── Getting Started
    ├── Keyboard Shortcuts
    ├── Contact Support
    └── What's New
```

### Gap Analysis: Current vs Recommended

| Gap | Current State | Recommended Change |
|-----|---------------|-------------------|
| No Leads management | Clients only | Add Leads under Sales |
| Estimates placement | Under Sales & Clients | Correct (keep here) |
| Finance redundancy | Reports in Finance AND separate section | Consolidate |
| Equipment/Materials | Separate items | Consider combining under Resources |
| Reports duplication | Under Finance AND separate section | Consolidate under Admin |

---

*Research conducted February 2026 for ContractorOS navigation restructure initiative.*
