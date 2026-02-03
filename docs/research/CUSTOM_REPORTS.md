# Custom Reports Builder Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issue:** #67

---

## Executive Summary

This document evaluates options for adding custom report building capabilities to ContractorOS. After analyzing BI platforms (Metabase, Superset), embedded analytics (Power BI Embedded, Looker), and charting libraries (Recharts, Plotly), we recommend a **hybrid approach**:

1. **Phase 1:** Enhanced built-in reports with Recharts (current stack)
2. **Phase 2:** Saved report templates with configurable filters
3. **Phase 3:** Metabase embedded for advanced users (self-service BI)

This approach leverages our existing React/Recharts infrastructure for 80% of use cases while providing a path to full self-service analytics via Metabase embedding for power users. Building a full drag-and-drop report builder from scratch would require 200+ hours; integrating Metabase provides similar functionality in ~40 hours.

---

## Requirements

### Business Requirements

- Contractors can create custom reports on their data
- Save and reuse report templates
- Schedule automated report delivery (email PDF/Excel)
- Export to PDF, Excel, CSV
- Filter by date range, project, client, user
- Drill-down from summary to detail
- Role-based report access

### Technical Requirements

- Integration with existing Firestore data
- React-compatible embedding
- Mobile-responsive report viewing
- Real-time vs. cached data options
- Performance at scale (100K+ records)
- Multi-tenant data isolation

---

## Options Evaluated

### BI Platforms

| Platform | Type | Embedding | Pricing | Complexity |
|----------|------|-----------|---------|------------|
| **Metabase** | Open Source | React SDK | Free / $85/user/mo | Low |
| **Apache Superset** | Open Source | iframe | Free | Medium |
| **Power BI Embedded** | Enterprise | iframe/API | $4,995/mo | High |
| **Looker** | Enterprise | iframe/API | Custom ($$$) | High |
| **Preset (Superset)** | Managed | iframe | $20+/user/mo | Medium |

### Charting Libraries

| Library | Type | React Native | Customization | Performance |
|---------|------|--------------|---------------|-------------|
| **Recharts** | React | Yes | Medium | Good |
| **Plotly** | Multi-platform | Via wrapper | High | Good |
| **Chart.js** | Vanilla JS | Via wrapper | Medium | Excellent |
| **Nivo** | React | Yes | High | Good |
| **ECharts** | Multi-platform | Via wrapper | Very High | Excellent |

### Report Builders

| Tool | Type | Drag-Drop | Scheduling | Price |
|------|------|-----------|------------|-------|
| **Metabase** | BI Platform | Yes | Yes | Free/Paid |
| **DotNetReport** | Embeddable | Yes | Yes | $999/year |
| **Luzmo** | Embedded BI | Yes | Yes | $500+/mo |
| **Bold Reports** | .NET | Yes | Yes | $995/year |

---

## Detailed Analysis

### Option A: Metabase (Recommended for Phase 3)

**Overview:** Open-source BI platform with excellent React embedding SDK.

#### Strengths

- **Self-service queries** — Users can build without SQL
- **React SDK** — Native embedding, not just iframes
- **Free tier** — Open source for evaluation/small scale
- **40+ visualizations** — Line, bar, pie, maps, tables, etc.
- **Dashboard builder** — Combine multiple charts
- **Scheduled delivery** — Email reports automatically

#### Pricing

| Tier | Cost | Features |
|------|------|----------|
| **Open Source** | Free | Self-hosted, basic embedding |
| **Pro** | $85/user/mo | Cloud, React SDK, SSO |
| **Enterprise** | Custom | Audit logs, advanced permissions |

#### React SDK Integration

```tsx
import { MetabaseProvider, StaticDashboard } from "@metabase/embedding-sdk-react";

const config = {
  metabaseInstanceUrl: "https://metabase.contractoros.com",
  jwtProviderUri: "/api/metabase/sso",
};

function ReportsPage() {
  return (
    <MetabaseProvider config={config}>
      <StaticDashboard dashboardId={1} withTitle withDownloads />
    </MetabaseProvider>
  );
}
```

#### Data Connection

Metabase connects to:
- PostgreSQL, MySQL, MongoDB
- BigQuery, Snowflake, Redshift
- **Firestore via BigQuery export**

For Firestore data, export to BigQuery using Firebase Extensions:
1. Install "Export Collections to BigQuery" extension
2. Configure collections to export
3. Connect Metabase to BigQuery

#### Limitations

- Firestore not directly supported (requires BigQuery export)
- React SDK requires Pro plan
- Additional infrastructure to manage

---

### Option B: Apache Superset

**Overview:** Enterprise-grade open-source BI from Apache/Airbnb.

#### Strengths

- 70+ chart types
- Row-level security built-in
- Embeddable dashboards
- Handles petabyte-scale data
- Free and open source

#### Challenges

- Documentation for embedding is lacking
- More complex setup than Metabase
- No React SDK (iframe only)
- Requires Python backend

#### When to Choose

- Need petabyte-scale analytics
- Already using Druid/Trino
- Have DevOps capacity for complex deployment

---

### Option C: Enhanced Built-in Reports (Recommended Phase 1-2)

**Overview:** Extend existing Recharts implementation with saved templates.

#### Current State

ContractorOS already uses Recharts for:
- Revenue charts
- Project status dashboards
- Financial reports

#### Proposed Enhancements

**Phase 1: Configurable Filters**
```tsx
interface ReportConfig {
  id: string;
  name: string;
  type: 'financial' | 'project' | 'time' | 'custom';

  // Filters
  dateRange: { start: Date; end: Date };
  projectIds?: string[];
  clientIds?: string[];
  userIds?: string[];

  // Visualization
  chartType: 'line' | 'bar' | 'pie' | 'table';
  metrics: string[];     // e.g., ['revenue', 'expenses', 'profit']
  groupBy: string;       // e.g., 'month', 'project', 'client'

  // Output
  schedule?: ReportSchedule;
  createdBy: string;
  createdAt: Timestamp;
}
```

**Phase 2: Report Templates**
```tsx
// Saved report template
interface ReportTemplate {
  id: string;
  orgId: string;
  name: string;
  description: string;
  config: ReportConfig;
  isDefault: boolean;
  sharedWith: string[];  // User IDs
}

// Template selector component
function ReportTemplateSelector({ onSelect }) {
  const { templates } = useReportTemplates();

  return (
    <div className="grid grid-cols-3 gap-4">
      {templates.map(template => (
        <ReportTemplateCard
          key={template.id}
          template={template}
          onSelect={() => onSelect(template)}
        />
      ))}
    </div>
  );
}
```

#### Recharts Implementation

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ReportData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

function FinancialReport({ data, config }: { data: ReportData[]; config: ReportConfig }) {
  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip formatter={(value) => formatCurrency(value)} />
      {config.metrics.includes('revenue') && (
        <Line type="monotone" dataKey="revenue" stroke="#10b981" />
      )}
      {config.metrics.includes('expenses') && (
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
      )}
      {config.metrics.includes('profit') && (
        <Line type="monotone" dataKey="profit" stroke="#3b82f6" />
      )}
    </LineChart>
  );
}
```

---

### Option D: Plotly for Advanced Visualizations

**Overview:** Use Plotly for specialized charts not available in Recharts.

#### When to Use Plotly

- 3D visualizations
- Geographic/map data
- Scientific/statistical charts
- Complex drill-down interactions

#### Integration

```tsx
import Plot from 'react-plotly.js';

function ProjectGantt({ tasks }) {
  const data = [{
    type: 'bar',
    orientation: 'h',
    x: tasks.map(t => t.duration),
    y: tasks.map(t => t.name),
    base: tasks.map(t => t.startDate),
  }];

  return (
    <Plot
      data={data}
      layout={{ title: 'Project Timeline', barmode: 'stack' }}
    />
  );
}
```

---

## Recommendation

### Phased Approach

```
Phase 1 (4-6 weeks)              Phase 2 (4-6 weeks)              Phase 3 (6-8 weeks)
├── Configurable filters         ├── Saved templates              ├── Metabase integration
├── Date range picker            ├── Template sharing             ├── Self-service queries
├── Project/client filters       ├── Dashboard builder            ├── Scheduled delivery
├── Export (PDF, Excel)          ├── Role-based access            ├── Advanced analytics
└── Enhanced Recharts            └── Basic scheduling             └── BigQuery export
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ContractorOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Reports Module                        │   │
│  │                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │ Built-in      │  │ Template      │  │  Metabase   │  │   │
│  │  │ Reports       │  │ Builder       │  │  Embed      │  │   │
│  │  │ (Recharts)    │  │               │  │  (Phase 3)  │  │   │
│  │  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘  │   │
│  └──────────┼──────────────────┼─────────────────┼──────────┘   │
│             │                  │                 │              │
│             ▼                  ▼                 ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Data Layer                          │   │
│  │                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │   │
│  │  │  Firestore    │  │   BigQuery    │  │   Cache     │  │   │
│  │  │  (Live Data)  │  │  (Analytics)  │  │  (Reports)  │  │   │
│  │  └───────────────┘  └───────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Enhanced Built-in Reports (4-6 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Report filter component | 8h | None |
| Date range picker enhancement | 4h | Filter |
| Project/client filter | 6h | Filter |
| Metric selector | 6h | Filter |
| Chart type switcher | 6h | Metrics |
| PDF export (react-pdf) | 12h | Charts |
| Excel export (xlsx) | 8h | Charts |
| **Subtotal** | **50h** | |

### Phase 2: Saved Templates (4-6 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Template data model | 4h | Phase 1 |
| Save template UI | 8h | Model |
| Template library page | 12h | Save UI |
| Template sharing | 6h | Library |
| Dashboard builder (multi-chart) | 16h | Templates |
| Basic scheduling UI | 8h | Dashboard |
| Email delivery (Cloud Function) | 12h | Scheduling |
| **Subtotal** | **66h** | |

### Phase 3: Metabase Integration (6-8 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| BigQuery export setup | 8h | None |
| Metabase deployment | 8h | BigQuery |
| SSO/JWT integration | 12h | Deployment |
| React SDK embedding | 12h | SSO |
| Permission sync | 8h | Embedding |
| User onboarding/docs | 8h | Permissions |
| **Subtotal** | **56h** | |

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | 12h | None (complete) |
| Phase 1: Enhanced Reports | 50h | Research |
| Phase 2: Templates | 66h | Phase 1 |
| Phase 3: Metabase | 56h | Phase 2 |
| **Total** | **184h** | |

**Estimated Duration:** 14-18 weeks

---

## Export Formats

### PDF Generation

```typescript
import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from '@/components/reports/ReportDocument';

async function exportToPDF(reportData: ReportData, config: ReportConfig) {
  const blob = await pdf(
    <ReportDocument data={reportData} config={config} />
  ).toBlob();

  // Download or email
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${config.name}-${formatDate(new Date())}.pdf`);
}
```

### Excel Generation

```typescript
import * as XLSX from 'xlsx';

function exportToExcel(data: any[], config: ReportConfig) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.name);

  // Style headers
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[address]) continue;
    worksheet[address].s = { font: { bold: true } };
  }

  XLSX.writeFile(workbook, `${config.name}-${formatDate(new Date())}.xlsx`);
}
```

---

## Scheduled Reports

### Cloud Function

```typescript
// functions/src/scheduledReports.ts
import * as functions from 'firebase-functions';
import { generateReport } from './reports/generator';
import { sendReportEmail } from './reports/email';

export const runScheduledReports = functions.pubsub
  .schedule('0 6 * * 1') // Every Monday at 6 AM
  .onRun(async () => {
    const schedules = await getActiveSchedules();

    for (const schedule of schedules) {
      const report = await generateReport(schedule.config);
      const pdf = await renderToPDF(report);

      await sendReportEmail({
        to: schedule.recipients,
        subject: `Weekly Report: ${schedule.name}`,
        attachments: [{ filename: `${schedule.name}.pdf`, content: pdf }],
      });

      await updateLastRun(schedule.id);
    }
  });
```

### Schedule Configuration

```typescript
interface ReportSchedule {
  id: string;
  reportTemplateId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;     // 0-6 for weekly
  dayOfMonth?: number;    // 1-31 for monthly
  time: string;           // '06:00'
  timezone: string;       // 'America/Los_Angeles'
  recipients: string[];   // Email addresses
  format: 'pdf' | 'excel' | 'both';
  isActive: boolean;
}
```

---

## Security Considerations

### Data Access

- Reports scoped to organization
- Role-based template access
- Row-level filtering for multi-tenant
- Audit logging for sensitive reports

### Metabase Security

```javascript
// JWT SSO for Metabase embedding
async function generateMetabaseToken(user: User) {
  const payload = {
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    groups: [user.orgId], // Metabase groups for data isolation
    exp: Math.floor(Date.now() / 1000) + 600, // 10 min expiry
  };

  return jwt.sign(payload, METABASE_SECRET_KEY);
}
```

### Export Controls

- Watermark exports with user/org info
- Log all exports for audit
- Option to disable exports per report

---

## Open Questions

- [ ] Should custom reports be a premium feature?
- [ ] How much historical data to support? (1 year? All time?)
- [ ] Do we need real-time reports or is daily cache acceptable?
- [ ] Should users be able to query raw data (SQL)?
- [ ] What's the data retention policy for exported reports?
- [ ] Do we need mobile-specific report views?

---

## References

- [Metabase Embedded Analytics SDK](https://www.metabase.com/product/embedded-analytics-sdk)
- [Metabase Documentation](https://www.metabase.com/docs/)
- [Apache Superset](https://superset.apache.org/)
- [Recharts](https://recharts.org/)
- [Plotly React](https://plotly.com/javascript/react/)
- [react-pdf](https://react-pdf.org/)
- [SheetJS (xlsx)](https://sheetjs.com/)
- [Firebase BigQuery Export](https://firebase.google.com/docs/firestore/solutions/bigquery-export)
