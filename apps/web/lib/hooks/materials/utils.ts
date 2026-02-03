import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firestore Timestamp to JavaScript Date
 */
export const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return timestamp;
};
