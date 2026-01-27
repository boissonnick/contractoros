import { db } from './config';
import { collection, getDocs, addDoc, Timestamp, query, limit } from 'firebase/firestore';
import { DEFAULT_PHASE_TEMPLATES } from '@/lib/constants/defaultPhaseTemplates';
import { PhaseTemplate } from '@/types';

/**
 * Ensures the org has phase templates in Firestore.
 * If none exist, seeds the default templates.
 * Returns the org's templates.
 */
export async function ensurePhaseTemplates(orgId: string): Promise<PhaseTemplate[]> {
  const templatesRef = collection(db, 'organizations', orgId, 'phaseTemplates');

  // Check if any templates exist
  const snap = await getDocs(query(templatesRef, limit(1)));
  if (!snap.empty) {
    // Already seeded — fetch all
    const allSnap = await getDocs(templatesRef);
    return allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhaseTemplate));
  }

  // Seed defaults
  const created: PhaseTemplate[] = [];
  for (const tmpl of DEFAULT_PHASE_TEMPLATES) {
    const docRef = await addDoc(templatesRef, {
      orgId,
      name: tmpl.name,
      scopeType: tmpl.scopeType,
      phases: tmpl.phases,
      isDefault: true,
      createdAt: Timestamp.now(),
    });
    created.push({
      id: docRef.id,
      orgId,
      name: tmpl.name,
      scopeType: tmpl.scopeType,
      phases: tmpl.phases,
      isDefault: true,
      createdAt: new Date(),
    });
  }

  return created;
}
