/**
 * Client Progress API - Sprint 36
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';

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

// GET: Return project progress data
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

    // Try to get dedicated progress document
    const progressDoc = await db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('projectProgress').doc(clientAccess.projectId)
      .get();

    if (progressDoc.exists) {
      return NextResponse.json({
        progress: { id: progressDoc.id, ...progressDoc.data() }
      });
    }

    // Fall back to calculating from project phases
    const projectDoc = await db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('projects').doc(clientAccess.projectId)
      .get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectDoc.data();

    // Get phases for the project
    const phasesSnapshot = await db
      .collection('organizations').doc(clientAccess.orgId)
      .collection('phases')
      .where('projectId', '==', clientAccess.projectId)
      .orderBy('order')
      .get();

    const phases = phasesSnapshot.docs.map(doc => {
      const phase = doc.data();
      return {
        phaseId: doc.id,
        phaseName: phase.name,
        percent: phase.percentComplete || 0,
        startDate: phase.startDate?.toDate?.() || null,
        endDate: phase.endDate?.toDate?.() || null,
      };
    });

    // Calculate overall progress
    const overallPercent = phases.length > 0
      ? Math.round(phases.reduce((sum, p) => sum + p.percent, 0) / phases.length)
      : project?.percentComplete || 0;

    const progress = {
      projectId: clientAccess.projectId,
      orgId: clientAccess.orgId,
      overallPercent,
      phases,
      estimatedCompletion: project?.estimatedCompletionDate?.toDate?.() || null,
      lastUpdated: new Date(),
    };

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
