# RS-03: Business Intelligence & Analytics Research Report

> **Research Date:** February 3, 2026
> **Category:** Business Intelligence, KPIs, Reporting
> **Priority:** High - Core differentiator for ContractorOS

---

## Executive Summary

This report provides comprehensive research on business intelligence dashboards and KPIs for construction companies. It covers industry benchmarks, competitor analysis, recommended metrics, and dashboard design best practices to inform ContractorOS reporting feature development.

**Key Findings:**
- Construction industry operates with gross margins of 18-25% (residential) and 12-16% (commercial GC)
- Change orders average 8-14% of contract value industry-wide
- Quote-to-close ratios range from 15-50% depending on lead source
- Top contractors achieve 21.8% gross profit margin (CFMA 2024)
- Construction DSO averages 82 days vs. global average of 65 days

---

## Table of Contents

1. [Key Performance Indicators (KPIs)](#1-key-performance-indicators-kpis)
2. [Industry Benchmarks](#2-industry-benchmarks)
3. [Competitor Analysis](#3-competitor-analysis)
4. [Dashboard Design Best Practices](#4-dashboard-design-best-practices)
5. [Recommended Priority for ContractorOS](#5-recommended-priority-for-contractoros)
6. [Dashboard Wireframe Descriptions](#6-dashboard-wireframe-descriptions)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Sources](#8-sources)

---

## 1. Key Performance Indicators (KPIs)

### 1.1 Financial KPIs

#### Gross Profit Margin
- **Definition:** Revenue minus direct costs (COGS), expressed as a percentage
- **Formula:** `(Revenue - COGS) / Revenue x 100`
- **Benchmark:** 18-25% residential, 12-16% commercial GC
- **Use:** Overall profitability indicator

#### Net Profit Margin
- **Definition:** Profit after all expenses including overhead
- **Formula:** `Net Income / Revenue x 100`
- **Benchmark:** 8-10% healthy, 12%+ top performers
- **Use:** Bottom-line health indicator

#### Revenue Growth Rate
- **Definition:** Year-over-year change in revenue
- **Formula:** `(Current Period Revenue - Prior Period Revenue) / Prior Period Revenue x 100`
- **Benchmark:** Varies by market conditions
- **Use:** Business growth tracking

#### Working Capital Ratio
- **Definition:** Ability to pay short-term obligations
- **Formula:** `Current Assets / Current Liabilities`
- **Benchmark:** 1.2 to 2.0 is healthy
- **Use:** Liquidity indicator

#### Return on Investment (ROI)
- **Definition:** Efficiency of capital deployed
- **Formula:** `(Net Profit / Total Investment) x 100`
- **Benchmark:** Varies by project type
- **Use:** Investment decision support

### 1.2 Project Profitability KPIs

#### Job Gross Margin
- **Definition:** Profitability of individual projects
- **Formula:** `(Project Revenue - Project Direct Costs) / Project Revenue x 100`
- **Benchmark:** Should exceed company target margin
- **Use:** Project-level profitability tracking

#### Estimate Accuracy (Variance)
- **Definition:** Difference between estimated and actual costs
- **Formula:** `(Actual Cost - Estimated Cost) / Estimated Cost x 100`
- **Benchmark:**
  - Pre-design: +/-30%
  - Detailed estimate: -10% to +15%
  - Definitive estimate: -5% to +10%
- **Use:** Estimating process improvement

#### Change Order Percentage
- **Definition:** Value of change orders relative to original contract
- **Formula:** `Total Change Order Value / Original Contract Value x 100`
- **Benchmark:** 8-14% typical, 10% industry standard
- **Use:** Scope management indicator

#### Cost Performance Index (CPI)
- **Definition:** Budget efficiency measure
- **Formula:** `Earned Value / Actual Cost`
- **Benchmark:** >1.0 is under budget, <1.0 is over budget
- **Use:** Cost control monitoring

### 1.3 Sales & Pipeline KPIs

#### Quote-to-Close Ratio (Win Rate)
- **Definition:** Percentage of estimates that become contracts
- **Formula:** `Jobs Won / Total Estimates Submitted x 100`
- **Benchmark:**
  - Referral leads: 50%+
  - Outbound/advertising: 20-30%
  - General: 25-40% healthy range
- **Use:** Sales effectiveness

#### Bid-Hit Ratio
- **Definition:** Number of bids per contract won
- **Formula:** `Number of Bids Submitted / Number of Jobs Won`
- **Benchmark:** 5:1 to 10:1 typical, >11:1 too high
- **Use:** Bidding efficiency

#### Average Deal Size
- **Definition:** Mean value of contracts won
- **Formula:** `Total Revenue / Number of Jobs`
- **Use:** Market positioning indicator

#### Pipeline Value
- **Definition:** Total value of active opportunities
- **Formula:** `Sum of (Estimate Value x Probability)`
- **Use:** Revenue forecasting

### 1.4 Schedule & Productivity KPIs

#### Schedule Performance Index (SPI)
- **Definition:** Schedule efficiency measure
- **Formula:** `Earned Value / Planned Value`
- **Benchmark:** >0.95 good, <0.8 concerning
- **Use:** Schedule adherence tracking

#### On-Time Completion Rate
- **Definition:** Percentage of projects completed on schedule
- **Formula:** `Projects On Time / Total Projects x 100`
- **Benchmark:** Track internally, improve over time
- **Use:** Operational excellence

#### Labor Productivity
- **Definition:** Output per labor hour
- **Formula:** `Units Completed / Labor Hours`
- **Benchmark:** Varies by trade (e.g., drywall: 350-450 sf/hour for 2-person crew)
- **Use:** Workforce efficiency

#### Equipment Utilization Rate
- **Definition:** Time equipment is actively used vs. available
- **Formula:** `Actual Hours Used / Available Hours x 100`
- **Benchmark:** Track internally
- **Use:** Asset optimization

### 1.5 Cash Flow KPIs

#### Days Sales Outstanding (DSO)
- **Definition:** Average days to collect payment
- **Formula:** `(Accounts Receivable / Total Credit Sales) x Number of Days`
- **Benchmark:** Construction average 82 days, <45 is excellent
- **Use:** Collection efficiency

#### Net Cash Flow
- **Definition:** Cash movement during a period
- **Formula:** `Cash Inflows - Cash Outflows`
- **Use:** Liquidity management

#### Projected Cash Flow
- **Definition:** Forecasted cash position
- **Formula:** `Current Cash + Expected Inflows - Expected Outflows`
- **Use:** Planning and decision-making

#### Overbilling/Underbilling
- **Definition:** Difference between billings and earned revenue
- **Formula:** `Billings to Date - Earned Revenue`
- **Benchmark:** Monitor for cash flow management
- **Use:** WIP and cash position

### 1.6 Labor & Burden KPIs

#### Labor Burden Rate
- **Definition:** Additional costs on top of base wages
- **Formula:** `(Indirect Labor Costs / Direct Labor Costs) x 100`
- **Benchmark:** 20-40% non-union, 60-70% union
- **Components:**
  - FICA taxes (7.65%)
  - Workers' comp (varies, up to 15% in CA)
  - Health insurance
  - Benefits
  - Administrative overhead

#### Fully Burdened Labor Rate
- **Definition:** True cost per labor hour
- **Formula:** `(Base Wage + All Burden Costs) / Productive Hours`
- **Example:** $30/hr base = $49.80/hr fully burdened (66% burden)
- **Use:** Accurate job costing

#### Overtime Percentage
- **Definition:** Overtime hours as percentage of total
- **Formula:** `Overtime Hours / Total Hours x 100`
- **Benchmark:** Track and minimize
- **Use:** Labor cost control

### 1.7 Safety KPIs

#### Safety Incident Rate
- **Definition:** Incidents per 100 workers
- **Formula:** `(Number of Incidents x 200,000) / Total Hours Worked`
- **Benchmark:** Compare to industry/OSHA standards
- **Use:** Safety program effectiveness

#### Lost Time Injury Rate
- **Definition:** Injuries causing missed work
- **Formula:** `(Lost Time Injuries x 200,000) / Total Hours Worked`
- **Use:** Risk management

### 1.8 Client Satisfaction KPIs

#### Net Promoter Score (NPS)
- **Definition:** Customer loyalty measure
- **Formula:** `% Promoters (9-10) - % Detractors (0-6)`
- **Benchmark:** Construction industry average: 37, >50 excellent
- **Use:** Client relationship health

#### Customer Satisfaction Score (CSAT)
- **Definition:** Direct satisfaction rating
- **Formula:** `(Satisfied Responses / Total Responses) x 100`
- **Use:** Service quality tracking

#### Repeat Business Rate
- **Definition:** Revenue from returning clients
- **Formula:** `Revenue from Repeat Clients / Total Revenue x 100`
- **Use:** Client retention indicator

---

## 2. Industry Benchmarks

### 2.1 Profitability Benchmarks

| Metric | Low Performer | Average | Top Performer |
|--------|---------------|---------|---------------|
| Gross Margin (Residential) | <15% | 18-22% | >25% |
| Gross Margin (Commercial GC) | <10% | 12-16% | >18% |
| Gross Margin (Specialty Trade) | <12% | 15-25% | >25% |
| Net Margin | <5% | 6-8% | >12% |
| Home Builder Gross Margin | <18% | 20.7% | >25% |

*Source: CFMA 2024 Construction Financial Benchmarker, NAHB Cost of Doing Business Study*

### 2.2 Estimate Accuracy Benchmarks

| Estimate Class | Maturity Level | Accuracy Range | Use Case |
|----------------|----------------|----------------|----------|
| Class 5 (Conceptual) | 0-2% design | -50% to +100% | Feasibility |
| Class 4 (Study) | 1-15% design | -30% to +50% | Budget planning |
| Class 3 (Budget) | 10-40% design | -20% to +30% | Authorization |
| Class 2 (Control) | 30-75% design | -15% to +20% | Bidding |
| Class 1 (Definitive) | 65-100% design | -5% to +10% | Contract |

*Source: AACE International Cost Estimate Classification System*

### 2.3 Change Order Benchmarks

| Metric | Low | Typical | High/Distressed |
|--------|-----|---------|-----------------|
| Change Order % of Contract | <5% | 8-14% | 25%+ |
| A/E Errors & Omissions | <2% | 3-5% | >5% |
| Average CO per Residential Project ($250K-$500K) | - | 6.3 COs | - |
| Average CO Value (Residential) | $16,793 | $29,251 | $44,344 |

*Source: California Multi-Agency CIP Benchmarking Study, CoConstruct 2020 Data*

### 2.4 Sales & Bidding Benchmarks

| Lead Source | Expected Close Rate |
|-------------|---------------------|
| Referrals from other contractors | 80%+ above average |
| Direct referrals from clients | 50-75% |
| In-person consultations | 30-40% |
| Outbound marketing | 20-30% |
| Advertising responses | 15-25% |
| Yellow Pages/directories | 20-30% |

| Bid-Hit Ratio | Interpretation |
|---------------|----------------|
| 2:1 | Unrealistic in competitive markets |
| 5:1 | Very strong |
| 7:1-10:1 | Healthy range |
| >11:1 | Too high, wasting estimating resources |
| 35:1 | Problematic |

*Source: Foundation Software, Sunflower Bank, ContractorTalk Industry Forums*

### 2.5 Cash Flow Benchmarks

| Metric | Poor | Average | Good |
|--------|------|---------|------|
| DSO (Days Sales Outstanding) | >90 | 82 | <45 |
| Working Capital Ratio | <1.0 | 1.2-1.5 | 1.5-2.0 |
| Quick Ratio | <0.8 | 1.0 | >1.2 |

*Source: Allianz Trade, Industry Analysis*

### 2.6 Overhead Benchmarks

| Company Size | Overhead % of COGS |
|--------------|-------------------|
| Small contractors | Higher % |
| Mid-size contractors | 15-20% |
| Large contractors | Lower % (economies of scale) |
| Standard estimate markup | 10% overhead + 10% profit |

*Source: CFMA Data, Foundation Software*

### 2.7 Labor Burden Benchmarks

| Category | Rate Range |
|----------|------------|
| Non-union contractor total burden | 24-33% |
| Union contractor total burden | 60-70% |
| Traditional planning assumption | 30% |
| Workers' comp (varies by state/trade) | 8-15% |
| FICA employer share | 7.65% |
| Health insurance contribution | $300-$600/month |

*Source: Procore, Construction Business Owner*

---

## 3. Competitor Analysis

### 3.1 Procore Analytics

**Strengths:**
- AI-powered analytics (Procore Helix) for predictive insights
- 100+ pre-built industry-sourced report templates
- Deep integration with Power BI, Tableau, Domo
- Real-time dashboards with drill-down capabilities
- Risk report identifying leading/lagging indicators

**Key Reports:**
- Quality & Safety Report
- Financials Report
- Daily Logs Report
- Coordination Issues Report
- Project Management Report with trending charts
- Key Influencers analysis (predicts late submittals/RFIs)

**Dashboard Types:**
- Project Report Dashboards (individual project focus)
- Company Report Dashboards (portfolio-wide aggregation)
- Interactive visualizations with color-coded status

**Differentiators:**
- Enterprise-scale, ERP integration
- AI trend identification
- Cross-project benchmarking

### 3.2 Buildertrend

**Strengths:**
- Real-time labor cost, billing, PO, and change order tracking
- Work in Progress (WIP) report
- Estimated vs. actual cost comparison
- Multiple financial software integrations
- Built-in financing and banking (Buildertrend Financing, Buildertrend Wallet)

**Key Reports:**
- Job costing with expense management
- Budget vs. actual dashboards
- Forecasting tools
- Daily progress tracking

**Differentiators:**
- Integrated financial services ecosystem
- Strong residential/remodeling focus
- Client-facing transparency features

### 3.3 CoConstruct (Now Part of Buildertrend)

**Strengths:**
- Industry-leading estimating module
- Enhanced financial module
- Line item or percentage billing flexibility
- Direct QuickBooks integration
- Detailed client-facing breakdowns

**Key Reports:**
- Transparent cost tracking
- Expense management
- Budget monitoring with forecasting

**Differentiators:**
- Client trust through transparency
- Strong custom home builder focus
- Detailed estimating capabilities

### 3.4 QuickBooks for Contractors

**Strengths:**
- Job Costing Center (Enterprise)
- Automatic cost tracking
- Change order management
- Committed cost tracking

**Key Reports:**
- Job Estimates vs. Actuals Detail (key report)
- Job Progress Invoices vs. Estimates
- Expenses Not Assigned to Jobs
- Job Status Report
- Project Profitability (QBO Projects)
- Unbilled Time and Expenses

**Integration:**
- QuickBooks Payroll and Time for labor cost import
- Progress billing with milestone tracking

**Limitations:**
- Limited report customization
- Cannot pull estimated cost at completion
- Job costing requires Pro/Advanced subscription

### 3.5 Competitor Feature Comparison

| Feature | Procore | Buildertrend | CoConstruct | QuickBooks |
|---------|---------|--------------|-------------|------------|
| Real-time dashboards | Yes | Yes | Yes | Limited |
| AI/predictive analytics | Yes (Helix) | No | No | No |
| Pre-built templates | 100+ | Moderate | Moderate | Limited |
| WIP reporting | Yes | Yes | Yes | Limited |
| Estimate vs. actual | Yes | Yes | Yes | Yes |
| Change order tracking | Yes | Yes | Yes | Yes |
| Multi-project rollup | Yes | Yes | Limited | Limited |
| Custom report builder | Yes | Limited | Limited | Limited |
| BI tool integration | Power BI, Tableau | Limited | Limited | Limited |
| Client portal | Yes | Yes | Yes | No |
| Mobile dashboards | Yes | Yes | Yes | Limited |
| Pricing | Enterprise | Mid-market | Mid-market | SMB |

---

## 4. Dashboard Design Best Practices

### 4.1 Core Principles

#### The Five-Second Rule
- Dashboard should answer key business questions at a glance
- If users are scanning for minutes, the design has failed
- Most important information immediately visible

#### Visual Hierarchy
- Most critical metrics in upper-left quadrant (reading pattern)
- High-level insights at top, detailed data below
- Use size and color to indicate importance

#### Limit Visualizations
- Maximum 5-9 visualizations per dashboard
- Human brain processes ~7 items effectively
- Too many creates clutter and cognitive overload
- Prefer 2-3 key views with drill-down options

#### Consistency
- Same color scheme, fonts, and chart types across dashboards
- Builds user mental model
- Reduces learning curve
- Creates sense of familiarity

### 4.2 Chart Selection Guidelines

| Data Type | Recommended Visualization | Avoid |
|-----------|--------------------------|-------|
| Trends over time | Line chart, area chart | Pie chart |
| Part-to-whole | Stacked bar, treemap | 3D charts |
| Comparison | Bar chart, grouped bars | Area charts |
| Distribution | Histogram, box plot | Pie chart |
| Correlation | Scatter plot | - |
| Single KPI | Big number with sparkline | Complex charts |
| Progress | Progress bar, gauge | - |

**Key Principle:** People struggle with comparing spatial areas. Pie charts and area charts are rarely the best choice.

### 4.3 Data-Ink Ratio

- Maximize data ink, minimize non-data ink
- Remove unnecessary grid lines
- Eliminate decorative elements
- Use white space effectively
- Every pixel should communicate information

### 4.4 Context for Metrics

**Always provide context:**
- Previous period comparison (vs. last month, YTD, YOY)
- Trend indicators (up/down arrows, sparklines)
- Target/benchmark lines
- Variance from plan

**Example:** Don't just show "42 leads" - show "42 leads (+15% vs. last week)"

### 4.5 Progressive Disclosure

- Show summary first, details on demand
- Drill-down from dashboard to detail views
- Filters for time period, project, category
- Reduces cognitive load
- Prevents information overload

### 4.6 Time Period Selection Patterns

**Standard Options:**
- Today
- This Week / Last Week
- This Month / Last Month
- This Quarter / Last Quarter
- YTD (Year to Date)
- Last 12 Months
- Custom date range

**Comparison Options:**
- Period over period (this month vs. last month)
- Year over year (this YTD vs. last YTD)
- Budget vs. actual

### 4.7 Construction-Specific Dashboard Patterns

**Project 360 View:**
- Cost and schedule snapshot at top
- Progress bars for milestones
- Cash flow chart
- Risk indicators

**Portfolio Dashboard:**
- Project list with RAG status (Red/Amber/Green)
- Aggregate financials
- Resource allocation overview
- Exception highlighting

**Financial Health Dashboard:**
- Working capital gauge
- AR aging breakdown
- Cash flow forecast
- Overbilling/underbilling status

---

## 5. Recommended Priority for ContractorOS

### 5.1 Phase 1: Foundation Metrics (MVP)

**Priority: Essential for launch**

| Dashboard | Key Metrics | Rationale |
|-----------|-------------|-----------|
| **Company Overview** | Revenue MTD/YTD, Active projects, Pipeline value | Executive snapshot |
| **Project Profitability** | Job gross margin, Estimate vs. actual, Change order % | Core financial control |
| **Cash Flow** | AR aging, DSO, Overbilling/underbilling | Cash management critical |
| **Pipeline/Sales** | Quote-to-close ratio, Estimate backlog, Win rate | Revenue forecasting |

### 5.2 Phase 2: Operational Excellence

**Priority: High value, moderate complexity**

| Dashboard | Key Metrics | Rationale |
|-----------|-------------|-----------|
| **Schedule Performance** | SPI, On-time completion %, Milestone status | Project delivery |
| **Labor Productivity** | Hours per unit, Overtime %, Labor utilization | Cost control |
| **WIP Report** | % complete, Billed vs. earned, Projected profit | Financial accuracy |

### 5.3 Phase 3: Advanced Analytics

**Priority: Differentiation features**

| Dashboard | Key Metrics | Rationale |
|-----------|-------------|-----------|
| **Benchmarking** | Performance vs. industry benchmarks | Competitive insights |
| **Trend Analysis** | Historical patterns, Forecasting | Strategic planning |
| **Client Insights** | NPS, Repeat business rate, Client profitability | Relationship management |
| **Estimating Analytics** | Estimate accuracy by category, Bid-hit ratio | Process improvement |

### 5.4 Recommended KPI Starter Set

For ContractorOS initial implementation, focus on 12-15 KPIs:

**Financial (5):**
1. Gross Profit Margin (company-wide)
2. Job Gross Margin (per project)
3. Revenue YTD vs. Goal
4. Working Capital Ratio
5. Net Cash Flow

**Sales (3):**
6. Quote-to-Close Ratio
7. Active Pipeline Value
8. Average Deal Size

**Operations (4):**
9. Estimate Accuracy (variance %)
10. Change Order Percentage
11. Schedule Performance Index
12. AR Aging (buckets)

**Client (2):**
13. NPS Score
14. Repeat Business Rate

---

## 6. Dashboard Wireframe Descriptions

### 6.1 Company Overview Dashboard

```
+------------------------------------------------------------------+
|  COMPANY OVERVIEW                    [MTD] [QTD] [YTD] [Custom]  |
+------------------------------------------------------------------+
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | REVENUE YTD    |  | GROSS MARGIN   |  | ACTIVE JOBS    |      |
|  | $2.4M          |  | 22.5%          |  | 12             |      |
|  | +15% vs LY     |  | +2.1% vs LY    |  | 3 at risk      |      |
|  | [sparkline]    |  | [sparkline]    |  |                |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | PIPELINE       |  | WIN RATE       |  | CASH POSITION  |      |
|  | $1.8M          |  | 34%            |  | $425K          |      |
|  | 8 estimates    |  | 12/35 MTD      |  | 45 DSO         |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
|  +---------------------------+  +---------------------------+    |
|  | REVENUE TREND (12 mo)     |  | TOP 5 JOBS BY MARGIN      |    |
|  | [Line chart]              |  | [Horizontal bar chart]    |    |
|  |                           |  | Smith Residence   28%     |    |
|  |                           |  | Oak Remodel       25%     |    |
|  |                           |  | ...                       |    |
|  +---------------------------+  +---------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.2 Project Profitability Dashboard

```
+------------------------------------------------------------------+
|  PROJECT PROFITABILITY               [All] [Active] [Completed]  |
+------------------------------------------------------------------+
|                                                                  |
|  Project Filter: [Dropdown___________]  Date: [This Year____]    |
|                                                                  |
|  +--------------------------------------------------------------+|
|  | PROJECT     | CONTRACT | ACTUAL   | MARGIN | EST ACC | CO %  ||
|  |-------------|----------|----------|--------|---------|-------||
|  | Smith Res.  | $450K    | $385K    | 28%    | -3%     | 8%    ||
|  | Oak Remodel | $220K    | $180K    | 25%    | +5%     | 12%   ||
|  | Jones Bath  | $85K     | $78K     | 22%    | -8%     | 15%   ||
|  | ...         |          |          |        |         |       ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  +---------------------------+  +---------------------------+    |
|  | MARGIN BY PROJECT TYPE    |  | ESTIMATE ACCURACY TREND   |    |
|  | [Grouped bar chart]       |  | [Line chart with bands]   |    |
|  | New Const: 24%            |  |                           |    |
|  | Remodel: 21%              |  | Target: +/-10%            |    |
|  | Addition: 19%             |  |                           |    |
|  +---------------------------+  +---------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.3 Cash Flow Dashboard

```
+------------------------------------------------------------------+
|  CASH FLOW & RECEIVABLES             [This Month_____] [Compare] |
+------------------------------------------------------------------+
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | CASH BALANCE   |  | DSO            |  | OVERBILLED     |      |
|  | $425,000       |  | 45 days        |  | $82,000        |      |
|  | [trend arrow]  |  | vs 82 avg      |  | (3 projects)   |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
|  +--------------------------------------------------------------+|
|  | AR AGING                                                     ||
|  | +--------------------------------------------------------+  ||
|  | | Current | 1-30 | 31-60 | 61-90 | 90+ |                 |  ||
|  | | $180K   | $95K | $45K  | $22K  | $8K |                  |  ||
|  | +--------------------------------------------------------+  ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  +--------------------------------------------------------------+|
|  | 12-WEEK CASH FLOW FORECAST                                   ||
|  | [Area chart showing projected cash position]                 ||
|  | Expected In: [green area]                                    ||
|  | Expected Out: [red area]                                     ||
|  | Net Position: [line]                                         ||
|  +--------------------------------------------------------------+|
|                                                                  |
+------------------------------------------------------------------+
```

### 6.4 WIP (Work in Progress) Report

```
+------------------------------------------------------------------+
|  WORK IN PROGRESS REPORT             As of: [Feb 3, 2026]        |
+------------------------------------------------------------------+
|                                                                  |
|  +--------------------------------------------------------------+|
|  | JOB      | CONTRACT | EST COST | ACTUAL | % COMP | BILLED    ||
|  |----------|----------|----------|--------|--------|-----------|
|  | Smith    | $450K    | $324K    | $195K  | 60%    | $270K     ||
|  |   Status: Overbilled $76K (ahead on billing)                 ||
|  |----------|----------|----------|--------|--------|-----------|
|  | Oak      | $220K    | $172K    | $155K  | 90%    | $176K     ||
|  |   Status: Underbilled $22K (behind on billing)               ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  TOTALS:                                                         |
|  +----------------+  +----------------+  +----------------+      |
|  | TOTAL BACKLOG  |  | TOTAL OVERBILL |  | TOTAL UNDERBILL|      |
|  | $1.2M          |  | $125K          |  | $45K           |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
|  +--------------------------------------------------------------+|
|  | PROJECTED GROSS PROFIT BY JOB                                ||
|  | [Horizontal stacked bar: Est Profit | Variance]              ||
|  +--------------------------------------------------------------+|
|                                                                  |
+------------------------------------------------------------------+
```

### 6.5 Sales Pipeline Dashboard

```
+------------------------------------------------------------------+
|  SALES PIPELINE                      [MTD] [QTD] [YTD] [Custom]  |
+------------------------------------------------------------------+
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | PIPELINE VALUE |  | WIN RATE       |  | AVG DEAL SIZE  |      |
|  | $1.8M          |  | 34%            |  | $185K          |      |
|  | 8 active       |  | 12/35 YTD      |  | +12% vs LY     |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
|  +--------------------------------------------------------------+|
|  | PIPELINE BY STAGE                                            ||
|  | [Funnel visualization]                                       ||
|  |                                                              ||
|  | Lead         [============================] 15  $2.4M        ||
|  | Qualified    [====================] 10  $1.8M                ||
|  | Estimate Out [==============] 6  $1.1M                       ||
|  | Negotiating  [========] 3  $520K                             ||
|  | Verbal       [====] 2  $280K                                 ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  +---------------------------+  +---------------------------+    |
|  | WIN/LOSS BY REASON        |  | CONVERSION TREND          |    |
|  | [Pie/donut chart]         |  | [Line chart]              |    |
|  | Won: 34%                  |  |                           |    |
|  | Lost-Price: 28%           |  | Win rate over 12 months   |    |
|  | Lost-Timeline: 15%        |  |                           |    |
|  | Lost-Competitor: 12%      |  |                           |    |
|  | No Decision: 11%          |  |                           |    |
|  +---------------------------+  +---------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 7. Implementation Roadmap

### 7.1 Phase 1: Foundation (Sprints 41-43)

**Data Layer:**
- [ ] Add analytics aggregation functions to Firestore
- [ ] Create daily/weekly snapshot jobs (Cloud Functions)
- [ ] Build date range query utilities

**UI Components:**
- [ ] KPI card component (big number + trend + sparkline)
- [ ] Simple chart components (bar, line, donut)
- [ ] Dashboard grid layout
- [ ] Date range selector

**Dashboards:**
- [ ] Company Overview (4-6 KPIs)
- [ ] Basic Project Profitability table

### 7.2 Phase 2: Core Reporting (Sprints 44-46)

**Data Layer:**
- [ ] WIP calculation logic
- [ ] AR aging calculations
- [ ] Estimate vs. actual comparison queries

**Dashboards:**
- [ ] Cash Flow Dashboard
- [ ] WIP Report
- [ ] Enhanced Project Profitability with charts

**Features:**
- [ ] Export to PDF
- [ ] Export to CSV/Excel

### 7.3 Phase 3: Advanced Analytics (Sprints 47-50)

**Data Layer:**
- [ ] Historical trend storage
- [ ] Benchmark data integration
- [ ] Forecasting algorithms (simple)

**Dashboards:**
- [ ] Sales Pipeline Dashboard
- [ ] Labor Productivity Dashboard
- [ ] Benchmarking comparisons

**Features:**
- [ ] Scheduled report delivery (email)
- [ ] Custom date comparisons
- [ ] Drill-down from summary to detail

### 7.4 Technical Architecture Recommendations

```
apps/web/
├── components/
│   └── analytics/
│       ├── KPICard.tsx
│       ├── TrendChart.tsx
│       ├── BarChart.tsx
│       ├── DonutChart.tsx
│       ├── DataTable.tsx
│       ├── DateRangeSelector.tsx
│       └── DashboardGrid.tsx
├── app/
│   └── dashboard/
│       └── analytics/
│           ├── page.tsx (Overview)
│           ├── profitability/page.tsx
│           ├── cash-flow/page.tsx
│           ├── wip/page.tsx
│           └── pipeline/page.tsx
└── lib/
    └── analytics/
        ├── calculations.ts (KPI formulas)
        ├── aggregations.ts (Firestore queries)
        └── benchmarks.ts (Industry data)
```

**Chart Library Recommendation:** Consider Recharts or Chart.js for React integration, or Tremor for pre-built dashboard components.

---

## 8. Sources

### Industry KPIs & Benchmarks
- [Construction KPIs - Procore](https://www.procore.com/library/construction-kpis)
- [Construction KPIs - Deltek](https://www.deltek.com/en/construction/construction-kpis)
- [Construction KPIs - Autodesk](https://www.autodesk.com/blogs/construction/construction-kpis/)
- [Financial Construction KPIs - Buildern](https://buildern.com/resources/blog/financial-construction-kpis/)
- [KPIs for Construction - Foundation Software](https://www.foundationsoft.com/learn/how-to-read-key-performance-indicators-kpis/)

### Profit Margins & Financial Benchmarks
- [2025 Performance Benchmarks - JMCO](https://www.jmco.com/articles/construction/performance-benchmarks-construction-companies/)
- [General Contractor Profit Margin - Siana Marketing](https://www.sianamarketing.com/resources/general-contractor-profit-margin)
- [Construction Industry Profit Margin - Aladdin Bookkeeping](https://aladdinbookkeeping.com/average-construction-industry-profit-margin/)
- [Builders Profit Margins - NAHB Eye on Housing](https://eyeonhousing.org/2025/03/builders-profit-margins-improved-in-2023/)
- [Profit Margins in Construction - Bridgit](https://gobridgit.com/blog/profit-margin-in-construction/)

### Competitor Analytics
- [Procore Analytics](https://www.procore.com/platform/analytics)
- [Procore Reports](https://www.procore.com/platform/reports)
- [Buildertrend vs CoConstruct](https://buildertrend.com/buildertrend-vs-coconstruct/)
- [CoConstruct Features](https://www.coconstruct.com/how-it-works)

### QuickBooks Job Costing
- [QuickBooks Enterprise Job Costing](https://quickbooks.intuit.com/desktop/enterprise/industry-solutions/contractor/job-costing/)
- [QuickBooks for Construction - Method](https://www.method.me/blog/quickbooks-for-construction-contractors/)
- [Job Costing Reports - Fast Easy Accounting](https://www.fasteasyaccounting.com/quickBooks-job-costs-reports/)

### Change Orders & Estimates
- [Change Order Benchmarks - CoConstruct](https://www.coconstruct.com/blog/volume-of-change-orders-in-construction-declined-in-2020)
- [Change Orders $177B Problem - SpecFinder](https://specfinder.tools/change-orders-the-177-billion-problem-contractors-keep-absorbing/)
- [Cost Estimate Classification - Mastt](https://www.mastt.com/guide/cost-estimate-classes)
- [Types of Construction Cost Estimates - AS Estimation](https://asestimation.com/blogs/top-7-types-of-construction-cost-estimates/)

### Labor Burden & Productivity
- [Labor Burden Calculation - eBacon](https://www.ebacon.com/construction/construction-labor-burden-calculation-the-complete-formula/)
- [Fully Burdened Labor Rate - Procore](https://www.procore.com/library/fully-burdened-labor-rate)
- [Construction Labor Burden - Autodesk](https://www.autodesk.com/blogs/construction/construction-labor-burden-explained/)
- [Labor Productivity - BLS](https://www.bls.gov/productivity/highlights/construction-labor-productivity.htm)

### WIP Reporting
- [Work in Progress Guide - Deltek](https://www.deltek.com/en/construction/accounting/work-in-progress)
- [WIP Accounting - Procore](https://www.procore.com/library/work-in-progress-accounting)
- [WIP Report Guide - Foundation Software](https://www.foundationsoft.com/learn/wip-report-field-guide/)

### Overhead Allocation
- [Overhead Allocation Methods - Foundation Software](https://www.foundationsoft.com/learn/overhead-allocation-methods/)
- [Cost Allocation - Buildertrend](https://buildertrend.com/blog/cost-allocation/)
- [Overhead Cost Allocation - Deltek](https://www.deltek.com/en/construction/accounting/job-costing/overhead-cost)

### Quote-to-Close & Win Rates
- [Closing Rate for Contractors - Hook Agency](https://hookagency.com/blog/contractor-good-closing-rate/)
- [Bid-Hit Ratio - Sunflower Bank](https://www.sunflowerbank.com/about-us/resource-articles/is-your-lsquo;bid-hit-rsquo;-ratio-okay/)
- [Bid-Hit Win Ratio - For Construction Pros](https://www.forconstructionpros.com/business/article/20868204/how-construction-contractors-can-improve-their-bidhit-win-ratio)

### Customer Satisfaction
- [Construction NPS - Lead Edge](https://lead-edge.co.uk/services/construction-net-promoter-score/)
- [Net Promoter Score - Qualtrics](https://www.qualtrics.com/articles/customer-experience/net-promoter-score/)

### Cash Flow & DSO
- [DSO for Construction - Construction Cost Accounting](https://www.constructioncostaccounting.com/post/simple-guide-to-days-sales-outstanding-dso)
- [DSO Calculation - Upflow](https://upflow.io/blog/reduce-dso/dso-calculation-formula)

### Dashboard Design
- [Dashboard Design Principles - RIB Software](https://www.rib-software.com/en/blogs/bi-dashboard-design-principles-best-practices)
- [Dashboard Design - Sisense](https://www.sisense.com/blog/4-design-principles-creating-better-dashboards/)
- [Dashboard Best Practices - Tableau](https://help.tableau.com/current/pro/desktop/en-us/dashboards_best_practices.htm)
- [Dashboard Design Guide - Improvado](https://improvado.io/blog/dashboard-design-guide)
- [Dashboard Design Tutorial - DataCamp](https://www.datacamp.com/tutorial/dashboard-design-tutorial)

---

## Appendix A: KPI Formula Quick Reference

```typescript
// Financial KPIs
grossMargin = (revenue - cogs) / revenue * 100
netMargin = netIncome / revenue * 100
workingCapital = currentAssets - currentLiabilities
workingCapitalRatio = currentAssets / currentLiabilities

// Project KPIs
jobGrossMargin = (projectRevenue - projectDirectCosts) / projectRevenue * 100
estimateVariance = (actualCost - estimatedCost) / estimatedCost * 100
changeOrderPercent = totalChangeOrderValue / originalContractValue * 100
costPerformanceIndex = earnedValue / actualCost
schedulePerformanceIndex = earnedValue / plannedValue

// Sales KPIs
quoteToCloseRatio = jobsWon / totalEstimates * 100
bidHitRatio = numberOfBids / numberOfJobsWon
pipelineValue = sum(estimateValue * probability)

// Cash Flow KPIs
dso = (accountsReceivable / totalCreditSales) * numberOfDays
netCashFlow = cashInflows - cashOutflows
overbilling = billingsToDate - earnedRevenue

// Labor KPIs
laborBurdenRate = indirectCosts / directCosts * 100
fullyBurdenedRate = (baseWage + allBurdenCosts) / productiveHours
overtimePercent = overtimeHours / totalHours * 100

// Satisfaction KPIs
nps = percentPromoters - percentDetractors
repeatBusinessRate = revenueFromRepeatClients / totalRevenue * 100
```

---

*Report generated for ContractorOS BI/Analytics feature planning. Last updated: February 3, 2026*
