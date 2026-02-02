# ContractorOS AI Intelligence Platform Vision

> **Version:** 1.0
> **Created:** 2026-01-30
> **Author:** Architecture Session
> **Status:** Strategic Vision Document

---

## Executive Summary

ContractorOS will evolve from a project management platform into an **AI-powered construction intelligence platform** that provides contractors with data-driven insights, accurate estimates, benchmarking, and predictive analytics. This document outlines the vision, architecture, and implementation roadmap for embedding AI capabilities throughout the platform.

---

## Vision Statement

> "Transform ContractorOS into the construction industry's most intelligent platform - where every estimate is informed by real market data, every decision is backed by industry benchmarks, and every contractor operates with enterprise-level intelligence regardless of their size."

---

## The Problem We're Solving

### Current Industry Pain Points

1. **Estimation Guesswork**
   - Contractors rely on gut feeling and outdated spreadsheets
   - Material prices fluctuate significantly (lumber alone saw 400% swings in 2020-2023)
   - No visibility into what others are charging in their market

2. **Information Asymmetry**
   - Large contractors have RSMeans subscriptions ($300+/year minimum)
   - Small contractors can't afford enterprise data services
   - Regional pricing variations are opaque

3. **Bid Analysis Blindness**
   - No way to know if subcontractor bids are competitive
   - Historical bid data sits unused in filing cabinets
   - Change order pricing lacks benchmarks

4. **Profitability Mysteries**
   - Why did some projects succeed and others fail?
   - Which trade categories consistently run over budget?
   - What's the true cost of delays?

---

## The ContractorOS Intelligence Advantage

### Three Pillars of Construction Intelligence

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CONTRACTOROS INTELLIGENCE PLATFORM                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   EXTERNAL   │    │   INTERNAL   │    │     AI       │          │
│  │    DATA      │    │    DATA      │    │   ENGINE     │          │
│  │              │    │              │    │              │          │
│  │ • BLS/FRED   │    │ • User Bids  │    │ • Estimation │          │
│  │ • RSMeans    │    │ • Invoices   │    │ • Benchmarks │          │
│  │ • Davis-Bacon│    │ • Time Data  │    │ • Predictions│          │
│  │ • Material   │    │ • Photos     │    │ • Assistant  │          │
│  │   Indices    │    │ • Change     │    │ • Anomaly    │          │
│  │ • Weather    │    │   Orders     │    │   Detection  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         └───────────────────┴───────────────────┘                   │
│                             │                                        │
│                    ┌────────▼────────┐                              │
│                    │  INTELLIGENCE   │                              │
│                    │     LAYER       │                              │
│                    │                 │                              │
│                    │ Surfaces insights│                              │
│                    │ directly in UI   │                              │
│                    └─────────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Architecture

### 1. External Data Sources (Construction Intelligence Database)

#### Tier 1: Free Government Data (Foundation)

| Source | Data Type | Update Frequency | Implementation |
|--------|-----------|------------------|----------------|
| **FRED API** | Material price indices (lumber, steel, cement) | Monthly | Direct API integration |
| **BLS OEWS** | Wage data by occupation and geography | Annual | CSV import pipeline |
| **SAM.gov Davis-Bacon** | Prevailing wage rates by county | Continuous | API integration |
| **Census Bureau** | Construction activity, permits | Monthly | API integration |
| **HUD Cost Indices** | Location adjustment factors | Annual | Database import |

#### Tier 2: Low-Cost Enhancement

| Source | Data Type | Cost | Implementation |
|--------|-----------|------|----------------|
| **Craftsman National Estimator** | Unit costs, manhours | $14/month | Manual import |
| **Home Depot/Lowe's Pricing** | Retail material prices | Scraping cost | Web scraping |
| **State Prevailing Wage** | Regional labor rates | Free | State API/scraping |

#### Tier 3: Premium Data (Future)

| Source | Data Type | Cost | When to Add |
|--------|-----------|------|-------------|
| **1build API** | 68M live data points | $$$ | At 1000+ customers |
| **RSMeans** | Industry standard costs | $300+/year | Enterprise tier |

### 2. Internal Data Collection (The Moat)

**This is our competitive advantage** - aggregated, anonymized data from our user base that no one else has.

#### Data Points to Collect

```typescript
// From Estimates
interface EstimateIntelligence {
  lineItems: {
    description: string;
    trade: TradeCategory;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }[];
  projectType: ProjectType;
  squareFootage?: number;
  zipCode: string;
  state: string;
  timestamp: Date;
  status: 'draft' | 'sent' | 'approved' | 'declined';
  clientType: 'residential' | 'commercial';
}

// From Subcontractor Bids
interface BidIntelligence {
  trade: TradeCategory;
  bidAmount: number;
  projectType: ProjectType;
  squareFootage?: number;
  zipCode: string;
  bidDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
  performanceScore?: number; // After completion
}

// From Invoices & Actuals
interface ActualsIntelligence {
  projectId: string;
  estimatedTotal: number;
  actualTotal: number;
  variance: number;
  varianceByTrade: Record<TradeCategory, number>;
  changeOrders: {
    reason: string;
    amount: number;
    category: string;
  }[];
  daysEstimated: number;
  daysActual: number;
}

// From Time Tracking
interface LaborIntelligence {
  trade: TradeCategory;
  hoursPerUnit: number;
  taskType: string;
  projectType: ProjectType;
  zipCode: string;
  crewSize: number;
  weatherConditions?: WeatherCondition;
}
```

### 3. Data Privacy & Anonymization

**Critical Principle:** User data contributes to aggregate intelligence but individual contractor data is NEVER visible to others.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ANONYMIZATION PIPELINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Raw User Data                                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ANONYMIZATION LAYER                                          ││
│  │ • Remove org/user identifiers                                ││
│  │ • Aggregate to ZIP code level (never address)                ││
│  │ • Require minimum N=5 data points for any insight            ││
│  │ • Add statistical noise for small samples                    ││
│  │ • Hash subcontractor names                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│       │                                                          │
│       ▼                                                          │
│  Intelligence Database (aggregate only)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI-Powered Features

### Phase 1: Estimation Intelligence (Sprint 14-16)

#### 1.1 Smart Line Item Suggestions

When a user adds a line item, suggest unit costs based on:
- Historical data from similar projects in their region
- Current material price indices
- Seasonal adjustments

**UI Integration:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Add Line Item                                                    │
├─────────────────────────────────────────────────────────────────┤
│ Description: [Hardwood flooring installation            ]       │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💡 AI Insight                                                │ │
│ │ Average cost in your area: $8.50 - $12.00 / sq ft           │ │
│ │ Based on 47 similar projects in ZIP 90210                   │ │
│ │ Your typical price: $10.25 / sq ft                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Unit Cost: [$10.25        ]  💡 Suggested                       │
│ Quantity:  [500           ]                                      │
│ Unit:      [sq ft         ]                                      │
│                                                                  │
│ Total: $5,125.00                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 Estimate Confidence Score

After completing an estimate, show a confidence score based on:
- How many data points support the pricing
- Variance from market averages
- Material price volatility

**UI Integration:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Estimate Summary                                      [Send]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Total: $45,250.00                                               │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 Estimate Intelligence                                     │ │
│ │                                                              │ │
│ │ Confidence: ████████░░ 78%                                   │ │
│ │                                                              │ │
│ │ ⚠️  Lumber prices up 12% in last 30 days                    │ │
│ │ ✓  Labor rates match market within 5%                        │ │
│ │ ✓  Similar projects avg $42k-$48k in your area              │ │
│ │                                                              │ │
│ │ Compared to market:                                          │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │    Low     |    Market    |  This Quote  |    High     │ │ │
│ │ │  $38,000   |   $43,500    |   $45,250    |  $52,000    │ │ │
│ │ │            |              |      ▲       |             │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3 Material Price Alerts

Proactive notifications when material prices change significantly:
- Lumber, steel, copper, concrete indices
- Regional variations
- Suggest estimate updates for pending quotes

### Phase 2: Bid Intelligence (Sprint 17-18)

#### 2.1 Subcontractor Bid Analysis

When a sub submits a bid, compare to:
- Their historical bids for similar work
- Market rates for the trade
- Other bids you've received

**UI Integration:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Bid from ABC Electrical - Kitchen Remodel                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Bid Amount: $8,500                                              │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Bid Analysis                                              │ │
│ │                                                              │ │
│ │ vs. Market:   ███████████░░░ $7,200 - $9,800 range          │ │
│ │               $8,500 is 3% above average                     │ │
│ │                                                              │ │
│ │ vs. This Sub: This is 8% higher than their typical bid      │ │
│ │               for similar scope                              │ │
│ │                                                              │ │
│ │ vs. Other Bids: You have 2 other bids for this work         │ │
│ │               - Johnson Electric: $7,800 (8% lower)          │ │
│ │               - Quick Spark: $9,200 (8% higher)              │ │
│ │                                                              │ │
│ │ Sub Performance: ⭐⭐⭐⭐☆ (4.2 avg from 12 projects)         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Accept Bid]  [Counter]  [Decline]                              │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Bid Recommendation Engine

When soliciting bids, suggest:
- Optimal number of bids to request
- Subs with best price/performance ratio
- Market timing (when prices typically dip)

### Phase 3: Project Intelligence (Sprint 19-20)

#### 3.1 Profitability Predictions

Before starting a project, predict likely outcome based on:
- Historical performance on similar projects
- Current market conditions
- Team availability and workload

#### 3.2 Risk Indicators

Flag projects with:
- Thin margins below historical averages
- Scope creep patterns from similar projects
- Weather risk for outdoor work

#### 3.3 Post-Project Analysis

Automated analysis comparing estimate vs. actuals:
- Where did we gain/lose money?
- Which trades consistently run over?
- What change order patterns repeat?

### Phase 4: AI Assistant (Sprint 21-22)

#### 4.1 Contextual AI Chat

An embedded AI assistant that understands the user's context:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 ContractorOS Assistant                              [─] [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ User: What should I charge for bathroom remodels in my area?    │
│                                                                  │
│ Assistant: Based on your location (ZIP 90210) and your          │
│ historical pricing, here's what I see:                          │
│                                                                  │
│ 📊 Your average bathroom remodel: $18,500                       │
│ 📈 Market range: $15,000 - $28,000                              │
│ ⭐ Your win rate at current pricing: 68%                        │
│                                                                  │
│ Key factors in your area:                                       │
│ • Labor costs 12% above national average                        │
│ • Tile installation trending up 8% this quarter                 │
│ • Your plumbing subs average $2,400 vs market $2,100            │
│                                                                  │
│ Suggestion: Your pricing is competitive. You could test         │
│ a 5-10% increase on premium finishes without impacting          │
│ win rate significantly.                                         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Type a question...                                     [Send]   │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Voice Commands

"Hey ContractorOS, what's the going rate for framing in Denver?"
- Voice input → AI processing → spoken response
- Hands-free operation in the field

---

## Technical Architecture

### Data Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA INGESTION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  External APIs                    User Activity                  │
│  ┌────────────┐                  ┌────────────┐                 │
│  │ FRED       │                  │ Estimates  │                 │
│  │ BLS        │                  │ Invoices   │                 │
│  │ SAM.gov    │                  │ Bids       │                 │
│  │ Weather    │                  │ Time Data  │                 │
│  └─────┬──────┘                  └─────┬──────┘                 │
│        │                               │                         │
│        ▼                               ▼                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              CLOUD FUNCTIONS (Event-Driven)                  ││
│  │  • Scheduled data fetches (daily/weekly)                     ││
│  │  • On-write triggers for user data                           ││
│  │  • Anonymization processing                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              INTELLIGENCE DATABASE (Firestore)               ││
│  │                                                              ││
│  │  /intelligence                                               ││
│  │    /materialPrices/{materialId}                              ││
│  │    /laborRates/{tradeId}/{zipCode}                          ││
│  │    /marketBenchmarks/{projectType}/{region}                  ││
│  │    /aggregateMetrics/{metric}                               ││
│  └─────────────────────────────────────────────────────────────┘│
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              AI/ML LAYER                                      ││
│  │  • Vertex AI for predictions                                 ││
│  │  • Claude API for natural language                           ││
│  │  • Custom models for pricing suggestions                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Firestore Collections for Intelligence

```typescript
// Material Price Index
interface MaterialPriceIndex {
  id: string;
  material: string;           // 'lumber', 'steel', 'copper', 'cement'
  category: string;           // 'structural', 'finishing', 'electrical'
  pricePerUnit: number;
  unit: string;
  region: string;             // 'national', 'west', 'midwest', etc.
  source: 'fred' | 'bls' | 'scrape' | 'manual';
  timestamp: Date;
  percentChange30d: number;
  percentChange90d: number;
}

// Regional Labor Rates
interface LaborRateData {
  id: string;
  trade: TradeCategory;
  zipCode: string;
  state: string;
  region: string;
  hourlyRate: number;
  burdenedRate: number;       // With benefits, insurance
  source: 'davis_bacon' | 'bls' | 'user_aggregate';
  sampleSize: number;         // For user aggregates
  lastUpdated: Date;
}

// Market Benchmarks
interface MarketBenchmark {
  id: string;
  projectType: ProjectType;
  region: string;
  zipCodePrefix: string;      // First 3 digits
  squareFootCost: {
    low: number;
    median: number;
    high: number;
  };
  duration: {
    avgDays: number;
    stdDev: number;
  };
  commonLineItems: {
    description: string;
    avgUnitCost: number;
    frequency: number;        // % of projects with this item
  }[];
  sampleSize: number;
  lastUpdated: Date;
}

// Aggregated User Metrics (fully anonymized)
interface AggregateMetric {
  id: string;
  metric: string;             // 'bathroom_remodel_cost', 'electrical_bid_avg'
  region: string;
  value: number;
  percentile25: number;
  percentile75: number;
  sampleSize: number;
  lastUpdated: Date;
}
```

### AI Integration Points

| Feature | AI Provider | Model | Use Case |
|---------|-------------|-------|----------|
| Line Item Suggestions | Vertex AI | Custom | Predict unit costs |
| Estimate Confidence | Vertex AI | Custom | Calculate risk scores |
| Natural Language | Claude API | claude-3-haiku | Chat assistant |
| Bid Analysis | Vertex AI | Custom | Compare to benchmarks |
| Voice Commands | Google Speech | Speech-to-Text | Field voice input |

---

## Implementation Roadmap

### Sprint 14: Intelligence Foundation (Current Sprint)

**Goal:** Establish data pipeline and basic intelligence infrastructure

**Tasks:**
1. Create `/intelligence` Firestore collections
2. Set up FRED API integration (material prices)
3. Build BLS data import pipeline (labor rates)
4. Create anonymization Cloud Functions
5. Design intelligence UI components
6. Add "AI Insights" placeholders to Estimate Builder

**Files to Create:**
```
apps/web/lib/intelligence/
├── types.ts                    # Intelligence data types
├── material-prices.ts          # FRED API integration
├── labor-rates.ts              # BLS data integration
├── benchmarks.ts               # Benchmark calculations
└── anonymizer.ts               # Data anonymization

apps/web/components/intelligence/
├── InsightCard.tsx             # Reusable insight display
├── MarketComparison.tsx        # Price comparison visual
├── ConfidenceScore.tsx         # Estimate confidence meter
└── index.ts

functions/src/intelligence/
├── fetchMaterialPrices.ts      # Scheduled FRED fetch
├── fetchLaborRates.ts          # Scheduled BLS fetch
├── aggregateUserData.ts        # Anonymized aggregation
└── index.ts
```

### Sprint 15: Estimation Intelligence

**Goal:** Add AI-powered suggestions to Estimate Builder

**Tasks:**
1. Line item cost suggestions based on region
2. Estimate confidence scoring
3. Material price trend alerts
4. Market comparison visualization

### Sprint 16: Data Enrichment

**Goal:** Expand data sources and collection

**Tasks:**
1. SAM.gov Davis-Bacon integration
2. State prevailing wage data (top 10 states)
3. User data contribution (opt-in)
4. Historical price trend charts

### Sprint 17-18: Bid Intelligence

**Goal:** AI-powered subcontractor bid analysis

**Tasks:**
1. Bid comparison to market rates
2. Sub performance scoring
3. Bid recommendation engine
4. Win rate optimization

### Sprint 19-20: Project Intelligence

**Goal:** Predictive project analytics

**Tasks:**
1. Profitability predictions
2. Risk indicator system
3. Post-project analysis automation
4. Lessons learned suggestions

### Sprint 21-22: AI Assistant

**Goal:** Natural language AI assistant

**Tasks:**
1. Claude API integration
2. Context-aware chat interface
3. Voice command support
4. Field-optimized mobile experience

---

## Business Model Implications

### Free Tier
- Basic AI insights (limited suggestions per month)
- Market averages (regional level)
- 50 AI-assisted estimates/month

### Professional Tier ($29/month)
- Unlimited AI insights
- ZIP code level pricing data
- Full estimate confidence scoring
- Bid analysis
- Material price alerts

### Enterprise Tier ($99/month)
- Everything in Professional
- API access to intelligence data
- Custom benchmarks for their project types
- White-label reports for clients
- Priority data freshness

### Data Value Proposition

"Every estimate you create makes the system smarter for you AND contributes to industry intelligence (anonymously). The more you use ContractorOS, the better your insights become."

---

## Privacy & Compliance

### Data Usage Policy

1. **User Control:** Users can opt out of data contribution
2. **Anonymization:** All contributed data is stripped of identifying info
3. **Minimum Thresholds:** No insights shown unless N≥5 data points
4. **Transparency:** Clear explanation of how data is used
5. **No Selling:** Data is never sold to third parties

### Compliance Considerations

- GDPR: Right to deletion, data portability
- CCPA: California privacy rights
- SOC 2: Security controls for enterprise

---

## Success Metrics

### Phase 1 (Foundation)
- [ ] Material price data updated daily
- [ ] Labor rates for top 50 metros
- [ ] 1,000+ estimates with AI insights

### Phase 2 (Adoption)
- [ ] 50% of estimates use AI suggestions
- [ ] User satisfaction score >4.0 for insights
- [ ] 30% reduction in estimate revision time

### Phase 3 (Intelligence Moat)
- [ ] 100,000+ anonymized data points
- [ ] Regional insights for 100+ metros
- [ ] Bid accuracy within 10% of market

### Phase 4 (Differentiation)
- [ ] AI-only features drive 20% of upgrades
- [ ] Industry recognition as "intelligent" platform
- [ ] Enterprise customers citing data as key value

---

## Appendix: Data Source APIs

### FRED API (Federal Reserve)
```
Base URL: https://api.stlouisfed.org/fred
Key Series:
- WPU081: Lumber
- WPU102: Steel mill products
- WPU101: Iron and steel
- PCU23822: Construction machinery
```

### BLS API
```
Base URL: https://api.bls.gov/publicAPI/v2
Key Series:
- OEWS: Occupational Employment (by trade)
- PPI: Producer Price Index (materials)
```

### SAM.gov Davis-Bacon
```
Base URL: https://sam.gov/api/wage-determination
Returns: Prevailing wages by county and trade
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-30 | Architecture Session | Initial vision document |
