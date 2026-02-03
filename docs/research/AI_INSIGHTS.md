# AI-Powered Insights Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issue:** #73

---

## Executive Summary

This document evaluates AI-powered insights capabilities for ContractorOS to provide contractors with anomaly detection, predictive analytics, and actionable recommendations. We recommend a **phased AI insights approach**:

1. **Phase 1:** Rule-based alerts with AI-enhanced descriptions
2. **Phase 2:** Anomaly detection for expenses, schedules, budgets
3. **Phase 3:** Predictive insights for cash flow, completion, profitability
4. **Phase 4:** Natural language summaries and recommendations

Using Claude API for natural language generation and custom anomaly detection algorithms provides the best balance of capability and cost. Expected API costs: $50-200/month for typical organization usage with proper caching and batching.

---

## Requirements

### Business Requirements

- Detect unusual expense patterns (fraud, waste)
- Predict project completion dates
- Forecast cash flow needs
- Identify budget overrun risks early
- Generate weekly/monthly insight summaries
- Provide actionable recommendations
- Alert on critical thresholds

### Technical Requirements

- Real-time or near-real-time analysis
- Integration with existing Firestore data
- Cost-effective API usage
- Privacy-preserving (no PII to external APIs)
- Explainable AI (show reasoning)
- User feedback loop for improvement

---

## Feature Categories

### 1. Anomaly Detection

| Type | Description | Example |
|------|-------------|---------|
| **Expense anomaly** | Unusual spend amount/frequency | "$5,000 lumber expense is 3x typical |
| **Schedule anomaly** | Task delays or acceleration | "Electrical phase 5 days behind average" |
| **Budget anomaly** | Cost category overspend | "Material costs 40% over budget" |
| **Time anomaly** | Unusual clock-in patterns | "3 employees overtime 5+ days" |

### 2. Predictive Insights

| Type | Description | Value |
|------|-------------|-------|
| **Completion forecast** | Predicted project end date | Plan resource allocation |
| **Cash flow forecast** | Predicted inflows/outflows | Manage working capital |
| **Profitability forecast** | Predicted margin | Course-correct early |
| **Resource forecast** | Predicted labor needs | Avoid over/under staffing |

### 3. Natural Language Summaries

| Type | Example |
|------|---------|
| **Weekly digest** | "This week: 3 projects on track, 1 at risk due to permit delay..." |
| **Project summary** | "Kitchen remodel is 65% complete, 2 days ahead of schedule..." |
| **Financial summary** | "Revenue up 15% vs. last month, driven by 2 new projects..." |
| **Risk summary** | "2 change orders pending approval totaling $12,500..." |

### 4. Actionable Alerts

| Alert | Trigger | Recommendation |
|-------|---------|----------------|
| **Budget warning** | 80% of category spent | "Review remaining scope" |
| **Payment overdue** | Invoice 30+ days | "Send reminder to client" |
| **Schedule slip** | Task overdue 3+ days | "Reassess dependencies" |
| **Margin erosion** | Profit margin < 10% | "Review change orders" |

---

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ContractorOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    AI Insights Engine                    │   │
│  │                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │   Anomaly     │  │  Predictive   │  │   NL Gen    │  │   │
│  │  │  Detection    │  │   Models      │  │  (Claude)   │  │   │
│  │  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘  │   │
│  └──────────┼──────────────────┼─────────────────┼──────────┘   │
│             │                  │                 │              │
│             ▼                  ▼                 ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Data Pipeline                         │   │
│  │                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │  Aggregation  │  │  Feature      │  │   Cache     │  │   │
│  │  │  (Scheduled)  │  │  Extraction   │  │  (Results)  │  │   │
│  │  └───────────────┘  └───────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                 │
│                               ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Firestore                           │   │
│  │   projects, expenses, tasks, time_entries, invoices      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Anomaly Detection Algorithm

```typescript
// Statistical anomaly detection using Z-score
interface AnomalyResult {
  type: 'expense' | 'schedule' | 'budget' | 'time';
  severity: 'low' | 'medium' | 'high';
  score: number;           // Z-score or deviation
  value: number;           // Actual value
  expected: number;        // Expected/average value
  context: string;         // Human-readable context
}

function detectExpenseAnomaly(
  expense: Expense,
  historicalData: Expense[]
): AnomalyResult | null {
  // Filter to same category/vendor
  const similar = historicalData.filter(e =>
    e.category === expense.category &&
    e.vendorId === expense.vendorId
  );

  if (similar.length < 5) return null; // Not enough data

  // Calculate statistics
  const amounts = similar.map(e => e.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length
  );

  // Z-score
  const zScore = (expense.amount - mean) / stdDev;

  if (Math.abs(zScore) > 2) {
    return {
      type: 'expense',
      severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
      score: zScore,
      value: expense.amount,
      expected: mean,
      context: `${expense.category} expense from ${expense.vendorName}`,
    };
  }

  return null;
}
```

### Predictive Model: Project Completion

```typescript
// Simple linear regression for completion prediction
interface CompletionForecast {
  projectId: string;
  predictedEndDate: Date;
  confidence: number;      // 0-1
  basedOn: string;         // Explanation
}

function forecastCompletion(project: Project): CompletionForecast {
  const tasks = project.tasks;
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (completedTasks.length < 3) {
    return {
      projectId: project.id,
      predictedEndDate: project.estimatedEndDate,
      confidence: 0.3,
      basedOn: 'Original estimate (insufficient data)',
    };
  }

  // Calculate average task completion rate
  const completionTimes = completedTasks.map(t =>
    (t.completedAt.getTime() - t.startedAt.getTime()) / t.estimatedHours
  );
  const avgCompletionRate = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;

  // Estimate remaining work
  const remainingHours = tasks
    .filter(t => t.status !== 'completed')
    .reduce((sum, t) => sum + t.estimatedHours, 0);

  const predictedDays = (remainingHours * avgCompletionRate) / 8; // 8-hour days
  const predictedEndDate = addDays(new Date(), predictedDays);

  return {
    projectId: project.id,
    predictedEndDate,
    confidence: Math.min(0.9, 0.5 + (completedTasks.length * 0.05)),
    basedOn: `Based on ${completedTasks.length} completed tasks (${avgCompletionRate.toFixed(1)}x rate)`,
  };
}
```

### Natural Language Generation (Claude)

```typescript
// Generate insight summary using Claude API
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface InsightContext {
  projectSummary: ProjectMetrics[];
  anomalies: AnomalyResult[];
  forecasts: CompletionForecast[];
  financials: FinancialSummary;
}

async function generateWeeklySummary(context: InsightContext): Promise<string> {
  const prompt = `You are a construction project analyst. Generate a concise weekly summary for a contractor based on this data:

Projects:
${context.projectSummary.map(p => `- ${p.name}: ${p.completionPercent}% complete, ${p.status}`).join('\n')}

Anomalies Detected:
${context.anomalies.map(a => `- ${a.severity.toUpperCase()}: ${a.context} (${a.value} vs expected ${a.expected})`).join('\n') || 'None'}

Forecasts:
${context.forecasts.map(f => `- ${f.projectId}: Predicted completion ${formatDate(f.predictedEndDate)} (${Math.round(f.confidence * 100)}% confidence)`).join('\n')}

Financials:
- Revenue this week: ${formatCurrency(context.financials.weeklyRevenue)}
- Expenses this week: ${formatCurrency(context.financials.weeklyExpenses)}
- Outstanding invoices: ${formatCurrency(context.financials.outstandingInvoices)}

Write a 3-4 paragraph summary highlighting:
1. Overall status (good/needs attention)
2. Key items requiring action
3. Positive trends to maintain

Keep it conversational but professional. Focus on actionable insights.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}
```

---

## Cost Estimation

### API Pricing (2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Use Case |
|-------|----------------------|------------------------|----------|
| **Claude Haiku 4.5** | $1.00 | $5.00 | Quick alerts |
| **Claude Sonnet 4.5** | $3.00 | $15.00 | Summaries |
| **Claude Opus 4.5** | $5.00 | $25.00 | Complex analysis |
| **GPT-4o** | $2.50 | $10.00 | Alternative |
| **GPT-4o-mini** | $0.15 | $0.60 | Budget option |

### Usage Estimation (per organization)

| Feature | Frequency | Tokens/Call | Monthly Calls | Monthly Cost |
|---------|-----------|-------------|---------------|--------------|
| **Weekly summary** | 4/month | 2,000 | 4 | $0.24 |
| **Anomaly descriptions** | 50/month | 500 | 50 | $0.75 |
| **Project insights** | 20/month | 1,000 | 20 | $0.60 |
| **Ad-hoc questions** | 30/month | 1,500 | 30 | $1.35 |
| **Monthly Total** | — | — | 104 | **~$3/org** |

**At scale (1,000 orgs):** ~$3,000/month base + usage spikes

### Cost Optimization

1. **Caching** — Cache summaries for 24h (90% cost reduction)
2. **Batching** — Batch API discount (50% off)
3. **Model selection** — Haiku for alerts, Sonnet for summaries
4. **Prompt optimization** — Minimize input context

---

## Implementation Plan

### Phase 1: Rule-Based Alerts (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Define alert thresholds | 4h | None |
| Budget threshold alerts | 6h | Thresholds |
| Payment overdue alerts | 4h | Thresholds |
| Schedule delay alerts | 6h | Thresholds |
| Alert notification UI | 8h | Alerts |
| **Subtotal** | **28h** | |

### Phase 2: Anomaly Detection (3 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Data aggregation pipeline | 8h | Phase 1 |
| Expense anomaly algorithm | 8h | Pipeline |
| Schedule anomaly algorithm | 8h | Pipeline |
| Anomaly scoring & ranking | 6h | Algorithms |
| AI-enhanced descriptions | 8h | Scoring |
| **Subtotal** | **38h** | |

### Phase 3: Predictive Insights (3 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Completion forecast model | 12h | Phase 2 |
| Cash flow forecast model | 12h | Completion |
| Profitability forecast | 8h | Cash flow |
| Forecast accuracy tracking | 6h | Forecasts |
| **Subtotal** | **38h** | |

### Phase 4: NL Summaries (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Claude API integration | 6h | Phase 3 |
| Weekly summary generation | 8h | API |
| Project insight generation | 8h | API |
| Summary caching | 4h | Generation |
| **Subtotal** | **26h** | |

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | 12h | None (complete) |
| Phase 1: Rule-based | 28h | Research |
| Phase 2: Anomaly detection | 38h | Phase 1 |
| Phase 3: Predictive | 38h | Phase 2 |
| Phase 4: NL summaries | 26h | Phase 3 |
| **Total** | **142h** | |

**Estimated Duration:** 10-12 weeks

---

## Privacy Considerations

### Data Sent to AI APIs

**DO send:**
- Aggregated metrics (totals, averages)
- Anonymized patterns
- Category names
- Date ranges

**DON'T send:**
- Employee names
- Client names/addresses
- Bank account numbers
- Specific dollar amounts (use percentages)

### Example Safe Prompt

```typescript
// Safe: Anonymized context
const safePrompt = `
Project A: 65% complete, 5 days behind schedule
Project B: 40% complete, on track
Project C: 90% complete, 2 days ahead

Expense anomaly: Materials category 40% over monthly average
Cash position: 2.5 months runway

Generate a brief status summary.
`;

// Unsafe: PII included
const unsafePrompt = `
Johnson Kitchen Remodel at 123 Oak St: $45,000 budget
Client John Johnson owes $15,000...
Employee Mike Smith worked 60 hours...
`;
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Alert accuracy** | >80% actionable | User feedback |
| **Forecast accuracy** | Within 15% | Actual vs. predicted |
| **User engagement** | 70% view summaries | Analytics |
| **Time saved** | 2h/week per user | Survey |
| **Cost per insight** | <$0.10 | API tracking |

---

## Open Questions

- [ ] Should AI insights be a premium feature?
- [ ] How do we handle organizations with minimal data?
- [ ] What's the feedback mechanism for improving predictions?
- [ ] Should users be able to disable AI features?
- [ ] How do we explain AI reasoning to non-technical users?
- [ ] Do we need on-premise/local AI for sensitive customers?

---

## References

- [Anthropic Claude API](https://docs.anthropic.com/)
- [Claude API Pricing](https://www.anthropic.com/pricing)
- [OpenAI API](https://platform.openai.com/)
- [MindBridge Anomaly Detection](https://www.mindbridge.ai/)
- [Datagrid Construction AI](https://www.datagrid.com/)
- [Statistical Anomaly Detection](https://en.wikipedia.org/wiki/Anomaly_detection)
