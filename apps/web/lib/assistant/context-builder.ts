/**
 * Context Builder for AI Assistant
 *
 * Builds contextual information from user data, active project,
 * and current page state to provide relevant context to the AI.
 */

import {
  AssistantContext,
  OrganizationContext,
  UserContext,
  ProjectContext,
  EstimateContext,
  ActivityContext,
  PageContext,
} from './types';
import { UserProfile, Organization, Project, Estimate } from '@/types';

/**
 * Build the full assistant context from available data
 */
export function buildAssistantContext(params: {
  profile?: UserProfile | null;
  organization?: Organization | null;
  activeProject?: Project | null;
  activeEstimate?: Estimate | null;
  recentProjects?: Project[];
  recentEstimates?: Estimate[];
  currentRoute?: string;
  pendingTasks?: number;
  overdueInvoices?: number;
}): AssistantContext {
  const {
    profile,
    organization,
    activeProject,
    activeEstimate,
    recentProjects,
    recentEstimates,
    currentRoute,
    pendingTasks,
    overdueInvoices,
  } = params;

  return {
    organization: buildOrganizationContext(organization),
    user: buildUserContext(profile),
    activeProject: activeProject ? buildProjectContext(activeProject) : undefined,
    activeEstimate: activeEstimate ? buildEstimateContext(activeEstimate) : undefined,
    recentActivity: buildActivityContext({
      recentProjects,
      recentEstimates,
      pendingTasks,
      overdueInvoices,
    }),
    currentPage: currentRoute ? buildPageContext(currentRoute) : undefined,
  };
}

/**
 * Build organization context
 */
export function buildOrganizationContext(
  organization?: Organization | null
): OrganizationContext {
  if (!organization) {
    return {
      orgId: '',
      name: 'Unknown Organization',
    };
  }

  // Organization.address is a string, try to parse location from it
  let location: OrganizationContext['location'];
  if (organization.address) {
    // Try to extract state from address string (e.g., "123 Main St, City, CA 12345")
    const stateMatch = organization.address.match(/,\s*([A-Z]{2})\s+\d{5}/);
    if (stateMatch) {
      location = { state: stateMatch[1] };
    }
  }

  return {
    orgId: organization.id,
    name: organization.name,
    location,
  };
}

/**
 * Build user context
 */
export function buildUserContext(profile?: UserProfile | null): UserContext {
  if (!profile) {
    return {
      userId: '',
      displayName: 'User',
      role: 'unknown',
    };
  }

  return {
    userId: profile.uid,
    displayName: profile.displayName || profile.email || 'User',
    role: profile.role || 'member',
    preferences: {
      timeZone: typeof window !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'America/Los_Angeles',
    },
  };
}

/**
 * Build project context
 */
export function buildProjectContext(project: Project): ProjectContext {
  return {
    projectId: project.id,
    name: project.name,
    type: project.scope || 'general',
    status: project.status,
    client: project.clientName ? { name: project.clientName } : undefined,
    address: project.address
      ? {
          city: project.address.city,
          state: project.address.state,
        }
      : undefined,
    budget: project.budget,
    startDate: project.startDate instanceof Date ? project.startDate : undefined,
    endDate: project.estimatedEndDate instanceof Date ? project.estimatedEndDate : undefined,
  };
}

/**
 * Build estimate context
 */
export function buildEstimateContext(estimate: Estimate): EstimateContext {
  // Calculate line item count and total
  const lineItemCount = estimate.lineItems?.length || 0;
  const totalAmount = estimate.total || 0;

  return {
    estimateId: estimate.id,
    name: estimate.name || `Estimate ${estimate.id.substring(0, 8)}`,
    totalAmount,
    lineItemCount,
    status: estimate.status || 'draft',
    lineItems: estimate.lineItems?.slice(0, 10).map(item => ({
      description: item.name || item.description || '',
      quantity: item.quantity,
      unitPrice: item.unitCost,
      total: item.totalCost,
    })),
  };
}

/**
 * Build activity context
 */
export function buildActivityContext(params: {
  recentProjects?: Project[];
  recentEstimates?: Estimate[];
  pendingTasks?: number;
  overdueInvoices?: number;
}): ActivityContext {
  const { recentProjects, recentEstimates, pendingTasks, overdueInvoices } = params;

  return {
    recentProjects:
      recentProjects?.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        lastAccessed: p.updatedAt instanceof Date ? p.updatedAt : new Date(),
      })) || [],
    recentEstimates:
      recentEstimates?.slice(0, 5).map(e => ({
        id: e.id,
        name: e.name || `Estimate ${e.id.substring(0, 8)}`,
        lastModified: e.updatedAt instanceof Date ? e.updatedAt : new Date(),
      })) || [],
    pendingTasks,
    overdueInvoices,
  };
}

/**
 * Build page context from route
 */
export function buildPageContext(route: string): PageContext {
  // Parse route to determine page name and params
  const segments = route.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  let pageName = 'Dashboard';

  if (segments.length === 0 || segments[0] === 'dashboard') {
    if (segments.length === 1 || segments.length === 0) {
      pageName = 'Dashboard Home';
    } else {
      const section = segments[1];

      // Map section to human-readable name
      const sectionNames: Record<string, string> = {
        projects: 'Projects',
        clients: 'Clients',
        team: 'Team',
        schedule: 'Schedule',
        time: 'Time Tracking',
        logs: 'Daily Logs',
        finances: 'Finances',
        payroll: 'Payroll',
        messaging: 'Messaging',
        reports: 'Reports',
        settings: 'Settings',
        estimates: 'Estimates',
        invoices: 'Invoices',
        materials: 'Materials',
        warranties: 'Warranties',
        permits: 'Permits',
        leads: 'Leads',
      };

      pageName = sectionNames[section] || section.charAt(0).toUpperCase() + section.slice(1);

      // Check for detail pages
      if (segments.length >= 3) {
        const id = segments[2];
        // Check if it looks like an ID (alphanumeric, certain length)
        if (/^[a-zA-Z0-9]{10,}$/.test(id)) {
          params.id = id;
          pageName = `${pageName} Detail`;
        } else {
          // Sub-section like /dashboard/settings/organization
          const subSection = segments[2];
          const subSectionNames: Record<string, string> = {
            organization: 'Organization Settings',
            templates: 'Templates',
            integrations: 'Integrations',
            notifications: 'Notifications',
            intelligence: 'AI Intelligence',
          };
          pageName = subSectionNames[subSection] || pageName;
        }
      }
    }
  } else if (segments[0] === 'client') {
    pageName = 'Client Portal';
  } else if (segments[0] === 'field') {
    pageName = 'Field Portal';
  } else if (segments[0] === 'sub') {
    pageName = 'Subcontractor Portal';
  }

  return {
    route,
    pageName,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
}

/**
 * Determine if context should include detailed project info
 */
export function shouldIncludeProjectDetails(route: string): boolean {
  return route.includes('/projects/') && /\/[a-zA-Z0-9]{10,}/.test(route);
}

/**
 * Determine if context should include detailed estimate info
 */
export function shouldIncludeEstimateDetails(route: string): boolean {
  return (
    route.includes('/estimates/') &&
    /\/[a-zA-Z0-9]{10,}/.test(route)
  );
}

/**
 * Get contextual suggestions based on current page
 */
export function getContextualSuggestions(route: string): string[] {
  const suggestions: Record<string, string[]> = {
    '/dashboard': [
      "What's my schedule for this week?",
      "Show me pending tasks",
      "What invoices are overdue?",
    ],
    '/dashboard/projects': [
      "Help me create a new project estimate",
      "What's the average profit margin on recent projects?",
    ],
    '/dashboard/estimates': [
      "What should I charge for a bathroom remodel?",
      "Review my current estimate totals",
      "Suggest line items for a kitchen renovation",
    ],
    '/dashboard/schedule': [
      "Any scheduling conflicts this week?",
      "What's the weather forecast for outdoor work?",
    ],
    '/dashboard/finances': [
      "What's my cash flow looking like?",
      "Show profitability by project type",
    ],
    '/dashboard/materials': [
      "What are current lumber prices?",
      "Show me price trends for steel",
    ],
  };

  // Find matching suggestions
  for (const [path, paths] of Object.entries(suggestions)) {
    if (route.startsWith(path)) {
      return paths;
    }
  }

  // Default suggestions
  return [
    "What can you help me with?",
    "Check material prices",
    "Help me create an estimate",
  ];
}
