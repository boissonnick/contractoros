/**
 * Reminder Generator Utility
 * Generates contextual reminders based on project data
 */

export interface Reminder {
  id: string;
  type: ReminderType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  dueDate?: Date;
  generatedAt: Date;
  dismissible: boolean;
}

export type ReminderType =
  | 'overdue-invoice'
  | 'upcoming-deadline'
  | 'stale-task'
  | 'pending-approval'
  | 'expiring-document'
  | 'overdue-payment'
  | 'incomplete-daily-log'
  | 'unsigned-document'
  | 'budget-alert'
  | 'crew-availability'
  | 'weather-alert'
  | 'inspection-due'
  | 'milestone-approaching';

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  projectId?: string;
  projectName?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  assignedTo?: string;
  projectId?: string;
  projectName?: string;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'change-order' | 'permit' | 'insurance' | 'license';
  expirationDate?: Date;
  requiresSignature: boolean;
  signedAt?: Date;
  projectId?: string;
}

export interface Deadline {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'inspection' | 'permit' | 'payment' | 'delivery';
  projectId?: string;
  projectName?: string;
}

export interface DailyLog {
  id: string;
  date: Date;
  projectId: string;
  projectName: string;
  completed: boolean;
}

export interface ProjectData {
  invoices?: Invoice[];
  tasks?: Task[];
  documents?: Document[];
  deadlines?: Deadline[];
  dailyLogs?: DailyLog[];
  budgetAlerts?: { projectId: string; projectName: string; message: string; severity: string }[];
}

const STALE_TASK_DAYS = 7;
const UPCOMING_DEADLINE_DAYS = 7;
const EXPIRING_DOCUMENT_DAYS = 30;

/**
 * Generate a unique reminder ID
 */
function generateReminderId(type: ReminderType, entityId: string): string {
  return `${type}-${entityId}`;
}

/**
 * Check overdue invoices and generate reminders
 */
function checkOverdueInvoices(invoices: Invoice[], now: Date): Reminder[] {
  const reminders: Reminder[] = [];

  invoices
    .filter(invoice =>
      invoice.status !== 'paid' &&
      invoice.status !== 'void' &&
      invoice.dueDate < now
    )
    .forEach(invoice => {
      const daysOverdue = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority: Reminder['priority'] = 'medium';
      if (daysOverdue > 30) priority = 'urgent';
      else if (daysOverdue > 14) priority = 'high';

      reminders.push({
        id: generateReminderId('overdue-invoice', invoice.id),
        type: 'overdue-invoice',
        priority,
        title: `Invoice #${invoice.number} is ${daysOverdue} days overdue`,
        message: `${invoice.clientName} owes $${invoice.amount.toLocaleString()}${invoice.projectName ? ` for ${invoice.projectName}` : ''}`,
        actionUrl: `/dashboard/invoices/${invoice.id}`,
        actionLabel: 'View Invoice',
        relatedEntityId: invoice.id,
        relatedEntityType: 'invoice',
        dueDate: invoice.dueDate,
        generatedAt: now,
        dismissible: false,
      });
    });

  return reminders;
}

/**
 * Check upcoming deadlines and generate reminders
 */
function checkUpcomingDeadlines(deadlines: Deadline[], now: Date): Reminder[] {
  const reminders: Reminder[] = [];
  const upcomingThreshold = new Date(now);
  upcomingThreshold.setDate(upcomingThreshold.getDate() + UPCOMING_DEADLINE_DAYS);

  deadlines
    .filter(deadline =>
      deadline.date > now &&
      deadline.date <= upcomingThreshold
    )
    .forEach(deadline => {
      const daysUntil = Math.ceil(
        (deadline.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority: Reminder['priority'] = 'low';
      if (daysUntil <= 1) priority = 'urgent';
      else if (daysUntil <= 3) priority = 'high';
      else if (daysUntil <= 5) priority = 'medium';

      const typeLabels: Record<Deadline['type'], string> = {
        milestone: 'Milestone',
        inspection: 'Inspection',
        permit: 'Permit deadline',
        payment: 'Payment due',
        delivery: 'Delivery',
      };

      reminders.push({
        id: generateReminderId('upcoming-deadline', deadline.id),
        type: deadline.type === 'inspection' ? 'inspection-due' : 'upcoming-deadline',
        priority,
        title: `${typeLabels[deadline.type]}: ${deadline.title}`,
        message: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}${deadline.projectName ? ` - ${deadline.projectName}` : ''}`,
        actionUrl: deadline.projectId ? `/dashboard/projects/${deadline.projectId}/schedule` : undefined,
        actionLabel: 'View Schedule',
        relatedEntityId: deadline.id,
        relatedEntityType: 'deadline',
        dueDate: deadline.date,
        generatedAt: now,
        dismissible: true,
      });
    });

  return reminders;
}

/**
 * Check stale tasks and generate reminders
 */
function checkStaleTasks(tasks: Task[], now: Date): Reminder[] {
  const reminders: Reminder[] = [];
  const staleThreshold = new Date(now);
  staleThreshold.setDate(staleThreshold.getDate() - STALE_TASK_DAYS);

  tasks
    .filter(task =>
      task.status === 'in-progress' &&
      task.updatedAt < staleThreshold
    )
    .forEach(task => {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      reminders.push({
        id: generateReminderId('stale-task', task.id),
        type: 'stale-task',
        priority: daysSinceUpdate > 14 ? 'high' : 'medium',
        title: `Task needs attention: ${task.title}`,
        message: `No updates for ${daysSinceUpdate} days${task.projectName ? ` - ${task.projectName}` : ''}`,
        actionUrl: task.projectId ? `/dashboard/projects/${task.projectId}/tasks` : undefined,
        actionLabel: 'View Task',
        relatedEntityId: task.id,
        relatedEntityType: 'task',
        generatedAt: now,
        dismissible: true,
      });
    });

  // Also check overdue tasks
  tasks
    .filter(task =>
      task.status !== 'completed' &&
      task.dueDate &&
      task.dueDate < now
    )
    .forEach(task => {
      const daysOverdue = Math.floor(
        (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
      );

      reminders.push({
        id: generateReminderId('stale-task', `overdue-${task.id}`),
        type: 'stale-task',
        priority: daysOverdue > 7 ? 'high' : 'medium',
        title: `Overdue task: ${task.title}`,
        message: `${daysOverdue} days past due${task.projectName ? ` - ${task.projectName}` : ''}`,
        actionUrl: task.projectId ? `/dashboard/projects/${task.projectId}/tasks` : undefined,
        actionLabel: 'View Task',
        relatedEntityId: task.id,
        relatedEntityType: 'task',
        dueDate: task.dueDate,
        generatedAt: now,
        dismissible: false,
      });
    });

  return reminders;
}

/**
 * Check expiring/unsigned documents and generate reminders
 */
function checkDocuments(documents: Document[], now: Date): Reminder[] {
  const reminders: Reminder[] = [];
  const expiringThreshold = new Date(now);
  expiringThreshold.setDate(expiringThreshold.getDate() + EXPIRING_DOCUMENT_DAYS);

  // Expiring documents
  documents
    .filter(doc =>
      doc.expirationDate &&
      doc.expirationDate > now &&
      doc.expirationDate <= expiringThreshold
    )
    .forEach(doc => {
      const daysUntilExpiry = Math.ceil(
        (doc.expirationDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority: Reminder['priority'] = 'low';
      if (daysUntilExpiry <= 7) priority = 'high';
      else if (daysUntilExpiry <= 14) priority = 'medium';

      reminders.push({
        id: generateReminderId('expiring-document', doc.id),
        type: 'expiring-document',
        priority,
        title: `${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} expiring soon`,
        message: `${doc.name} expires in ${daysUntilExpiry} days`,
        actionUrl: doc.projectId ? `/dashboard/projects/${doc.projectId}/documents` : '/dashboard/documents',
        actionLabel: 'View Document',
        relatedEntityId: doc.id,
        relatedEntityType: 'document',
        dueDate: doc.expirationDate,
        generatedAt: now,
        dismissible: true,
      });
    });

  // Unsigned documents
  documents
    .filter(doc => doc.requiresSignature && !doc.signedAt)
    .forEach(doc => {
      reminders.push({
        id: generateReminderId('unsigned-document', doc.id),
        type: 'unsigned-document',
        priority: doc.type === 'contract' ? 'high' : 'medium',
        title: `Signature required: ${doc.name}`,
        message: `${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} awaiting signature`,
        actionUrl: doc.projectId ? `/dashboard/projects/${doc.projectId}/documents` : '/dashboard/documents',
        actionLabel: 'Sign Document',
        relatedEntityId: doc.id,
        relatedEntityType: 'document',
        generatedAt: now,
        dismissible: false,
      });
    });

  return reminders;
}

/**
 * Check incomplete daily logs
 */
function checkDailyLogs(dailyLogs: DailyLog[], now: Date): Reminder[] {
  const reminders: Reminder[] = [];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Find incomplete logs from yesterday
  dailyLogs
    .filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === yesterday.getTime() && !log.completed;
    })
    .forEach(log => {
      reminders.push({
        id: generateReminderId('incomplete-daily-log', log.id),
        type: 'incomplete-daily-log',
        priority: 'medium',
        title: `Complete daily log for ${log.projectName}`,
        message: `Yesterday's daily log is incomplete`,
        actionUrl: `/dashboard/projects/${log.projectId}/daily-logs`,
        actionLabel: 'Complete Log',
        relatedEntityId: log.id,
        relatedEntityType: 'daily-log',
        generatedAt: now,
        dismissible: true,
      });
    });

  return reminders;
}

/**
 * Add budget alerts as reminders
 */
function processBudgetAlerts(
  budgetAlerts: ProjectData['budgetAlerts'],
  now: Date
): Reminder[] {
  if (!budgetAlerts) return [];

  return budgetAlerts.map(alert => ({
    id: generateReminderId('budget-alert', alert.projectId),
    type: 'budget-alert' as ReminderType,
    priority: alert.severity === 'critical' ? 'urgent' : alert.severity === 'warning' ? 'high' : 'medium',
    title: `Budget alert: ${alert.projectName}`,
    message: alert.message,
    actionUrl: `/dashboard/projects/${alert.projectId}/budget`,
    actionLabel: 'View Budget',
    relatedEntityId: alert.projectId,
    relatedEntityType: 'project',
    generatedAt: now,
    dismissible: false,
  }));
}

/**
 * Sort reminders by priority and due date
 */
function sortReminders(reminders: Reminder[]): Reminder[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  return reminders.sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    return 0;
  });
}

/**
 * Main function: Generate all reminders for a user
 */
export function generateReminders(
  userId: string,
  projectData: ProjectData
): Reminder[] {
  const now = new Date();
  const reminders: Reminder[] = [];

  if (projectData.invoices) {
    reminders.push(...checkOverdueInvoices(projectData.invoices, now));
  }

  if (projectData.deadlines) {
    reminders.push(...checkUpcomingDeadlines(projectData.deadlines, now));
  }

  if (projectData.tasks) {
    reminders.push(...checkStaleTasks(projectData.tasks, now));
  }

  if (projectData.documents) {
    reminders.push(...checkDocuments(projectData.documents, now));
  }

  if (projectData.dailyLogs) {
    reminders.push(...checkDailyLogs(projectData.dailyLogs, now));
  }

  if (projectData.budgetAlerts) {
    reminders.push(...processBudgetAlerts(projectData.budgetAlerts, now));
  }

  return sortReminders(reminders);
}

/**
 * Filter reminders by type
 */
export function filterRemindersByType(
  reminders: Reminder[],
  types: ReminderType[]
): Reminder[] {
  return reminders.filter(r => types.includes(r.type));
}

/**
 * Filter reminders by priority
 */
export function filterRemindersByPriority(
  reminders: Reminder[],
  minPriority: Reminder['priority']
): Reminder[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const minOrder = priorityOrder[minPriority];

  return reminders.filter(r => priorityOrder[r.priority] <= minOrder);
}

/**
 * Get reminder counts by type
 */
export function getReminderCounts(reminders: Reminder[]): Record<ReminderType, number> {
  const counts: Partial<Record<ReminderType, number>> = {};

  reminders.forEach(r => {
    counts[r.type] = (counts[r.type] || 0) + 1;
  });

  return counts as Record<ReminderType, number>;
}
