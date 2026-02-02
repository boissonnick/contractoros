# Sprint 14: AI Intelligence Foundation

> **Sprint Start:** 2026-01-30
> **Sprint Goal:** Establish the foundation for AI-powered construction intelligence
> **Focus:** Data pipeline, intelligence schema, UI components, FRED/BLS integration

---

## Sprint Overview

This sprint establishes the technical foundation for ContractorOS's AI intelligence layer. We're building:

1. **Intelligence Data Schema** - Firestore collections for storing market data
2. **External Data Pipeline** - FRED API and BLS data integration
3. **Intelligence UI Components** - Reusable insight display components
4. **Estimate Builder Integration** - First AI insights in the estimate workflow

---

## User Stories

### US-14.1: As a contractor, I want to see current material price trends so I can price estimates accurately

**Acceptance Criteria:**
- [ ] Dashboard shows material price widget with lumber, steel, cement trends
- [ ] Prices update daily from FRED API
- [ ] 30-day and 90-day percent changes displayed
- [ ] Click to see historical chart

### US-14.2: As a contractor, I want to see labor rate benchmarks for my area so I know if my rates are competitive

**Acceptance Criteria:**
- [ ] Settings shows regional labor rates by trade
- [ ] Based on BLS data and user ZIP code
- [ ] Comparison to national average
- [ ] Source and date transparency

### US-14.3: As a contractor, I want AI suggestions when adding line items so I don't have to guess pricing

**Acceptance Criteria:**
- [ ] Line item picker shows "AI Suggested Price" when available
- [ ] Suggestion based on region and project type
- [ ] Shows confidence level (based on data availability)
- [ ] Can dismiss or accept suggestions

### US-14.4: As a platform, we need to collect anonymized estimate data to build our intelligence moat

**Acceptance Criteria:**
- [ ] User opt-in for data contribution (default opt-in)
- [ ] Anonymization removes org/user identifiers
- [ ] Aggregation to ZIP code prefix level
- [ ] Cloud Function processes on estimate completion

---

## Technical Tasks

### Task 1: Intelligence Type Definitions
**Size:** S (2 hours)
**Priority:** P0 - Foundation

Create TypeScript types for all intelligence data structures.

**File:** `apps/web/lib/intelligence/types.ts`

```typescript
// Material price indices from FRED
interface MaterialPriceIndex {
  id: string;
  material: MaterialType;
  category: MaterialCategory;
  pricePerUnit: number;
  unit: string;
  region: 'national' | 'west' | 'midwest' | 'south' | 'northeast';
  source: 'fred' | 'bls' | 'manual';
  timestamp: Date;
  percentChange30d: number;
  percentChange90d: number;
  historicalData: { date: Date; price: number }[];
}

type MaterialType =
  | 'lumber_framing'
  | 'lumber_plywood'
  | 'steel_structural'
  | 'steel_rebar'
  | 'cement_portland'
  | 'copper_wire'
  | 'copper_pipe'
  | 'drywall'
  | 'insulation';

// Regional labor rates
interface LaborRateData {
  id: string;
  trade: TradeCategory;
  occupation: string;          // BLS occupation code
  zipCodePrefix: string;       // First 3 digits
  state: string;
  region: string;
  hourlyRateLow: number;
  hourlyRateMedian: number;
  hourlyRateHigh: number;
  source: 'bls_oews' | 'davis_bacon' | 'user_aggregate';
  sampleSize?: number;
  lastUpdated: Date;
}

// Market benchmarks (aggregated from user data)
interface MarketBenchmark {
  id: string;
  projectType: ProjectType;
  zipCodePrefix: string;
  squareFootCost: {
    low: number;
    median: number;
    high: number;
  };
  commonLineItems: LineItemBenchmark[];
  sampleSize: number;
  lastUpdated: Date;
}

interface LineItemBenchmark {
  description: string;
  trade: TradeCategory;
  unitCostLow: number;
  unitCostMedian: number;
  unitCostHigh: number;
  frequency: number;           // % of estimates with this item
}

// AI suggestion for estimate line items
interface PriceSuggestion {
  suggestedPrice: number;
  priceRange: { low: number; high: number };
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  factors: string[];           // "Based on 23 similar projects in your area"
  source: 'market' | 'historical' | 'user';
}
```

---

### Task 2: FRED API Integration
**Size:** M (4 hours)
**Priority:** P0 - Data Pipeline

Create service to fetch material price data from Federal Reserve Economic Data API.

**File:** `apps/web/lib/intelligence/material-prices.ts`

```typescript
const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// Key series for construction materials
const MATERIAL_SERIES = {
  lumber_framing: 'WPU0811',      // Lumber
  lumber_plywood: 'WPU0831',      // Plywood
  steel_structural: 'WPU1017',    // Steel mill products
  cement_portland: 'WPU1321',     // Cement
  copper_wire: 'WPU1022',         // Copper
};

export async function fetchMaterialPrices(): Promise<MaterialPriceIndex[]>
export async function getMaterialPriceHistory(material: MaterialType, months: number): Promise<...>
export async function calculatePriceChanges(material: MaterialType): Promise<{ change30d: number; change90d: number }>
```

**Cloud Function:** `functions/src/intelligence/fetchMaterialPrices.ts`
- Scheduled to run daily at 6 AM
- Fetches all material series
- Stores in Firestore `/intelligence/materialPrices/{materialId}`
- Calculates 30d/90d percent changes

---

### Task 3: BLS Labor Rate Integration
**Size:** M (4 hours)
**Priority:** P0 - Data Pipeline

Create service to fetch occupational wage data from Bureau of Labor Statistics.

**File:** `apps/web/lib/intelligence/labor-rates.ts`

```typescript
const BLS_API_KEY = process.env.BLS_API_KEY;
const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2';

// Construction occupation codes
const OCCUPATION_CODES = {
  carpenter: '47-2031',
  electrician: '47-2111',
  plumber: '47-2152',
  hvac_tech: '49-9021',
  painter: '47-2141',
  roofer: '47-2181',
  concrete_mason: '47-2051',
  general_laborer: '47-2061',
};

export async function fetchLaborRates(state: string): Promise<LaborRateData[]>
export async function getLaborRateByZip(zipCode: string, trade: TradeCategory): Promise<LaborRateData | null>
export async function compareToNationalAverage(rate: number, trade: TradeCategory): Promise<{ percentDiff: number; comparison: 'above' | 'below' | 'average' }>
```

**Cloud Function:** `functions/src/intelligence/fetchLaborRates.ts`
- Scheduled to run weekly (data updates annually)
- Fetches rates for all states
- Stores in Firestore `/intelligence/laborRates/{tradeId}/{state}`

---

### Task 4: Firestore Rules & Indexes
**Size:** S (1 hour)
**Priority:** P0 - Foundation

Add Firestore rules for intelligence collections.

**Update:** `firestore.rules`

```javascript
// Intelligence collections - read by authenticated users, write by system only
match /intelligence/{collection}/{docId} {
  allow read: if isAuthenticated();
  allow write: if false;  // Only Cloud Functions can write
}

// User intelligence contribution (opt-in aggregated data)
match /intelligence/userContributions/{contributionId} {
  allow read: if false;   // Never readable
  allow create: if isAuthenticated();  // Users can contribute
}
```

**Update:** `firestore.indexes.json`

```json
{
  "collectionGroup": "materialPrices",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "material", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

---

### Task 5: Intelligence UI Components
**Size:** M (4 hours)
**Priority:** P1 - UI

Create reusable components for displaying AI insights.

**Files:**

```
apps/web/components/intelligence/
├── InsightCard.tsx             # Generic insight display with icon, title, value
├── MarketComparison.tsx        # Price range visualization with marker
├── ConfidenceScore.tsx         # Circular or bar confidence meter
├── PriceTrendChart.tsx         # Mini sparkline for price trends
├── MaterialPriceWidget.tsx     # Dashboard widget showing material prices
├── LaborRateBenchmark.tsx      # Trade-specific labor rate display
└── index.ts
```

**InsightCard.tsx:**
```tsx
interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtext?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  confidence?: 'high' | 'medium' | 'low';
  onClick?: () => void;
}
```

**MarketComparison.tsx:**
```tsx
interface MarketComparisonProps {
  low: number;
  median: number;
  high: number;
  current: number;
  label?: string;
  formatValue?: (val: number) => string;
}

// Visual:
// Low ─────|─────●─────|───── High
//          ↑           ↑
//        Median      Your Price
```

---

### Task 6: Material Price Dashboard Widget
**Size:** S (2 hours)
**Priority:** P1 - Dashboard

Add material price trends to the main dashboard.

**Update:** `apps/web/app/dashboard/page.tsx`

Add a new dashboard card showing:
- Top 5 material price trends (lumber, steel, cement, copper, drywall)
- 30-day percent change with color coding (red/green)
- Click to expand to full chart
- "Last updated" timestamp

---

### Task 7: Line Item AI Suggestions
**Size:** L (6 hours)
**Priority:** P1 - Core Feature

Integrate AI suggestions into the Estimate Builder line item picker.

**Update:** `apps/web/components/estimates/LineItemPicker.tsx`

When user selects a line item:
1. Check if we have benchmark data for this item type
2. Look up regional pricing based on user's ZIP code
3. Display suggestion with confidence level
4. Allow user to accept or dismiss

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
  <div className="flex items-center gap-2">
    <SparklesIcon className="h-4 w-4 text-blue-500" />
    <span className="text-sm font-medium text-blue-700">AI Suggested Price</span>
    <Badge variant="outline" size="sm">{confidence} confidence</Badge>
  </div>
  <div className="mt-1 text-lg font-semibold text-blue-900">
    ${suggestedPrice.toLocaleString()} / {unit}
  </div>
  <div className="text-xs text-blue-600">
    Based on {dataPoints} similar projects in your area
  </div>
  <div className="flex gap-2 mt-2">
    <Button size="sm" onClick={acceptSuggestion}>Use This Price</Button>
    <Button size="sm" variant="ghost" onClick={dismiss}>Dismiss</Button>
  </div>
</div>
```

---

### Task 8: User Data Contribution Pipeline
**Size:** M (4 hours)
**Priority:** P2 - Data Collection

Create Cloud Function to anonymize and aggregate user estimate data.

**File:** `functions/src/intelligence/aggregateUserData.ts`

Triggered when an estimate is marked as "approved" or "sent":
1. Extract line items with prices
2. Anonymize (remove org/user IDs)
3. Aggregate to ZIP code prefix level
4. Store in contributions collection
5. Update market benchmarks periodically

**Anonymization rules:**
- Remove: orgId, userId, clientName, project address
- Keep: ZIP prefix (first 3 digits), project type, line items, prices
- Minimum N=5 for any insight to be shown

---

### Task 9: Settings - Intelligence Preferences
**Size:** S (2 hours)
**Priority:** P2 - Settings

Add intelligence settings to the settings page.

**File:** `apps/web/app/dashboard/settings/intelligence/page.tsx`

Settings options:
- [ ] Enable AI price suggestions (default: on)
- [ ] Contribute anonymized data to improve suggestions (default: on)
- [ ] Show material price alerts (default: on)
- [ ] Preferred data source (if multiple available)
- [ ] ZIP code for regional pricing (auto-detected from org address)

---

### Task 10: Intelligence Hook
**Size:** M (3 hours)
**Priority:** P0 - Foundation

Create React hook for accessing intelligence data.

**File:** `apps/web/lib/hooks/useIntelligence.ts`

```typescript
export function useIntelligence() {
  const { orgId } = useAuth();

  return {
    // Material prices
    materialPrices: MaterialPriceIndex[];
    materialPricesLoading: boolean;
    getMaterialPrice: (material: MaterialType) => MaterialPriceIndex | null;

    // Labor rates
    laborRates: LaborRateData[];
    laborRatesLoading: boolean;
    getLaborRate: (trade: TradeCategory, zipCode?: string) => LaborRateData | null;

    // Price suggestions
    getSuggestion: (lineItem: Partial<LineItem>, projectType: ProjectType) => Promise<PriceSuggestion | null>;

    // Settings
    intelligenceEnabled: boolean;
    contributionEnabled: boolean;
  };
}

export function useMaterialPrices() { ... }
export function useLaborRates(state?: string) { ... }
export function usePriceSuggestion(lineItem: Partial<LineItem>) { ... }
```

---

## Files to Create

| File | Task | Priority |
|------|------|----------|
| `lib/intelligence/types.ts` | Task 1 | P0 |
| `lib/intelligence/material-prices.ts` | Task 2 | P0 |
| `lib/intelligence/labor-rates.ts` | Task 3 | P0 |
| `lib/hooks/useIntelligence.ts` | Task 10 | P0 |
| `components/intelligence/InsightCard.tsx` | Task 5 | P1 |
| `components/intelligence/MarketComparison.tsx` | Task 5 | P1 |
| `components/intelligence/ConfidenceScore.tsx` | Task 5 | P1 |
| `components/intelligence/PriceTrendChart.tsx` | Task 5 | P1 |
| `components/intelligence/MaterialPriceWidget.tsx` | Task 6 | P1 |
| `components/intelligence/index.ts` | Task 5 | P1 |
| `functions/src/intelligence/fetchMaterialPrices.ts` | Task 2 | P0 |
| `functions/src/intelligence/fetchLaborRates.ts` | Task 3 | P0 |
| `functions/src/intelligence/aggregateUserData.ts` | Task 8 | P2 |
| `app/dashboard/settings/intelligence/page.tsx` | Task 9 | P2 |

## Files to Update

| File | Task | Changes |
|------|------|---------|
| `firestore.rules` | Task 4 | Add intelligence collection rules |
| `firestore.indexes.json` | Task 4 | Add intelligence indexes |
| `app/dashboard/page.tsx` | Task 6 | Add material price widget |
| `components/estimates/LineItemPicker.tsx` | Task 7 | Add AI suggestion display |
| `types/index.ts` | Task 1 | Add intelligence types |

---

## Environment Variables Needed

```bash
# Add to .env.local
FRED_API_KEY=your_fred_api_key_here
BLS_API_KEY=your_bls_api_key_here

# Add to GCP Secret Manager for Cloud Functions
gcloud secrets create FRED_API_KEY --data-file=-
gcloud secrets create BLS_API_KEY --data-file=-
```

**Get API Keys:**
- FRED: https://fred.stlouisfed.org/docs/api/api_key.html (free, instant)
- BLS: https://www.bls.gov/developers/home.htm (free, instant)

---

## Sprint Schedule

| Day | Focus | Tasks |
|-----|-------|-------|
| 1 | Foundation | Task 1 (Types), Task 4 (Rules), Task 10 (Hook) |
| 2 | Data Pipeline | Task 2 (FRED), Task 3 (BLS) |
| 3 | UI Components | Task 5 (Components) |
| 4 | Integration | Task 6 (Dashboard), Task 7 (Line Items) |
| 5 | Polish | Task 8 (Contribution), Task 9 (Settings), Testing |

---

## Definition of Done

- [ ] Material prices display on dashboard
- [ ] Labor rates available by ZIP code
- [ ] Line item picker shows AI suggestions
- [ ] User can enable/disable intelligence features
- [ ] Data pipeline runs without errors
- [ ] TypeScript passes
- [ ] Firestore rules deployed
- [ ] Documentation updated

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| FRED/BLS API rate limits | Data freshness | Cache aggressively, batch requests |
| Low user data volume initially | Poor suggestions | Supplement with public data, show confidence |
| Suggestion accuracy concerns | User trust | Always show data source and sample size |

---

## Success Metrics

- [ ] Material price data < 24 hours old
- [ ] Labor rates available for 50 states
- [ ] 80% of line items have suggestion capability
- [ ] <500ms latency for suggestions
- [ ] Zero PII in intelligence database

---

## Next Sprint Preview (Sprint 15)

- Estimate confidence scoring
- Market comparison visualization on estimates
- Historical price trend charts
- Price alert notifications
- Enhanced line item suggestions with user feedback loop
