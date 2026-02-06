/**
 * Client Notes API - Sprint 36
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
    clientId: project.clientId,
    clientName: project.clientName || 'Client'
  };
}

// GET: List notes for project
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
      .collection('clientNotes')
      .where('projectId', '==', clientAccess.projectId)
      .orderBy('createdAt', 'desc')
      .get();

    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    logger.error('Error fetching notes', { error, route: 'client-notes' });
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST: Create note (client)
export async function POST(
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
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const db = getFirestore();
    const now = new Date();

    const noteData = {
      projectId: clientAccess.projectId,
      orgId: clientAccess.orgId,
      clientId: clientAccess.clientId,
      clientName: clientAccess.clientName,
      content: content.trim(),
      addressed: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('clientNotes')
      .add(noteData);

    return NextResponse.json({
      id: docRef.id,
      ...noteData
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating note', { error, route: 'client-notes' });
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// PATCH: Mark note as addressed (contractor side would use auth)
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
    const { noteId, addressed } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    const db = getFirestore();
    const noteRef = db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('clientNotes').doc(noteId);

    const noteDoc = await noteRef.get();
    if (!noteDoc.exists) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = noteDoc.data();
    if (note?.projectId !== clientAccess.projectId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      addressed: !!addressed,
      updatedAt: new Date()
    };

    if (addressed) {
      updates.addressedAt = new Date();
    }

    await noteRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating note', { error, route: 'client-notes' });
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}
