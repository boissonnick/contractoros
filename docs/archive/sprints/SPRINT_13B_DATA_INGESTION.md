# Sprint 13B: Construction Intelligence Data Ingestion Pipeline

> **Sprint Start:** Ready for new session
> **Sprint Goal:** Build automated data ingestion pipeline for construction intelligence
> **Prerequisite:** None (can run in parallel with Sprint 14 UI work)
> **GCP Project:** contractoros-483812

---

## Sprint Overview

This sprint establishes the data foundation for the AI Intelligence Platform by building automated pipelines to ingest, process, and store construction cost data from multiple external sources.

### What This Sprint Builds

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   EXTERNAL SOURCES                    GCP INFRASTRUCTURE                     │
│   ┌──────────────┐                   ┌─────────────────────────────────────┐│
│   │ FRED API     │──────────────────▶│ Cloud Scheduler                     ││
│   │ (Materials)  │                   │ (Triggers daily/weekly)             ││
│   └──────────────┘                   └────────────┬────────────────────────┘│
│   ┌──────────────┐                                │                          │
│   │ BLS API      │──────────────────▶             ▼                          │
│   │ (Labor)      │                   ┌─────────────────────────────────────┐│
│   └──────────────┘                   │ Cloud Functions (Gen 2)             ││
│   ┌──────────────┐                   │ - fetchMaterialPrices               ││
│   │ SAM.gov      │──────────────────▶│ - fetchLaborRates                   ││
│   │ (Davis-Bacon)│                   │ - fetchDavisBacon                   ││
│   └──────────────┘                   │ - processUserContributions          ││
│   ┌──────────────┐                   └────────────┬────────────────────────┘│
│   │ User Data    │                                │                          │
│   │ (Estimates)  │───────────────────             │                          │
│   └──────────────┘                   │            ▼                          │
│                                      │ ┌─────────────────────────────────────┐
│                                      │ │ Cloud Storage (Raw Data)           ││
│                                      │ │ gs://contractoros-intelligence/    ││
│                                      │ │ - /raw/fred/                       ││
│                                      │ │ - /raw/bls/                        ││
│                                      │ │ - /raw/davis-bacon/                ││
│                                      │ └────────────┬────────────────────────┘
│                                      │              │                        │
│                                      │              ▼                        │
│                                      │ ┌─────────────────────────────────────┐
│                                      │ │ BigQuery (Analytics)               ││
│                                      │ │ - material_prices                  ││
│                                      │ │ - labor_rates                      ││
│                                      │ │ - user_benchmarks                  ││
│                                      │ └────────────┬────────────────────────┘
│                                      │              │                        │
│                                      │              ▼                        │
│                                      │ ┌─────────────────────────────────────┐
│                                      └▶│ Firestore (Live Data)              ││
│                                        │ /intelligence/materialPrices       ││
│                                        │ /intelligence/laborRates           ││
│                                        │ /intelligence/benchmarks           ││
│                                        └─────────────────────────────────────┘
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## GCP Services to Utilize

### 1. Cloud Functions (Gen 2) - Already Using
**Purpose:** Serverless compute for data fetching and processing
**Why:** Already in use for email functions, consistent with existing architecture

```
functions/src/intelligence/
├── fetchMaterialPrices.ts    # Daily FRED API fetch
├── fetchLaborRates.ts        # Weekly BLS API fetch
├── fetchDavisBacon.ts        # Weekly Davis-Bacon fetch
├── aggregateUserData.ts      # On-write trigger for user data
└── index.ts                  # Exports
```

### 2. Cloud Scheduler
**Purpose:** Trigger scheduled data fetches
**Why:** Native GCP, integrates with Cloud Functions, more reliable than cron

**Schedules to Create:**
| Schedule | Function | Frequency | Time |
|----------|----------|-----------|------|
| `fetch-material-prices` | fetchMaterialPrices | Daily | 6:00 AM EST |
| `fetch-labor-rates` | fetchLaborRates | Weekly | Sunday 2:00 AM EST |
| `fetch-davis-bacon` | fetchDavisBacon | Weekly | Sunday 3:00 AM EST |
| `aggregate-benchmarks` | aggregateBenchmarks | Daily | 4:00 AM EST |

### 3. Cloud Storage
**Purpose:** Store raw API responses for audit trail and reprocessing
**Why:** Cheap, durable, enables data replay if processing logic changes

**Bucket Structure:**
```
gs://contractoros-intelligence/
├── raw/
│   ├── fred/
│   │   └── YYYY-MM-DD/
│   │       └── {series_id}.json
│   ├── bls/
│   │   └── YYYY-MM-DD/
│   │       └── {state}_{occupation}.json
│   └── davis-bacon/
│       └── YYYY-MM-DD/
│           └── {state}_{county}.json
├── processed/
│   └── YYYY-MM-DD/
│       ├── material_prices.json
│       └── labor_rates.json
└── exports/
    └── YYYY-MM-DD/
        └── benchmarks.csv
```

### 4. BigQuery
**Purpose:** Analytics warehouse for historical data and complex queries
**Why:** Enables trend analysis, regional comparisons, ML model training

**Dataset:** `contractoros_intelligence`

**Tables:**
| Table | Description | Partitioning |
|-------|-------------|--------------|
| `material_prices` | Historical material price indices | By date |
| `labor_rates` | Regional labor rate snapshots | By date |
| `davis_bacon_rates` | Prevailing wage determinations | By state |
| `user_estimates_anon` | Anonymized user estimate data | By date |
| `benchmarks` | Calculated market benchmarks | By project_type |

### 5. Secret Manager - Already Using
**Purpose:** Store API keys securely
**Why:** Already in use for Firebase keys, consistent pattern

**Secrets to Add:**
```
FRED_API_KEY
BLS_API_KEY
```

### 6. Pub/Sub (Optional - Future)
**Purpose:** Decouple data ingestion from processing
**Why:** Enables more complex workflows, retry logic, fan-out

**Topics (Future):**
- `intelligence-raw-data` - Raw data ingested
- `intelligence-processed` - Data ready for Firestore

### 7. Vertex AI (Future - Sprint 19+)
**Purpose:** ML models for price predictions
**Why:** Native GCP ML platform, integrates with BigQuery

---

## Tasks

### Task 1: Create Cloud Storage Bucket
**Size:** S (30 min)
**Priority:** P0

```bash
# Create bucket for intelligence data
gsutil mb -l us-east1 -c STANDARD gs://contractoros-intelligence

# Set lifecycle policy (delete raw data after 90 days)
gsutil lifecycle set lifecycle.json gs://contractoros-intelligence
```

**lifecycle.json:**
```json
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 90,
        "matchesPrefix": ["raw/"]
      }
    }
  ]
}
```

---

### Task 2: Create BigQuery Dataset and Tables
**Size:** M (2 hours)
**Priority:** P0

```sql
-- Create dataset
CREATE SCHEMA IF NOT EXISTS `contractoros-483812.contractoros_intelligence`
OPTIONS(
  location = 'us-east1',
  description = 'Construction intelligence data warehouse'
);

-- Material prices table
CREATE TABLE IF NOT EXISTS `contractoros_intelligence.material_prices` (
  id STRING NOT NULL,
  material STRING NOT NULL,
  category STRING NOT NULL,
  price_per_unit FLOAT64 NOT NULL,
  unit STRING NOT NULL,
  region STRING NOT NULL,
  source STRING NOT NULL,
  fred_series_id STRING,
  fetch_date DATE NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  percent_change_7d FLOAT64,
  percent_change_30d FLOAT64,
  percent_change_90d FLOAT64,
  percent_change_ytd FLOAT64
)
PARTITION BY fetch_date
CLUSTER BY material, region;

-- Labor rates table
CREATE TABLE IF NOT EXISTS `contractoros_intelligence.labor_rates` (
  id STRING NOT NULL,
  trade STRING NOT NULL,
  bls_occupation_code STRING,
  occupation_title STRING NOT NULL,
  state STRING NOT NULL,
  region STRING NOT NULL,
  hourly_rate_low FLOAT64 NOT NULL,
  hourly_rate_median FLOAT64 NOT NULL,
  hourly_rate_high FLOAT64 NOT NULL,
  hourly_rate_mean FLOAT64 NOT NULL,
  burdened_rate_multiplier FLOAT64,
  source STRING NOT NULL,
  fetch_date DATE NOT NULL,
  timestamp TIMESTAMP NOT NULL
)
PARTITION BY fetch_date
CLUSTER BY trade, state;

-- Davis-Bacon rates table
CREATE TABLE IF NOT EXISTS `contractoros_intelligence.davis_bacon_rates` (
  id STRING NOT NULL,
  state STRING NOT NULL,
  county STRING NOT NULL,
  trade STRING NOT NULL,
  classification STRING NOT NULL,
  basic_hourly_rate FLOAT64 NOT NULL,
  fringe_rate FLOAT64 NOT NULL,
  total_rate FLOAT64 NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  wage_decision_number STRING NOT NULL,
  fetch_date DATE NOT NULL
)
PARTITION BY fetch_date
CLUSTER BY state, trade;

-- Anonymized user estimates (for benchmarking)
CREATE TABLE IF NOT EXISTS `contractoros_intelligence.user_estimates_anon` (
  id STRING NOT NULL,
  project_type STRING NOT NULL,
  zip_code_prefix STRING NOT NULL,
  region STRING NOT NULL,
  square_footage FLOAT64,
  total_amount FLOAT64 NOT NULL,
  line_item_count INT64 NOT NULL,
  status STRING NOT NULL,
  created_date DATE NOT NULL
)
PARTITION BY created_date
CLUSTER BY project_type, zip_code_prefix;

-- Calculated benchmarks
CREATE TABLE IF NOT EXISTS `contractoros_intelligence.benchmarks` (
  id STRING NOT NULL,
  project_type STRING NOT NULL,
  zip_code_prefix STRING NOT NULL,
  region STRING NOT NULL,
  sq_ft_cost_low FLOAT64,
  sq_ft_cost_median FLOAT64,
  sq_ft_cost_high FLOAT64,
  total_cost_low FLOAT64,
  total_cost_median FLOAT64,
  total_cost_high FLOAT64,
  sample_size INT64 NOT NULL,
  confidence_level STRING NOT NULL,
  calculated_date DATE NOT NULL
)
PARTITION BY calculated_date
CLUSTER BY project_type, region;
```

---

### Task 3: Add API Keys to Secret Manager
**Size:** S (15 min)
**Priority:** P0

```bash
# Get API keys first:
# FRED: https://fred.stlouisfed.org/docs/api/api_key.html
# BLS: https://www.bls.gov/developers/home.htm

# Add to Secret Manager
echo -n "your_fred_api_key" | gcloud secrets create FRED_API_KEY --data-file=- --project=contractoros-483812

echo -n "your_bls_api_key" | gcloud secrets create BLS_API_KEY --data-file=- --project=contractoros-483812

# Grant Cloud Functions access
gcloud secrets add-iam-policy-binding FRED_API_KEY \
  --member="serviceAccount:contractoros-483812@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=contractoros-483812

gcloud secrets add-iam-policy-binding BLS_API_KEY \
  --member="serviceAccount:contractoros-483812@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=contractoros-483812
```

---

### Task 4: Create FRED Data Fetch Function
**Size:** L (4 hours)
**Priority:** P0

**File:** `functions/src/intelligence/fetchMaterialPrices.ts`

```typescript
import * as functions from 'firebase-functions/v2';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import { getFirestore } from 'firebase-admin/firestore';

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// Material series to fetch
const MATERIAL_SERIES = {
  lumber_framing: { id: 'WPU0811', name: 'Framing Lumber', unit: 'MBF', category: 'lumber' },
  lumber_plywood: { id: 'WPU0831', name: 'Plywood', unit: 'MSF', category: 'lumber' },
  steel_structural: { id: 'WPU1017', name: 'Structural Steel', unit: 'ton', category: 'steel' },
  steel_rebar: { id: 'WPU101706', name: 'Rebar', unit: 'ton', category: 'steel' },
  cement_portland: { id: 'WPU1321', name: 'Portland Cement', unit: 'ton', category: 'concrete' },
  copper_wire: { id: 'WPU10220601', name: 'Copper Wire', unit: 'lb', category: 'copper' },
  drywall: { id: 'WPU1392', name: 'Drywall', unit: 'MSF', category: 'drywall' },
  insulation: { id: 'WPU1393', name: 'Insulation', unit: 'MSF', category: 'insulation' },
  roofing_shingles: { id: 'WPU1391', name: 'Asphalt Shingles', unit: 'square', category: 'roofing' },
  paint: { id: 'WPU0621', name: 'Paint', unit: 'gallon', category: 'finishes' },
  pvc_pipe: { id: 'WPU072104', name: 'PVC Pipe', unit: 'lb', category: 'plumbing' },
  hvac_equipment: { id: 'WPU1141', name: 'HVAC Equipment', unit: 'unit', category: 'hvac' },
};

export const fetchMaterialPrices = functions.scheduler.onSchedule(
  {
    schedule: '0 6 * * *', // 6 AM daily
    timeZone: 'America/New_York',
    region: 'us-east1',
    secrets: ['FRED_API_KEY'],
  },
  async (event) => {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      throw new Error('FRED_API_KEY not configured');
    }

    const storage = new Storage();
    const bigquery = new BigQuery();
    const db = getFirestore();

    const today = new Date().toISOString().split('T')[0];
    const bucket = storage.bucket('contractoros-intelligence');

    const results: any[] = [];

    for (const [materialKey, config] of Object.entries(MATERIAL_SERIES)) {
      try {
        // Fetch from FRED
        const response = await fetch(
          `${FRED_BASE_URL}/series/observations?` +
          `series_id=${config.id}&api_key=${apiKey}&file_type=json&` +
          `sort_order=desc&limit=365`
        );

        if (!response.ok) {
          console.error(`Failed to fetch ${materialKey}: ${response.status}`);
          continue;
        }

        const data = await response.json();

        // Save raw data to Cloud Storage
        const rawFile = bucket.file(`raw/fred/${today}/${config.id}.json`);
        await rawFile.save(JSON.stringify(data), {
          contentType: 'application/json',
        });

        // Process observations
        const observations = data.observations.filter((o: any) => o.value !== '.');
        if (observations.length === 0) continue;

        const current = parseFloat(observations[0].value);
        const obs7d = findObservationNearDays(observations, 7);
        const obs30d = findObservationNearDays(observations, 30);
        const obs90d = findObservationNearDays(observations, 90);

        const record = {
          id: `${materialKey}_${today}`,
          material: materialKey,
          category: config.category,
          displayName: config.name,
          price_per_unit: current,
          unit: config.unit,
          region: 'national',
          source: 'fred',
          fred_series_id: config.id,
          fetch_date: today,
          timestamp: new Date().toISOString(),
          percent_change_7d: obs7d ? ((current - obs7d) / obs7d) * 100 : null,
          percent_change_30d: obs30d ? ((current - obs30d) / obs30d) * 100 : null,
          percent_change_90d: obs90d ? ((current - obs90d) / obs90d) * 100 : null,
          percent_change_ytd: null, // Calculate separately
        };

        results.push(record);

        // Update Firestore (live data)
        await db.collection('intelligence')
          .doc('materialPrices')
          .collection('items')
          .doc(materialKey)
          .set({
            ...record,
            timestamp: new Date(),
            historicalData: observations.slice(0, 90).map((o: any) => ({
              date: o.date,
              price: parseFloat(o.value),
            })),
          });

      } catch (error) {
        console.error(`Error processing ${materialKey}:`, error);
      }
    }

    // Insert to BigQuery
    if (results.length > 0) {
      await bigquery
        .dataset('contractoros_intelligence')
        .table('material_prices')
        .insert(results);
    }

    console.log(`Fetched ${results.length} material prices`);
  }
);

function findObservationNearDays(observations: any[], days: number): number | null {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);

  for (const obs of observations) {
    const obsDate = new Date(obs.date);
    const diffDays = Math.abs((targetDate.getTime() - obsDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return parseFloat(obs.value);
    }
  }
  return null;
}
```

---

### Task 5: Create BLS Labor Rate Fetch Function
**Size:** L (4 hours)
**Priority:** P0

**File:** `functions/src/intelligence/fetchLaborRates.ts`

```typescript
import * as functions from 'firebase-functions/v2';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import { getFirestore } from 'firebase-admin/firestore';

const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2';

// Construction occupation codes
const OCCUPATIONS = {
  carpenter: { code: '47-2031', title: 'Carpenter' },
  electrician: { code: '47-2111', title: 'Electrician' },
  plumber: { code: '47-2152', title: 'Plumber' },
  hvac_tech: { code: '49-9021', title: 'HVAC Technician' },
  painter: { code: '47-2141', title: 'Painter' },
  roofer: { code: '47-2181', title: 'Roofer' },
  concrete_mason: { code: '47-2051', title: 'Concrete Mason' },
  general_laborer: { code: '47-2061', title: 'General Laborer' },
};

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const fetchLaborRates = functions.scheduler.onSchedule(
  {
    schedule: '0 2 * * 0', // 2 AM every Sunday
    timeZone: 'America/New_York',
    region: 'us-east1',
    secrets: ['BLS_API_KEY'],
  },
  async (event) => {
    const apiKey = process.env.BLS_API_KEY;
    if (!apiKey) {
      throw new Error('BLS_API_KEY not configured');
    }

    const storage = new Storage();
    const bigquery = new BigQuery();
    const db = getFirestore();

    const today = new Date().toISOString().split('T')[0];
    const bucket = storage.bucket('contractoros-intelligence');
    const currentYear = new Date().getFullYear();

    const results: any[] = [];

    // BLS API allows 50 series per request, batch accordingly
    for (const state of STATES) {
      const seriesIds: string[] = [];

      for (const [tradeKey, config] of Object.entries(OCCUPATIONS)) {
        // Build OEWS series ID
        // Format: OEUM + state code + 000000 + occupation code (no hyphen) + data type
        const stateCode = getStateCode(state);
        const occCode = config.code.replace('-', '');
        seriesIds.push(`OEUM${stateCode}000000${occCode}04`); // Median wage
      }

      try {
        const response = await fetch(`${BLS_BASE_URL}/timeseries/data/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seriesid: seriesIds,
            startyear: currentYear - 1,
            endyear: currentYear,
            registrationkey: apiKey,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${state}: ${response.status}`);
          continue;
        }

        const data = await response.json();

        // Save raw data
        const rawFile = bucket.file(`raw/bls/${today}/${state}.json`);
        await rawFile.save(JSON.stringify(data), {
          contentType: 'application/json',
        });

        // Process results
        if (data.Results?.series) {
          for (const series of data.Results.series) {
            const tradeKey = getTradeFromSeriesId(series.seriesID);
            if (!tradeKey || !series.data?.[0]) continue;

            const medianWage = parseFloat(series.data[0].value);

            const record = {
              id: `${tradeKey}_${state}_${today}`,
              trade: tradeKey,
              bls_occupation_code: OCCUPATIONS[tradeKey as keyof typeof OCCUPATIONS].code,
              occupation_title: OCCUPATIONS[tradeKey as keyof typeof OCCUPATIONS].title,
              state: state,
              region: getRegion(state),
              hourly_rate_low: medianWage * 0.7,  // Estimate
              hourly_rate_median: medianWage,
              hourly_rate_high: medianWage * 1.5, // Estimate
              hourly_rate_mean: medianWage * 1.05,
              burdened_rate_multiplier: 1.35,
              source: 'bls_oews',
              fetch_date: today,
              timestamp: new Date().toISOString(),
            };

            results.push(record);
          }
        }

        // Rate limit: BLS allows 500 requests per day
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing ${state}:`, error);
      }
    }

    // Insert to BigQuery
    if (results.length > 0) {
      await bigquery
        .dataset('contractoros_intelligence')
        .table('labor_rates')
        .insert(results);

      // Update Firestore with latest rates
      const batch = db.batch();
      const laborRatesRef = db.collection('intelligence').doc('laborRates').collection('items');

      for (const record of results) {
        batch.set(laborRatesRef.doc(`${record.trade}_${record.state}`), {
          ...record,
          timestamp: new Date(),
        });
      }

      await batch.commit();
    }

    console.log(`Fetched ${results.length} labor rates`);
  }
);

function getStateCode(state: string): string {
  // BLS uses FIPS state codes
  const codes: Record<string, string> = {
    'AL': '0100000', 'AK': '0200000', 'AZ': '0400000', 'AR': '0500000',
    'CA': '0600000', 'CO': '0800000', 'CT': '0900000', 'DE': '1000000',
    'FL': '1200000', 'GA': '1300000', 'HI': '1500000', 'ID': '1600000',
    'IL': '1700000', 'IN': '1800000', 'IA': '1900000', 'KS': '2000000',
    'KY': '2100000', 'LA': '2200000', 'ME': '2300000', 'MD': '2400000',
    'MA': '2500000', 'MI': '2600000', 'MN': '2700000', 'MS': '2800000',
    'MO': '2900000', 'MT': '3000000', 'NE': '3100000', 'NV': '3200000',
    'NH': '3300000', 'NJ': '3400000', 'NM': '3500000', 'NY': '3600000',
    'NC': '3700000', 'ND': '3800000', 'OH': '3900000', 'OK': '4000000',
    'OR': '4100000', 'PA': '4200000', 'RI': '4400000', 'SC': '4500000',
    'SD': '4600000', 'TN': '4700000', 'TX': '4800000', 'UT': '4900000',
    'VT': '5000000', 'VA': '5100000', 'WA': '5300000', 'WV': '5400000',
    'WI': '5500000', 'WY': '5600000',
  };
  return codes[state] || '0000000';
}

function getTradeFromSeriesId(seriesId: string): string | null {
  // Extract occupation code and map back to trade
  const occCode = seriesId.substring(17, 23);
  for (const [trade, config] of Object.entries(OCCUPATIONS)) {
    if (config.code.replace('-', '') === occCode.substring(0, 6)) {
      return trade;
    }
  }
  return null;
}

function getRegion(state: string): string {
  const regions: Record<string, string[]> = {
    northeast: ['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
    southeast: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
    midwest: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
    southwest: ['AZ', 'NM', 'OK', 'TX'],
    west: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY'],
    pacific: ['AK', 'CA', 'HI', 'OR', 'WA'],
  };

  for (const [region, states] of Object.entries(regions)) {
    if (states.includes(state)) return region;
  }
  return 'national';
}
```

---

### Task 6: Create User Data Aggregation Function
**Size:** M (3 hours)
**Priority:** P1

**File:** `functions/src/intelligence/aggregateUserData.ts`

Triggered when estimates are approved - anonymizes and aggregates to benchmarks.

---

### Task 7: Create Cloud Scheduler Jobs
**Size:** S (1 hour)
**Priority:** P0

```bash
# Material prices - daily at 6 AM EST
gcloud scheduler jobs create http fetch-material-prices \
  --location=us-east1 \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://us-east1-contractoros-483812.cloudfunctions.net/fetchMaterialPrices" \
  --oidc-service-account-email="contractoros-483812@appspot.gserviceaccount.com"

# Labor rates - weekly Sunday 2 AM EST
gcloud scheduler jobs create http fetch-labor-rates \
  --location=us-east1 \
  --schedule="0 2 * * 0" \
  --time-zone="America/New_York" \
  --uri="https://us-east1-contractoros-483812.cloudfunctions.net/fetchLaborRates" \
  --oidc-service-account-email="contractoros-483812@appspot.gserviceaccount.com"
```

---

### Task 8: Add Firestore Rules for Intelligence
**Size:** S (30 min)
**Priority:** P0

**Update:** `firestore.rules`

```javascript
// Intelligence collections - read by authenticated users, write by system only
match /intelligence/{document=**} {
  allow read: if isAuthenticated();
  allow write: if false;  // Only Cloud Functions can write
}

// User contributions (opt-in anonymized data)
match /intelligenceContributions/{contributionId} {
  allow read: if false;   // Never readable by clients
  allow create: if isAuthenticated() &&
    request.resource.data.keys().hasOnly(['projectType', 'zipCodePrefix', 'lineItems', 'totalAmount', 'createdAt']);
}
```

---

### Task 9: Deploy and Test
**Size:** M (2 hours)
**Priority:** P0

```bash
# Deploy functions
cd functions
npm run deploy

# Test manually
gcloud functions call fetchMaterialPrices --region=us-east1

# Check logs
gcloud functions logs read fetchMaterialPrices --region=us-east1 --limit=50

# Verify Firestore data
firebase firestore:get intelligence/materialPrices/items --project=contractoros-483812
```

---

### Task 10: Create Data Validation & Monitoring
**Size:** M (2 hours)
**Priority:** P1

Create alerts for:
- Fetch failures
- Data anomalies (>50% price changes)
- Missing data series
- API quota warnings

---

## File Structure After Sprint

```
functions/
├── src/
│   ├── intelligence/
│   │   ├── fetchMaterialPrices.ts    # NEW
│   │   ├── fetchLaborRates.ts        # NEW
│   │   ├── fetchDavisBacon.ts        # NEW (optional)
│   │   ├── aggregateUserData.ts      # NEW
│   │   └── index.ts                  # NEW
│   ├── email/
│   │   └── ... (existing)
│   └── index.ts                      # UPDATE - export intelligence functions
├── package.json                      # UPDATE - add BigQuery, Storage deps
└── tsconfig.json

apps/web/
├── lib/
│   └── intelligence/
│       ├── types.ts                  # EXISTS (from Sprint 14)
│       ├── material-prices.ts        # EXISTS
│       └── labor-rates.ts            # EXISTS
```

---

## Dependencies to Add

**functions/package.json:**
```json
{
  "dependencies": {
    "@google-cloud/bigquery": "^7.0.0",
    "@google-cloud/storage": "^7.0.0",
    "@google-cloud/secret-manager": "^5.0.0"
  }
}
```

---

## Success Criteria

- [ ] Cloud Storage bucket created with lifecycle policy
- [ ] BigQuery dataset and tables created
- [ ] API keys stored in Secret Manager
- [ ] fetchMaterialPrices function deployed and working
- [ ] fetchLaborRates function deployed and working
- [ ] Cloud Scheduler jobs created
- [ ] Firestore rules deployed
- [ ] Data visible in Firestore `/intelligence/materialPrices`
- [ ] Data visible in BigQuery `material_prices` table
- [ ] No errors in Cloud Functions logs

---

## Estimated Timeline

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | Tasks 1-3 (GCP setup, secrets) | 3 |
| 2 | Task 4 (FRED function) | 4 |
| 3 | Task 5 (BLS function) | 4 |
| 4 | Tasks 6-7 (Aggregation, Scheduler) | 4 |
| 5 | Tasks 8-10 (Rules, Deploy, Monitor) | 4 |

**Total:** ~19 hours (3-4 days)

---

## Notes for Session Starting This Sprint

1. **Get API keys first** - Register at:
   - FRED: https://fred.stlouisfed.org/docs/api/api_key.html
   - BLS: https://www.bls.gov/developers/home.htm

2. **GCP Project:** `contractoros-483812`

3. **Check existing functions setup:**
   ```bash
   cd functions
   npm install
   firebase functions:list --project=contractoros-483812
   ```

4. **BigQuery pricing note:** First 1TB/month queries free, storage $0.02/GB

5. **This sprint can run in parallel with Sprint 14** - Sprint 14 builds UI, this builds data pipeline. They meet at Firestore `/intelligence/*` collections.
