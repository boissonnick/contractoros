/**
 * ContractorOS AI Assistant Prompts
 *
 * System prompts and context builders for the AI-powered assistant.
 * Supports both client-side AssistantContext and server-side ServerContext.
 */

import { AssistantContext } from './types';
import type { ServerContext } from './server-context-loader';

/**
 * Main system prompt for the ContractorOS assistant
 */
export const SYSTEM_PROMPT = `You are the ContractorOS AI Assistant - a helpful, knowledgeable assistant for construction contractors and project managers.

## Your Capabilities

You have access to:
- **Material prices**: Real-time price indices for lumber, steel, copper, concrete, and other construction materials
- **Labor rates**: Regional wage data by trade (carpenter, electrician, plumber, HVAC, painter, etc.)
- **Market benchmarks**: Project cost ranges for bathroom remodels, kitchen remodels, roofing, and more
- **User's project data**: Active projects, estimates, and schedules (when context is provided)

## Your Role

1. **Answer pricing questions** with specific data when available
2. **Help create estimates** by suggesting line items and costs
3. **Provide project guidance** based on best practices
4. **Explain construction concepts** in plain language
5. **Assist with calculations** for materials, labor, and costs

## Response Guidelines

- **Be concise**: Contractors are busy. Keep responses short and actionable.
- **Use bullet points**: For lists of items, prices, or steps
- **Cite sources**: When providing prices, mention the data source (e.g., "Based on FRED lumber indices...")
- **Provide ranges**: Give low/median/high price ranges rather than single numbers
- **Regional context**: Adjust advice based on the user's location when known
- **Ask clarifying questions**: If the request is vague, ask one focused follow-up

## Formatting

- Use markdown formatting for clarity
- Format prices as currency (e.g., $150/sq ft)
- Use tables for comparing options
- Keep paragraphs short (2-3 sentences max)

## What NOT to Do

- Don't make up prices - say "I don't have current data for that"
- Don't give legal or tax advice
- Don't promise specific timelines without project details
- Don't share competitor names or make comparisons to other software

## Sample Responses

**Good**: "For a standard bathroom remodel in California:
- Low end: $150-200/sq ft (basic fixtures, minimal tile)
- Mid-range: $250-350/sq ft (quality fixtures, custom tile)
- High end: $400+/sq ft (premium everything)

Based on market data from 47 similar projects in your region."

**Bad**: "A bathroom remodel costs about $15,000 to $50,000 depending on various factors like the size, materials chosen, labor costs in your area, the complexity of the plumbing and electrical work, whether you're moving fixtures, the quality of tiles and fixtures selected..."
`;

/**
 * Build a context summary string from the assistant context
 */
export function buildContextSummary(context: AssistantContext): string {
  const parts: string[] = [];

  // User info
  if (context.user) {
    parts.push(`User: ${context.user.displayName} (${context.user.role})`);
  }

  // Organization location for regional pricing
  if (context.organization?.location) {
    const loc = context.organization.location;
    if (loc.state) {
      parts.push(`Location: ${loc.city ? `${loc.city}, ` : ''}${loc.state}${loc.zipCode ? ` ${loc.zipCode}` : ''}`);
    }
  }

  // Active project context
  if (context.activeProject) {
    const p = context.activeProject;
    let projectInfo = `Active Project: "${p.name}" (${p.type}, ${p.status})`;
    if (p.budget) {
      projectInfo += ` - Budget: $${p.budget.toLocaleString()}`;
    }
    if (p.client?.name) {
      projectInfo += ` - Client: ${p.client.name}`;
    }
    parts.push(projectInfo);
  }

  // Active estimate context
  if (context.activeEstimate) {
    const e = context.activeEstimate;
    parts.push(
      `Active Estimate: "${e.name}" - ${e.lineItemCount} items totaling $${e.totalAmount.toLocaleString()} (${e.status})`
    );
  }

  // Current page
  if (context.currentPage) {
    parts.push(`Viewing: ${context.currentPage.pageName}`);
  }

  // Recent activity highlights
  if (context.recentActivity) {
    const a = context.recentActivity;
    if (a.pendingTasks && a.pendingTasks > 0) {
      parts.push(`${a.pendingTasks} pending tasks`);
    }
    if (a.overdueInvoices && a.overdueInvoices > 0) {
      parts.push(`${a.overdueInvoices} overdue invoices`);
    }
  }

  return parts.join(' | ');
}

/**
 * Build the full system prompt with context
 */
export function buildSystemPrompt(context?: AssistantContext): string {
  let prompt = SYSTEM_PROMPT;

  if (context) {
    const contextSummary = buildContextSummary(context);
    if (contextSummary) {
      prompt += `\n\n## Current Context\n\n${contextSummary}`;
    }
  }

  return prompt;
}

/**
 * Build rich server context into the system prompt
 * This provides June with comprehensive org-specific data
 */
export function buildServerContextPrompt(serverContext: ServerContext): string {
  const sections: string[] = [];

  // Organization overview
  if (serverContext.organization) {
    const org = serverContext.organization;
    sections.push(`## Organization Profile

You're assisting **${org.name}**, a ${org.industry.replace(/_/g, ' ')} company${org.location.city ? ` based in ${org.location.city}, ${org.location.state}` : ''}.
- Team size: ${org.teamSize} members
- Primary trades: ${org.primaryTrades.length > 0 ? org.primaryTrades.join(', ') : 'General contracting'}
`);
  }

  // Projects summary
  if (serverContext.projects) {
    const p = serverContext.projects;
    let projectSection = `## Active Projects

Currently managing **${p.activeCount} active projects** (${p.totalCount} total).

`;
    if (p.list.length > 0) {
      projectSection += '**Current Projects:**\n';
      p.list.slice(0, 10).forEach(proj => {
        const budget = proj.budget ? ` - Budget: $${proj.budget.toLocaleString()}` : '';
        const completion = proj.completionPercent ? ` (${proj.completionPercent}% complete)` : '';
        projectSection += `- ${proj.name} (${proj.status})${budget}${completion}${proj.clientName ? ` - Client: ${proj.clientName}` : ''}\n`;
      });
    }
    sections.push(projectSection);
  }

  // Clients summary
  if (serverContext.clients) {
    const c = serverContext.clients;
    let clientSection = `## Clients

**${c.activeCount} active clients**

`;
    if (c.withOutstandingBalance.length > 0) {
      clientSection += '**Clients with Outstanding Balances:**\n';
      c.withOutstandingBalance.slice(0, 5).forEach(client => {
        clientSection += `- ${client.name}: $${client.outstandingBalance.toLocaleString()} owed\n`;
      });
      clientSection += '\n';
    }
    if (c.recent.length > 0) {
      clientSection += '**Recent Clients:**\n';
      c.recent.slice(0, 5).forEach(client => {
        const revenue = client.totalRevenue ? ` - Total revenue: $${client.totalRevenue.toLocaleString()}` : '';
        clientSection += `- ${client.name} (${client.status})${revenue}\n`;
      });
    }
    sections.push(clientSection);
  }

  // Estimates summary
  if (serverContext.estimates && serverContext.estimates.pendingCount > 0) {
    const e = serverContext.estimates;
    let estSection = `## Pending Estimates

**${e.pendingCount} estimates** awaiting response:

`;
    e.pending.slice(0, 8).forEach(est => {
      const total = est.total ? ` - $${est.total.toLocaleString()}` : '';
      estSection += `- ${est.name} (${est.status})${total}${est.clientName ? ` for ${est.clientName}` : ''}\n`;
    });
    sections.push(estSection);
  }

  // Schedule summary
  if (serverContext.schedule) {
    const s = serverContext.schedule;
    let schedSection = `## Schedule Overview

- **Today:** ${s.todayEvents} events
- **This week:** ${s.weekEvents} events

`;
    if (s.upcoming.length > 0) {
      schedSection += '**Upcoming Events:**\n';
      s.upcoming.slice(0, 7).forEach(event => {
        const time = event.startTime ? ` at ${event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : '';
        const date = event.startTime ? ` (${event.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})` : '';
        schedSection += `- ${event.title}${time}${date}${event.projectName ? ` - ${event.projectName}` : ''}\n`;
      });
    }
    sections.push(schedSection);
  }

  // Financial summary
  if (serverContext.financials) {
    const f = serverContext.financials;
    let finSection = `## Financial Summary (This Month)

- **Revenue:** $${f.monthlyRevenue.toLocaleString()}
- **Expenses:** $${f.monthlyExpenses.toLocaleString()}
- **Profit:** $${f.monthlyProfit.toLocaleString()}

**Accounts Receivable:**
- ${f.pendingInvoices} pending invoices
- ${f.overdueInvoices} overdue invoices ($${f.overdueAmount.toLocaleString()} total overdue)
`;
    sections.push(finSection);
  }

  // Team summary
  if (serverContext.team && serverContext.team.totalMembers > 0) {
    const t = serverContext.team;
    let teamSection = `## Team

**${t.totalMembers} team members:**
`;
    // Show role breakdown
    Object.entries(t.roleBreakdown).forEach(([role, count]) => {
      teamSection += `- ${role}: ${count}\n`;
    });

    if (t.members.length > 0 && t.members.length <= 15) {
      teamSection += '\n**Team Members:**\n';
      t.members.forEach(m => {
        teamSection += `- ${m.name} (${m.role})\n`;
      });
    }
    sections.push(teamSection);
  }

  // Inventory alerts
  if (serverContext.inventory && serverContext.inventory.lowStockAlerts > 0) {
    sections.push(`## Inventory Alerts

⚠️ **${serverContext.inventory.lowStockAlerts} low stock alerts** require attention.
`);
  }

  return sections.join('\n');
}

/**
 * Build the full system prompt with server context
 * This is used when we have rich server-side data from Firebase Admin
 */
export function buildSystemPromptWithServerContext(
  serverContext: ServerContext,
  clientContext?: AssistantContext
): string {
  let prompt = SYSTEM_PROMPT;

  // Add rich server context
  const serverContextStr = buildServerContextPrompt(serverContext);
  if (serverContextStr) {
    prompt += `\n\n${serverContextStr}`;
  }

  // Add any client-side context (current page, active project view, etc.)
  if (clientContext) {
    const parts: string[] = [];

    if (clientContext.currentPage) {
      parts.push(`**Currently Viewing:** ${clientContext.currentPage.pageName}`);
    }

    if (clientContext.activeProject) {
      const p = clientContext.activeProject;
      parts.push(`**Focused Project:** ${p.name} (${p.status})`);
    }

    if (clientContext.activeEstimate) {
      const e = clientContext.activeEstimate;
      parts.push(`**Focused Estimate:** ${e.name} - $${e.totalAmount.toLocaleString()}`);
    }

    if (parts.length > 0) {
      prompt += `\n\n## Current View\n\n${parts.join('\n')}`;
    }
  }

  // Add helpful instruction about the data
  prompt += `\n\n## Using This Context

You have access to real-time data from this organization's ContractorOS account. When answering questions:
- Reference specific projects, clients, and team members by name
- Use actual financial figures when discussing budgets or invoices
- Consider the team's current schedule when making recommendations
- Be specific about pending estimates and outstanding balances
- If asked about something not in the context, say you don't have that data currently loaded

**Important:** This data is confidential and specific to this organization. Do not reference any information from other organizations.`;

  return prompt;
}

/**
 * Pricing data template for responses
 */
export const PRICING_RESPONSE_TEMPLATE = `
Based on current market data:

| Range | Cost |
|-------|------|
| Low | {{lowPrice}} |
| Median | {{medianPrice}} |
| High | {{highPrice}} |

{{#if sources}}
**Data sources:** {{sources}}
{{/if}}

{{#if factors}}
**Key factors affecting price:**
{{#each factors}}
- {{this}}
{{/each}}
{{/if}}
`;

/**
 * Estimate assistance prompt
 */
export const ESTIMATE_ASSISTANCE_PROMPT = `
You're helping create an estimate. Focus on:

1. **Essential line items** - What must be included?
2. **Common additions** - What do clients often add?
3. **Pricing guidance** - Suggest ranges based on market data
4. **Potential issues** - What might increase costs?

Be specific with quantities and unit costs when possible.
`;

/**
 * Project analysis prompt
 */
export const PROJECT_ANALYSIS_PROMPT = `
Analyze this project and provide:

1. **Budget assessment** - Is the budget realistic for the scope?
2. **Timeline check** - Are the deadlines achievable?
3. **Risk factors** - What could cause problems?
4. **Recommendations** - Specific actionable suggestions

Base your analysis on similar projects in the database.
`;

/**
 * Common response fragments
 */
export const RESPONSE_FRAGMENTS = {
  noData: "I don't have reliable pricing data for that specific item. Would you like me to suggest similar items I do have data for?",
  askClarification: "To give you accurate information, could you specify:",
  regionalNote: "Note: Prices vary significantly by region. These figures are based on {{region}} market data.",
  disclaimerEstimate: "These are market estimates based on aggregated data. Actual costs may vary based on project specifics.",
  suggestFollowUp: "Would you like me to:",
};

/**
 * Quick response templates for common queries
 */
export const QUICK_RESPONSES: Record<string, string> = {
  hello: "Hi! I'm here to help with pricing, estimates, and project questions. What can I do for you?",
  thanks: "You're welcome! Let me know if you need anything else.",
  help: `I can help you with:
- **Pricing**: "What should I charge for a kitchen remodel?"
- **Estimates**: "Help me create an estimate for a bathroom renovation"
- **Materials**: "What's the current price of lumber?"
- **Labor rates**: "What's the average rate for an electrician?"
- **Project advice**: "How long should a deck project take?"

Just ask your question naturally!`,
  capabilities: `Here's what I can help with:

**Pricing Intelligence**
- Material prices (lumber, steel, copper, etc.)
- Labor rates by trade and region
- Project cost benchmarks

**Estimates**
- Suggest line items
- Provide price ranges
- Review estimate totals

**Projects**
- Schedule planning
- Budget analysis
- Timeline estimation

What would you like to know?`,
};

/**
 * Get a quick response if the message matches a pattern
 */
export function getQuickResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (['hi', 'hello', 'hey', 'hi there', 'hello there'].includes(lowerMessage)) {
    return QUICK_RESPONSES.hello;
  }

  // Thanks
  if (['thanks', 'thank you', 'thx', 'ty', 'appreciated'].some(t => lowerMessage.includes(t))) {
    return QUICK_RESPONSES.thanks;
  }

  // Help
  if (['help', 'what can you do', 'how do i use', 'capabilities'].some(t => lowerMessage.includes(t))) {
    return QUICK_RESPONSES.help;
  }

  return null;
}

/**
 * Enhance a pricing query with context
 */
export function enhancePricingQuery(
  query: string,
  context: AssistantContext
): string {
  let enhanced = query;

  // Add regional context if available
  if (context.organization?.location?.state) {
    if (!query.toLowerCase().includes('in ') && !query.toLowerCase().includes('for ')) {
      enhanced += ` in ${context.organization.location.state}`;
    }
  }

  // Add project type context if available
  if (context.activeProject?.type && !query.toLowerCase().includes(context.activeProject.type.toLowerCase())) {
    enhanced = `For a ${context.activeProject.type}: ${query}`;
  }

  return enhanced;
}
