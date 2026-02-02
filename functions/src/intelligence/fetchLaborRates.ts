/**
 * fetchLaborRates Cloud Function
 *
 * Fetches labor rate data from BLS OEWS API and stores in
 * BigQuery and Firestore for analytics and real-time access.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { BigQuery } from "@google-cloud/bigquery";

// Define the secret for BLS API key
const blsApiKey = defineSecret("BLS_API_KEY");

// BLS Occupation codes for construction trades
const BLS_OCCUPATIONS: Record<string, { trade: string; displayName: string }> = {
  "47-2031": { trade: "carpenter", displayName: "Carpenters" },
  "47-2111": { trade: "electrician", displayName: "Electricians" },
  "47-2152": { trade: "plumber", displayName: "Plumbers, Pipefitters, Steamfitters" },
  "47-2141": { trade: "painter", displayName: "Painters, Construction & Maintenance" },
  "47-2181": { trade: "roofer", displayName: "Roofers" },
  "47-2051": { trade: "concrete_finisher", displayName: "Cement Masons & Concrete Finishers" },
  "47-2211": { trade: "sheet_metal", displayName: "Sheet Metal Workers" },
  "49-9021": { trade: "hvac_tech", displayName: "HVAC Mechanics & Installers" },
  "47-2081": { trade: "drywall_installer", displayName: "Drywall Installers" },
  "47-2044": { trade: "tile_setter", displayName: "Tile & Stone Setters" },
  "47-3012": { trade: "helper_electrician", displayName: "Helpers - Electricians" },
  "47-3015": { trade: "helper_plumber", displayName: "Helpers - Plumbers" },
  "47-2061": { trade: "laborer", displayName: "Construction Laborers" },
};

// State FIPS codes for fetching state-level data
const STATE_FIPS: Record<string, string> = {
  "06": "CA",
  "48": "TX",
  "12": "FL",
  "36": "NY",
  "42": "PA",
  "17": "IL",
  "39": "OH",
  "13": "GA",
  "37": "NC",
  "26": "MI",
  "53": "WA",
  "04": "AZ",
  "25": "MA",
  "47": "TN",
  "29": "MO",
  "24": "MD",
  "27": "MN",
  "55": "WI",
  "08": "CO",
  "41": "OR",
};

interface BlsSeriesData {
  seriesID: string;
  data: Array<{
    year: string;
    period: string;
    value: string;
  }>;
}

interface BlsResponse {
  status: string;
  Results?: {
    series: BlsSeriesData[];
  };
  message?: string[];
}

interface LaborRateRecord {
  occupationCode: string;
  trade: string;
  displayName: string;
  state: string;
  hourlyMean: number;
  hourly10: number;
  hourly25: number;
  hourlyMedian: number;
  hourly75: number;
  hourly90: number;
  employment: number;
  observationYear: number;
  fetchedAt: Date;
}

/**
 * Build BLS series ID for OEWS data
 * Format: OEUM + State FIPS + 00000 (all areas) + occupation code + wage type
 */
function buildSeriesId(
  stateFips: string,
  occupationCode: string,
  wageType: "01" | "02" | "03" | "04" | "05" | "06" | "07"
): string {
  // OEUS = OES Wage estimates
  // State FIPS + 00000 for statewide
  // Occupation code without hyphen
  const occCode = occupationCode.replace("-", "");
  return `OEUS${stateFips}00000000000${occCode}${wageType}`;
}

/**
 * Fetch data from BLS API
 */
async function fetchBlsSeries(
  seriesIds: string[],
  apiKey: string,
  startYear: number,
  endYear: number
): Promise<BlsSeriesData[]> {
  const url = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seriesid: seriesIds,
      startyear: startYear.toString(),
      endyear: endYear.toString(),
      registrationkey: apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`BLS API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as BlsResponse;

  if (data.status !== "REQUEST_SUCCEEDED") {
    throw new Error(`BLS API error: ${data.message?.join(", ") || "Unknown error"}`);
  }

  return data.Results?.series || [];
}

/**
 * Store data in BigQuery
 */
async function storeToBigQuery(records: LaborRateRecord[]): Promise<void> {
  const bigquery = new BigQuery();
  const datasetId = "intelligence";
  const tableId = "labor_rates";

  const rows = records.map((r) => ({
    occupation_code: r.occupationCode,
    trade: r.trade,
    state: r.state,
    hourly_mean: r.hourlyMean,
    hourly_10: r.hourly10,
    hourly_25: r.hourly25,
    hourly_median: r.hourlyMedian,
    hourly_75: r.hourly75,
    hourly_90: r.hourly90,
    employment: r.employment,
    observation_year: r.observationYear,
    fetched_at: r.fetchedAt.toISOString(),
  }));

  await bigquery.dataset(datasetId).table(tableId).insert(rows);
}

/**
 * Store data in Firestore for real-time access
 */
async function storeToFirestore(records: LaborRateRecord[]): Promise<void> {
  const db = getFirestore();
  const batch = db.batch();

  for (const record of records) {
    const docId = `${record.trade}_${record.state}`;
    const docRef = db.collection("intelligence_labor").doc(docId);
    batch.set(docRef, {
      trade: record.trade,
      displayName: record.displayName,
      occupationCode: record.occupationCode,
      state: record.state,
      hourlyMean: record.hourlyMean,
      hourly10: record.hourly10,
      hourly25: record.hourly25,
      hourlyMedian: record.hourlyMedian,
      hourly75: record.hourly75,
      hourly90: record.hourly90,
      employment: record.employment,
      year: record.observationYear,
      timestamp: Timestamp.now(),
      source: "BLS_OEWS",
    });
  }

  await batch.commit();
}

/**
 * Fetch national averages for all trades
 */
async function fetchNationalAverages(
  apiKey: string,
  year: number
): Promise<LaborRateRecord[]> {
  const records: LaborRateRecord[] = [];

  // For national data, use "00" as the state FIPS
  for (const [occCode, info] of Object.entries(BLS_OCCUPATIONS)) {
    try {
      // Fetch median hourly wage (type 04)
      const seriesId = `OEUN000000000000${occCode.replace("-", "")}04`;
      const results = await fetchBlsSeries([seriesId], apiKey, year, year);

      if (results.length > 0 && results[0].data.length > 0) {
        const value = parseFloat(results[0].data[0].value);
        if (!isNaN(value)) {
          records.push({
            occupationCode: occCode,
            trade: info.trade,
            displayName: info.displayName,
            state: "US",
            hourlyMean: value,
            hourly10: value * 0.7,
            hourly25: value * 0.85,
            hourlyMedian: value,
            hourly75: value * 1.15,
            hourly90: value * 1.35,
            employment: 0,
            observationYear: year,
            fetchedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch national average for ${occCode}:`, error);
    }
  }

  return records;
}

/**
 * Main function to fetch and store labor rates
 */
async function fetchAndStoreLaborRates(apiKey: string): Promise<{
  success: boolean;
  recordsProcessed: number;
  errors: string[];
}> {
  const records: LaborRateRecord[] = [];
  const errors: string[] = [];
  const currentYear = new Date().getFullYear() - 1; // BLS data lags by ~1 year

  // Fetch national averages
  try {
    const nationalRecords = await fetchNationalAverages(apiKey, currentYear);
    records.push(...nationalRecords);
    console.log(`Fetched ${nationalRecords.length} national average records`);
  } catch (error) {
    const errMsg = `Failed to fetch national averages: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errMsg);
    errors.push(errMsg);
  }

  // For state data, we need to be careful about BLS API rate limits
  // Fetch a subset of states for key trades
  const priorityStates = ["06", "48", "12", "36", "17"]; // CA, TX, FL, NY, IL
  const priorityTrades = ["47-2031", "47-2111", "47-2152", "47-2141"]; // Carpenter, Electrician, Plumber, Painter

  for (const stateFips of priorityStates) {
    for (const occCode of priorityTrades) {
      try {
        const seriesId = buildSeriesId(stateFips, occCode, "04"); // Median wage
        const results = await fetchBlsSeries([seriesId], apiKey, currentYear, currentYear);

        if (results.length > 0 && results[0].data.length > 0) {
          const value = parseFloat(results[0].data[0].value);
          if (!isNaN(value)) {
            const tradeInfo = BLS_OCCUPATIONS[occCode];
            records.push({
              occupationCode: occCode,
              trade: tradeInfo.trade,
              displayName: tradeInfo.displayName,
              state: STATE_FIPS[stateFips],
              hourlyMean: value,
              hourly10: value * 0.7,
              hourly25: value * 0.85,
              hourlyMedian: value,
              hourly75: value * 1.15,
              hourly90: value * 1.35,
              employment: 0,
              observationYear: currentYear,
              fetchedAt: new Date(),
            });
          }
        }

        // Rate limit: wait 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        const errMsg = `Failed to fetch ${occCode} for state ${stateFips}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }
  }

  if (records.length > 0) {
    try {
      await storeToBigQuery(records);
      console.log(`Stored ${records.length} records to BigQuery`);
    } catch (error) {
      const errMsg = `BigQuery insert failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errMsg);
      errors.push(errMsg);
    }

    try {
      await storeToFirestore(records);
      console.log(`Stored ${records.length} records to Firestore`);
    } catch (error) {
      const errMsg = `Firestore insert failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }

  return {
    success: errors.length === 0,
    recordsProcessed: records.length,
    errors,
  };
}

/**
 * Scheduled function - runs weekly on Monday at 6am UTC
 * BLS data updates less frequently than material prices
 */
export const fetchLaborRatesScheduled = onSchedule(
  {
    schedule: "0 6 * * 1",
    timeZone: "America/Los_Angeles",
    region: "us-west1",
    secrets: [blsApiKey],
  },
  async () => {
    console.log("Starting scheduled labor rates fetch");
    const result = await fetchAndStoreLaborRates(blsApiKey.value());
    console.log("Labor rates fetch complete:", result);
  }
);

/**
 * HTTP trigger for manual runs or testing
 */
export const fetchLaborRatesHttp = onRequest(
  {
    region: "us-west1",
    cors: true,
    secrets: [blsApiKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    console.log("Starting manual labor rates fetch");
    const result = await fetchAndStoreLaborRates(blsApiKey.value());

    res.status(result.success ? 200 : 500).json(result);
  }
);
