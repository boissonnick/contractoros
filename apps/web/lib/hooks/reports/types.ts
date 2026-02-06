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

// ============================================
// Financial Report Types
// ============================================

export interface FinancialSummary {
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  cashFlow: number;
  // Enhanced P&L fields
  laborCosts: number;
  materialCosts: number;
  subcontractorCosts: number;
  equipmentCosts: number;
  overheadCosts: number;
  directCosts: number;
  netProfit: number;
  netMargin: number;
}

export interface RevenueByProject {
  projectId: string;
  projectName: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
}

export interface RevenueByClient {
  clientId: string;
  clientName: string;
  revenue: number;
  invoiceCount: number;
}

export interface RevenueByMonthData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
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

// ============================================
// Operational Report Types
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

// ============================================
// Constants
// ============================================

export const STATUS_COLORS: Record<string, string> = {
  planning: '#3B82F6',    // Blue
  bidding: '#8B5CF6',     // Purple
  active: '#10B981',      // Green
  on_hold: '#F59E0B',     // Amber
  completed: '#6B7280',   // Gray
  cancelled: '#EF4444',   // Red
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#3B82F6',
  in_progress: '#F59E0B',
  blocked: '#EF4444',
  review: '#8B5CF6',
  completed: '#10B981',
};

// ============================================
// Balance Sheet Types
// ============================================

export interface ARAgingBucket {
  label: string;
  amount: number;
  count: number;
}

export interface BalanceSheetData {
  asOfDate: Date;
  assets: {
    cashPosition: number;
    accountsReceivable: number;
    arAging: ARAgingBucket[];
    equipmentValue: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    accruedExpenses: number;
    payrollLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    retainedEarnings: number;
    ownersEquity: number;
    totalEquity: number;
  };
}

// ============================================
// Cash Flow Statement Types
// ============================================

export interface CashFlowStatementData {
  periodStart: Date;
  periodEnd: Date;
  operating: {
    collectionsFromCustomers: number;
    paymentsForMaterials: number;
    paymentsForLabor: number;
    paymentsToSubcontractors: number;
    otherOperatingPayments: number;
    changeInAR: number;
    changeInAP: number;
    netOperatingCashFlow: number;
  };
  investing: {
    equipmentPurchases: number;
    toolPurchases: number;
    netInvestingCashFlow: number;
  };
  financing: {
    ownerContributions: number;
    ownerDraws: number;
    netFinancingCashFlow: number;
  };
  netChangeInCash: number;
  beginningCashBalance: number;
  endingCashBalance: number;
}

// ============================================
// Report Template Types
// ============================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'financial' | 'operational' | 'executive';
  href: string;
  datePreset?: string;
  isNew?: boolean;
}

// ============================================
// Constants
// ============================================

export const CATEGORY_COLORS: Record<string, string> = {
  materials: '#3B82F6',
  labor: '#10B981',
  equipment: '#F59E0B',
  equipment_rental: '#F59E0B',
  subcontractor: '#8B5CF6',
  permits: '#EC4899',
  fuel: '#EF4444',
  vehicle: '#06B6D4',
  office: '#6366F1',
  travel: '#D946EF',
  other: '#6B7280',
};
