// ============================================
// Communication Types
// Messaging, Notifications, SMS
// Extracted from types/index.ts
// ============================================

// ============================================
// Messaging Types
// ============================================

export type MessageChannelType = 'project' | 'direct';

export interface MessageChannel {
  id: string;
  orgId: string;
  type: MessageChannelType;
  name: string;
  projectId?: string;
  participantIds: string[];
  lastMessageAt?: Date;
  lastMessageText?: string;
  lastMessageBy?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  orgId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mentions: string[];
  attachmentURL?: string;
  attachmentName?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'rfi_created'
  | 'rfi_responded'
  | 'submittal_review'
  | 'punch_item_assigned'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'expense_approved'
  | 'expense_rejected'
  | 'change_order_pending'
  | 'selection_pending'
  | 'selection_made'
  | 'message_received'
  | 'mention'
  | 'general';

export interface AppNotification {
  id: string;
  orgId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: Date;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // "22:00" format
  endTime: string;   // "07:00" format
  days: DayOfWeek[];
  allowHighPriority: boolean;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  orgId: string;
  email: {
    enabled: boolean;
    taskAssigned: boolean;
    taskDueSoon: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    rfiCreated: boolean;
    expenseApproved: boolean;
    changeOrderPending: boolean;
    selectionPending: boolean;
    messages: boolean;
    mentions: boolean;
    dailyDigest: boolean;
  };
  push: {
    enabled: boolean;
    taskAssigned: boolean;
    taskDueSoon: boolean;
    invoicePaid: boolean;
    changeOrderPending: boolean;
    messages: boolean;
    mentions: boolean;
  };
  quietHours?: QuietHoursConfig;
  projectSettings?: NotificationProjectSettings[];
}

// Per-project notification settings
export interface NotificationProjectSettings {
  projectId: string;
  projectName?: string; // Cached for display purposes
  muted: boolean; // Mute all notifications from this project
  taskNotifications: boolean;
  rfiNotifications: boolean;
  expenseNotifications: boolean;
  changeOrderNotifications: boolean;
  updatedAt?: Date;
}

// ============================================
// SMS/Text Workflows Types (Twilio)
// ============================================

export type SMSWorkflowType =
  | 'appointment_reminder'
  | 'schedule_update'
  | 'payment_reminder'
  | 'task_assignment'
  | 'emergency_alert'
  | 'custom';

export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export interface SMSMessage {
  id: string;
  orgId: string;
  workflowId?: string;
  recipientId: string;        // User or client ID
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: SMSStatus;
  twilioSid?: string;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface SMSWorkflow {
  id: string;
  orgId: string;
  name: string;
  type: SMSWorkflowType;
  template: string;           // Message template with {{placeholders}}
  isActive: boolean;
  triggerConditions?: {
    daysBeforeEvent?: number;
    eventTypes?: string[];
    projectIds?: string[];
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface SMSUsage {
  orgId: string;
  month: string;              // "2026-02"
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  creditsUsed: number;
  creditLimit: number;
}

// ============================================
// Email Template Types
// ============================================

export type EmailTemplateType =
  | 'invoice_sent'
  | 'invoice_reminder'
  | 'payment_received'
  | 'estimate_sent'
  | 'project_update'
  | 'task_assigned'
  | 'welcome'
  | 'password_reset'
  | 'custom';

export interface EmailTemplate {
  id: string;
  orgId: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];        // Available placeholders
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface EmailLog {
  id: string;
  orgId: string;
  templateId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  provider: 'mailgun' | 'sendgrid' | 'ses';
  providerId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  createdAt: Date;
}

// ============================================
// Communication Labels
// ============================================

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: 'Task Assigned',
  task_completed: 'Task Completed',
  task_due_soon: 'Task Due Soon',
  rfi_created: 'RFI Created',
  rfi_responded: 'RFI Responded',
  submittal_review: 'Submittal Review',
  punch_item_assigned: 'Punch Item Assigned',
  invoice_paid: 'Invoice Paid',
  invoice_overdue: 'Invoice Overdue',
  expense_approved: 'Expense Approved',
  expense_rejected: 'Expense Rejected',
  change_order_pending: 'Change Order Pending',
  selection_pending: 'Selection Pending',
  selection_made: 'Selection Made',
  message_received: 'Message Received',
  mention: 'Mention',
  general: 'General',
};

export const SMS_STATUS_LABELS: Record<SMSStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};
