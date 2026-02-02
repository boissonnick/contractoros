/**
 * Notification System Types
 */

import { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'invoice_paid'
  | 'task_assigned'
  | 'project_update'
  | 'mention'
  | 'estimate_approved'
  | 'signature_completed'
  | 'system';

export interface Notification {
  id: string;
  orgId: string;
  userId: string; // Target user
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  actionUrl?: string; // URL to navigate on click
  metadata?: {
    projectId?: string;
    invoiceId?: string;
    taskId?: string;
    estimateId?: string;
    mentionedBy?: string;
    amount?: number;
  };
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Notification['metadata'];
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  invoice_paid: 'BanknotesIcon',
  task_assigned: 'ClipboardDocumentCheckIcon',
  project_update: 'FolderIcon',
  mention: 'AtSymbolIcon',
  estimate_approved: 'CheckCircleIcon',
  signature_completed: 'PencilSquareIcon',
  system: 'BellIcon',
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  invoice_paid: 'text-green-600 bg-green-100',
  task_assigned: 'text-blue-600 bg-blue-100',
  project_update: 'text-purple-600 bg-purple-100',
  mention: 'text-yellow-600 bg-yellow-100',
  estimate_approved: 'text-green-600 bg-green-100',
  signature_completed: 'text-indigo-600 bg-indigo-100',
  system: 'text-gray-600 bg-gray-100',
};
