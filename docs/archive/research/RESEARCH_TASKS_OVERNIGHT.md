# ContractorOS - Overnight Research Tasks

> **Created:** 2026-02-03
> **Purpose:** Parallel research tasks for overnight sub-agent execution
> **Output Location:** `docs/research/` (create folder if needed)

---

## How to Run These Research Tasks

Each research task below is designed to be run as a **parallel sub-agent** using the Task tool. Copy the prompts directly into your CLI session.

### Quick Start Commands

```bash
# First, create the research output folder
mkdir -p docs/research

# Then launch all research agents in parallel (copy the Task tool calls below)
```

---

## Research Task 1: Navigation Architecture (RS-01)

**Priority:** HIGH - Blocks Sprint 39 navigation restructure
**Output File:** `docs/research/RS-01-navigation-architecture.md`

### Sub-Agent Prompt (Explore + WebSearch)

```
You are a UX research agent for ContractorOS, a construction project management platform.

TASK: Research navigation patterns in construction/project management software

RESEARCH GOALS:
1. Analyze how these platforms structure their main navigation:
   - Procore (construction management)
   - Buildertrend (construction management)
   - CoConstruct (construction management)
   - Monday.com (project management)
   - Asana (project management)
   - Notion (workspace)

2. For each platform, document:
   - Top-level navigation items (what's in the main sidebar?)
   - How do they group features? (by workflow? by entity? by user role?)
   - What terminology do they use? (Projects vs Jobs vs Work?)
   - How do they handle "Home" vs "Dashboard"?
   - How deep is their navigation hierarchy?

3. Identify common patterns:
   - What navigation items appear in ALL platforms?
   - What's the typical number of top-level items?
   - How do they handle Settings/Admin?
   - How do they handle Help/Support?

4. Specific questions to answer for ContractorOS:
   - Should we use "Projects" or "Jobs"?
   - Should "Estimates" be under Sales or Projects?
   - Where should "Clients" live vs "Leads"?
   - How should Finance/Accounting be organized?
   - Should Equipment and Materials be combined or separate?

DELIVERABLE: A markdown report with:
- Screenshot descriptions or navigation tree for each platform
- Comparison table of navigation structures
- Specific recommendations for ContractorOS navigation restructure
- Proposed new navigation hierarchy

Save output to: docs/research/RS-01-navigation-architecture.md
```

---

## Research Task 2: Payroll Integration Strategy (RS-02)

**Priority:** HIGH - Needed for payroll module completion
**Output File:** `docs/research/RS-02-payroll-integration.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are an integration research agent for ContractorOS.

TASK: Research payroll platform integrations for construction companies

RESEARCH GOALS:
1. Identify the most common payroll platforms for small-medium contractors:
   - Gusto
   - ADP (Run, Workforce Now)
   - Paychex
   - QuickBooks Payroll
   - Rippling
   - OnPay
   - Patriot Payroll

2. For each platform, research:
   - Market share / popularity with contractors
   - API availability (REST API? Webhooks? Partner program?)
   - What data can be READ from payroll? (employee records, rates, tax info, pay history)
   - What data can be WRITTEN to payroll? (hours, time entries)
   - Authentication method (OAuth2, API key, etc.)
   - Pricing/partnership requirements
   - Documentation quality

3. Analyze data flow patterns:
   - Bidirectional sync vs one-way
   - Real-time vs batch updates
   - Webhook/event-driven vs polling
   - Conflict resolution approaches

4. Research how competitors handle payroll integration:
   - How does Procore integrate with payroll?
   - How does Buildertrend handle time → payroll?
   - What's the typical user flow?

5. Answer these architecture questions:
   - Should ContractorOS be the "source of truth" for hours?
   - Should employee records sync FROM payroll TO ContractorOS?
   - How do we handle rate changes?
   - What happens when an employee is terminated in payroll?

DELIVERABLE: A markdown report with:
- Comparison table of payroll platforms (API, pricing, features)
- Recommended integration priority (which platforms first?)
- Data flow diagram (text-based)
- Technical architecture recommendations
- Sample API endpoints to explore

Save output to: docs/research/RS-02-payroll-integration.md
```

---

## Research Task 3: Lead Generation Integrations (RS-06)

**Priority:** HIGH - Enables lead capture workflow
**Output File:** `docs/research/RS-06-lead-generation.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are an integration research agent for ContractorOS.

TASK: Research lead generation platform integrations for contractors

PLATFORMS TO RESEARCH:
1. Google My Business / Google Business Profile
2. Houzz Pro
3. Angi (formerly Angie's List) / HomeAdvisor
4. Thumbtack
5. Yelp for Business
6. Facebook Business / Meta Business Suite
7. Nextdoor for Business

FOR EACH PLATFORM, RESEARCH:
1. API Availability:
   - Is there a public API?
   - What's the authentication method?
   - What endpoints are available?
   - Rate limits?

2. Lead Data Available:
   - Contact info (name, email, phone)
   - Project details (type, description, timeline)
   - Location/address
   - Budget information
   - Photos/attachments

3. Integration Methods:
   - Direct API integration
   - Zapier/Make connectors available?
   - Email forwarding/parsing
   - Webhook notifications

4. Lead Response Requirements:
   - SLA requirements (respond within X hours?)
   - Two-way messaging support?
   - Quote/estimate submission?

5. Pricing/Partnership:
   - Cost for API access
   - Partner program requirements
   - Volume limits

SPECIFIC QUESTIONS:
- Which platforms have the best API for automated lead import?
- Which require email parsing as the only integration option?
- What's the typical lead data structure from each platform?
- How do competitors (Procore, Buildertrend) handle lead import?

DELIVERABLE: A markdown report with:
- Platform comparison matrix
- API availability summary
- Recommended integration approach for each
- Priority ranking (which to build first)
- Data mapping: Platform fields → ContractorOS Client fields
- Estimated development effort for each integration

Save output to: docs/research/RS-06-lead-generation.md
```

---

## Research Task 4: Expense OCR & AI Solutions (RS-07)

**Priority:** MEDIUM - Enables expense automation epic
**Output File:** `docs/research/RS-07-expense-ocr.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are an AI/ML research agent for ContractorOS.

TASK: Research OCR and AI solutions for expense management automation

OCR PLATFORMS TO RESEARCH:
1. Google Cloud Vision API
2. AWS Textract
3. Azure Computer Vision / Form Recognizer
4. Mindee (receipt-specific)
5. Veryfi (expense-specific)
6. Rossum
7. Nanonets

FOR EACH PLATFORM, RESEARCH:
1. Receipt/Invoice Processing:
   - Accuracy rates for receipts
   - Fields extracted (vendor, amount, date, line items, tax)
   - Supported document types (receipts, invoices, statements)
   - Handwritten text handling

2. Pricing:
   - Cost per document/page
   - Free tier limits
   - Volume discounts

3. Integration:
   - REST API availability
   - SDK support (JavaScript/Node.js)
   - Webhook support
   - Processing time (real-time vs async)

4. Special Features:
   - Pre-trained receipt models
   - Custom model training
   - Category/expense type detection
   - Duplicate detection
   - Multi-language support

BANK CONNECTIVITY RESEARCH:
1. Plaid
   - Transaction data available
   - Pricing structure
   - Category enrichment
   - Real-time vs batch

2. Alternatives to Plaid:
   - Yodlee
   - MX
   - Finicity
   - Teller

CATEGORIZATION RESEARCH:
1. What expense categories do contractors typically use?
2. How do QuickBooks/Xero categorize construction expenses?
3. What's the standard COA (Chart of Accounts) for contractors?

DELIVERABLE: A markdown report with:
- OCR platform comparison table
- Bank connectivity comparison table
- Recommended tech stack for expense automation
- Cost analysis for 1,000 receipts/month
- Expense category taxonomy for contractors
- Sample API integration code snippets

Save output to: docs/research/RS-07-expense-ocr.md
```

---

## Research Task 5: BI Analytics Best Practices (RS-03)

**Priority:** MEDIUM - Informs reporting module redesign
**Output File:** `docs/research/RS-03-bi-analytics.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are a business intelligence research agent for ContractorOS.

TASK: Research BI dashboards and KPIs for construction companies

RESEARCH GOALS:
1. Key Performance Indicators (KPIs) for Contractors:
   - Project profitability metrics
   - Labor efficiency metrics
   - Material cost tracking
   - Schedule adherence
   - Client satisfaction
   - Cash flow metrics

2. Research how competitors display analytics:
   - Procore Reports/Analytics
   - Buildertrend Reports
   - CoConstruct Financial Reports
   - QuickBooks Contractor Reports

3. Specific metrics to research:
   - Quote-to-close ratio (how many estimates become jobs?)
   - Average change order % (how much do projects change?)
   - Estimate accuracy (estimated vs actual cost)
   - Labor burden rate calculations
   - Gross margin by project type
   - Overhead allocation methods
   - WIP (Work in Progress) reporting

4. Dashboard design patterns:
   - What charts/visualizations work best?
   - How much data should be on one screen?
   - Drill-down patterns
   - Time period selection (MTD, YTD, custom)
   - Comparison views (this year vs last year)

5. Industry benchmarks:
   - What's a "good" gross margin for residential contractors?
   - What's typical change order percentage?
   - What's normal estimate variance?

DELIVERABLE: A markdown report with:
- Comprehensive KPI list with definitions and formulas
- Dashboard wireframe descriptions
- Industry benchmarks table
- Competitor feature comparison
- Recommended priority for ContractorOS reporting

Save output to: docs/research/RS-03-bi-analytics.md
```

---

## Research Task 6: Documents/File Storage Strategy (RS-04)

**Priority:** HIGH - Architecture decision needed
**Output File:** `docs/research/RS-04-file-storage.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are a technical architecture research agent for ContractorOS.

TASK: Research file storage strategies for construction management platforms

RESEARCH GOALS:
1. How do competitors handle document storage?
   - Procore Documents module
   - Buildertrend File Management
   - PlanGrid (now Autodesk Build)
   - Bluebeam Revu

2. For each, determine:
   - Do they store files natively or integrate with cloud storage?
   - What file types are supported?
   - File size limits?
   - Version control?
   - Folder structure approach?

3. Construction-specific document types:
   - Plans/Blueprints (PDF, DWG, RVT)
   - Specifications
   - Contracts
   - Permits
   - Photos (job site)
   - RFIs and Submittals
   - Change Orders
   - Invoices/Receipts

4. Integration options:
   - Google Drive integration patterns
   - Dropbox Business
   - Microsoft OneDrive/SharePoint
   - Box
   - AWS S3 direct

5. Technical considerations:
   - Firebase Storage limits and pricing
   - Google Cloud Storage for large files
   - CDN requirements for photos
   - Thumbnail generation
   - Search/indexing within documents

6. Scope definition questions:
   - Should ContractorOS be a file storage platform?
   - What's the MVP for document management?
   - Should we integrate with existing storage vs build native?
   - How to handle large files (plans, videos)?

DELIVERABLE: A markdown report with:
- Competitor comparison table
- File type support matrix
- Storage architecture options (native vs integration)
- Cost analysis for different approaches
- Recommended scope for MVP
- Technical architecture proposal

Save output to: docs/research/RS-04-file-storage.md
```

---

## Research Task 7: Subcontractor Invoice Ingestion (RS-05)

**Priority:** HIGH - Enables AP workflow
**Output File:** `docs/research/RS-05-subcontractor-invoices.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are an integration research agent for ContractorOS.

TASK: Research subcontractor invoice ingestion methods

RESEARCH GOALS:
1. How do contractors currently receive sub invoices?
   - Email attachments
   - Subcontractor portals
   - Mail/physical documents
   - Accounting software exports

2. Integration platforms to research:
   - Bill.com
   - Melio
   - BILL (formerly Bill.com)
   - QuickBooks AP
   - Xero Bills
   - Ramp
   - Brex

3. For each platform:
   - API for invoice import/export
   - OCR capabilities
   - Approval workflows
   - Payment processing
   - Sync with accounting software

4. Email-based invoice capture:
   - How does Bill.com's email import work?
   - Email parsing services (Parseur, Mailparser)
   - Dedicated invoice email addresses

5. Subcontractor portal patterns:
   - How does Procore handle sub invoices?
   - Self-service invoice submission
   - Required fields for sub invoices
   - Lien waiver collection

6. AP workflow research:
   - Typical approval chains
   - Three-way match (PO, Receipt, Invoice)
   - Retention handling
   - Progress billing vs lump sum

DELIVERABLE: A markdown report with:
- Invoice ingestion method comparison
- Platform integration comparison
- Recommended multi-pathway approach
- Subcontractor portal requirements
- AP workflow diagram (text-based)
- Technical architecture for invoice processing

Save output to: docs/research/RS-05-subcontractor-invoices.md
```

---

## Research Task 8: Pricing & Supplier Catalog (RS-08)

**Priority:** MEDIUM - Enables better estimating
**Output File:** `docs/research/RS-08-pricing-catalogs.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are a data/integration research agent for ContractorOS.

TASK: Research pricing data and supplier catalog integration

RESEARCH GOALS:
1. Where do contractors get pricing data?
   - Home Depot Pro
   - Lowe's Pro
   - Ferguson
   - ABC Supply
   - 84 Lumber
   - Local distributors

2. Pricing data sources:
   - RSMeans (Gordian) - construction cost data
   - Craftsman Book Company
   - HomeAdvisor cost guides
   - Manufacturer price lists

3. API/Integration availability:
   - Do major suppliers offer APIs?
   - EDI (Electronic Data Interchange) options
   - Catalog download formats (CSV, XML)
   - Real-time pricing availability

4. Product identification:
   - UPC codes
   - SKU systems (supplier-specific)
   - Manufacturer part numbers
   - Industry standard codes (MasterFormat)

5. Competitor approaches:
   - How does Procore handle pricing?
   - BuilderTrend material pricing
   - How do estimating tools (Clear Estimates, etc.) get pricing?

6. User-uploaded pricing:
   - What format should users upload?
   - How to handle price updates?
   - Bulk import patterns

DELIVERABLE: A markdown report with:
- Supplier API availability matrix
- Pricing data source comparison
- Product identification standards overview
- Recommended approach for ContractorOS
- Data model for pricing/catalog
- MVP feature set for pricing module

Save output to: docs/research/RS-08-pricing-catalogs.md
```

---

## Research Task 9: Marketing & Reviews Module (RS-09)

**Priority:** LOW - Future epic
**Output File:** `docs/research/RS-09-marketing-reviews.md`

### Sub-Agent Prompt (WebSearch + WebFetch)

```
You are a product research agent for ContractorOS.

TASK: Research marketing and review management for contractors

RESEARCH GOALS:
1. Review platforms contractors use:
   - Google Reviews (Google Business Profile)
   - Yelp
   - Angi/HomeAdvisor
   - Houzz
   - Facebook Reviews
   - BBB (Better Business Bureau)
   - Nextdoor

2. Review management tools:
   - Birdeye
   - Podium
   - NiceJob
   - GatherUp
   - Grade.us

3. For each review management tool:
   - Review aggregation features
   - Review request automation
   - Response templates
   - Reporting/analytics
   - Pricing

4. Review solicitation best practices:
   - When to ask for reviews?
   - Email vs SMS vs in-person
   - Incentive compliance (legal issues)
   - Response rate optimization

5. Marketing features for contractors:
   - Email marketing (job completion updates)
   - Referral programs
   - Before/after photo galleries
   - Project portfolio websites
   - Social media auto-posting

6. Competitor features:
   - Does Buildertrend have marketing features?
   - How does Procore handle client communication?

DELIVERABLE: A markdown report with:
- Review platform API comparison
- Review management tool comparison
- Marketing feature prioritization
- MVP scope for reviews module
- Integration requirements

Save output to: docs/research/RS-09-marketing-reviews.md
```

---

## Parallel Execution Instructions

### Option 1: Run All Research in Parallel (Recommended)

In your CLI session, send ONE message with multiple Task tool calls:

```
Launch these 9 research agents in parallel:

1. Task(Explore/WebSearch): Navigation Architecture Research
2. Task(WebSearch): Payroll Integration Research
3. Task(WebSearch): Lead Generation Research
4. Task(WebSearch): Expense OCR Research
5. Task(WebSearch): BI Analytics Research
6. Task(WebSearch): File Storage Research
7. Task(WebSearch): Subcontractor Invoice Research
8. Task(WebSearch): Pricing Catalog Research
9. Task(WebSearch): Marketing/Reviews Research

All output files go to docs/research/
```

### Option 2: Run in Batches

**Batch 1 (HIGH Priority):**
- RS-01: Navigation Architecture
- RS-04: File Storage Strategy
- RS-06: Lead Generation

**Batch 2 (HIGH Priority):**
- RS-02: Payroll Integration
- RS-05: Subcontractor Invoices

**Batch 3 (MEDIUM Priority):**
- RS-03: BI Analytics
- RS-07: Expense OCR
- RS-08: Pricing Catalogs

**Batch 4 (LOW Priority):**
- RS-09: Marketing/Reviews

---

## Expected Output

After running, you should have these files:

```
docs/research/
├── RS-01-navigation-architecture.md
├── RS-02-payroll-integration.md
├── RS-03-bi-analytics.md
├── RS-04-file-storage.md
├── RS-05-subcontractor-invoices.md
├── RS-06-lead-generation.md
├── RS-07-expense-ocr.md
├── RS-08-pricing-catalogs.md
└── RS-09-marketing-reviews.md
```

---

## Morning Review Checklist

When you wake up, review the research outputs:

1. [ ] Check `docs/research/` for completed reports
2. [ ] Review RS-01 (Navigation) - needed for Sprint 39
3. [ ] Review RS-04 (File Storage) - architecture decision needed
4. [ ] Prioritize findings into sprint tasks
5. [ ] Update `PRODUCTION_TESTING_SPRINT_PLAN.md` with research insights

---

*Document created: 2026-02-03*
