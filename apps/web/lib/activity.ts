import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ActivityLogEntry {
  id: string;
  orgId: string;
  type: 'project' | 'task' | 'scope' | 'change_order' | 'bid' | 'photo' | 'time' | 'issue' | 'user';
  message: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
}

export async function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) {
  try {
    await addDoc(collection(db, 'activityLog'), {
      ...entry,
      timestamp: Timestamp.now(),
    });
  } catch (err) {
    // Silent fail — activity logging should never block the main operation
    console.warn('Failed to log activity:', err);
  }
}
