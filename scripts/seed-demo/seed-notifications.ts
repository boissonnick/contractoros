/**
 * Seed Notifications for Demo Data
 *
 * Creates 25 realistic notifications for various team members.
 * Uses the named "contractoros" database via shared db.ts module.
 *
 * Distribution:
 *   - 10 for owner (Mike Johnson)
 *   - 8 for PM (Sarah Williams)
 *   - 4 for foreman (Carlos Rodriguez)
 *   - 3 for fieldWorker1 (Jake Thompson)
 *
 * ~60% unread, ~40% read. Dates spread over last 7 days.
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  toTimestamp,
  randomInt,
  generateId,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

// ============================================
// Types (matching AppNotification in types/index.ts)
// ============================================

type NotificationType =
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

interface NotificationSeed {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  projectId?: string;
  isRead: boolean;
}

// ============================================
// Demo Projects
// ============================================

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Install' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
];

// ============================================
// Notification Templates
// ============================================

// Owner (Mike Johnson) - 10 notifications
const OWNER_NOTIFICATIONS: NotificationSeed[] = [
  {
    userId: DEMO_USERS.owner.uid,
    type: 'invoice_paid',
    title: 'Invoice #INV-2024-018 Paid',
    body: 'Robert Smith paid $4,750.00 for the Smith Kitchen Remodel progress billing. Payment received via ACH transfer.',
    link: '/dashboard/invoices',
    projectId: 'demo-proj-smith-kitchen',
    isRead: true,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'invoice_paid',
    title: 'Invoice #INV-2024-022 Paid',
    body: 'Maria Garcia paid $2,850.00 for the Garcia Master Bath milestone 2 invoice.',
    link: '/dashboard/invoices',
    projectId: 'demo-proj-garcia-bath',
    isRead: false,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'task_completed',
    title: 'Task Completed: Electrical Rough-In',
    body: 'Carlos Rodriguez marked "Electrical rough-in" as complete on the Smith Kitchen Remodel project.',
    link: '/dashboard/projects/demo-proj-smith-kitchen',
    projectId: 'demo-proj-smith-kitchen',
    isRead: true,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'rfi_created',
    title: 'New RFI: Beam size clarification',
    body: 'Carlos Rodriguez submitted RFI-007 regarding beam size clarification at the kitchen opening on the Smith Kitchen Remodel.',
    link: '/dashboard/projects/demo-proj-smith-kitchen/rfis',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'change_order_pending',
    title: 'Change Order Awaiting Approval',
    body: 'CO-003 for the Garcia Master Bath requires your approval. Client requested upgraded shower fixtures (+$1,200).',
    link: '/dashboard/projects/demo-proj-garcia-bath/change-orders',
    projectId: 'demo-proj-garcia-bath',
    isRead: false,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'message_received',
    title: 'New Message from Robert Smith',
    body: 'Robert Smith sent a message about the kitchen cabinet color selection for the Smith Kitchen Remodel.',
    link: '/dashboard/messages',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'expense_approved',
    title: 'Expense Report Approved',
    body: 'Your expense report for $387.50 (plumbing supplies from Home Depot) has been processed and approved.',
    link: '/dashboard/expenses',
    projectId: 'demo-proj-garcia-bath',
    isRead: true,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'invoice_overdue',
    title: 'Invoice #INV-2024-015 Overdue',
    body: 'Invoice for Main St. Retail Storefront ($8,500.00) is 5 days past due. Consider sending a reminder to Susan Martinez.',
    link: '/dashboard/invoices',
    projectId: 'demo-proj-mainst-retail',
    isRead: false,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'task_completed',
    title: 'Task Completed: Demo walls and ceilings',
    body: 'Jake Thompson marked "Demo walls and ceilings" as complete on the Downtown Cafe TI project.',
    link: '/dashboard/projects/demo-proj-cafe-ti',
    projectId: 'demo-proj-cafe-ti',
    isRead: true,
  },
  {
    userId: DEMO_USERS.owner.uid,
    type: 'selection_made',
    title: 'Client Selection Made: Countertop Material',
    body: 'Maria Garcia selected "Quartz - Calacatta Gold" for the master bath countertop on the Garcia Master Bath project.',
    link: '/dashboard/projects/demo-proj-garcia-bath/selections',
    projectId: 'demo-proj-garcia-bath',
    isRead: false,
  },
];

// PM (Sarah Williams) - 8 notifications
const PM_NOTIFICATIONS: NotificationSeed[] = [
  {
    userId: DEMO_USERS.pm.uid,
    type: 'task_assigned',
    title: 'New Task Assigned: Schedule Framing Inspection',
    body: 'Mike Johnson assigned you "Schedule framing inspection" on the Smith Kitchen Remodel. Due in 3 days.',
    link: '/dashboard/projects/demo-proj-smith-kitchen',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'submittal_review',
    title: 'Submittal Requires Review',
    body: 'Tile submittal for Garcia Master Bath needs your review. Vendor submitted samples for floor and shower tile.',
    link: '/dashboard/projects/demo-proj-garcia-bath/submittals',
    projectId: 'demo-proj-garcia-bath',
    isRead: false,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'punch_item_assigned',
    title: 'Punch List Item Assigned',
    body: 'You have been assigned "Touch up paint on north wall" punch list item for the Main St. Retail Storefront.',
    link: '/dashboard/projects/demo-proj-mainst-retail/punch-list',
    projectId: 'demo-proj-mainst-retail',
    isRead: true,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'selection_pending',
    title: 'Client Selection Pending: Light Fixtures',
    body: 'Waiting on Robert Smith to select light fixtures for the Smith Kitchen Remodel. Deadline approaching.',
    link: '/dashboard/projects/demo-proj-smith-kitchen/selections',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'rfi_responded',
    title: 'RFI Response Received',
    body: 'Mike Johnson responded to RFI-004 regarding plumbing rough-in routing on the Garcia Master Bath.',
    link: '/dashboard/projects/demo-proj-garcia-bath/rfis',
    projectId: 'demo-proj-garcia-bath',
    isRead: true,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'task_due_soon',
    title: 'Task Due Tomorrow: Order Countertop Material',
    body: '"Order countertop material" for the Smith Kitchen Remodel is due tomorrow. Current status: assigned.',
    link: '/dashboard/projects/demo-proj-smith-kitchen',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'message_received',
    title: 'New Message from Tom Richards',
    body: 'Tom Richards (Downtown Cafe LLC) sent a message asking about the updated timeline for the cafe renovation.',
    link: '/dashboard/messages',
    projectId: 'demo-proj-cafe-ti',
    isRead: true,
  },
  {
    userId: DEMO_USERS.pm.uid,
    type: 'expense_rejected',
    title: 'Expense Report Needs Revision',
    body: 'Your expense report for $1,245.00 was returned. Receipt missing for the lumber purchase on 01/28.',
    link: '/dashboard/expenses',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
];

// Foreman (Carlos Rodriguez) - 4 notifications
const FOREMAN_NOTIFICATIONS: NotificationSeed[] = [
  {
    userId: DEMO_USERS.foreman.uid,
    type: 'task_assigned',
    title: 'New Task Assigned: Install Cabinets',
    body: 'Sarah Williams assigned you "Install cabinets" on the Smith Kitchen Remodel. Estimated 16 hours.',
    link: '/dashboard/projects/demo-proj-smith-kitchen',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.foreman.uid,
    type: 'task_due_soon',
    title: 'Task Due Soon: Tile Shower Walls',
    body: '"Tile shower walls" on the Garcia Master Bath is due in 2 days. Coordinate with tile sub for scheduling.',
    link: '/dashboard/projects/demo-proj-garcia-bath',
    projectId: 'demo-proj-garcia-bath',
    isRead: true,
  },
  {
    userId: DEMO_USERS.foreman.uid,
    type: 'mention',
    title: 'You were mentioned in a comment',
    body: 'Sarah Williams mentioned you in a comment on the Smith Kitchen Remodel: "@Carlos please confirm the beam specs before framing starts."',
    link: '/dashboard/projects/demo-proj-smith-kitchen',
    projectId: 'demo-proj-smith-kitchen',
    isRead: false,
  },
  {
    userId: DEMO_USERS.foreman.uid,
    type: 'task_assigned',
    title: 'New Task Assigned: Coordinate HVAC Rough-In',
    body: 'Mike Johnson assigned you "HVAC rough-in coordination" on the Downtown Cafe TI. Schedule with Summit HVAC.',
    link: '/dashboard/projects/demo-proj-cafe-ti',
    projectId: 'demo-proj-cafe-ti',
    isRead: false,
  },
];

// Field Worker 1 (Jake Thompson) - 3 notifications
const FIELD_WORKER_NOTIFICATIONS: NotificationSeed[] = [
  {
    userId: DEMO_USERS.fieldWorker1.uid,
    type: 'task_assigned',
    title: 'New Task Assigned: Install Decking Boards',
    body: 'Carlos Rodriguez assigned you "Install decking boards" on the Wilson Fence Install project. Start date: tomorrow.',
    link: '/dashboard/projects/demo-proj-wilson-fence',
    projectId: 'demo-proj-wilson-fence',
    isRead: false,
  },
  {
    userId: DEMO_USERS.fieldWorker1.uid,
    type: 'message_received',
    title: 'New Team Message',
    body: 'Carlos Rodriguez posted in the Smith Kitchen Remodel channel: "Lumber delivery confirmed for Thursday AM."',
    link: '/dashboard/messages',
    projectId: 'demo-proj-smith-kitchen',
    isRead: true,
  },
  {
    userId: DEMO_USERS.fieldWorker1.uid,
    type: 'task_assigned',
    title: 'New Task Assigned: Remove Existing Fixtures',
    body: 'Sarah Williams assigned you "Remove existing fixtures" on the Garcia Master Bath. Estimated 6 hours.',
    link: '/dashboard/projects/demo-proj-garcia-bath',
    projectId: 'demo-proj-garcia-bath',
    isRead: false,
  },
];

// ============================================
// Seed Function
// ============================================

async function seedNotifications(): Promise<number> {
  logSection('Seeding Notifications');

  const db = getDb();

  // Combine all notifications
  const allNotifications = [
    ...OWNER_NOTIFICATIONS,
    ...PM_NOTIFICATIONS,
    ...FOREMAN_NOTIFICATIONS,
    ...FIELD_WORKER_NOTIFICATIONS,
  ];

  logProgress(`Preparing ${allNotifications.length} notifications...`);

  // Build Firestore documents with timestamps spread over last 7 days
  const firestoreNotifications = allNotifications.map((notif, index) => {
    // Spread created dates over last 7 days, newer items first
    const dayOffset = (index / allNotifications.length) * 7;
    const hoursOffset = randomInt(0, 23);
    const minutesOffset = randomInt(0, 59);
    const createdDate = daysAgo(dayOffset);
    createdDate.setHours(hoursOffset, minutesOffset, 0, 0);

    const id = generateId('notif');

    return {
      id,
      orgId: DEMO_ORG_ID,
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      link: notif.link || null,
      projectId: notif.projectId || null,
      isRead: notif.isRead,
      createdAt: createdDate,
    };
  });

  // Write to Firestore (top-level 'notifications' collection)
  await executeBatchWrites(
    db,
    firestoreNotifications,
    (batch, notif) => {
      const ref = db.collection('notifications').doc(notif.id);
      batch.set(ref, {
        ...notif,
        createdAt: toTimestamp(notif.createdAt),
      });
    },
    'Notifications'
  );

  // Log summary
  const readCount = firestoreNotifications.filter(n => n.isRead).length;
  const unreadCount = firestoreNotifications.filter(n => !n.isRead).length;
  logSuccess(`Created ${firestoreNotifications.length} notifications (${readCount} read, ${unreadCount} unread)`);
  logProgress(`  Owner (Mike Johnson): ${OWNER_NOTIFICATIONS.length}`);
  logProgress(`  PM (Sarah Williams): ${PM_NOTIFICATIONS.length}`);
  logProgress(`  Foreman (Carlos Rodriguez): ${FOREMAN_NOTIFICATIONS.length}`);
  logProgress(`  Field (Jake Thompson): ${FIELD_WORKER_NOTIFICATIONS.length}`);

  return firestoreNotifications.length;
}

// ============================================
// Main Export
// ============================================

export { seedNotifications };

// Run if executed directly
if (require.main === module) {
  seedNotifications()
    .then((count) => {
      console.log(`\nCompleted: Created ${count} notifications`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding notifications:', error);
      process.exit(1);
    });
}
