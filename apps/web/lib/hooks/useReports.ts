"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================
// Core Report Data Types
// ============================================

export interface LaborCostData {
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  totalMinutes: number;
  totalCost: number;
}

export interface ProjectPnLData {
  projectId: string;
  projectName: string;
  budget: number;
  actualSpend: number;
  laborCost: number;
  variance: number;
}

export interface ProductivityData {
  userId: string;
  userName: string;
  tasksCompleted: number;
  tasksTotal: number;
  totalHours: number;
  completionRate: number;
}

// ============================================
// Dashboard KPI Types
// ============================================

export interface DashboardKPIs {
  // Project KPIs
  activeProjects: number;
  completedProjects: number;
  totalProjectValue: number;
  averageProjectValue: number;
  // Financial KPIs
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  outstandingInvoices: number;
  // Team KPIs
  activeTeamMembers: number;
  hoursLoggedThisMonth: number;
  averageHoursPerMember: number;
  // Task KPIs
  openTasks: number;
  completedTasksThisMonth: number;
  taskCompletionRate: number;
}

export interface TrendDataPoint {
  name: string; // Month/Week label
  value: number;
  previousValue?: number;
}

export interface ProjectStatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RevenueByMonth {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TeamPerformance {
  name: string;
  hoursLogged: number;
  tasksCompleted: number;
  efficiency: number;
}

// ============================================
// Dashboard Aggregation Types
// ============================================

export interface DashboardData {
  kpis: DashboardKPIs;
  projectStatusDistribution: ProjectStatusDistribution[];
  revenueByMonth: RevenueByMonth[];
  teamPerformance: TeamPerformance[];
  recentActivity: ActivityItem[];
  loading: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'task' | 'invoice' | 'time' | 'expense';
  message: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

// Status colors for charts
const STATUS_COLORS: Record<string, string> = {
  planning: '#3B82F6',    // Blue
  bidding: '#8B5CF6',     // Purple
  active: '#10B981',      // Green
  on_hold: '#F59E0B',     // Amber
  completed: '#6B7280',   // Gray
  cancelled: '#EF4444',   // Red
};

export function useReports(orgId?: string) {
  const [loading, setLoading] = useState(false);

  const fetchLaborCosts = useCallback(async (startDate: Date, endDate: Date): Promise<LaborCostData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      const entriesSnap = await getDocs(query(
        collection(db, `organizations/${orgId}/timeEntries`),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));
      const projectsSnap = await getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId)));

      const userMap = new Map<string, { name: string; rate: number }>();
      usersSnap.docs.forEach(d => {
        const data = d.data();
        if (data.orgId === orgId) userMap.set(d.id, { name: data.displayName || 'Unknown', rate: data.hourlyRate || 0 });
      });

      const projectMap = new Map<string, string>();
      projectsSnap.docs.forEach(d => projectMap.set(d.id, d.data().name || 'Unknown'));

      const aggregated = new Map<string, LaborCostData>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        if (!userMap.has(data.userId)) return;
        const key = `${data.userId}_${data.projectId}`;
        const existing = aggregated.get(key) || {
          userId: data.userId,
          userName: userMap.get(data.userId)?.name || 'Unknown',
          projectId: data.projectId,
          projectName: projectMap.get(data.projectId) || 'Unknown',
          totalMinutes: 0,
          totalCost: 0,
        };
        existing.totalMinutes += data.totalMinutes || 0;
        existing.totalCost += ((data.totalMinutes || 0) / 60) * (userMap.get(data.userId)?.rate || 0);
        aggregated.set(key, existing);
      });

      return Array.from(aggregated.values());
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchProjectPnL = useCallback(async (startDate: Date, endDate: Date): Promise<ProjectPnLData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      const projectsSnap = await getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId)));
      const entriesSnap = await getDocs(query(
        collection(db, `organizations/${orgId}/timeEntries`),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));

      // Fetch expenses from org-scoped collection
      const expensesSnap = await getDocs(query(
        collection(db, `organizations/${orgId}/expenses`),
        where('status', '==', 'approved')
      ));

      const userRates = new Map<string, number>();
      usersSnap.docs.forEach(d => userRates.set(d.id, d.data().hourlyRate || 0));

      const laborByProject = new Map<string, number>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        const cost = ((data.totalMinutes || 0) / 60) * (userRates.get(data.userId) || 0);
        laborByProject.set(data.projectId, (laborByProject.get(data.projectId) || 0) + cost);
      });

      // Sum expenses by project
      const expensesByProject = new Map<string, number>();
      expensesSnap.docs.forEach(d => {
        const data = d.data();
        const projectId = data.projectId as string;
        const amount = (data.amount as number) || 0;
        if (projectId) {
          expensesByProject.set(projectId, (expensesByProject.get(projectId) || 0) + amount);
        }
      });

      return projectsSnap.docs.map(d => {
        const data = d.data();
        const budget = data.budget || 0;
        const laborCost = laborByProject.get(d.id) || 0;
        const expenseCost = expensesByProject.get(d.id) || 0;
        // Actual spend = labor cost + expenses (materials, equipment, etc.)
        const actualSpend = laborCost + expenseCost;
        return {
          projectId: d.id,
          projectName: data.name || 'Unknown',
          budget,
          actualSpend,
          laborCost,
          variance: budget - actualSpend,
        };
      });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchProductivity = useCallback(async (startDate: Date, endDate: Date): Promise<ProductivityData[]> => {
    if (!orgId) return [];
    setLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)));
      const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId)));
      const entriesSnap = await getDocs(query(
        collection(db, `organizations/${orgId}/timeEntries`),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      ));

      const hoursByUser = new Map<string, number>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        hoursByUser.set(data.userId, (hoursByUser.get(data.userId) || 0) + (data.totalMinutes || 0) / 60);
      });

      return usersSnap.docs
        .filter(d => ['EMPLOYEE', 'CONTRACTOR', 'SUB'].includes(d.data().role))
        .map(d => {
          const data = d.data();
          const uid = d.id;
          const userTasks = tasksSnap.docs.filter(t => (t.data().assignedTo || []).includes(uid));
          const completed = userTasks.filter(t => t.data().status === 'completed').length;
          return {
            userId: uid,
            userName: data.displayName || 'Unknown',
            tasksCompleted: completed,
            tasksTotal: userTasks.length,
            totalHours: hoursByUser.get(uid) || 0,
            completionRate: userTasks.length > 0 ? (completed / userTasks.length) * 100 : 0,
          };
        });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  return { loading, fetchLaborCosts, fetchProjectPnL, fetchProductivity };
}

// ============================================
// Dashboard Reports Hook
// ============================================

export function useDashboardReports(orgId?: string) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [projectStatusDistribution, setProjectStatusDistribution] = useState<ProjectStatusDistribution[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch all required data in parallel
      const [projectsSnap, usersSnap, tasksSnap, timeEntriesSnap, expensesSnap, invoicesSnap] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'users'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, `organizations/${orgId}/timeEntries`))),
        getDocs(query(collection(db, `organizations/${orgId}/expenses`))),
        getDocs(query(collection(db, `organizations/${orgId}/invoices`))),
      ]);

      // Process projects
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; status?: string; budget?: number; name?: string }>;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const totalProjectValue = projects.reduce((sum, p) => sum + ((p as { budget?: number }).budget || 0), 0);

      // Project status distribution for pie chart
      const statusCounts: Record<string, number> = {};
      projects.forEach(p => {
        const status = (p as { status?: string }).status || 'planning';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const distribution: ProjectStatusDistribution[] = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value,
        color: STATUS_COLORS[name] || '#6B7280',
      }));
      setProjectStatusDistribution(distribution);

      // Process users/team
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activeTeamMembers = users.filter(u => (u as { status?: string }).status !== 'inactive').length;

      // Process tasks
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const openTasks = tasks.filter(t => !['completed', 'cancelled'].includes((t as { status?: string }).status || '')).length;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedTasksThisMonth = tasks.filter(t => {
        const status = (t as { status?: string }).status;
        const completedAt = (t as { completedAt?: { toDate: () => Date } }).completedAt;
        return status === 'completed' && completedAt && completedAt.toDate() >= startOfMonth;
      }).length;
      const taskCompletionRate = tasks.length > 0
        ? (tasks.filter(t => (t as { status?: string }).status === 'completed').length / tasks.length) * 100
        : 0;

      // Process time entries
      const timeEntries = timeEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const hoursLoggedThisMonth = timeEntries
        .filter(e => {
          const clockIn = (e as { clockIn?: { toDate: () => Date } }).clockIn;
          return clockIn && clockIn.toDate() >= startOfMonth;
        })
        .reduce((sum, e) => sum + (((e as { totalMinutes?: number }).totalMinutes || 0) / 60), 0);

      // Process expenses
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalExpenses = expenses
        .filter(e => (e as { status?: string }).status === 'approved')
        .reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);

      // Process invoices
      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalRevenue = invoices
        .filter(i => (i as { status?: string }).status === 'paid')
        .reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);
      const outstandingInvoices = invoices
        .filter(i => ['sent', 'viewed', 'overdue'].includes((i as { status?: string }).status || ''))
        .reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);

      // Calculate KPIs
      const calculatedKpis: DashboardKPIs = {
        activeProjects,
        completedProjects,
        totalProjectValue,
        averageProjectValue: projects.length > 0 ? totalProjectValue / projects.length : 0,
        totalRevenue,
        totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
        outstandingInvoices,
        activeTeamMembers,
        hoursLoggedThisMonth,
        averageHoursPerMember: activeTeamMembers > 0 ? hoursLoggedThisMonth / activeTeamMembers : 0,
        openTasks,
        completedTasksThisMonth,
        taskCompletionRate,
      };
      setKpis(calculatedKpis);

      // Generate revenue by month (last 6 months)
      const revenueData: RevenueByMonth[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });

        const monthRevenue = invoices
          .filter(inv => {
            const paidAt = (inv as { paidAt?: { toDate: () => Date } }).paidAt;
            if (!paidAt || (inv as { status?: string }).status !== 'paid') return false;
            const date = paidAt.toDate();
            return date >= monthDate && date <= monthEnd;
          })
          .reduce((sum, inv) => sum + ((inv as { total?: number }).total || 0), 0);

        const monthExpenses = expenses
          .filter(exp => {
            const createdAt = (exp as { createdAt?: { toDate: () => Date } }).createdAt;
            if (!createdAt || (exp as { status?: string }).status !== 'approved') return false;
            const date = createdAt.toDate();
            return date >= monthDate && date <= monthEnd;
          })
          .reduce((sum, exp) => sum + ((exp as { amount?: number }).amount || 0), 0);

        revenueData.push({
          name: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        });
      }
      setRevenueByMonth(revenueData);

      // Team performance
      const teamData: TeamPerformance[] = users
        .filter(u => ['EMPLOYEE', 'CONTRACTOR', 'PM'].includes((u as { role?: string }).role || ''))
        .slice(0, 10) // Limit to top 10 for chart
        .map(u => {
          const userId = (u as { id: string }).id;
          const userName = (u as { displayName?: string }).displayName || 'Unknown';

          const userHours = timeEntries
            .filter(e => (e as { userId?: string }).userId === userId)
            .reduce((sum, e) => sum + (((e as { totalMinutes?: number }).totalMinutes || 0) / 60), 0);

          const userTasksCompleted = tasks
            .filter(t =>
              ((t as { assignedTo?: string[] }).assignedTo || []).includes(userId) &&
              (t as { status?: string }).status === 'completed'
            ).length;

          const userTasksTotal = tasks
            .filter(t => ((t as { assignedTo?: string[] }).assignedTo || []).includes(userId)).length;

          return {
            name: userName.split(' ')[0], // First name only for chart
            hoursLogged: Math.round(userHours),
            tasksCompleted: userTasksCompleted,
            efficiency: userTasksTotal > 0 ? Math.round((userTasksCompleted / userTasksTotal) * 100) : 0,
          };
        })
        .filter(t => t.hoursLogged > 0 || t.tasksCompleted > 0); // Only include active members

      setTeamPerformance(teamData);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Fetch on mount and when orgId changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    error,
    kpis,
    projectStatusDistribution,
    revenueByMonth,
    teamPerformance,
    refetch: fetchDashboardData,
  };
}

// ============================================
// Financial Reports Hook
// ============================================

export interface FinancialSummary {
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  cashFlow: number;
}

export interface ExpenseByCategory {
  name: string;
  value: number;
  color: string;
}

export interface InvoiceAging {
  name: string;
  amount: number;
  count: number;
}

export function useFinancialReports(orgId?: string) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [invoiceAging, setInvoiceAging] = useState<InvoiceAging[]>([]);
  const [projectProfitability, setProjectProfitability] = useState<ProjectPnLData[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const CATEGORY_COLORS: Record<string, string> = {
    materials: '#3B82F6',
    labor: '#10B981',
    equipment: '#F59E0B',
    subcontractor: '#8B5CF6',
    permits: '#EC4899',
    other: '#6B7280',
  };

  const fetchFinancialData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const [projectsSnap, expensesSnap, invoicesSnap, timeEntriesSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, `organizations/${orgId}/expenses`))),
        getDocs(query(collection(db, `organizations/${orgId}/invoices`))),
        getDocs(query(collection(db, `organizations/${orgId}/timeEntries`))),
        getDocs(query(collection(db, 'users'), where('orgId', '==', orgId))),
      ]);

      // Process user rates for labor cost calculation
      const userRates = new Map<string, number>();
      usersSnap.docs.forEach(d => {
        const data = d.data();
        userRates.set(d.id, data.hourlyRate || 0);
      });

      // Calculate labor costs by project
      const laborByProject = new Map<string, number>();
      timeEntriesSnap.docs.forEach(d => {
        const data = d.data();
        const cost = ((data.totalMinutes || 0) / 60) * (userRates.get(data.userId) || 0);
        laborByProject.set(data.projectId, (laborByProject.get(data.projectId) || 0) + cost);
      });

      // Process expenses
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const approvedExpenses = expenses.filter(e => (e as { status?: string }).status === 'approved');

      // Expenses by category
      const categoryTotals: Record<string, number> = {};
      approvedExpenses.forEach(e => {
        const category = (e as { category?: string }).category || 'other';
        const amount = (e as { amount?: number }).amount || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
      const categoryData: ExpenseByCategory[] = Object.entries(categoryTotals).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CATEGORY_COLORS[name] || '#6B7280',
      }));
      setExpensesByCategory(categoryData);

      // Process invoices
      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalRevenue = invoices
        .filter(i => (i as { status?: string }).status === 'paid')
        .reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);

      // Invoice aging
      const now = new Date();
      const aging: Record<string, { amount: number; count: number }> = {
        'Current': { amount: 0, count: 0 },
        '1-30 Days': { amount: 0, count: 0 },
        '31-60 Days': { amount: 0, count: 0 },
        '61-90 Days': { amount: 0, count: 0 },
        '90+ Days': { amount: 0, count: 0 },
      };

      invoices
        .filter(i => ['sent', 'viewed', 'overdue'].includes((i as { status?: string }).status || ''))
        .forEach(inv => {
          const dueDate = (inv as { dueDate?: { toDate: () => Date } }).dueDate;
          const amount = (inv as { total?: number }).total || 0;
          if (!dueDate) {
            aging['Current'].amount += amount;
            aging['Current'].count += 1;
            return;
          }
          const daysPast = Math.floor((now.getTime() - dueDate.toDate().getTime()) / (1000 * 60 * 60 * 24));
          if (daysPast <= 0) {
            aging['Current'].amount += amount;
            aging['Current'].count += 1;
          } else if (daysPast <= 30) {
            aging['1-30 Days'].amount += amount;
            aging['1-30 Days'].count += 1;
          } else if (daysPast <= 60) {
            aging['31-60 Days'].amount += amount;
            aging['31-60 Days'].count += 1;
          } else if (daysPast <= 90) {
            aging['61-90 Days'].amount += amount;
            aging['61-90 Days'].count += 1;
          } else {
            aging['90+ Days'].amount += amount;
            aging['90+ Days'].count += 1;
          }
        });

      const agingData: InvoiceAging[] = Object.entries(aging).map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
      }));
      setInvoiceAging(agingData);

      // Project profitability
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const expensesByProject = new Map<string, number>();
      approvedExpenses.forEach(e => {
        const projectId = (e as { projectId?: string }).projectId;
        const amount = (e as { amount?: number }).amount || 0;
        if (projectId) {
          expensesByProject.set(projectId, (expensesByProject.get(projectId) || 0) + amount);
        }
      });

      const profitability: ProjectPnLData[] = projects.map(p => {
        const projectId = (p as { id: string }).id;
        const budget = (p as { budget?: number }).budget || 0;
        const laborCost = laborByProject.get(projectId) || 0;
        const expenseCost = expensesByProject.get(projectId) || 0;
        const actualSpend = laborCost + expenseCost;

        return {
          projectId,
          projectName: (p as { name?: string }).name || 'Unknown',
          budget,
          actualSpend,
          laborCost,
          variance: budget - actualSpend,
        };
      });
      setProjectProfitability(profitability);

      // Financial summary
      const totalBudget = projects.reduce((sum, p) => sum + ((p as { budget?: number }).budget || 0), 0);
      const totalLabor = Array.from(laborByProject.values()).reduce((sum, v) => sum + v, 0);
      const totalMaterialExpenses = approvedExpenses.reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);
      const totalSpent = totalLabor + totalMaterialExpenses;
      const grossProfit = totalRevenue - totalSpent;

      setSummary({
        totalBudget,
        totalSpent,
        totalRevenue,
        grossProfit,
        profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        cashFlow: totalRevenue - totalSpent,
      });

    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    loading,
    error,
    summary,
    expensesByCategory,
    invoiceAging,
    projectProfitability,
    refetch: fetchFinancialData,
  };
}

// ============================================
// Operational Reports Hook
// ============================================

export interface OperationalMetrics {
  averageProjectDuration: number; // days
  onTimeCompletionRate: number;
  averageTasksPerProject: number;
  resourceUtilization: number;
  activeSubcontractors: number;
  pendingChangeOrders: number;
}

export interface ProjectTimeline {
  name: string;
  planned: number; // days
  actual: number; // days
  status: string;
}

export function useOperationalReports(orgId?: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [projectTimelines, setProjectTimelines] = useState<ProjectTimeline[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [hoursbyProject, setHoursByProject] = useState<{ name: string; hours: number }[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const TASK_STATUS_COLORS: Record<string, string> = {
    todo: '#3B82F6',
    in_progress: '#F59E0B',
    blocked: '#EF4444',
    review: '#8B5CF6',
    completed: '#10B981',
  };

  const fetchOperationalData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const [projectsSnap, tasksSnap, timeEntriesSnap, subsSnap, changeOrdersSnap] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, `organizations/${orgId}/timeEntries`))),
        getDocs(query(collection(db, `organizations/${orgId}/subcontractors`))),
        getDocs(query(collection(db, `organizations/${orgId}/changeOrders`))),
      ]);

      // Process projects
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const completedProjects = projects.filter(p => (p as { status?: string }).status === 'completed');

      // Calculate average project duration
      let totalDuration = 0;
      let onTimeCount = 0;
      const timelines: ProjectTimeline[] = [];

      completedProjects.forEach(p => {
        const startDate = (p as { startDate?: { toDate: () => Date } }).startDate;
        const endDate = (p as { endDate?: { toDate: () => Date } }).endDate;
        const plannedEndDate = (p as { plannedEndDate?: { toDate: () => Date } }).plannedEndDate;

        if (startDate && endDate) {
          const duration = Math.ceil((endDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24));
          totalDuration += duration;

          if (plannedEndDate && endDate.toDate() <= plannedEndDate.toDate()) {
            onTimeCount++;
          }
        }
      });

      // Project timelines for chart (active projects)
      projects
        .filter(p => (p as { status?: string }).status === 'active')
        .slice(0, 8)
        .forEach(p => {
          const startDate = (p as { startDate?: { toDate: () => Date } }).startDate;
          const plannedEndDate = (p as { plannedEndDate?: { toDate: () => Date } }).plannedEndDate;
          const now = new Date();

          if (startDate) {
            const plannedDays = plannedEndDate
              ? Math.ceil((plannedEndDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const actualDays = Math.ceil((now.getTime() - startDate.toDate().getTime()) / (1000 * 60 * 60 * 24));

            timelines.push({
              name: ((p as { name?: string }).name || 'Unknown').substring(0, 15),
              planned: plannedDays,
              actual: actualDays,
              status: (p as { status?: string }).status || 'active',
            });
          }
        });
      setProjectTimelines(timelines);

      // Process tasks
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const taskStatusCounts: Record<string, number> = {};
      tasks.forEach(t => {
        const status = (t as { status?: string }).status || 'todo';
        taskStatusCounts[status] = (taskStatusCounts[status] || 0) + 1;
      });
      const tasksByStatusData = Object.entries(taskStatusCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
        value,
        color: TASK_STATUS_COLORS[name] || '#6B7280',
      }));
      setTasksByStatus(tasksByStatusData);

      // Process time entries by project
      const timeEntries = timeEntriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const hoursByProjectMap = new Map<string, { name: string; hours: number }>();

      // Create project ID to name map
      const projectNameMap = new Map<string, string>();
      projects.forEach(p => {
        projectNameMap.set((p as { id: string }).id, (p as { name?: string }).name || 'Unknown');
      });

      timeEntries.forEach(e => {
        const projectId = (e as { projectId?: string }).projectId;
        const minutes = (e as { totalMinutes?: number }).totalMinutes || 0;
        if (projectId) {
          const existing = hoursByProjectMap.get(projectId);
          if (existing) {
            existing.hours += minutes / 60;
          } else {
            hoursByProjectMap.set(projectId, {
              name: (projectNameMap.get(projectId) || 'Unknown').substring(0, 12),
              hours: minutes / 60,
            });
          }
        }
      });
      const hoursData = Array.from(hoursByProjectMap.values())
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 8)
        .map(h => ({ ...h, hours: Math.round(h.hours) }));
      setHoursByProject(hoursData);

      // Process subcontractors
      const subs = subsSnap.docs.filter(d => (d.data() as { status?: string }).status === 'active');

      // Process change orders
      const changeOrders = changeOrdersSnap.docs.filter(d =>
        (d.data() as { status?: string }).status === 'pending'
      );

      // Calculate metrics
      setMetrics({
        averageProjectDuration: completedProjects.length > 0 ? totalDuration / completedProjects.length : 0,
        onTimeCompletionRate: completedProjects.length > 0 ? (onTimeCount / completedProjects.length) * 100 : 0,
        averageTasksPerProject: projects.length > 0 ? tasks.length / projects.length : 0,
        resourceUtilization: 0, // Would need capacity data to calculate
        activeSubcontractors: subs.length,
        pendingChangeOrders: changeOrders.length,
      });

    } catch (err) {
      console.error('Failed to fetch operational data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOperationalData();
  }, [fetchOperationalData]);

  return {
    loading,
    error,
    metrics,
    projectTimelines,
    tasksByStatus,
    hoursbyProject,
    refetch: fetchOperationalData,
  };
}
