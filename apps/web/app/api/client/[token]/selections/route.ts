/**
 * Client Selections API - Sprint 36
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';

async function validateClientToken(token: string) {
  await initializeAdminApp();
  const db = getFirestore();

  // Find project by client access token
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

// GET: List selections for project
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
    const snapshot = await db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('projectSelections')
      .where('projectId', '==', clientAccess.projectId)
      .orderBy('category')
      .get();

    const selections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ selections });
  } catch (error) {
    console.error('Error fetching selections:', error);
    return NextResponse.json({ error: 'Failed to fetch selections' }, { status: 500 });
  }
}

// PATCH: Approve selection (client)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const clientAccess = await validateClientToken(token);

    if (!clientAccess) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    const body = await request.json();
    const { selectionId, selectedOptionId, approved } = body;

    if (!selectionId) {
      return NextResponse.json({ error: 'Selection ID required' }, { status: 400 });
    }

    const db = getFirestore();
    const selectionRef = db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('projectSelections').doc(selectionId);

    const selectionDoc = await selectionRef.get();
    if (!selectionDoc.exists) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 });
    }

    const selection = selectionDoc.data();
    if (selection?.projectId !== clientAccess.projectId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (selectedOptionId !== undefined) {
      updates.selectedOptionId = selectedOptionId;
    }
    if (approved !== undefined) {
      updates.clientApproved = approved;
      if (approved) {
        updates.clientApprovedAt = new Date();
      }
    }

    await selectionRef.update(updates);

    return NextResponse.json({ success: true, ...updates });
  } catch (error) {
    console.error('Error updating selection:', error);
    return NextResponse.json({ error: 'Failed to update selection' }, { status: 500 });
  }
}
