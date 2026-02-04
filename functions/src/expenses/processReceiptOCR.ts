/**
 * processReceiptOCR Cloud Function
 *
 * AI-powered receipt scanning using Claude vision models.
 * Extracts expense data from receipt images for construction companies.
 *
 * Features:
 * - Primary: Claude Haiku (fast, cheap ~$0.001/receipt)
 * - Fallback: Claude Sonnet for low-confidence results
 * - Construction-specific category mapping
 * - Rate limiting (10 requests per minute per user)
 */

import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { FirestoreRateLimiter } from "../security/rate-limiter";

// CORS configuration
const CORS_ORIGINS = [
  "http://localhost:3000",
  "https://contractoros-483812.web.app",
  "https://contractoros.com",
  "https://www.contractoros.com",
];

// Define the Anthropic API key secret
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

// Region configuration
const REGION = "us-east1";

// Model configurations
const HAIKU_MODEL = "claude-3-5-haiku-20241022";
const SONNET_MODEL = "claude-sonnet-4-20250514";
const CONFIDENCE_THRESHOLD = 0.7;

// Rate limit configuration: 10 requests per minute per user
const OCR_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
};

// Lazy Firestore initialization using named database
let _db: FirebaseFirestore.Firestore | null = null;
function getDb(): FirebaseFirestore.Firestore {
  if (!_db) {
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db;
}

// ============================================
// Types
// ============================================

/**
 * Request payload for OCR processing
 */
interface ProcessReceiptRequest {
  /** Base64-encoded image data */
  imageBase64: string;
  /** Image MIME type (image/jpeg, image/png, etc.) */
  mimeType: string;
  /** Organization ID */
  orgId: string;
  /** Optional project ID to associate expense with */
  projectId?: string;
}

/**
 * Line item extracted from receipt
 */
interface LineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

/**
 * Expense category types (matching ExpenseCategory in types/finance.ts)
 */
type ExpenseCategory =
  | "materials"
  | "tools"
  | "equipment_rental"
  | "fuel"
  | "vehicle"
  | "subcontractor"
  | "permits"
  | "labor"
  | "office"
  | "travel"
  | "meals"
  | "insurance"
  | "utilities"
  | "marketing"
  | "other";

/**
 * Cost type for job costing
 */
type CostType =
  | "MATERIALS"
  | "EQUIPMENT"
  | "OVERHEAD"
  | "LABOR"
  | "SUBCONTRACTOR"
  | "OTHER_DIRECT";

/**
 * Payment method extracted from receipt
 */
type PaymentMethod = "cash" | "card" | "check" | "other" | null;

/**
 * Result from OCR extraction
 */
export interface ReceiptOCRResult {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD format
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  currency: string;
  paymentMethod: PaymentMethod;
  category: ExpenseCategory;
  costType: CostType;
  lineItems: LineItem[];
  confidence: number; // 0.0 - 1.0
  rawText?: string; // For debugging
  modelUsed: string; // Which model processed this
  processingTimeMs: number;
}

// Response structure is { success: boolean, data: ReceiptOCRResult | null, error?: string }

// ============================================
// Extraction Prompt
// ============================================

const EXTRACTION_PROMPT = `You are a receipt OCR system for a construction company expense tracker.

Analyze this receipt image and extract the following information. Return ONLY valid JSON with no markdown formatting.

{
  "vendor": "merchant/store name (string or null if not readable)",
  "date": "YYYY-MM-DD format (string or null if not readable)",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "currency": "USD",
  "paymentMethod": "cash|card|check|other",
  "category": "see list below",
  "costType": "MATERIALS|EQUIPMENT|OVERHEAD|LABOR|SUBCONTRACTOR|OTHER_DIRECT",
  "lineItems": [{"description": "", "quantity": null, "unitPrice": null, "totalPrice": null}],
  "confidence": 0.0
}

CATEGORY OPTIONS (use lowercase):
- materials (building supplies, lumber, concrete, drywall, etc.)
- tools (hand tools, power tools)
- equipment_rental (machinery, scaffolding rentals)
- fuel (gas, diesel)
- vehicle (auto parts, car maintenance)
- subcontractor (sub payments)
- permits (permits, licenses, inspections)
- labor (direct labor costs)
- office (office supplies, printing)
- travel (hotels, flights, parking)
- meals (food, restaurants)
- insurance (insurance payments)
- utilities (phone, internet)
- marketing (advertising, signs)
- other (anything else)

COST TYPE MAPPING:
- materials, tools -> MATERIALS
- equipment_rental -> EQUIPMENT
- office, travel, meals, insurance, utilities, marketing -> OVERHEAD
- labor -> LABOR
- subcontractor -> SUBCONTRACTOR
- fuel, vehicle, permits, other -> OTHER_DIRECT

MERCHANT CATEGORY HINTS:
- Home Depot, Lowes, Ace Hardware, Menards -> materials
- 84 Lumber, lumber yards -> materials
- Sherwin-Williams, Benjamin Moore -> materials
- Grainger, Fastenal -> materials
- Harbor Freight -> tools
- Shell, Chevron, BP, Exxon, gas stations -> fuel
- United Rentals, Sunbelt, Herc -> equipment_rental
- AutoZone, O'Reilly, NAPA, auto shops -> vehicle
- McDonald's, Subway, restaurants, cafes -> meals
- Hilton, Marriott, hotels -> travel
- Staples, Office Depot -> office

CONFIDENCE SCORING:
- 0.9-1.0: All key fields clearly readable (vendor, date, total)
- 0.7-0.9: Most fields readable, some uncertainty
- 0.5-0.7: Partial extraction, some guessing required
- 0.3-0.5: Poor image quality, many fields uncertain
- 0.0-0.3: Unable to extract meaningful data

Return ONLY the JSON object, no markdown code blocks or explanation.`;

// ============================================
// Helper Functions
// ============================================

/**
 * Create Anthropic client with API key
 */
function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

/**
 * Validate base64 image data
 */
function validateImageData(
  imageBase64: string,
  mimeType: string
): { valid: boolean; error?: string } {
  // Check if base64 string is present
  if (!imageBase64 || imageBase64.length === 0) {
    return { valid: false, error: "Image data is required" };
  }

  // Check mime type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  // Check size (rough estimate: base64 is ~1.37x original size)
  // Max 20MB original = ~27MB base64
  const maxBase64Size = 27 * 1024 * 1024;
  if (imageBase64.length > maxBase64Size) {
    return { valid: false, error: "Image too large. Maximum size is 20MB." };
  }

  return { valid: true };
}

/**
 * Parse JSON response from Claude, handling potential formatting issues
 */
function parseOCRResponse(response: string): Partial<ReceiptOCRResult> {
  // Remove potential markdown code blocks
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse OCR response:", cleaned);
    throw new Error("Failed to parse AI response as JSON");
  }
}

/**
 * Validate and normalize OCR result
 */
function normalizeOCRResult(
  parsed: Partial<ReceiptOCRResult>,
  modelUsed: string,
  processingTimeMs: number
): ReceiptOCRResult {
  // Valid expense categories
  const validCategories: ExpenseCategory[] = [
    "materials",
    "tools",
    "equipment_rental",
    "fuel",
    "vehicle",
    "subcontractor",
    "permits",
    "labor",
    "office",
    "travel",
    "meals",
    "insurance",
    "utilities",
    "marketing",
    "other",
  ];

  // Valid cost types
  const validCostTypes: CostType[] = [
    "MATERIALS",
    "EQUIPMENT",
    "OVERHEAD",
    "LABOR",
    "SUBCONTRACTOR",
    "OTHER_DIRECT",
  ];

  // Normalize category
  let category: ExpenseCategory = "other";
  if (parsed.category && validCategories.includes(parsed.category as ExpenseCategory)) {
    category = parsed.category as ExpenseCategory;
  }

  // Normalize cost type
  let costType: CostType = "OTHER_DIRECT";
  if (parsed.costType && validCostTypes.includes(parsed.costType as CostType)) {
    costType = parsed.costType as CostType;
  } else {
    // Auto-map from category if not provided
    const categoryToCostType: Record<ExpenseCategory, CostType> = {
      materials: "MATERIALS",
      tools: "MATERIALS",
      equipment_rental: "EQUIPMENT",
      fuel: "OTHER_DIRECT",
      vehicle: "OTHER_DIRECT",
      subcontractor: "SUBCONTRACTOR",
      permits: "OTHER_DIRECT",
      labor: "LABOR",
      office: "OVERHEAD",
      travel: "OVERHEAD",
      meals: "OVERHEAD",
      insurance: "OVERHEAD",
      utilities: "OVERHEAD",
      marketing: "OVERHEAD",
      other: "OTHER_DIRECT",
    };
    costType = categoryToCostType[category];
  }

  // Normalize payment method
  let paymentMethod: PaymentMethod = null;
  if (parsed.paymentMethod) {
    const pm = parsed.paymentMethod.toLowerCase();
    if (["cash", "card", "check", "other"].includes(pm)) {
      paymentMethod = pm as PaymentMethod;
    }
  }

  // Normalize line items
  const lineItems: LineItem[] = [];
  if (Array.isArray(parsed.lineItems)) {
    for (const item of parsed.lineItems) {
      if (item && typeof item === "object" && item.description) {
        lineItems.push({
          description: String(item.description),
          quantity: typeof item.quantity === "number" ? item.quantity : null,
          unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : null,
          totalPrice: typeof item.totalPrice === "number" ? item.totalPrice : null,
        });
      }
    }
  }

  // Normalize confidence (ensure 0-1 range)
  let confidence = 0.5;
  if (typeof parsed.confidence === "number") {
    confidence = Math.max(0, Math.min(1, parsed.confidence));
  }

  return {
    vendor: parsed.vendor && typeof parsed.vendor === "string" ? parsed.vendor : null,
    date: parsed.date && typeof parsed.date === "string" ? parsed.date : null,
    total: typeof parsed.total === "number" ? parsed.total : null,
    subtotal: typeof parsed.subtotal === "number" ? parsed.subtotal : null,
    tax: typeof parsed.tax === "number" ? parsed.tax : null,
    currency: parsed.currency && typeof parsed.currency === "string" ? parsed.currency : "USD",
    paymentMethod,
    category,
    costType,
    lineItems,
    confidence,
    modelUsed,
    processingTimeMs,
  };
}

/**
 * Process receipt with Claude vision model
 */
async function processWithClaude(
  client: Anthropic,
  model: string,
  imageBase64: string,
  mimeType: string
): Promise<ReceiptOCRResult> {
  const startTime = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const processingTimeMs = Date.now() - startTime;

  // Extract text content from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI model");
  }

  // Parse and normalize the response
  const parsed = parseOCRResponse(textContent.text);
  return normalizeOCRResult(parsed, model, processingTimeMs);
}

/**
 * Log OCR request for analytics
 */
async function logOCRRequest(
  orgId: string,
  userId: string,
  result: ReceiptOCRResult,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await getDb().collection("ocrLogs").add({
      orgId,
      userId,
      success,
      modelUsed: result.modelUsed,
      confidence: result.confidence,
      category: result.category,
      processingTimeMs: result.processingTimeMs,
      errorMessage: errorMessage || null,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to log OCR request:", error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

// ============================================
// Cloud Function
// ============================================

/**
 * Set CORS headers for response
 */
function setCorsHeaders(
  req: { headers: { origin?: string } },
  res: { set: (name: string, value: string) => void }
): boolean {
  const origin = req.headers.origin || "";

  // Check if origin is allowed
  if (CORS_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", CORS_ORIGINS[0]);
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");

  return CORS_ORIGINS.includes(origin);
}

/**
 * Verify Firebase ID token and return user ID
 */
async function verifyAuth(authHeader?: string): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpsError("unauthenticated", "Missing or invalid Authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    throw new HttpsError("unauthenticated", "Invalid authentication token");
  }
}

/**
 * processReceiptOCR - HTTP function for AI receipt scanning
 *
 * Accepts a base64-encoded receipt image and extracts expense data
 * using Claude vision models. Uses Haiku for speed/cost, with Sonnet
 * fallback for low-confidence results.
 *
 * Request body:
 * - imageBase64: Base64-encoded image data (required)
 * - mimeType: Image MIME type (required)
 * - orgId: Organization ID (required)
 * - projectId: Optional project to associate expense with
 *
 * Returns:
 * - success: boolean
 * - data: ReceiptOCRResult or null
 * - error: Error message if failed
 */
export const processReceiptOCR = onRequest(
  {
    region: REGION,
    secrets: [anthropicApiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res): Promise<void> => {
    // Handle CORS
    setCorsHeaders(req, res);

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    const startTime = Date.now();

    try {
      // Verify authentication
      const userId = await verifyAuth(req.headers.authorization);

      const data = req.body as ProcessReceiptRequest;
      const { imageBase64, mimeType, orgId } = data;
      // Note: data.projectId is available but not used in this function
      // It will be passed to the frontend for expense creation

      // Validate required fields
      if (!imageBase64 || !mimeType || !orgId) {
        res.status(400).json({
          success: false,
          data: null,
          error: "Missing required fields: imageBase64, mimeType, orgId",
        });
        return;
      }

      // Rate limiting
      const rateLimiter = new FirestoreRateLimiter(OCR_RATE_LIMIT);
      const rateLimitKey = `ocr:${userId}`;
      const rateLimitResult = await rateLimiter.check(rateLimitKey);

      if (!rateLimitResult.success) {
        const retryAfter = Math.ceil(
          (rateLimitResult.resetTime.getTime() - Date.now()) / 1000
        );
        res.status(429).json({
          success: false,
          data: null,
          error: `Rate limit exceeded. Maximum 10 receipt scans per minute. Retry after ${Math.max(1, retryAfter)} seconds.`,
        });
        return;
      }

      // Verify user belongs to organization
      const userDoc = await getDb().collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({ success: false, data: null, error: "User not found" });
        return;
      }

      const userData = userDoc.data();
      if (userData?.orgId !== orgId) {
        res.status(403).json({
          success: false,
          data: null,
          error: "User does not belong to this organization",
        });
        return;
      }

      // Validate image data
      const validation = validateImageData(imageBase64, mimeType);
      if (!validation.valid) {
        res.status(400).json({ success: false, data: null, error: validation.error });
        return;
      }

      // Create Anthropic client
      const client = createAnthropicClient(anthropicApiKey.value());

      // First attempt with Haiku (fast, cheap)
      console.log(`[OCR] Processing receipt for org ${orgId} with Haiku`);
      let result = await processWithClaude(client, HAIKU_MODEL, imageBase64, mimeType);

      // If confidence is low, retry with Sonnet
      if (result.confidence < CONFIDENCE_THRESHOLD) {
        console.log(
          `[OCR] Low confidence (${result.confidence}), retrying with Sonnet`
        );
        const sonnetResult = await processWithClaude(
          client,
          SONNET_MODEL,
          imageBase64,
          mimeType
        );

        // Use Sonnet result if it has higher confidence
        if (sonnetResult.confidence > result.confidence) {
          result = sonnetResult;
          // Add total processing time
          result.processingTimeMs = Date.now() - startTime;
        }
      }

      // Log successful request
      await logOCRRequest(orgId, userId, result, true);

      console.log(
        `[OCR] Success: ${result.vendor}, $${result.total}, confidence: ${result.confidence}, model: ${result.modelUsed}`
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OCR] Processing failed:", errorMessage);

      // Determine if we have user context for logging
      let userId = "unknown";
      let orgId = "unknown";
      try {
        userId = await verifyAuth(req.headers.authorization);
        orgId = req.body?.orgId || "unknown";
      } catch {
        // Ignore auth errors during error logging
      }

      // Log failed request
      await logOCRRequest(
        orgId,
        userId,
        {
          vendor: null,
          date: null,
          total: null,
          subtotal: null,
          tax: null,
          currency: "USD",
          paymentMethod: null,
          category: "other",
          costType: "OTHER_DIRECT",
          lineItems: [],
          confidence: 0,
          modelUsed: "none",
          processingTimeMs: Date.now() - startTime,
        },
        false,
        errorMessage
      );

      // Check for specific errors
      if (errorMessage.includes("rate_limit")) {
        res.status(429).json({
          success: false,
          data: null,
          error: "AI service rate limit reached. Please try again in a moment.",
        });
        return;
      }

      if (errorMessage.includes("invalid_api_key")) {
        res.status(500).json({
          success: false,
          data: null,
          error: "AI service configuration error. Please contact support.",
        });
        return;
      }

      if (errorMessage.includes("unauthenticated") || errorMessage.includes("authentication")) {
        res.status(401).json({
          success: false,
          data: null,
          error: errorMessage,
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        error: `Failed to process receipt: ${errorMessage}`,
      });
    }
  }
);
