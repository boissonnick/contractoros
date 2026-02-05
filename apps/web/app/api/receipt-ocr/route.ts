import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminAuth } from '@/lib/firebase/admin';

// Models
const FLASH_MODEL = 'gemini-2.0-flash';
const PRO_MODEL = 'gemini-1.5-pro';
const CONFIDENCE_THRESHOLD = 0.7;

// Extraction prompt
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

MERCHANT CATEGORY HINTS:
- Home Depot, Lowes, Ace Hardware, Menards -> materials
- Harbor Freight -> tools
- Shell, Chevron, BP, Exxon, gas stations -> fuel
- United Rentals, Sunbelt -> equipment_rental
- McDonald's, Subway, restaurants -> meals

CONFIDENCE SCORING:
- 0.9-1.0: All key fields clearly readable
- 0.7-0.9: Most fields readable
- 0.5-0.7: Partial extraction
- 0.0-0.5: Poor quality

Return ONLY the JSON object, no markdown code blocks.`;

interface ProcessReceiptRequest {
  imageBase64: string;
  mimeType: string;
  orgId: string;
  projectId?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, data: null, error: 'Missing authorization' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json(
        { success: false, data: null, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body: ProcessReceiptRequest = await request.json();
    const { imageBase64, mimeType, orgId } = body;

    if (!imageBase64 || !mimeType || !orgId) {
      return NextResponse.json(
        { success: false, data: null, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, data: null, error: 'OCR service not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Process with Flash first (fast, cheap)
    console.log(`[OCR] Processing receipt for user ${userId}`);
    let result = await processWithGemini(genAI, FLASH_MODEL, imageBase64, mimeType, startTime);

    // If low confidence, retry with Pro
    if (result.confidence < CONFIDENCE_THRESHOLD) {
      console.log(`[OCR] Low confidence (${result.confidence}), trying Pro`);
      const proResult = await processWithGemini(genAI, PRO_MODEL, imageBase64, mimeType, startTime);
      if (proResult.confidence > result.confidence) {
        result = proResult;
      }
    }

    console.log(`[OCR] Success: ${result.vendor}, $${result.total}, confidence: ${result.confidence}`);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[OCR] Error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Processing failed'
      },
      { status: 500 }
    );
  }
}

async function processWithGemini(
  genAI: GoogleGenerativeAI,
  modelName: string,
  imageBase64: string,
  mimeType: string,
  startTime: number
) {
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    },
    { text: EXTRACTION_PROMPT },
  ]);

  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error('No response from AI');
  }

  // Parse JSON from response
  let parsed;
  try {
    let cleanText = text.trim();
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    parsed = JSON.parse(cleanText);
  } catch {
    console.error('[OCR] Failed to parse response:', text);
    throw new Error('Failed to parse AI response');
  }

  return {
    vendor: parsed.vendor || null,
    date: parsed.date || null,
    total: typeof parsed.total === 'number' ? parsed.total : null,
    subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : null,
    tax: typeof parsed.tax === 'number' ? parsed.tax : null,
    currency: parsed.currency || 'USD',
    paymentMethod: parsed.paymentMethod || null,
    category: parsed.category || 'other',
    costType: parsed.costType || 'OTHER_DIRECT',
    lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
    confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    modelUsed: modelName,
    processingTimeMs: Date.now() - startTime,
  };
}
