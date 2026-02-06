/**
 * Client Documents API - Sprint 36
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { logger } from '@/lib/utils/logger';

async function validateClientToken(token: string) {
  await initializeAdminApp();
  const db = getFirestore();

  const projectsSnapshot = await db.collectionGroup('projects')
    .where('clientAccessToken', '==', token)
    .limit(1)
    .get();

  if (projectsSnapshot.empty) return null;

  const projectDoc = projectsSnapshot.docs[0];
  const project = projectDoc.data();
  return {
    projectId: projectDoc.id,
    orgId: project.orgId,
    projectName: project.name
  };
}

// Document types visible to clients
const CLIENT_VISIBLE_TYPES = [
  'contract',
  'proposal',
  'change_order',
  'invoice',
  'receipt',
  'permit',
  'drawing',
  'specification',
  'warranty',
  'photo',
  'report',
];

// GET: List documents for project (filtered for client access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const clientAccess = await validateClientToken(token);

    if (!clientAccess) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query: FirebaseFirestore.Query = db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('documents')
      .where('projectId', '==', clientAccess.projectId)
      .where('clientVisible', '==', true);

    // Filter by document type if specified
    if (type && CLIENT_VISIBLE_TYPES.includes(type)) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const documents = snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Only return client-safe fields
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          description: data.description,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          createdAt: data.createdAt?.toDate?.() || null,
        };
      })
      .filter(doc => CLIENT_VISIBLE_TYPES.includes(doc.type));

    return NextResponse.json({
      documents,
      availableTypes: CLIENT_VISIBLE_TYPES
    });
  } catch (error) {
    logger.error('Error fetching documents', { error, route: 'client-documents' });
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
