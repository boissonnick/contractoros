/**
 * AI Analysis Prompt Templates - Sprint 31
 *
 * Centralized prompts for AI-powered features:
 * - Document analysis
 * - Photo description
 * - Project summary
 * - Estimate review
 * - Proactive suggestions
 */

// ===========================================
// DOCUMENT ANALYSIS PROMPTS
// ===========================================

/**
 * Prompt for analyzing construction-related documents
 */
export const DOCUMENT_ANALYSIS_PROMPT = `You are an expert document analyst specializing in construction industry documents. Analyze the provided document and extract key information.

## Your Task

Extract the following information from the document:

1. **Document Type**: Identify if this is a contract, invoice, permit, change order, proposal, insurance document, specification, or other type.

2. **Summary**: Provide a 2-3 sentence summary of what this document is about.

3. **Key Dates**: Extract all important dates (deadlines, milestones, effective dates, expiration dates).
   Format: { "date": "YYYY-MM-DD", "description": "what this date represents" }

4. **Financial Information**: Extract all monetary amounts.
   Format: { "amount": number, "currency": "USD", "description": "what this amount represents" }

5. **Parties Involved**: List all companies, individuals, or entities mentioned.
   Format: { "name": "party name", "role": "their role (contractor, client, subcontractor, etc.)" }

6. **Action Items**: List any required actions, deliverables, or obligations.

7. **Tags**: Suggest 3-5 relevant tags for categorizing this document.

## Response Format

Respond in valid JSON format:
{
  "documentType": "contract" | "invoice" | "permit" | "change_order" | "proposal" | "insurance" | "specification" | "other",
  "summary": "Brief summary of the document",
  "keyDates": [
    { "date": "2024-03-15", "description": "Project start date" }
  ],
  "amounts": [
    { "amount": 50000, "currency": "USD", "description": "Total contract value" }
  ],
  "parties": [
    { "name": "ABC Construction", "role": "General Contractor" }
  ],
  "actionItems": [
    "Submit permit application by March 1",
    "Provide insurance certificate"
  ],
  "tags": ["residential", "remodel", "contract", "kitchen"]
}

## Important Notes

- Extract actual data from the document, don't make assumptions
- If a field has no relevant data, use an empty array []
- Dates should be in ISO format (YYYY-MM-DD)
- All monetary amounts should be numbers (no currency symbols)
- Be thorough but only include information actually present in the document`;

/**
 * Prompt for analyzing specific document types
 */
export const DOCUMENT_TYPE_PROMPTS: Record<string, string> = {
  contract: `Focus on: parties, scope of work, payment terms, milestones, warranty, liability clauses, termination conditions.`,
  invoice: `Focus on: vendor, invoice number, due date, line items, amounts, payment terms, PO reference.`,
  permit: `Focus on: permit number, issuing authority, property address, scope allowed, expiration, conditions.`,
  change_order: `Focus on: original scope, proposed changes, cost impact, schedule impact, approvals needed.`,
  proposal: `Focus on: scope of work, pricing breakdown, exclusions, assumptions, validity period.`,
};

// ===========================================
// PHOTO ANALYSIS PROMPTS
// ===========================================

/**
 * Main prompt for analyzing construction site photos
 */
export const PHOTO_ANALYSIS_PROMPT = `You are an expert construction site analyst with deep knowledge of building processes, safety requirements, and quality standards. Analyze this construction photo.

## Your Task

Provide a comprehensive analysis including:

1. **Description**: What's shown in this photo? Be specific about the work being performed.

2. **Detected Objects**: List construction elements, materials, tools, and equipment visible.
   Include confidence level (0.0-1.0) for each detection.

3. **Suggested Tags**: Provide relevant tags for categorizing this photo.
   Categories: work-type (framing, electrical, plumbing, etc.), phase (rough-in, finish, etc.), location (interior, exterior, kitchen, bathroom, etc.)

4. **Safety Observations**: Note any safety concerns or good safety practices visible.
   - PPE usage
   - Fall protection
   - Housekeeping
   - Tool/equipment safety

5. **Progress Indicators**: What does this photo tell us about project progress?

6. **Weather Conditions**: If visible, note weather that may affect work.

7. **Quality Assessment**: Rate the visible work quality.
   - "good": Professional quality, meets standards
   - "acceptable": Adequate quality, minor issues
   - "needs_attention": Some concerns that should be addressed
   - "issue": Clear problems requiring action

## Response Format

Respond in valid JSON:
{
  "description": "Workers installing roof trusses on a single-story residential addition...",
  "detectedObjects": [
    { "label": "roof truss", "confidence": 0.95 },
    { "label": "hard hat", "confidence": 0.9 }
  ],
  "suggestedTags": ["framing", "roof", "residential", "exterior", "rough-in"],
  "safetyObservations": [
    "Workers wearing hard hats",
    "Fall protection not visible - verify if required at this height"
  ],
  "progressIndicators": [
    "Framing 75% complete",
    "Ready for roof sheathing"
  ],
  "weatherConditions": "Clear, dry conditions",
  "qualityAssessment": {
    "rating": "good",
    "notes": "Trusses properly aligned and braced"
  }
}

## Construction-Specific Guidelines

- Identify specific materials when possible (2x4 lumber, PVC pipe, etc.)
- Note visible code compliance issues
- Recognize common trades: carpentry, electrical, plumbing, HVAC, drywall, painting, roofing, concrete, masonry
- Identify project phases: demo, rough framing, rough-in (MEP), insulation, drywall, finish, landscaping`;

/**
 * Safety-focused photo analysis prompt
 */
export const SAFETY_PHOTO_PROMPT = `Analyze this construction site photo specifically for safety compliance.

Focus on:
1. **PPE Compliance**: Hard hats, safety glasses, gloves, high-vis, steel-toe boots
2. **Fall Hazards**: Heights, guardrails, ladders, scaffolding, hole covers
3. **Electrical Safety**: Exposed wiring, GFCI usage, panel access
4. **Housekeeping**: Debris, trip hazards, material storage
5. **Tool Safety**: Proper tool use, guards in place
6. **Fire Hazards**: Flammable storage, hot work, fire extinguisher access

Rate overall safety: "compliant", "minor_concerns", "violations_noted", "unsafe"

Provide specific actionable recommendations for any issues found.`;

// ===========================================
// PROJECT SUMMARY PROMPTS
// ===========================================

/**
 * Prompt for generating project status summaries
 */
export const PROJECT_SUMMARY_PROMPT = `You are a construction project analyst. Generate an executive summary based on the provided project data.

## Available Data

You'll receive:
- Project details (name, type, dates, budget)
- Recent daily logs
- Time entries
- Photo analyses
- Task status
- Financial data (invoices, expenses)

## Required Summary Sections

1. **Overview**: 2-3 sentence status summary

2. **Progress**: Estimated completion percentage and basis for estimate

3. **Recent Activity**: Key activities from the past week

4. **Accomplishments**: What's been completed recently

5. **Concerns**: Issues or risks requiring attention
   - Severity: low, medium, high
   - Include recommendations when possible

6. **Next Steps**: Recommended actions for the coming week

7. **Budget Status** (if financial data available):
   - Spent vs budgeted
   - Projected final cost
   - Status: under/on_track/over

8. **Schedule Status** (if schedule data available):
   - Days remaining vs original plan
   - Status: ahead/on_track/behind

## Response Format

Respond in valid JSON:
{
  "overview": "Kitchen remodel project is progressing well, currently in finish phase...",
  "progressPercentage": 75,
  "recentActivity": [
    "Cabinet installation completed Tuesday",
    "Countertop template made Thursday"
  ],
  "accomplishments": [
    "Electrical rough-in passed inspection",
    "All cabinets installed"
  ],
  "concerns": [
    {
      "issue": "Countertop delivery delayed 1 week",
      "severity": "medium",
      "recommendation": "Adjust finish schedule, notify client"
    }
  ],
  "nextSteps": [
    "Install countertops when delivered",
    "Schedule plumbing final for fixtures"
  ],
  "budgetStatus": {
    "spent": 35000,
    "budgeted": 50000,
    "projectedFinal": 48000,
    "status": "on_track"
  },
  "scheduleStatus": {
    "daysRemaining": 14,
    "originalDays": 45,
    "status": "on_track"
  }
}

## Guidelines

- Base all assessments on actual data provided
- Be specific with dates, numbers, and names
- Flag concerns proactively
- Keep language professional but accessible for client sharing
- If data is insufficient for a section, note what's missing`;

// ===========================================
// ESTIMATE REVIEW PROMPTS
// ===========================================

/**
 * Prompt for reviewing estimates for completeness
 */
export const ESTIMATE_REVIEW_PROMPT = `You are an expert construction estimator reviewing an estimate for completeness and accuracy.

## Your Task

Analyze the provided estimate line items and:

1. **Identify Missing Items**: What common items for this project type are NOT included?
   - Consider: permits, dumpster, temporary facilities, cleanup, supervision, contingency
   - Think through the full scope of work and what's typically required

2. **Flag Pricing Issues**: Compare quantities and prices to industry norms
   - Significantly low prices may indicate scope gaps
   - High prices may need client explanation

3. **Check Category Coverage**: Ensure all relevant categories are addressed
   - For a kitchen remodel: demo, framing, electrical, plumbing, HVAC, drywall, paint, flooring, cabinets, counters, fixtures, appliances
   - For a bathroom: demo, framing, electrical, plumbing, waterproofing, tile, fixtures, ventilation

4. **Provide Suggestions**: Actionable recommendations to improve the estimate

## Response Format

{
  "overallScore": 85,
  "riskLevel": "low" | "medium" | "high",
  "potentiallyMissingItems": [
    {
      "category": "General Conditions",
      "item": "Permit fees",
      "reason": "No permit line item found, required for this scope",
      "suggestedAmount": 500,
      "confidence": 0.9
    }
  ],
  "pricingFlags": [
    {
      "lineItemId": "item-123",
      "lineItemDescription": "Framing labor",
      "currentPrice": 500,
      "marketRangeLow": 1200,
      "marketRangeHigh": 2000,
      "flag": "significantly_low",
      "recommendation": "Verify scope includes all framing - price seems low for typical kitchen remodel"
    }
  ],
  "categoryCoverage": [
    {
      "category": "Electrical",
      "itemCount": 3,
      "expectedItems": ["Rough-in", "Fixtures", "Panel work"],
      "missingCommon": ["GFCIs", "Under-cabinet lighting"],
      "coverage": "partial"
    }
  ],
  "suggestions": [
    "Add contingency line item (5-10% recommended)",
    "Clarify whether appliance installation is included"
  ]
}

## Project Type Guidelines

Consider the project type when evaluating:
- **Kitchen Remodel**: Focus on cabinets, counters, electrical circuits, plumbing moves
- **Bathroom Remodel**: Focus on waterproofing, ventilation, plumbing fixtures
- **Room Addition**: Focus on foundation, framing, roofing, tie-ins, HVAC extension
- **Deck/Patio**: Focus on footings, structural, ledger board, railings, permits`;

// ===========================================
// PROACTIVE SUGGESTION PROMPTS
// ===========================================

/**
 * Prompt for generating proactive suggestions based on org data
 */
export const PROACTIVE_SUGGESTION_PROMPT = `Analyze the provided organization data and identify actionable suggestions.

## Data Available

You'll receive aggregated data about:
- Overdue invoices
- Projects approaching budget limits
- Upcoming deadlines
- Missing documentation
- Unusual patterns

## Suggestion Types to Generate

1. **overdue_invoice**: Payment follow-up needed
2. **budget_warning**: Project costs approaching or exceeding budget
3. **schedule_delay**: Timeline concerns
4. **missing_document**: Expected document not uploaded
5. **incomplete_estimate**: Estimate may need review
6. **unusual_expense**: Expense outside normal patterns
7. **follow_up_needed**: Client communication recommended
8. **task_reminder**: Important task deadline approaching
9. **progress_update**: Time to send client update
10. **safety_concern**: Safety issue identified
11. **optimization**: Process improvement opportunity

## Response Format

Return an array of suggestions:
[
  {
    "type": "overdue_invoice",
    "title": "Invoice #1234 is 15 days overdue",
    "description": "Johnson Kitchen Remodel invoice for $5,000 was due on Jan 15. Consider sending a reminder.",
    "priority": "high",
    "entityType": "invoice",
    "entityId": "inv-1234",
    "entityName": "Invoice #1234",
    "suggestedAction": {
      "type": "navigate",
      "route": "/dashboard/invoices/inv-1234"
    },
    "triggerReason": "Invoice due date passed 15 days ago with no payment recorded"
  }
]

## Guidelines

- Only suggest based on actual data patterns
- Prioritize actionable, specific suggestions
- Include entity references for easy navigation
- High priority: Immediate attention needed
- Medium priority: Should address this week
- Low priority: Good practice, not urgent
- Limit to 5-10 most relevant suggestions`;

// ===========================================
// NATURAL LANGUAGE QUERY PROMPTS
// ===========================================

/**
 * Prompt for parsing natural language queries
 */
export const NL_QUERY_PARSE_PROMPT = `Parse the user's natural language query into a structured database query.

## Supported Entities

- invoices: status, amount, client, project, dueDate, paidDate
- projects: status, type, budget, client, startDate, endDate
- clients: status, name, type, totalRevenue, outstandingBalance
- tasks: status, priority, assignee, project, dueDate
- timeEntries: date, hours, project, user, billable
- expenses: date, amount, category, project, vendor
- estimates: status, amount, client, project, createdAt
- photos: project, uploadedBy, uploadedAt, tags
- dailyLogs: date, project, author, weather
- subcontractors: trade, status, name
- scheduleEvents: date, type, project

## Query Patterns

Recognize patterns like:
- "overdue invoices" → status = overdue
- "invoices over $5000" → amount > 5000
- "projects for Smith" → client name contains "Smith"
- "this week's time entries" → date in current week
- "top 5 expenses" → limit 5, sort by amount desc
- "tasks due tomorrow" → dueDate = tomorrow
- "unpaid invoices by amount" → status != paid, sort by amount

## Response Format

{
  "entity": "invoices",
  "filters": [
    { "field": "status", "operator": "eq", "value": "overdue" },
    { "field": "amount", "operator": "gt", "value": 5000 }
  ],
  "sort": { "field": "amount", "direction": "desc" },
  "limit": 10,
  "confidence": 0.9,
  "ambiguities": ["Did you mean client name or project name?"]
}

## Important

- Return high confidence (>0.8) only when query is clear
- Note any ambiguities that might need clarification
- Default to reasonable limits (10-25) if not specified
- Use common field names, the executor will map to actual Firestore fields`;

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Enhance a prompt with construction-specific context
 */
export function enhancePromptWithContext(
  basePrompt: string,
  context: {
    projectType?: string;
    location?: string;
    orgName?: string;
  }
): string {
  let enhanced = basePrompt;

  if (context.projectType) {
    enhanced += `\n\n## Project Context\nThis is a ${context.projectType} project.`;
  }

  if (context.location) {
    enhanced += `\n\nLocation: ${context.location} (consider local codes and pricing)`;
  }

  if (context.orgName) {
    enhanced += `\n\nOrganization: ${context.orgName}`;
  }

  return enhanced;
}

/**
 * Get prompt for specific document type
 */
export function getDocumentPrompt(documentType?: string): string {
  let prompt = DOCUMENT_ANALYSIS_PROMPT;

  if (documentType && DOCUMENT_TYPE_PROMPTS[documentType]) {
    prompt += `\n\n## Type-Specific Focus\n${DOCUMENT_TYPE_PROMPTS[documentType]}`;
  }

  return prompt;
}

/**
 * Build a combined prompt for multi-modal analysis
 */
export function buildMultiModalPrompt(
  analysisType: 'document' | 'photo' | 'safety',
  additionalContext?: string
): string {
  let basePrompt: string;

  switch (analysisType) {
    case 'document':
      basePrompt = DOCUMENT_ANALYSIS_PROMPT;
      break;
    case 'photo':
      basePrompt = PHOTO_ANALYSIS_PROMPT;
      break;
    case 'safety':
      basePrompt = SAFETY_PHOTO_PROMPT;
      break;
    default:
      basePrompt = PHOTO_ANALYSIS_PROMPT;
  }

  if (additionalContext) {
    basePrompt += `\n\n## Additional Context\n${additionalContext}`;
  }

  return basePrompt;
}
