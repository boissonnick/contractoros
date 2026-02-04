# ContractorOS Sprint Plan: Research Integration

> **Created:** 2026-02-04
> **Based On:** Research Summary from RS-01 through RS-09
> **Purpose:** Integrate overnight research findings into existing roadmap
> **Status:** MERGED INTO IMPLEMENTATION_ROADMAP_2026.md

---

## Sprint Status Summary

| Sprint | Focus | Status |
|--------|-------|--------|
| 37A | Critical Bugs | ✅ COMPLETE |
| 37B | UI/Layout + Animations | ✅ COMPLETE |
| 37C | Security Fixes | ✅ COMPLETE |
| 38 | Demo Data (Core) | ✅ COMPLETE |
| 39 | Demo Data (Extended) + Notifications | ✅ COMPLETE |
| **40** | **Demo Data, Navigation, Schedule** | **🔄 CURRENT** |
| 41-46 | Audit Phase 2 + Finance | 📋 PLANNED |
| 47-68 | Implementation Roadmap 2026 | 📋 PLANNED |
| **69-76** | **Research Integration (NEW)** | 📋 PLANNED |

---

## Research Mapping to Existing Sprints

The overnight research (RS-01 through RS-09) maps to existing/planned work as follows:

### Already Covered in IMPLEMENTATION_ROADMAP_2026.md

| Research | Topic | Existing Sprint | Notes |
|----------|-------|-----------------|-------|
| RS-02 | Payroll Integration | Sprint 59-60 | Covered by Finch integration |
| RS-07 | Bank Connectivity | Sprint 61-63 | Covered by Plaid + Neobank |
| RS-03 | BI Analytics | Sprint 64-66 | Partial - AI Insights covers alerts/anomalies |
| RS-04 | File Storage | Sprint 52 | Partial - mentioned in messaging |

### New Sprints Required (69-76)

| Research | Topic | New Sprint | Reason |
|----------|-------|------------|--------|
| RS-01 | Navigation Architecture | Sprint 40 (current) | Already in current sprint |
| RS-03 | BI Dashboard KPIs | Sprint 69 | Dashboards not in existing roadmap |
| RS-05 | Subcontractor Invoices | Sprint 70 | AP workflow not covered |
| RS-06 | Lead Generation | Sprint 71-72 | Not in existing roadmap |
| RS-07 | Expense OCR | Sprint 73 | OCR specifically not covered |
| RS-08 | Pricing Catalogs | Sprint 74 | Not in existing roadmap |
| RS-09 | Review Management | Sprint 75-76 | Not in existing roadmap |

---

## New Sprints: Research Integration (69-76)

### Sprint 69: BI Dashboard MVP
**Research:** RS-03 BI Analytics & Dashboards
**Duration:** 2 weeks
**Effort:** 40-56 hours
**Prerequisites:** Sprint 40 (navigation restructure complete)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| BI-01 | Define KPI data models in types/index.ts | 2h | `[ ]` |
| BI-02 | Create useKPIMetrics hook | 4h | `[ ]` |
| BI-03 | Build Company Overview dashboard | 6h | `[ ]` |
| BI-04 | Build Project Profitability dashboard | 6h | `[ ]` |
| BI-05 | Build Cash Flow dashboard | 5h | `[ ]` |
| BI-06 | Build WIP Report dashboard | 6h | `[ ]` |
| BI-07 | Build Sales Pipeline dashboard | 5h | `[ ]` |
| BI-08 | Create KPI card components | 3h | `[ ]` |
| BI-09 | Add trend indicators (up/down arrows) | 2h | `[ ]` |
| BI-10 | Implement date range filters | 3h | `[ ]` |
| BI-11 | Add export to CSV/PDF | 4h | `[ ]` |

**KPIs to Implement (12 MVP):**

| Category | KPI | Formula |
|----------|-----|---------|
| Financial | Gross Profit Margin | (Revenue - COGS) / Revenue |
| Financial | Net Profit Margin | Net Income / Revenue |
| Financial | Cash Flow Forecast | AR Due - AP Due (30/60/90 days) |
| Financial | AR Aging | Invoices by 0-30, 31-60, 61-90, 90+ |
| Project | WIP Value | % Complete × Contract - Billed |
| Project | Cost Variance | Actual Cost - Budgeted Cost |
| Project | Change Order Rate | CO Value / Original Contract |
| Project | Schedule Variance | Actual Duration - Planned Duration |
| Sales | Lead Conversion Rate | Converted Leads / Total Leads |
| Sales | Estimate Win Rate | Won Estimates / Total Estimates |
| Sales | Avg Days to Close | Avg(Close Date - Create Date) |
| Sales | Pipeline Value | Sum(Open Estimates × Probability) |

**Deliverables:**
- [ ] 5 dashboard pages under /dashboard/analytics/
- [ ] 12 KPI calculations with real-time data
- [ ] Trend comparisons (vs. prior period)
- [ ] Export functionality

---

### Sprint 70: Subcontractor Invoice Management
**Research:** RS-05 Subcontractor Invoices
**Duration:** 2 weeks
**Effort:** 56-72 hours
**Prerequisites:** Sprint 61 (Plaid integration for payment context)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| SUB-01 | Define SubInvoice, LienWaiver types | 2h | `[ ]` |
| SUB-02 | Create subcontractor-invoices Firestore collection | 1h | `[ ]` |
| SUB-03 | Add Firestore rules for sub invoices | 1h | `[ ]` |
| SUB-04 | Build SubInvoiceUpload component | 4h | `[ ]` |
| SUB-05 | Email ingestion setup (receive@contractoros.com) | 6h | `[ ]` |
| SUB-06 | Invoice OCR processing (Mindee) | 3h | `[ ]` |
| SUB-07 | Three-way matching engine | 8h | `[ ]` |
| SUB-08 | Build approval workflow UI | 6h | `[ ]` |
| SUB-09 | Create LienWaiverRequest component | 4h | `[ ]` |
| SUB-10 | Lien waiver tracking dashboard | 4h | `[ ]` |
| SUB-11 | AIA G702/G703 parser | 6h | `[ ]` |
| SUB-12 | Payment scheduling integration | 4h | `[ ]` |
| SUB-13 | Sub invoice list/detail pages | 4h | `[ ]` |
| SUB-14 | Notification triggers (approval needed) | 2h | `[ ]` |

**Three-Way Matching Logic:**
```
Invoice Received
    ↓
Match to Purchase Order (by PO#, vendor)
    ↓
Match to Delivery Receipt (by PO#, date range)
    ↓
Validate: Qty matches, Price matches, Within tolerance
    ↓
Auto-approve OR Flag for review
```

**Deliverables:**
- [ ] Multi-pathway invoice ingestion (upload, email, mobile)
- [ ] Automated three-way matching
- [ ] Approval workflow with delegation
- [ ] Lien waiver request/tracking
- [ ] AIA G702/G703 support

---

### Sprint 71: Lead Generation Integrations (P1)
**Research:** RS-06 Lead Generation
**Duration:** 1.5 weeks
**Effort:** 40-48 hours
**Prerequisites:** Sprint 40 (Sales section in navigation)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| LEAD-01 | Define Lead, LeadSource types | 2h | `[ ]` |
| LEAD-02 | Create leads Firestore collection | 1h | `[ ]` |
| LEAD-03 | Meta Lead Ads webhook endpoint | 4h | `[ ]` |
| LEAD-04 | Meta Lead Ads OAuth + form sync | 4h | `[ ]` |
| LEAD-05 | Thumbtack API integration | 6h | `[ ]` |
| LEAD-06 | Lead deduplication engine | 4h | `[ ]` |
| LEAD-07 | Auto-assignment rules | 4h | `[ ]` |
| LEAD-08 | Lead notification system | 3h | `[ ]` |
| LEAD-09 | Lead list/detail pages | 4h | `[ ]` |
| LEAD-10 | Source attribution tracking | 3h | `[ ]` |
| LEAD-11 | Lead → Client conversion flow | 3h | `[ ]` |
| LEAD-12 | ROI dashboard by source | 4h | `[ ]` |

**P1 Integrations:**

| Platform | Method | Lead Volume |
|----------|--------|-------------|
| Meta Lead Ads | Webhook + API | High |
| Thumbtack | API | High |

**Deliverables:**
- [ ] Automatic lead capture from Meta/Thumbtack
- [ ] Deduplication and enrichment
- [ ] Auto-assignment to sales team
- [ ] Source attribution for ROI tracking
- [ ] Lead → Client conversion

---

### Sprint 72: Lead Generation Integrations (P2)
**Research:** RS-06 Lead Generation
**Duration:** 1.5 weeks
**Effort:** 40-48 hours
**Prerequisites:** Sprint 71 (lead infrastructure)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| LEAD-13 | Angi (HomeAdvisor) integration | 6h | `[ ]` |
| LEAD-14 | Google Business Profile API | 4h | `[ ]` |
| LEAD-15 | Nextdoor API integration | 5h | `[ ]` |
| LEAD-16 | Unified lead import interface | 4h | `[ ]` |
| LEAD-17 | Manual lead entry form | 2h | `[ ]` |
| LEAD-18 | CSV lead import | 3h | `[ ]` |
| LEAD-19 | Lead scoring rules engine | 4h | `[ ]` |
| LEAD-20 | Lead activity timeline | 3h | `[ ]` |
| LEAD-21 | Follow-up task automation | 4h | `[ ]` |
| LEAD-22 | Comprehensive ROI report | 4h | `[ ]` |

**P2 Integrations:**

| Platform | Method | Lead Volume |
|----------|--------|-------------|
| Angi (HomeAdvisor) | API | Medium |
| Google Business Profile | API | Medium |
| Nextdoor | API | Low-Medium |

**Deliverables:**
- [ ] Additional lead source integrations
- [ ] Lead scoring system
- [ ] Activity timeline per lead
- [ ] Automated follow-up tasks
- [ ] Comprehensive ROI reporting

---

### Sprint 73: Expense OCR Integration
**Research:** RS-07 Expense OCR & Bank Connectivity
**Duration:** 1.5 weeks
**Effort:** 40-48 hours
**Prerequisites:** Sprint 61-62 (Bank connectivity context)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| OCR-01 | Set up Mindee account and API key | 1h | `[ ]` |
| OCR-02 | Create expense-ocr Cloud Function | 4h | `[ ]` |
| OCR-03 | Build receipt upload component | 3h | `[ ]` |
| OCR-04 | Implement mobile camera capture | 3h | `[ ]` |
| OCR-05 | Create OCR result parser | 2h | `[ ]` |
| OCR-06 | Build review/edit UI for extracted data | 4h | `[ ]` |
| OCR-07 | Auto-categorize by vendor name | 3h | `[ ]` |
| OCR-08 | Duplicate receipt detection | 2h | `[ ]` |
| OCR-09 | Confidence score display | 2h | `[ ]` |
| OCR-10 | Receipt image storage (Firebase) | 2h | `[ ]` |
| OCR-11 | Link receipts to expense records | 2h | `[ ]` |
| OCR-12 | Batch processing queue | 4h | `[ ]` |
| OCR-13 | Error handling and retry logic | 2h | `[ ]` |
| OCR-14 | Test with 50+ receipt types | 4h | `[ ]` |

**Technical Stack:**
- Primary OCR: Mindee Receipt API ($0.01-0.10/receipt)
- Backup OCR: AWS Textract (complex invoices)
- Storage: Firebase Cloud Storage
- Processing: Cloud Functions Gen 2

**Deliverables:**
- [ ] Receipt photo capture (mobile + desktop)
- [ ] Automatic data extraction (vendor, amount, date, category)
- [ ] Review UI with edit capability
- [ ] Receipt image attached to expense record

---

### Sprint 74: Pricing Catalog MVP
**Research:** RS-08 Pricing Catalogs & Cost Data
**Duration:** 1.5 weeks
**Effort:** 40-48 hours
**Prerequisites:** None (independent)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| PRICE-01 | Define PriceCatalog, PriceItem types | 2h | `[ ]` |
| PRICE-02 | Create price-catalogs Firestore collection | 1h | `[ ]` |
| PRICE-03 | Build CSV/Excel import component | 4h | `[ ]` |
| PRICE-04 | Manual price entry UI | 3h | `[ ]` |
| PRICE-05 | MasterFormat category picker | 3h | `[ ]` |
| PRICE-06 | ABC Supply API integration | 8h | `[ ]` |
| PRICE-07 | Product search component | 4h | `[ ]` |
| PRICE-08 | Price lookup in estimate builder | 4h | `[ ]` |
| PRICE-09 | Labor rate configuration | 3h | `[ ]` |
| PRICE-10 | Regional markup support | 2h | `[ ]` |
| PRICE-11 | Price history tracking | 2h | `[ ]` |
| PRICE-12 | Favorite items list | 2h | `[ ]` |

**MasterFormat Divisions (MVP):**

| Division | Category |
|----------|----------|
| 03 | Concrete |
| 06 | Wood, Plastics, Composites |
| 07 | Thermal & Moisture Protection |
| 08 | Openings (Doors, Windows) |
| 09 | Finishes |
| 22 | Plumbing |
| 26 | Electrical |

**Deliverables:**
- [ ] Custom price book with import/export
- [ ] ABC Supply real-time pricing
- [ ] MasterFormat categorization
- [ ] Integration with estimate builder
- [ ] Labor rate management

---

### Sprint 75: Review Management (Foundation)
**Research:** RS-09 Marketing & Review Management
**Duration:** 1.5 weeks
**Effort:** 40-48 hours
**Prerequisites:** Existing Twilio integration

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| REV-01 | Define Review, ReviewRequest types | 2h | `[ ]` |
| REV-02 | Create reviews Firestore collection | 1h | `[ ]` |
| REV-03 | Google Business Profile OAuth | 4h | `[ ]` |
| REV-04 | Review monitoring sync | 4h | `[ ]` |
| REV-05 | SMS review request (Twilio) | 3h | `[ ]` |
| REV-06 | Email review request | 2h | `[ ]` |
| REV-07 | Review request automation rules | 4h | `[ ]` |
| REV-08 | Review dashboard (aggregate stats) | 4h | `[ ]` |
| REV-09 | Response template library | 3h | `[ ]` |
| REV-10 | Review response composer | 3h | `[ ]` |

**Deliverables:**
- [ ] Automated review requests (SMS + Email)
- [ ] Google Business Profile sync
- [ ] Review monitoring dashboard
- [ ] Response templates and composer

---

### Sprint 76: Review Management (Enhancement) + Referrals
**Research:** RS-09 Marketing & Review Management
**Duration:** 1.5 weeks
**Effort:** 40-48 hours
**Prerequisites:** Sprint 75

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| REV-11 | Referral program tracking | 4h | `[ ]` |
| REV-12 | Referral code generation | 2h | `[ ]` |
| REV-13 | Referral attribution | 3h | `[ ]` |
| REV-14 | FTC compliance checks | 2h | `[ ]` |
| REV-15 | Project gallery for social proof | 4h | `[ ]` |
| REV-16 | Before/after photo pairs | 3h | `[ ]` |
| REV-17 | Gallery embed widget | 4h | `[ ]` |
| REV-18 | Social sharing integration | 3h | `[ ]` |
| REV-19 | Review analytics dashboard | 4h | `[ ]` |
| REV-20 | NPS survey integration | 4h | `[ ]` |

**FTC Compliance Requirements:**
- [ ] No fake reviews ($53,088/violation)
- [ ] No review suppression clauses
- [ ] Disclose incentivized reviews
- [ ] No cherry-picking displayed reviews

**Deliverables:**
- [ ] Referral program with tracking
- [ ] Project gallery with before/after
- [ ] FTC-compliant workflows
- [ ] Review analytics

---

## Updated Sprint Calendar

### Current + Near-Term (Q1 2026)

| Sprint | Name | Duration | Status |
|--------|------|----------|--------|
| **40** | Demo Data + Navigation + Schedule | 2 weeks | 🔄 CURRENT |
| 41 | Finance Module | 1-2 weeks | 📋 Next |
| 42 | Reports Bugs + Configuration | 1-2 weeks | 📋 Planned |
| 43 | Reports Demo Data | 2-3 weeks | 📋 Planned |
| 44 | Settings Consolidation | 1-2 weeks | 📋 Planned |
| 45 | Reporting Enhancements | 2 weeks | 📋 Planned |
| 46 | Notification System | 1-2 weeks | 📋 Planned |

### Foundation Phase (Q2 2026 - From IMPLEMENTATION_ROADMAP_2026.md)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 47 | Animation Audit & Guidelines | 1.5 weeks | Existing roadmap |
| 48 | Notification Foundation | 2 weeks | Existing roadmap |
| 49 | AI Settings Foundation | 2 weeks | Existing roadmap |

### Messaging Phase (Q2-Q3 2026)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 50 | Messaging Data Model | 2 weeks | Existing roadmap |
| 51 | Messaging Core UI | 2 weeks | Existing roadmap |
| 52 | Project-Linked Messaging | 1.5 weeks | Existing roadmap |
| 53 | Multi-Channel Notifications | 2 weeks | Existing roadmap |

### AI Provider Phase (Q3 2026)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 54 | Key Management | 2 weeks | Existing roadmap |
| 55 | Multi-Provider Gateway | 2 weeks | Existing roadmap |

### Reports Phase (Q3 2026)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 56 | Enhanced Report Filters | 1.5 weeks | Existing roadmap |
| 57 | Report Templates & Export | 1.5 weeks | Existing roadmap |
| 58 | Report Scheduling & Dashboard | 2 weeks | Existing roadmap |

### Financial Integrations Phase (Q3-Q4 2026)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 59 | Payroll Integration Foundation | 2 weeks | Existing roadmap + RS-02 |
| 60 | Payroll Bi-Directional Sync | 2 weeks | Existing roadmap + RS-02 |
| 61 | Bank Integration (Plaid) | 2 weeks | Existing roadmap + RS-07 |
| 62 | Bank Transaction Matching | 2 weeks | Existing roadmap + RS-07 |
| 63 | Neobank Integration | 1.5 weeks | Existing roadmap |

### AI Insights Phase (Q4 2026)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 64 | Rule-Based Alerts | 1.5 weeks | Existing roadmap |
| 65 | Anomaly Detection | 2 weeks | Existing roadmap |
| 66 | Predictive Insights & NL Summaries | 2 weeks | Existing roadmap |

### Advanced Reports Phase (Q4 2026)

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| 67 | BigQuery Export | 1.5 weeks | Existing roadmap |
| 68 | Metabase Integration | 2 weeks | Existing roadmap |

### Research Integration Phase (Q4 2026 - Q1 2027) - NEW

| Sprint | Name | Duration | Source |
|--------|------|----------|--------|
| **69** | **BI Dashboard MVP** | 2 weeks | RS-03 (new) |
| **70** | **Subcontractor Invoice Management** | 2 weeks | RS-05 (new) |
| **71** | **Lead Generation (P1)** | 1.5 weeks | RS-06 (new) |
| **72** | **Lead Generation (P2)** | 1.5 weeks | RS-06 (new) |
| **73** | **Expense OCR Integration** | 1.5 weeks | RS-07 (enhancement) |
| **74** | **Pricing Catalog MVP** | 1.5 weeks | RS-08 (new) |
| **75** | **Review Management (Foundation)** | 1.5 weeks | RS-09 (new) |
| **76** | **Review Management + Referrals** | 1.5 weeks | RS-09 (new) |

---

## Third-Party Service Costs (Monthly)

| Service | Sprint | Cost Range | Notes |
|---------|--------|------------|-------|
| Mindee OCR | 73 | $10-100 | Per receipt volume |
| Plaid | 61 | $50-100 | Per bank connection |
| Finch | 59-60 | $50-200 | Per payroll connection |
| Google Drive API | 52 | Free | Within quotas |
| ABC Supply API | 74 | Free | Partner program |
| Meta Ads API | 71 | Free | |
| Thumbtack API | 71 | Free | |
| NiceJob (optional) | 75 | $75 | Review management |
| RSMeans (optional) | Future | $25-500 | Cost data |

**Estimated Monthly Cost:** $185-975 (varies by usage)

---

## Summary

**Total Sprint Count:** 76 sprints planned (40-76)
- Sprints 40-46: Audit fixes and hardening
- Sprints 47-68: Implementation Roadmap 2026 (existing)
- **Sprints 69-76: Research Integration (new from RS-01 to RS-09)**

**Research Items Already Covered:**
- RS-02 Payroll → Sprints 59-60
- RS-07 Bank Connectivity → Sprints 61-63
- RS-03 AI Insights (partial) → Sprints 64-66

**New Research Sprints Added:**
- RS-03 BI Dashboards → Sprint 69
- RS-05 Subcontractor Invoices → Sprint 70
- RS-06 Lead Generation → Sprints 71-72
- RS-07 Expense OCR → Sprint 73
- RS-08 Pricing Catalogs → Sprint 74
- RS-09 Review Management → Sprints 75-76

**RS-01 Navigation:** Already incorporated into Sprint 40 (current)

---

*Document created: 2026-02-04*
*Integrated with: IMPLEMENTATION_ROADMAP_2026.md*
