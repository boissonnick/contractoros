# Sprint: AI-Powered Receipt OCR

> **Created:** 2026-02-04
> **Priority:** High (Competitive Differentiator)
> **Estimated Effort:** 15-20 hours (1 sprint)
> **Dependencies:** None (uses existing expense system)

---

## Executive Summary

Implement AI-powered receipt scanning that extracts expense data directly using Claude/GPT vision models, avoiding per-receipt fees from dedicated OCR services. This approach is **10-100x cheaper** than Mindee/Veryfi while providing comparable accuracy and construction-specific categorization.

### Cost Comparison

| Approach | Per Receipt | 1K/month | 5K/month | Annual (1K) |
|----------|-------------|----------|----------|-------------|
| **Mindee** | $0.01-0.10 | $10-100 | $50-500 | $120-1,200 |
| **AWS Textract** | $0.01 | $10 | $50 | $120 |
| **Claude Haiku** | ~$0.001 | ~$1 | ~$5 | **~$12** |
| **GPT-4o-mini** | ~$0.0003 | ~$0.30 | ~$1.50 | **~$4** |

**Selected Approach:** Claude Haiku (primary) with Sonnet fallback for low-confidence results.

---

## Feature Scope

### Core Features (This Sprint)

1. **Receipt Photo Capture** — Camera/gallery upload in ExpenseFormModal
2. **AI OCR Processing** — Extract vendor, amount, date, tax, line items
3. **Auto-Categorization** — Map to construction expense categories
4. **Confidence Scoring** — Flag low-confidence extractions for review
5. **Form Auto-Fill** — Populate expense form from OCR results

### Future Enhancements (Not This Sprint)

- Bank transaction matching (requires Plaid integration)
- Batch receipt processing
- Duplicate detection
- Receipt storage in Cloud Storage

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile/Web Client                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ExpenseFormModal                                    │   │
│  │  - Camera capture / Gallery upload                   │   │
│  │  - Preview image                                     │   │
│  │  - "Scan Receipt" button → calls Cloud Function     │   │
│  │  - Auto-fills form fields from response             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloud Function: processReceiptOCR              │
│  1. Validate auth & image                                   │
│  2. Upload to Cloud Storage (optional, for records)         │
│  3. Send to Claude Haiku with extraction prompt             │
│  4. Parse JSON response                                     │
│  5. If confidence < 0.7, retry with Sonnet                  │
│  6. Return extracted data to client                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Anthropic API (Claude)                    │
│  - Primary: claude-3-5-haiku-20241022 (~$0.001/receipt)    │
│  - Fallback: claude-sonnet-4-20250514 (~$0.006/receipt)        │
└─────────────────────────────────────────────────────────────┘
```

### API Response Schema

```typescript
interface ReceiptOCRResult {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'check' | 'other' | null;
  category: ExpenseCategory;
  costType: 'MATERIALS' | 'EQUIPMENT' | 'OVERHEAD' | 'LABOR' | 'SUBCONTRACTOR' | 'OTHER_DIRECT';
  lineItems: Array<{
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    totalPrice: number | null;
  }>;
  confidence: number; // 0.0 - 1.0
  rawText?: string; // For debugging
}
```

### Category Mapping

The AI prompt includes construction-specific merchant-to-category hints:

| Merchant Pattern | Category |
|-----------------|----------|
| Home Depot, Lowes, Ace Hardware | materials |
| 84 Lumber, lumber yards | materials |
| Shell, Chevron, gas stations | fuel |
| United Rentals, Sunbelt | equipment_rental |
| Restaurants, fast food | meals |
| AutoZone, O'Reilly | vehicle |

---

## Task Breakdown

### Phase 1: Backend (Cloud Function) — 6-8 hours

| Task | Description | Est. |
|------|-------------|------|
| **OCR-01** | Create `processReceiptOCR` Cloud Function scaffold | 1h |
| **OCR-02** | Add Anthropic SDK to functions, configure API key | 0.5h |
| **OCR-03** | Build extraction prompt with category taxonomy | 1.5h |
| **OCR-04** | Implement Haiku processing with JSON parsing | 2h |
| **OCR-05** | Add Sonnet fallback for low-confidence results | 1h |
| **OCR-06** | Add rate limiting and error handling | 1h |
| **OCR-07** | Deploy and test with sample receipts | 1h |

### Phase 2: Frontend (UI Components) — 6-8 hours

| Task | Description | Est. |
|------|-------------|------|
| **OCR-08** | Add receipt image upload to ExpenseFormModal | 1.5h |
| **OCR-09** | Create ReceiptCaptureButton component (camera/gallery) | 1.5h |
| **OCR-10** | Add image preview with crop/rotate (optional) | 1h |
| **OCR-11** | Wire up Cloud Function call with loading state | 1h |
| **OCR-12** | Auto-fill form fields from OCR response | 1h |
| **OCR-13** | Show confidence indicator, highlight low-confidence fields | 1h |
| **OCR-14** | Mobile-optimized camera capture experience | 1h |

### Phase 3: Testing & Polish — 3-4 hours

| Task | Description | Est. |
|------|-------------|------|
| **OCR-15** | Test with various receipt types (gas, hardware, restaurant) | 1.5h |
| **OCR-16** | Handle edge cases (blurry, partial, handwritten) | 1h |
| **OCR-17** | Add analytics tracking for OCR usage | 0.5h |
| **OCR-18** | Update expense E2E tests | 1h |

---

## Files to Create/Modify

### New Files

```
functions/src/expenses/
├── processReceiptOCR.ts     # Cloud Function
├── receiptPrompt.ts         # AI prompt builder
└── categoryMapping.ts       # Merchant-to-category rules

apps/web/components/expenses/
├── ReceiptCaptureButton.tsx # Camera/upload button
├── ReceiptPreview.tsx       # Image preview component
└── OCRConfidenceIndicator.tsx # Confidence display
```

### Modified Files

```
apps/web/components/expenses/ExpenseFormModal.tsx  # Add receipt capture
apps/web/lib/hooks/useExpenses.ts                  # Add OCR function call
apps/web/types/index.ts                            # Add OCR types
functions/src/index.ts                             # Export new function
```

---

## Environment Setup

### Required Secrets (GCP Secret Manager)

```bash
# Add Anthropic API key
echo -n "sk-ant-xxxxx" | gcloud secrets create ANTHROPIC_API_KEY \
  --project=contractoros-483812 \
  --data-file=-

# Grant Cloud Functions access
gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY \
  --project=contractoros-483812 \
  --member="serviceAccount:contractoros-483812@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Package Dependencies

```bash
# In functions/
npm install @anthropic-ai/sdk

# In apps/web/ (for image handling)
npm install browser-image-compression
```

---

## Extraction Prompt (Core Logic)

```typescript
const EXTRACTION_PROMPT = `You are a receipt OCR system for a construction company expense tracker.

Extract from this receipt image and return ONLY valid JSON:
{
  "vendor": "merchant/store name",
  "date": "YYYY-MM-DD format",
  "total": number,
  "subtotal": number or null,
  "tax": number or null,
  "currency": "USD",
  "paymentMethod": "cash|card|check|other",
  "category": "see list below",
  "costType": "MATERIALS|EQUIPMENT|OVERHEAD|LABOR|SUBCONTRACTOR|OTHER_DIRECT",
  "lineItems": [{"description": "", "quantity": null, "unitPrice": null, "totalPrice": null}],
  "confidence": 0.0-1.0
}

CATEGORY OPTIONS (construction-specific):
- materials, materials_electrical, materials_plumbing, materials_lumber
- equipment_rental, fuel, tools
- meals, travel, vehicle, office_supplies, software
- permits, subcontractor, other

MERCHANT HINTS:
- Home Depot, Lowes, Ace Hardware → materials
- 84 Lumber → materials_lumber
- Shell, Chevron, gas stations → fuel
- United Rentals, Sunbelt → equipment_rental
- Restaurants → meals

Return ONLY JSON, no markdown.`;
```

---

## Success Criteria

- [ ] Receipt photo can be captured via camera or gallery
- [ ] OCR extracts vendor, date, total, tax with >90% accuracy
- [ ] Category auto-assigned based on merchant
- [ ] Form fields auto-populated from scan
- [ ] Low-confidence fields highlighted for review
- [ ] Works on mobile (responsive, camera access)
- [ ] Processes receipt in <5 seconds
- [ ] Cost per receipt <$0.01

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low accuracy on poor images | Show confidence score, allow manual override |
| API rate limits | Queue requests, cache results |
| Cost overrun | Monitor usage, set alerts at $10/month |
| Mobile camera issues | Fallback to file upload |

---

## Integration with Existing Code

The existing `ExpenseFormModal` already has:
- ✅ All form fields we need to populate
- ✅ Project selection
- ✅ Category selection with EXPENSE_CATEGORIES
- ✅ Receipt placeholder text ("📷 You can add receipt photos after saving")

We're enhancing it with:
- Camera/gallery upload button
- Image preview
- "Scan Receipt" action
- Auto-fill from OCR results

---

## Sprint Assignment

**Recommended approach:** Single session can complete this in 1-2 days.

Alternatively, parallel sub-agents:
- **Agent A (Backend):** OCR-01 through OCR-07
- **Agent B (Frontend):** OCR-08 through OCR-14 (after OCR-01 complete)
- **Main Session:** OCR-15 through OCR-18 (testing)

---

*Created: 2026-02-04*
