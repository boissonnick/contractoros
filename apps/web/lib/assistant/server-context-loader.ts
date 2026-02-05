/**
 * Server-Side Context Loader for June AI Assistant
 *
 * Fetches organization-specific data for the AI assistant using
 * authenticated user's orgId. Enforces strict data isolation.
 *
 * SECURITY: All data is loaded using the verified orgId from auth token,
 * not from client-provided context. This prevents cross-org data leakage.
 */

import { Timestamp } from 'firebase-admin/firestore';

// Types for server context
export interface ServerContext {
  organization: OrganizationData | null;
  projects: ProjectsData;
  clients: ClientsData;
  estimates: EstimatesData;
  schedule: ScheduleData;
  financials: FinancialsData;
  team: TeamData;
  inventory: InventoryData;
}

export interface OrganizationData {
  id: string;
  name: string;
  location: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  industry: string;
  teamSize: number;
  primaryTrades: string[];
}

export interface ProjectsData {
  activeCount: number;
  totalCount: number;
  list: Array<{
    id: string;
    name: string;
    status: string;
    clientName?: string;
    budget?: number;
    completionPercent?: number;
    startDate?: Date;
    endDate?: Date;
  }>;
}

export interface ClientsData {
  activeCount: number;
  recent: Array<{
    id: string;
    name: string;
    status: string;
    lastContact?: Date;
    totalRevenue?: number;
    outstandingBalance?: number;
  }>;
  withOutstandingBalance: Array<{
    id: string;
    name: string;
    outstandingBalance: number;
  }>;
}

export interface EstimatesData {
  pendingCount: number;
  pending: Array<{
    id: string;
    name: string;
    status: string;
    clientName?: string;
    total?: number;
    expiresAt?: Date;
  }>;
}

export interface ScheduleData {
  upcomingCount: number;
  upcoming: Array<{
    id: string;
    title: string;
    type: string;
    startTime?: Date;
    endTime?: Date;
    projectName?: string;
    assignedTo?: string[];
  }>;
  todayEvents: number;
  weekEvents: number;
}

export interface FinancialsData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  pendingInvoices: number;
  overdueInvoices: number;
  pendingPayments: number;
  overdueAmount: number;
}

export interface TeamData {
  totalMembers: number;
  members: Array<{
    id: string;
    name: string;
    role: string;
    email?: string;
  }>;
  roleBreakdown: Record<string, number>;
}

export interface InventoryData {
  lowStockAlerts: number;
  totalMaterials: number;
  recentOrders: number;
}

/**
 * Load complete server-side context for the AI assistant
 */
export async function loadServerContext(
  orgId: string,
  _userId: string
): Promise<ServerContext> {
  // Dynamic import to avoid bundling firebase-admin in client
  const { getFirestore } = await import('firebase-admin/firestore');
  const { initializeAdminApp } = await import('./firebase-admin-init');

  // Ensure Firebase Admin is initialized
  await initializeAdminApp();
  const db = getFirestore();

  // Parallel fetch for performance
  const [
    organization,
    projects,
    clients,
    estimates,
    schedule,
    financials,
    team,
    inventory,
  ] = await Promise.all([
    loadOrganization(db, orgId),
    loadProjects(db, orgId),
    loadClients(db, orgId),
    loadEstimates(db, orgId),
    loadSchedule(db, orgId),
    loadFinancials(db, orgId),
    loadTeam(db, orgId),
    loadInventory(db, orgId),
  ]);

  return {
    organization,
    projects,
    clients,
    estimates,
    schedule,
    financials,
    team,
    inventory,
  };
}

/**
 * Load organization details
 */
async function loadOrganization(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<OrganizationData | null> {
  try {
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    if (!orgDoc.exists) return null;

    const org = orgDoc.data()!;

    // Count team members
    const membersSnap = await db
      .collection('users')
      .where('orgId', '==', orgId)
      .where('status', '==', 'active')
      .count()
      .get();

    return {
      id: orgId,
      name: org.name || 'Unknown Organization',
      location: {
        city: org.city,
        state: org.state,
        zipCode: org.zip,
      },
      industry: org.industry || 'general_contracting',
      teamSize: membersSnap.data().count || 0,
      primaryTrades: org.trades || [],
    };
  } catch (error) {
    console.error('[ServerContext] Error loading organization:', error);
    return null;
  }
}

/**
 * Load active projects
 */
async function loadProjects(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<ProjectsData> {
  try {
    // Get active projects
    const activeQuery = db
      .collection('projects')
      .where('orgId', '==', orgId)
      .where('status', 'in', ['active', 'in_progress', 'planning'])
      .orderBy('updatedAt', 'desc')
      .limit(20);

    const [activeSnap, totalSnap] = await Promise.all([
      activeQuery.get(),
      db.collection('projects').where('orgId', '==', orgId).count().get(),
    ]);

    const list = activeSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        status: data.status,
        clientName: data.clientName,
        budget: data.budget,
        completionPercent: data.completionPercent,
        startDate: data.startDate?.toDate?.(),
        endDate: data.endDate?.toDate?.(),
      };
    });

    return {
      activeCount: activeSnap.size,
      totalCount: totalSnap.data().count || 0,
      list,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading projects:', error);
    return { activeCount: 0, totalCount: 0, list: [] };
  }
}

/**
 * Load client data
 */
async function loadClients(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<ClientsData> {
  try {
    const clientsRef = db.collection(`organizations/${orgId}/clients`);

    // Get recent active clients
    const recentQuery = clientsRef
      .where('status', '==', 'active')
      .orderBy('updatedAt', 'desc')
      .limit(15);

    const [recentSnap, countSnap] = await Promise.all([
      recentQuery.get(),
      clientsRef.where('status', '==', 'active').count().get(),
    ]);

    const recent = recentSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        status: data.status,
        lastContact: data.lastContactDate?.toDate?.(),
        totalRevenue: data.financials?.totalRevenue || 0,
        outstandingBalance: data.financials?.outstandingBalance || 0,
      };
    });

    // Filter clients with outstanding balance
    const withOutstandingBalance = recent
      .filter((c) => c.outstandingBalance > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        outstandingBalance: c.outstandingBalance!,
      }));

    return {
      activeCount: countSnap.data().count || 0,
      recent,
      withOutstandingBalance,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading clients:', error);
    return { activeCount: 0, recent: [], withOutstandingBalance: [] };
  }
}

/**
 * Load pending estimates
 */
async function loadEstimates(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<EstimatesData> {
  try {
    const estimatesQuery = db
      .collection('estimates')
      .where('orgId', '==', orgId)
      .where('status', 'in', ['draft', 'pending', 'sent'])
      .orderBy('updatedAt', 'desc')
      .limit(15);

    const snap = await estimatesQuery.get();

    const pending = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        status: data.status,
        clientName: data.clientName,
        total: data.total,
        expiresAt: data.expiresAt?.toDate?.(),
      };
    });

    return {
      pendingCount: snap.size,
      pending,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading estimates:', error);
    return { pendingCount: 0, pending: [] };
  }
}

/**
 * Load upcoming schedule events
 */
async function loadSchedule(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<ScheduleData> {
  try {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const scheduleRef = db.collection(`organizations/${orgId}/scheduleEvents`);

    // Get upcoming week's events
    const weekQuery = scheduleRef
      .where('startTime', '>=', Timestamp.fromDate(now))
      .where('startTime', '<=', Timestamp.fromDate(weekFromNow))
      .orderBy('startTime')
      .limit(25);

    const weekSnap = await weekQuery.get();

    const upcoming = weekSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.eventType || data.type || 'event',
        startTime: data.startTime?.toDate?.(),
        endTime: data.endTime?.toDate?.(),
        projectName: data.projectName,
        assignedTo: data.assignedUsers?.map((u: any) => u.name || u.displayName),
      };
    });

    // Count today's events
    const todayEvents = upcoming.filter((e) => {
      if (!e.startTime) return false;
      return e.startTime <= endOfToday;
    }).length;

    return {
      upcomingCount: weekSnap.size,
      upcoming,
      todayEvents,
      weekEvents: weekSnap.size,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading schedule:', error);
    return { upcomingCount: 0, upcoming: [], todayEvents: 0, weekEvents: 0 };
  }
}

/**
 * Load financial summary
 */
async function loadFinancials(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<FinancialsData> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const invoicesRef = db.collection(`organizations/${orgId}/invoices`);
    const expensesRef = db.collection(`organizations/${orgId}/expenses`);

    // Get this month's data
    const [invoicesSnap, expensesSnap] = await Promise.all([
      invoicesRef
        .where('date', '>=', Timestamp.fromDate(startOfMonth))
        .get(),
      expensesRef
        .where('date', '>=', Timestamp.fromDate(startOfMonth))
        .get(),
    ]);

    let monthlyRevenue = 0;
    let monthlyExpenses = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let overdueAmount = 0;

    invoicesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const total = data.total || 0;

      if (data.status === 'paid') {
        monthlyRevenue += total;
      } else if (data.status === 'pending' || data.status === 'sent') {
        pendingInvoices++;
        const dueDate = data.dueDate?.toDate?.();
        if (dueDate && dueDate < now) {
          overdueInvoices++;
          overdueAmount += total;
        }
      }
    });

    expensesSnap.docs.forEach((doc) => {
      const data = doc.data();
      monthlyExpenses += data.amount || 0;
    });

    // Get pending payments count
    const pendingPaymentsSnap = await db
      .collection(`organizations/${orgId}/payments`)
      .where('status', '==', 'pending')
      .count()
      .get();

    return {
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      pendingInvoices,
      overdueInvoices,
      pendingPayments: pendingPaymentsSnap.data().count || 0,
      overdueAmount,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading financials:', error);
    return {
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      monthlyProfit: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      pendingPayments: 0,
      overdueAmount: 0,
    };
  }
}

/**
 * Load team members
 */
async function loadTeam(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<TeamData> {
  try {
    const usersQuery = db
      .collection('users')
      .where('orgId', '==', orgId)
      .where('status', '==', 'active')
      .limit(50);

    const snap = await usersQuery.get();

    const members = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.name || 'Unknown',
        role: data.role || 'EMPLOYEE',
        email: data.email,
      };
    });

    // Calculate role breakdown
    const roleBreakdown: Record<string, number> = {};
    members.forEach((m) => {
      roleBreakdown[m.role] = (roleBreakdown[m.role] || 0) + 1;
    });

    return {
      totalMembers: snap.size,
      members,
      roleBreakdown,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading team:', error);
    return { totalMembers: 0, members: [], roleBreakdown: {} };
  }
}

/**
 * Load inventory/materials summary
 */
async function loadInventory(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<InventoryData> {
  try {
    const [lowStockSnap, materialsSnap] = await Promise.all([
      db
        .collection(`organizations/${orgId}/lowStockAlerts`)
        .where('resolved', '==', false)
        .count()
        .get(),
      db.collection(`organizations/${orgId}/materials`).count().get(),
    ]);

    // Get recent purchase orders
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrdersSnap = await db
      .collection(`organizations/${orgId}/purchaseOrders`)
      .where('createdAt', '>=', Timestamp.fromDate(weekAgo))
      .count()
      .get();

    return {
      lowStockAlerts: lowStockSnap.data().count || 0,
      totalMaterials: materialsSnap.data().count || 0,
      recentOrders: recentOrdersSnap.data().count || 0,
    };
  } catch (error) {
    console.error('[ServerContext] Error loading inventory:', error);
    return { lowStockAlerts: 0, totalMaterials: 0, recentOrders: 0 };
  }
}
