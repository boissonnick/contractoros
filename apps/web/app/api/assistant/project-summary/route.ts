/**
 * Project Summary Generation API - Sprint 31
 *
 * Generates AI-powered project status summaries by:
 * 1. Fetching project data, recent logs, time entries, photos
 * 2. Generating AI summary of project status
 * 3. Including: progress %, recent activity, concerns, next steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { PROJECT_SUMMARY_PROMPT } from '@/lib/ai/prompts';
import type { ProjectSummary } from '@/types';

/**
 * Verify Firebase auth token
 */
async function verifyAuth(request: NextRequest): Promise<{ uid: string; orgId: string } | null> {
  await initializeAdminApp();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData?.orgId) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      orgId: userData.orgId,
    };
  } catch (error) {
    console.error('[Project Summary] Auth error:', error);
    return null;
  }
}

/**
 * Fetch project data for summary
 */
async function fetchProjectData(
  orgId: string,
  projectId: string
): Promise<{
  project: Record<string, unknown> | null;
  dailyLogs: Record<string, unknown>[];
  timeEntries: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  photos: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
}> {
  const db = getFirestore();
  const oneWeekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  // Fetch project
  const projectDoc = await db
    .collection(`organizations/${orgId}/projects`)
    .doc(projectId)
    .get();

  if (!projectDoc.exists) {
    return {
      project: null,
      dailyLogs: [],
      timeEntries: [],
      tasks: [],
      photos: [],
      invoices: [],
      expenses: [],
    };
  }

  const project = { id: projectDoc.id, ...projectDoc.data() };

  // Fetch recent daily logs
  const dailyLogsSnapshot = await db
    .collection(`organizations/${orgId}/dailyLogs`)
    .where('projectId', '==', projectId)
    .where('date', '>=', oneWeekAgo)
    .orderBy('date', 'desc')
    .limit(10)
    .get();

  const dailyLogs = dailyLogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch recent time entries
  const timeEntriesSnapshot = await db
    .collection(`organizations/${orgId}/timeEntries`)
    .where('projectId', '==', projectId)
    .where('date', '>=', oneWeekAgo)
    .orderBy('date', 'desc')
    .limit(50)
    .get();

  const timeEntries = timeEntriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch tasks
  const tasksSnapshot = await db
    .collection(`organizations/${orgId}/tasks`)
    .where('projectId', '==', projectId)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();

  const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch recent photos
  const photosSnapshot = await db
    .collection(`organizations/${orgId}/photos`)
    .where('projectId', '==', projectId)
    .orderBy('uploadedAt', 'desc')
    .limit(20)
    .get();

  const photos = photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch invoices
  const invoicesSnapshot = await db
    .collection(`organizations/${orgId}/invoices`)
    .where('projectId', '==', projectId)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch expenses
  const expensesSnapshot = await db
    .collection(`organizations/${orgId}/expenses`)
    .where('projectId', '==', projectId)
    .orderBy('date', 'desc')
    .limit(30)
    .get();

  const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    project,
    dailyLogs,
    timeEntries,
    tasks,
    photos,
    invoices,
    expenses,
  };
}

/**
 * Build context string for AI
 */
function buildProjectContext(data: {
  project: Record<string, unknown>;
  dailyLogs: Record<string, unknown>[];
  timeEntries: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  photos: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
}): string {
  const sections: string[] = [];

  // Project overview
  const p = data.project;
  sections.push(`## Project: ${p.name}
- Type: ${p.projectType || 'Not specified'}
- Status: ${p.status}
- Client: ${p.clientName || 'Not specified'}
- Budget: $${(p.budget as number || 0).toLocaleString()}
- Start Date: ${p.startDate ? new Date((p.startDate as Timestamp).toDate()).toLocaleDateString() : 'Not set'}
- End Date: ${p.endDate ? new Date((p.endDate as Timestamp).toDate()).toLocaleDateString() : 'Not set'}
- Address: ${p.address || 'Not specified'}
`);

  // Recent daily logs
  if (data.dailyLogs.length > 0) {
    sections.push(`## Recent Daily Logs (${data.dailyLogs.length} entries)`);
    data.dailyLogs.slice(0, 5).forEach(log => {
      const date = log.date ? new Date((log.date as Timestamp).toDate()).toLocaleDateString() : 'Unknown';
      sections.push(`- ${date}: ${log.summary || log.notes || 'No summary'}`);
      if (log.weather) sections.push(`  Weather: ${log.weather}`);
      if (log.crewSize) sections.push(`  Crew: ${log.crewSize} workers`);
    });
  }

  // Time entries summary
  if (data.timeEntries.length > 0) {
    const totalHours = data.timeEntries.reduce((sum, entry) => sum + ((entry.duration as number) || 0), 0);
    const uniqueWorkers = new Set(data.timeEntries.map(e => e.userId)).size;
    sections.push(`\n## Time Tracking (Past Week)
- Total Hours: ${totalHours.toFixed(1)}
- Workers: ${uniqueWorkers}
- Entries: ${data.timeEntries.length}`);
  }

  // Tasks summary
  if (data.tasks.length > 0) {
    const tasksByStatus: Record<string, number> = {};
    data.tasks.forEach(task => {
      const status = (task.status as string) || 'unknown';
      tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
    });

    sections.push(`\n## Tasks
${Object.entries(tasksByStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}`);

    // Overdue tasks
    const now = new Date();
    const overdueTasks = data.tasks.filter(task => {
      if ((task.status as string) === 'completed') return false;
      if (!task.dueDate) return false;
      const dueDate = (task.dueDate as Timestamp).toDate();
      return dueDate < now;
    });

    if (overdueTasks.length > 0) {
      sections.push(`\n**Overdue Tasks (${overdueTasks.length}):**`);
      overdueTasks.slice(0, 5).forEach(task => {
        sections.push(`- ${task.title || task.name}`);
      });
    }
  }

  // Financial summary
  if (data.invoices.length > 0 || data.expenses.length > 0) {
    const totalInvoiced = data.invoices.reduce((sum, inv) => sum + ((inv.totalAmount as number) || 0), 0);
    const paidInvoices = data.invoices.filter(inv => (inv.status as string) === 'paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + ((inv.totalAmount as number) || 0), 0);
    const totalExpenses = data.expenses.reduce((sum, exp) => sum + ((exp.amount as number) || 0), 0);

    sections.push(`\n## Financial Summary
- Total Invoiced: $${totalInvoiced.toLocaleString()}
- Collected: $${totalPaid.toLocaleString()}
- Outstanding: $${(totalInvoiced - totalPaid).toLocaleString()}
- Expenses: $${totalExpenses.toLocaleString()}
- Invoices: ${data.invoices.length} (${paidInvoices.length} paid)`);
  }

  // Recent photos
  if (data.photos.length > 0) {
    sections.push(`\n## Recent Photos: ${data.photos.length} uploaded this week`);
  }

  return sections.join('\n');
}

/**
 * Generate summary with AI
 */
async function generateSummaryWithAI(
  projectContext: string
): Promise<{
  summary: ProjectSummary['summary'];
  confidence: number;
  modelUsed: string;
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('AI API key not configured');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${PROJECT_SUMMARY_PROMPT}\n\n---\n\n${projectContext}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Project Summary] Gemini API error:', errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('No response from AI');
  }

  let summary: ProjectSummary['summary'];
  try {
    const parsed = JSON.parse(responseText);
    summary = {
      overview: parsed.overview || 'Project summary not available.',
      progressPercentage: parsed.progressPercentage || 0,
      recentActivity: parsed.recentActivity || [],
      accomplishments: parsed.accomplishments || [],
      concerns: (parsed.concerns || []).map((c: { issue: string; severity?: string; recommendation?: string }) => ({
        issue: c.issue,
        severity: c.severity || 'low',
        recommendation: c.recommendation,
      })),
      nextSteps: parsed.nextSteps || [],
      budgetStatus: parsed.budgetStatus,
      scheduleStatus: parsed.scheduleStatus,
    };
  } catch (parseError) {
    console.error('[Project Summary] Failed to parse AI response:', parseError);
    summary = {
      overview: responseText.slice(0, 500),
      progressPercentage: 0,
      recentActivity: [],
      accomplishments: [],
      concerns: [],
      nextSteps: [],
    };
  }

  return {
    summary,
    confidence: 0.8,
    modelUsed: 'gemini-1.5-flash',
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid auth token.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Fetch project data
    const projectData = await fetchProjectData(auth.orgId, projectId);

    if (!projectData.project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Build context for AI
    const projectContext = buildProjectContext(projectData as {
      project: Record<string, unknown>;
      dailyLogs: Record<string, unknown>[];
      timeEntries: Record<string, unknown>[];
      tasks: Record<string, unknown>[];
      photos: Record<string, unknown>[];
      invoices: Record<string, unknown>[];
      expenses: Record<string, unknown>[];
    });

    // Generate summary with AI
    const { summary, confidence, modelUsed } = await generateSummaryWithAI(projectContext);

    const processingTimeMs = Date.now() - startTime;

    // Build response
    const response: ProjectSummary = {
      id: `summary-${projectId}-${Date.now()}`,
      orgId: auth.orgId,
      projectId,
      projectName: (projectData.project.name as string) || 'Unknown Project',
      summary,
      sourcesUsed: {
        dailyLogs: projectData.dailyLogs.length,
        timeEntries: projectData.timeEntries.length,
        photos: projectData.photos.length,
        tasks: projectData.tasks.length,
        invoices: projectData.invoices.length,
        expenses: projectData.expenses.length,
      },
      confidence,
      modelUsed,
      processingTimeMs,
      generatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      summary: response,
    });

  } catch (error) {
    console.error('[Project Summary] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please check API key settings.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate project summary. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Support GET with query params for convenience
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId query parameter is required' },
      { status: 400 }
    );
  }

  // Create a fake request body and call POST handler
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ projectId }),
  });

  return POST(newRequest);
}
