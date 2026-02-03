/**
 * Offline Project Service
 * Manages downloading and caching project data for offline field access
 */

import { saveOffline, getOfflineData, deleteOfflineData } from './storage';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Project, Task, Client, UserProfile } from '@/types';

// ============================================
// Types
// ============================================

/**
 * Cached project data structure
 * Contains all essential data for offline field access
 */
export interface OfflineProjectData {
  project: OfflineCachedProject;
  tasks: OfflineCachedTask[];
  client: OfflineCachedContact | null;
  projectManager: OfflineCachedContact | null;
  downloadedAt: number;
  expiresAt: number;
}

/**
 * Simplified project data for offline use
 */
export interface OfflineCachedProject {
  id: string;
  name: string;
  status: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate?: string;
  estimatedEndDate?: string;
  clientName?: string;
  currentPhase?: string;
}

/**
 * Simplified task data for offline use
 */
export interface OfflineCachedTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  assignedTo: string[];
  phaseId?: string;
}

/**
 * Simplified contact info for offline use
 */
export interface OfflineCachedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

/**
 * Download progress callback type
 */
export type DownloadProgressCallback = (progress: {
  stage: 'project' | 'tasks' | 'contacts' | 'complete';
  percent: number;
  message: string;
}) => void;

// ============================================
// Constants
// ============================================

const CACHE_KEY_PREFIX = 'offline-project-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DOWNLOADED_PROJECTS_KEY = 'offline-downloaded-projects';

// ============================================
// Helper Functions
// ============================================

function getCacheKey(projectId: string): string {
  return `${CACHE_KEY_PREFIX}${projectId}`;
}

function formatDateForCache(date: Date | undefined | null): string | undefined {
  if (!date) return undefined;
  if (date instanceof Date) {
    return date.toISOString();
  }
  // Handle Firestore Timestamp
  if (typeof date === 'object' && 'toDate' in date) {
    return (date as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

// ============================================
// Core Functions
// ============================================

/**
 * Download and cache a project for offline access
 */
export async function downloadProjectForOffline(
  projectId: string,
  orgId: string,
  userId: string,
  onProgress?: DownloadProgressCallback
): Promise<void> {
  if (!projectId || !orgId) {
    throw new Error('Project ID and Organization ID are required');
  }

  try {
    // Stage 1: Fetch project details (0-25%)
    onProgress?.({
      stage: 'project',
      percent: 0,
      message: 'Fetching project details...',
    });

    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data() as Project;

    const cachedProject: OfflineCachedProject = {
      id: projectDoc.id,
      name: projectData.name,
      status: projectData.status,
      description: projectData.description,
      address: projectData.address,
      startDate: formatDateForCache(projectData.startDate),
      estimatedEndDate: formatDateForCache(projectData.estimatedEndDate),
      clientName: projectData.clientName,
      currentPhase: projectData.currentPhase,
    };

    onProgress?.({
      stage: 'project',
      percent: 25,
      message: 'Project details loaded',
    });

    // Stage 2: Fetch tasks (25-50%)
    onProgress?.({
      stage: 'tasks',
      percent: 25,
      message: 'Fetching tasks...',
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tasks for this project that are active/assigned
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      where('status', 'in', ['pending', 'assigned', 'in_progress', 'blocked']),
      orderBy('dueDate', 'asc'),
      limit(50)
    );

    const tasksSnap = await getDocs(tasksQuery);
    const cachedTasks: OfflineCachedTask[] = tasksSnap.docs.map((doc) => {
      const data = doc.data() as Task;
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: formatDateForCache(data.dueDate),
        startDate: formatDateForCache(data.startDate),
        estimatedHours: data.estimatedHours,
        assignedTo: data.assignedTo || [],
        phaseId: data.phaseId,
      };
    });

    onProgress?.({
      stage: 'tasks',
      percent: 50,
      message: `${cachedTasks.length} tasks loaded`,
    });

    // Stage 3: Fetch contacts (50-90%)
    onProgress?.({
      stage: 'contacts',
      percent: 50,
      message: 'Fetching contact information...',
    });

    let cachedClient: OfflineCachedContact | null = null;
    let cachedPM: OfflineCachedContact | null = null;

    // Fetch client info
    if (projectData.clientId) {
      try {
        const clientDoc = await getDoc(doc(db, `organizations/${orgId}/clients`, projectData.clientId));
        if (clientDoc.exists()) {
          const clientData = clientDoc.data() as Client;
          cachedClient = {
            id: clientDoc.id,
            name: clientData.displayName || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim(),
            email: clientData.email,
            phone: clientData.phone,
            role: 'Client',
          };
        }
      } catch (err) {
        console.warn('Failed to fetch client:', err);
      }
    }

    onProgress?.({
      stage: 'contacts',
      percent: 70,
      message: 'Client info loaded',
    });

    // Fetch PM info
    if (projectData.pmId) {
      try {
        const pmDoc = await getDoc(doc(db, 'users', projectData.pmId));
        if (pmDoc.exists()) {
          const pmData = pmDoc.data() as UserProfile;
          cachedPM = {
            id: pmDoc.id,
            name: pmData.displayName || pmData.email || 'Unknown',
            email: pmData.email,
            phone: pmData.phone,
            role: 'Project Manager',
          };
        }
      } catch (err) {
        console.warn('Failed to fetch PM:', err);
      }
    }

    onProgress?.({
      stage: 'contacts',
      percent: 90,
      message: 'Contact info loaded',
    });

    // Stage 4: Save to IndexedDB (90-100%)
    const now = Date.now();
    const offlineData: OfflineProjectData = {
      project: cachedProject,
      tasks: cachedTasks,
      client: cachedClient,
      projectManager: cachedPM,
      downloadedAt: now,
      expiresAt: now + CACHE_TTL_MS,
    };

    await saveOffline(getCacheKey(projectId), offlineData, CACHE_TTL_MS);

    // Track downloaded project in the list
    await addToDownloadedProjects(projectId, orgId, cachedProject.name);

    onProgress?.({
      stage: 'complete',
      percent: 100,
      message: 'Download complete',
    });
  } catch (error) {
    console.error('[OfflineProject] Failed to download project:', error);
    throw error;
  }
}

/**
 * Get cached project data
 */
export async function getOfflineProject(projectId: string): Promise<OfflineProjectData | null> {
  if (!projectId) return null;

  try {
    const data = await getOfflineData<OfflineProjectData>(getCacheKey(projectId));

    if (!data) return null;

    // Check if expired
    if (Date.now() > data.expiresAt) {
      // Delete expired data
      await removeOfflineProject(projectId);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[OfflineProject] Failed to get cached project:', error);
    return null;
  }
}

/**
 * Check if a project is available offline
 */
export async function isProjectAvailableOffline(projectId: string): Promise<boolean> {
  const data = await getOfflineProject(projectId);
  return data !== null;
}

/**
 * Get the download timestamp for a project
 */
export async function getProjectDownloadTime(projectId: string): Promise<Date | null> {
  const data = await getOfflineProject(projectId);
  return data ? new Date(data.downloadedAt) : null;
}

/**
 * Remove offline project data
 */
export async function removeOfflineProject(projectId: string): Promise<void> {
  await deleteOfflineData(getCacheKey(projectId));
  await removeFromDownloadedProjects(projectId);
}

// ============================================
// Downloaded Projects List Management
// ============================================

interface DownloadedProjectEntry {
  projectId: string;
  orgId: string;
  name: string;
  downloadedAt: number;
}

/**
 * Get list of all downloaded projects
 */
export async function getDownloadedProjects(): Promise<DownloadedProjectEntry[]> {
  const data = await getOfflineData<DownloadedProjectEntry[]>(DOWNLOADED_PROJECTS_KEY);
  return data || [];
}

/**
 * Add a project to the downloaded list
 */
async function addToDownloadedProjects(
  projectId: string,
  orgId: string,
  name: string
): Promise<void> {
  const projects = await getDownloadedProjects();

  // Remove existing entry if present
  const filtered = projects.filter((p) => p.projectId !== projectId);

  // Add new entry
  filtered.push({
    projectId,
    orgId,
    name,
    downloadedAt: Date.now(),
  });

  await saveOffline(DOWNLOADED_PROJECTS_KEY, filtered);
}

/**
 * Remove a project from the downloaded list
 */
async function removeFromDownloadedProjects(projectId: string): Promise<void> {
  const projects = await getDownloadedProjects();
  const filtered = projects.filter((p) => p.projectId !== projectId);
  await saveOffline(DOWNLOADED_PROJECTS_KEY, filtered);
}

/**
 * Get downloaded projects for an organization
 */
export async function getDownloadedProjectsForOrg(orgId: string): Promise<DownloadedProjectEntry[]> {
  const projects = await getDownloadedProjects();
  return projects.filter((p) => p.orgId === orgId);
}

/**
 * Clear all downloaded projects for an organization
 */
export async function clearAllOfflineProjects(orgId: string): Promise<void> {
  const projects = await getDownloadedProjectsForOrg(orgId);

  for (const project of projects) {
    await removeOfflineProject(project.projectId);
  }
}
