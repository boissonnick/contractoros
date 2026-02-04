# ContractorOS Research Summary

> **Consolidated findings from 9 overnight research tasks**
> Generated: February 2026

---

## Executive Summary

This document synthesizes findings from comprehensive research across 9 key areas for ContractorOS platform development. The research analyzed competitor platforms, industry standards, third-party integrations, and implementation strategies.

### Key Themes

1. **Integration-First Strategy** - Leverage existing APIs (Gusto, Plaid, Mindee, ABC Supply) rather than building from scratch
2. **Industry Standards Matter** - Use MasterFormat codes, AIA billing forms, and established construction terminology
3. **Mobile-First UX** - Field workers need streamlined mobile experiences with offline capability
4. **Compliance is Critical** - FTC review rules, lien waiver collection, and certified payroll have legal implications

---

## RS-01: Navigation Architecture

### Key Findings

| Recommendation | Rationale |
|----------------|-----------|
| Use "Projects" not "Jobs" | Industry standard across Procore, Buildertrend, CoConstruct |
| Keep 6-8 top-level nav items | Reduces cognitive load, matches competitor patterns |
| Estimates under Sales section | Logical flow: Leads → Estimates → Clients → Projects |
| Separate Leads from Clients | Different lifecycle stages require different workflows |
| Finance as dedicated section | Invoices, Expenses, Reports grouped together |
| Settings at bottom | Universal UX pattern |

### Recommended Navigation Structure

```
├── Dashboard (overview)
├── Sales
│   ├── Leads
│   ├── Estimates
│   └── Proposals
├── Projects
│   ├── Active
│   ├── Completed
│   └── Templates
├── Clients
├── Schedule
├── Finance
│   ├── Invoices
│   ├── Expenses
│   └── Reports
├── Team
│   ├── Employees
│   └── Subcontractors
└── Settings (bottom)
```

### Implementation Priority: **HIGH** (foundational UX)

---

## RS-02: Payroll Integration

### Platform Comparison

| Platform | Customers | API Quality | Construction Focus | Recommendation |
|----------|-----------|-------------|-------------------|----------------|
| **Gusto** | 400K+ | Excellent | Medium | **First integration** |
| ADP | 1M+ | Good | Low | Via Finch |
| Paychex | 740K | Medium | Low | Via Finch |
| QuickBooks Payroll | 1.4M | Good | Medium | Future phase |

### Architecture Decisions

- **ContractorOS = Source of Truth** for time/hours data
- **Payroll System = Source of Truth** for employee records, pay rates
- Sync direction: Employees FROM payroll, Hours TO payroll

### Recommended Approach

1. **Phase 1**: Gusto direct integration (native API, best docs)
2. **Phase 2**: Finch Unified API (covers 220+ payroll systems)

### Cost Estimate

- Gusto API: Free (partner program)
- Finch: $50-200/month based on connections
- **Total implementation: 139 hours (4 phases)**

### Implementation Priority: **MEDIUM** (valuable but complex)

---

## RS-03: BI Analytics & Dashboards

### Industry Benchmarks

| Metric | Residential | Commercial | Source |
|--------|-------------|------------|--------|
| Gross Margin | 18-25% | 12-16% | CFMA |
| Change Orders | 8-14% of contract | 5-10% | Industry avg |
| Quote-to-Close | 25-50% (referral) | 15-25% (cold) | HBA |
| DSO (Days Sales Outstanding) | 45-60 days | 82 days avg | CFMA |
| Project Completion Variance | ±5-10% | ±3-5% | Target |

### Recommended KPIs (MVP - 12-15 total)

**Financial Health**
- Gross Profit Margin (%)
- Net Profit Margin (%)
- Cash Flow Forecast (30/60/90 days)
- AR Aging Summary

**Project Performance**
- Work in Progress (WIP) Report
- Cost-to-Complete vs Budget
- Change Order Rate (%)
- Schedule Variance (days)

**Sales Pipeline**
- Lead Conversion Rate
- Estimate Win Rate
- Avg Days to Close
- Pipeline Value

### Dashboard Wireframes

| Dashboard | Primary Users | Key Metrics |
|-----------|---------------|-------------|
| Company Overview | Owner/PM | Revenue, margins, cash position |
| Project Profitability | PM | Budget vs actual by project |
| Cash Flow | Owner/Bookkeeper | AR/AP aging, forecasts |
| WIP Report | Owner/Accountant | % complete, billing status |
| Sales Pipeline | Sales/Owner | Funnel, conversion rates |

### Implementation Priority: **HIGH** (immediate business value)

---

## RS-04: File Storage Architecture

### Competitor Analysis

| Platform | Storage Limit | Notable Features |
|----------|--------------|------------------|
| Procore | Unlimited | Version control, markup tools |
| Buildertrend | Unlimited | Photo organization by date/room |
| Autodesk Build | 5TB/file | BIM integration |

### Recommended Hybrid Approach

| File Type | Storage Solution | Rationale |
|-----------|-----------------|-----------|
| Photos/Receipts | Firebase Cloud Storage | Native, fast, mobile-optimized |
| Plans/Blueprints | Google Drive Integration | Large files, version history |
| Documents | Google Drive Integration | Collaboration, familiar UX |

### Cost Estimate

| Usage Level | Photos/Receipts | Doc Storage | Total |
|-------------|-----------------|-------------|-------|
| Small (100 projects) | $2-5/mo | $0-12/mo | $2-17/mo |
| Medium (500 projects) | $5-15/mo | $12-50/mo | $17-65/mo |
| Large (1000+ projects) | $15-50/mo | $50-150/mo | $65-200/mo |

### Key Features Needed

- [ ] Automatic thumbnail generation
- [ ] EXIF data extraction (GPS, timestamp)
- [ ] Folder structure by project/phase
- [ ] Photo markup tools
- [ ] Offline sync for field use

### Implementation Priority: **MEDIUM** (important but not blocking)

---

## RS-05: Subcontractor Invoice Management

### Ingestion Pathways

| Method | % of Invoices | Solution |
|--------|---------------|----------|
| Email | 60% | Email parsing + OCR |
| Portal Upload | 25% | Web form + mobile upload |
| Mail/Fax | 10% | Scan + OCR |
| EDI/API | 5% | Future: B2B integrations |

### Recommended Tools

| Function | Tool | Cost |
|----------|------|------|
| AP Automation | **Bill.com** | $45-79/user/mo |
| OCR Processing | Mindee | $0.01-0.10/invoice |
| Lien Waiver Collection | Built-in feature | Included |

### Critical Requirements

1. **Three-Way Matching** (PO → Receipt → Invoice)
   - Reduces errors 50-80%
   - Catches duplicate invoices
   - Validates quantities and pricing

2. **Lien Waiver Automation**
   - Conditional waivers BEFORE payment
   - Unconditional waivers AFTER payment
   - Track by sub, project, pay period

3. **AIA G702/G703 Support**
   - Standard billing format for commercial
   - Schedule of Values integration
   - Retention tracking

### Approval Workflow

```
Invoice Received
    ↓
OCR + Data Extraction
    ↓
Three-Way Match Check
    ↓ (pass)         ↓ (fail)
Auto-Route          Flag for Review
    ↓                    ↓
Approval Chain      Manual Resolution
    ↓
Payment Scheduling
    ↓
Lien Waiver Request
```

### Implementation Priority: **HIGH** (major pain point)

---

## RS-06: Lead Generation Integrations

### Platform Priority Matrix

| Priority | Platform | API Quality | Lead Volume | Dev Days |
|----------|----------|-------------|-------------|----------|
| **P1** | Meta Lead Ads | Excellent | High | 3-5 |
| **P1** | Thumbtack | Good | High | 4-6 |
| P2 | Angi (HomeAdvisor) | Medium | Medium | 5-7 |
| P2 | Google Business | Good | Medium | 3-4 |
| P2 | Nextdoor | Medium | Low-Med | 4-5 |
| P3 | Houzz | Limited | Low | 5-7 |
| P3 | Yelp | Limited | Low | 3-4 |

### Integration Architecture

```
External Platform → Webhook → Queue → Lead Processor → ContractorOS Lead
                                           ↓
                                    Deduplication
                                           ↓
                                    Auto-Assignment
                                           ↓
                                    Notification
```

### Lead Source Attribution

Track by source for ROI analysis:
- Cost per lead by platform
- Conversion rate by source
- Time to close by source
- Average deal size by source

### Total Implementation: **29-43 dev days** for all platforms

### Implementation Priority: **MEDIUM** (revenue driver, but manual entry works)

---

## RS-07: Expense OCR & Bank Connectivity

### OCR Platform Comparison

| Platform | Accuracy | Cost/Receipt | Best For |
|----------|----------|--------------|----------|
| **Mindee** | 95%+ | $0.01-0.10 | **Recommended for receipts** |
| AWS Textract | 90-95% | $0.015/page | Complex invoices |
| Google Doc AI | 90-95% | $0.01/page | Google ecosystem |
| Veryfi | 95%+ | $0.05-0.15 | All-in-one solution |

### Bank Connectivity Comparison

| Platform | Coverage | Cost | Best For |
|----------|----------|------|----------|
| **Plaid** | 12,000+ FIs | ~$1.50/user/mo | **Recommended** |
| Yodlee | 17,000+ FIs | Enterprise | Large deployments |
| MX | 10,000+ FIs | Enterprise | Credit unions |
| Finicity | 10,000+ FIs | Variable | Mortgage focus |

### Cost Estimate (1,000 receipts/mo + 50 bank connections)

| Service | Low | High |
|---------|-----|------|
| Mindee OCR | $10/mo | $100/mo |
| Plaid | $50/mo | $100/mo |
| AWS Textract (backup) | $5/mo | $30/mo |
| **Total** | **$65/mo** | **$230/mo** |

### Integration Flow

```
Receipt Photo → Mindee OCR → Extracted Data → Review UI → Expense Record
                                   ↓
Bank Transaction → Plaid Sync → Match Engine → Auto-Categorize
```

### Key Features

- [ ] Real-time receipt scanning (mobile camera)
- [ ] Automatic transaction matching
- [ ] Category suggestions based on vendor
- [ ] Duplicate detection
- [ ] Mileage tracking integration

### Implementation Priority: **HIGH** (daily pain point for contractors)

---

## RS-08: Pricing Catalogs & Cost Data

### Supplier API Priority

| Supplier | API Availability | Coverage | Cost | Priority |
|----------|-----------------|----------|------|----------|
| **ABC Supply** | Free, comprehensive | National | Free | **P1 - First** |
| SRS Distribution | Partner program | Regional | Free | P2 |
| Beacon/QXO | Limited | National | Varies | P2 |
| Local distributors | None | Local | N/A | Manual import |

### Cost Data Sources

| Source | Coverage | Cost | Update Frequency |
|--------|----------|------|------------------|
| **RSMeans** | Comprehensive | $300-$5,973/yr | Quarterly |
| Craftsman Book | Good | $50-150/book | Annual |
| BNi Building News | Regional | $100-300/yr | Annual |

### Categorization Standard

**MasterFormat (CSI) Divisions** - Industry standard for construction

| Division | Category | Examples |
|----------|----------|----------|
| 03 | Concrete | Foundations, flatwork |
| 06 | Wood/Plastics | Framing, trim |
| 07 | Thermal/Moisture | Roofing, insulation |
| 08 | Openings | Doors, windows |
| 09 | Finishes | Drywall, paint, flooring |
| 22 | Plumbing | Fixtures, piping |
| 26 | Electrical | Wiring, fixtures |

### MVP Features

1. **Custom Price Book**
   - CSV/Excel import
   - Manual entry
   - Labor rates by trade

2. **ABC Supply Integration**
   - Real-time pricing
   - Product search
   - Availability check

3. **RSMeans Data** (Phase 2)
   - Regional cost adjustments
   - Assembly-based estimates
   - Labor productivity factors

### Implementation Priority: **MEDIUM** (valuable for estimates)

---

## RS-09: Marketing & Review Management

### Platform Priority

| Platform | % of Reviews | API Access | Priority |
|----------|-------------|------------|----------|
| **Google Business Profile** | 70%+ | Good | **P0 - Critical** |
| Facebook | 15-20% | Limited | P1 |
| Yelp | 5-10% | Restricted | P2 |
| Houzz | 5% | Limited | P3 |
| Angi | 3-5% | None | Manual |

### Review Solicitation Tools

| Tool | Cost | Features | Recommendation |
|------|------|----------|----------------|
| **NiceJob** | $75/mo | SMS+Email, automation | **MVP choice** |
| Birdeye | $299/mo | Full suite | Enterprise |
| Podium | $399/mo | SMS focus | High volume |
| GatherUp | $99/mo | Good automation | Mid-market |

### Optimal Request Timing

| Project Stage | Channel | Response Rate |
|---------------|---------|---------------|
| Project complete + 1-3 days | SMS | 25-35% |
| Project complete + 1 week | Email | 10-15% |
| After positive feedback | In-person ask | 50%+ |

### FTC Compliance Requirements

**Critical: Consumer Review Fairness Act**
- $53,088 per violation for fake reviews
- Cannot suppress negative reviews contractually
- Must disclose incentivized reviews
- Cannot cherry-pick which reviews to display

### Key Features

- [ ] Automated review requests (SMS + Email)
- [ ] Review monitoring dashboard
- [ ] Response templates
- [ ] Project gallery for social proof
- [ ] Referral program tracking

### Implementation Priority: **MEDIUM** (long-term growth driver)

---

## Implementation Roadmap

### Phase 1: Foundation (Current Sprint Focus)

| Feature | Research | Priority | Effort |
|---------|----------|----------|--------|
| Navigation Restructure | RS-01 | HIGH | 2-3 days |
| BI Dashboard MVP | RS-03 | HIGH | 5-7 days |
| Expense OCR | RS-07 | HIGH | 5-7 days |

### Phase 2: Financial Operations

| Feature | Research | Priority | Effort |
|---------|----------|----------|--------|
| Subcontractor Invoices | RS-05 | HIGH | 7-10 days |
| Bank Connectivity | RS-07 | HIGH | 3-5 days |
| File Storage (Photos) | RS-04 | MEDIUM | 5-7 days |

### Phase 3: Integrations

| Feature | Research | Priority | Effort |
|---------|----------|----------|--------|
| Gusto Payroll | RS-02 | MEDIUM | 10-15 days |
| Meta Lead Ads | RS-06 | MEDIUM | 3-5 days |
| ABC Supply Catalog | RS-08 | MEDIUM | 5-7 days |

### Phase 4: Growth Features

| Feature | Research | Priority | Effort |
|---------|----------|----------|--------|
| Review Management | RS-09 | MEDIUM | 5-7 days |
| Additional Lead Sources | RS-06 | LOW | 15-20 days |
| RSMeans Integration | RS-08 | LOW | 7-10 days |
| Finch Unified Payroll | RS-02 | LOW | 10-15 days |

---

## Cost Summary

### Third-Party Services (Monthly, Mid-Size Contractor)

| Service | Low | High | Notes |
|---------|-----|------|-------|
| Mindee OCR | $10 | $100 | 500-5,000 receipts |
| Plaid | $50 | $100 | 25-100 bank connections |
| File Storage | $17 | $65 | Firebase + Google Drive |
| NiceJob | $75 | $75 | Review management |
| Bill.com | $45 | $79 | AP automation (optional) |
| RSMeans | $25 | $100 | Cost data (optional) |
| **Total** | **$222** | **$519** | Per contractor/month |

### Development Effort Summary

| Area | Days | Notes |
|------|------|-------|
| Navigation + UX | 3-5 | RS-01 |
| BI Dashboards | 10-15 | RS-03 |
| File Storage | 7-10 | RS-04 |
| Subcontractor Invoices | 10-15 | RS-05 |
| Expense OCR + Banking | 10-15 | RS-07 |
| Payroll Integration | 15-20 | RS-02 |
| Lead Generation | 29-43 | RS-06 |
| Pricing Catalogs | 10-15 | RS-08 |
| Review Management | 7-10 | RS-09 |
| **Total** | **101-148 days** | Full implementation |

---

## Quick Reference: Recommended Vendors

| Function | Primary Choice | Backup | Why |
|----------|---------------|--------|-----|
| OCR | Mindee | AWS Textract | Best accuracy/cost for receipts |
| Banking | Plaid | Yodlee | Coverage + developer experience |
| Payroll | Gusto | Finch | API quality + market share |
| AP Automation | Bill.com | Built-in | Market leader, good API |
| Reviews | NiceJob | Birdeye | Best value for SMB |
| Supplier Data | ABC Supply | Manual import | Free API, national coverage |
| Cost Data | RSMeans | Craftsman | Industry standard |
| Lead Ads | Meta | Thumbtack | Best API, highest volume |

---

## Appendix: Research File Index

| File | Lines | Topic |
|------|-------|-------|
| RS-01-navigation-architecture.md | 847 | Navigation UX patterns |
| RS-02-payroll-integration.md | 1,471 | Payroll API comparison |
| RS-03-bi-analytics.md | 963 | KPIs and dashboards |
| RS-04-file-storage.md | 989 | Storage architecture |
| RS-05-subcontractor-invoices.md | 1,132 | AP automation |
| RS-06-lead-generation.md | 963 | Lead platform APIs |
| RS-07-expense-ocr.md | 1,435 | OCR + banking |
| RS-08-pricing-catalogs.md | 1,106 | Supplier/cost APIs |
| RS-09-marketing-reviews.md | 1,078 | Review management |
| **Total** | **~10,000** | |

---

*Research conducted February 2026 for ContractorOS platform development*
