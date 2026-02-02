/**
 * fetchMaterialPrices Cloud Function
 *
 * Fetches material price indices from FRED API and stores in
 * BigQuery and Firestore for analytics and real-time access.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { BigQuery } from "@google-cloud/bigquery";

// Define the secret for FRED API key
const fredApiKey = defineSecret("FRED_API_KEY");

// FRED series codes for construction materials
const FRED_SERIES: Record<string, { displayName: string; unit: string }> = {
  WPU081: { displayName: "Lumber & Wood Products", unit: "index" },
  WPU101: { displayName: "Steel Mill Products", unit: "index" },
  WPU1322: { displayName: "Cement", unit: "index" },
  WPU102502: { displayName: "Copper Wire & Cable", unit: "index" },
  WPU13310113: { displayName: "Ready-Mix Concrete", unit: "index" },
  WPU072105: { displayName: "Gypsum Products", unit: "index" },
  WPU0531: { displayName: "Insulation Materials", unit: "index" },
  WPU0551: { displayName: "Glass (Flat)", unit: "index" },
  WPU10170402: { displayName: "Aluminum Sheet", unit: "index" },
  PCU23821238212: { displayName: "Plumbing Fixtures", unit: "index" },
};

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

interface MaterialPriceRecord {
  material: string;
  seriesId: string;
  displayName: string;
  price: number;
  unit: string;
  observationDate: string;
  percentChange7d: number;
  percentChange30d: number;
  fetchedAt: Date;
}

/**
 * Fetch data from FRED API for a given series
 */
async function fetchFredSeries(
  seriesId: string,
  apiKey: string
): Promise<FredObservation[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=90`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as FredResponse;
  return data.observations || [];
}

/**
 * Calculate percent change between two values
 */
function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Process FRED observations into material price records
 */
function processObservations(
  seriesId: string,
  observations: FredObservation[],
  displayName: string,
  unit: string
): MaterialPriceRecord | null {
  // Filter out invalid observations
  const validObs = observations.filter(
    (o) => o.value !== "." && !isNaN(parseFloat(o.value))
  );

  if (validObs.length === 0) {
    return null;
  }

  const latestPrice = parseFloat(validObs[0].value);
  const latestDate = validObs[0].date;

  // Find 7-day and 30-day previous values
  let price7dAgo = latestPrice;
  let price30dAgo = latestPrice;

  for (const obs of validObs) {
    const obsDate = new Date(obs.date);
    const latestDateObj = new Date(latestDate);
    const daysDiff = Math.floor(
      (latestDateObj.getTime() - obsDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff >= 7 && price7dAgo === latestPrice) {
      price7dAgo = parseFloat(obs.value);
    }
    if (daysDiff >= 30) {
      price30dAgo = parseFloat(obs.value);
      break;
    }
  }

  return {
    material: seriesId,
    seriesId,
    displayName,
    price: latestPrice,
    unit,
    observationDate: latestDate,
    percentChange7d: calcPercentChange(latestPrice, price7dAgo),
    percentChange30d: calcPercentChange(latestPrice, price30dAgo),
    fetchedAt: new Date(),
  };
}

/**
 * Store data in BigQuery
 */
async function storeToBigQuery(records: MaterialPriceRecord[]): Promise<void> {
  const bigquery = new BigQuery();
  const datasetId = "intelligence";
  const tableId = "material_prices";

  const rows = records.map((r) => ({
    material: r.material,
    series_id: r.seriesId,
    price: r.price,
    unit: r.unit,
    observation_date: r.observationDate,
    fetched_at: r.fetchedAt.toISOString(),
  }));

  await bigquery.dataset(datasetId).table(tableId).insert(rows);
}

/**
 * Store data in Firestore for real-time access
 */
async function storeToFirestore(records: MaterialPriceRecord[]): Promise<void> {
  const db = getFirestore();
  const batch = db.batch();

  for (const record of records) {
    const docRef = db.collection("intelligence_materials").doc(record.material);
    batch.set(docRef, {
      material: record.material,
      seriesId: record.seriesId,
      displayName: record.displayName,
      pricePerUnit: record.price,
      unit: record.unit,
      percentChange7d: record.percentChange7d,
      percentChange30d: record.percentChange30d,
      timestamp: Timestamp.now(),
      source: "FRED",
    });
  }

  await batch.commit();
}

/**
 * Main function to fetch and store material prices
 */
async function fetchAndStoreMaterialPrices(apiKey: string): Promise<{
  success: boolean;
  recordsProcessed: number;
  errors: string[];
}> {
  const records: MaterialPriceRecord[] = [];
  const errors: string[] = [];

  for (const [seriesId, info] of Object.entries(FRED_SERIES)) {
    try {
      const observations = await fetchFredSeries(seriesId, apiKey);
      const record = processObservations(
        seriesId,
        observations,
        info.displayName,
        info.unit
      );

      if (record) {
        records.push(record);
      }
    } catch (error) {
      const errMsg = `Failed to fetch ${seriesId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errMsg);
      errors.push(errMsg);
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
 * Scheduled function - runs daily at 6am UTC
 */
export const fetchMaterialPricesScheduled = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "America/Los_Angeles",
    region: "us-west1",
    secrets: [fredApiKey],
  },
  async () => {
    console.log("Starting scheduled material price fetch");
    const result = await fetchAndStoreMaterialPrices(fredApiKey.value());
    console.log("Material price fetch complete:", result);
  }
);

/**
 * HTTP trigger for manual runs or testing
 */
export const fetchMaterialPricesHttp = onRequest(
  {
    region: "us-west1",
    cors: true,
    secrets: [fredApiKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    console.log("Starting manual material price fetch");
    const result = await fetchAndStoreMaterialPrices(fredApiKey.value());

    res.status(result.success ? 200 : 500).json(result);
  }
);
