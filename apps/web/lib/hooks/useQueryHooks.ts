"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { toast } from '@/components/ui/Toast';

// Query key factory for consistent key management
export const queryKeys = {
  all: ['all'] as const,
  projects: {
    all: ['projects'] as const,
    list: (orgId: string) => ['projects', 'list', orgId] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (projectId: string) => ['tasks', 'list', projectId] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  phases: {
    all: ['phases'] as const,
    list: (projectId: string) => ['phases', 'list', projectId] as const,
  },
  team: {
    all: ['team'] as const,
    list: (orgId: string) => ['team', 'list', orgId] as const,
    invites: (orgId: string) => ['team', 'invites', orgId] as const,
  },
  subcontractors: {
    all: ['subcontractors'] as const,
    list: (orgId: string) => ['subcontractors', 'list', orgId] as const,
    detail: (id: string) => ['subcontractors', 'detail', id] as const,
  },
  timeEntries: {
    all: ['timeEntries'] as const,
    list: (userId: string) => ['timeEntries', 'list', userId] as const,
    byProject: (projectId: string) => ['timeEntries', 'project', projectId] as const,
  },
  dailyLogs: {
    all: ['dailyLogs'] as const,
    list: (projectId: string) => ['dailyLogs', 'list', projectId] as const,
  },
  photos: {
    all: ['photos'] as const,
    list: (projectId: string) => ['photos', 'list', projectId] as const,
  },
  changeOrders: {
    all: ['changeOrders'] as const,
    list: (projectId: string) => ['changeOrders', 'list', projectId] as const,
  },
  scopes: {
    all: ['scopes'] as const,
    list: (projectId: string) => ['scopes', 'list', projectId] as const,
    current: (projectId: string) => ['scopes', 'current', projectId] as const,
  },
};

// Generic Firestore document fetch
async function fetchDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

// Generic Firestore collection fetch
async function fetchCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

// ==========================================
// PROJECT HOOKS
// ==========================================

/**
 * Hook for fetching all projects for the current organization.
 *
 * Uses React Query for caching and automatic refetching. Projects are
 * ordered by creation date descending.
 *
 * @returns {UseQueryResult} React Query result object
 * @returns {Project[]} data - Array of projects for the organization
 * @returns {boolean} isLoading - True while initial fetch is in progress
 * @returns {boolean} isFetching - True while any fetch is in progress
 * @returns {Error|null} error - Error if the query failed
 * @returns {Function} refetch - Function to manually refetch data
 *
 * @example
 * // List all projects
 * const { data: projects, isLoading, error } = useProjects();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return projects.map(p => <ProjectCard key={p.id} project={p} />);
 *
 * @example
 * // Filter projects by status
 * const { data: projects } = useProjects();
 * const activeProjects = projects?.filter(p => p.status === 'active') || [];
 */
export function useProjects() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: queryKeys.projects.list(profile?.orgId || ''),
    queryFn: () =>
      fetchCollection('projects', [
        where('orgId', '==', profile?.orgId),
        orderBy('createdAt', 'desc'),
      ]),
    enabled: !!profile?.orgId,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId || ''),
    queryFn: () => fetchDocument('projects', projectId!),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<DocumentData>) => {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...data,
        orgId: profile?.orgId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Project created');
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentData> }) => {
      await updateDoc(doc(db, 'projects', id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Project updated');
    },
    onError: () => {
      toast.error('Failed to update project');
    },
  });
}

// ==========================================
// TASK HOOKS
// ==========================================

export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.list(projectId || ''),
    queryFn: () =>
      fetchCollection('tasks', [
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
      ]),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<DocumentData> & { projectId: string }) => {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...data,
        status: data.status || 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      toast.success('Task created');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId: _projectId,
      data,
    }: {
      id: string;
      projectId: string;
      data: Partial<DocumentData>;
    }) => {
      await updateDoc(doc(db, 'tasks', id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      toast.success('Task updated');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await deleteDoc(doc(db, 'tasks', id));
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      toast.success('Task deleted');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });
}

// ==========================================
// TEAM HOOKS
// ==========================================

/**
 * Hook for fetching all active team members in the current organization.
 *
 * Returns only users who are marked as active (isActive: true).
 * Uses React Query for caching and automatic refetching.
 *
 * @returns {UseQueryResult} React Query result object
 * @returns {UserProfile[]} data - Array of active team member profiles
 * @returns {boolean} isLoading - True while initial fetch is in progress
 * @returns {boolean} isFetching - True while any fetch is in progress
 * @returns {Error|null} error - Error if the query failed
 * @returns {Function} refetch - Function to manually refetch data
 *
 * @example
 * // Display team member list
 * const { data: team, isLoading } = useTeamMembers();
 *
 * if (isLoading) return <Spinner />;
 *
 * return team?.map(member => (
 *   <TeamMemberCard key={member.id} member={member} />
 * ));
 *
 * @example
 * // Filter by role
 * const { data: team } = useTeamMembers();
 * const fieldWorkers = team?.filter(m => m.role === 'FIELD') || [];
 * const managers = team?.filter(m => m.role === 'PM' || m.role === 'OWNER') || [];
 */
export function useTeamMembers() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: queryKeys.team.list(profile?.orgId || ''),
    queryFn: () =>
      fetchCollection('users', [
        where('orgId', '==', profile?.orgId),
        where('isActive', '==', true),
      ]),
    enabled: !!profile?.orgId,
  });
}

export function usePendingInvites() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: queryKeys.team.invites(profile?.orgId || ''),
    queryFn: () =>
      fetchCollection('invites', [
        where('orgId', '==', profile?.orgId),
        where('status', '==', 'pending'),
      ]),
    enabled: !!profile?.orgId,
  });
}

// ==========================================
// SUBCONTRACTOR HOOKS
// ==========================================

export function useSubcontractors() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: queryKeys.subcontractors.list(profile?.orgId || ''),
    queryFn: () =>
      fetchCollection('subcontractors', [
        where('orgId', '==', profile?.orgId),
        orderBy('companyName', 'asc'),
      ]),
    enabled: !!profile?.orgId,
  });
}

export function useSubcontractor(subId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.subcontractors.detail(subId || ''),
    queryFn: () => fetchDocument('subcontractors', subId!),
    enabled: !!subId,
  });
}

// ==========================================
// TIME ENTRY HOOKS
// ==========================================

export function useUserTimeEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.timeEntries.list(user?.uid || ''),
    queryFn: () =>
      fetchCollection('timeEntries', [
        where('userId', '==', user?.uid),
        orderBy('date', 'desc'),
        limit(100),
      ]),
    enabled: !!user?.uid,
  });
}

export function useProjectTimeEntries(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.timeEntries.byProject(projectId || ''),
    queryFn: () =>
      fetchCollection('timeEntries', [
        where('projectId', '==', projectId),
        orderBy('date', 'desc'),
      ]),
    enabled: !!projectId,
  });
}

// ==========================================
// DAILY LOG HOOKS
// ==========================================

export function useDailyLogs(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dailyLogs.list(projectId || ''),
    queryFn: () =>
      fetchCollection('dailyLogs', [
        where('projectId', '==', projectId),
        orderBy('date', 'desc'),
      ]),
    enabled: !!projectId,
  });
}

// ==========================================
// PHOTO HOOKS
// ==========================================

export function useProjectPhotos(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.photos.list(projectId || ''),
    queryFn: () =>
      fetchCollection('photos', [
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
      ]),
    enabled: !!projectId,
  });
}

// ==========================================
// CHANGE ORDER HOOKS
// ==========================================

export function useChangeOrders(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.changeOrders.list(projectId || ''),
    queryFn: () =>
      fetchCollection('changeOrders', [
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
      ]),
    enabled: !!projectId,
  });
}

// ==========================================
// SCOPE HOOKS
// ==========================================

export function useScopes(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.scopes.list(projectId || ''),
    queryFn: () =>
      fetchCollection('scopes', [
        where('projectId', '==', projectId),
        orderBy('version', 'desc'),
      ]),
    enabled: !!projectId,
  });
}

// ==========================================
// REAL-TIME SUBSCRIPTION HOOK
// ==========================================

export function useRealtimeQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  queryKey: readonly unknown[],
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        queryClient.setQueryData(queryKey, data);
      },
      (error) => {
        console.error(`Realtime subscription error for ${collectionName}:`, error);
      }
    );

    return () => unsubscribe();
  }, [collectionName, enabled, queryClient, queryKey, constraints]);

  return useQuery<T[]>({
    queryKey,
    queryFn: () => fetchCollection<T>(collectionName, constraints),
    enabled,
  });
}

// ==========================================
// OPTIMISTIC UPDATE HELPER
// ==========================================

export function useOptimisticUpdate<T extends { id: string }>(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return {
    // Optimistically update a single item in a list
    optimisticUpdate: (id: string, updates: Partial<T>) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        );
      });
    },

    // Optimistically add an item to a list
    optimisticAdd: (item: T) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return [item];
        return [item, ...old];
      });
    },

    // Optimistically remove an item from a list
    optimisticRemove: (id: string) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((item) => item.id !== id);
      });
    },

    // Revert changes on error
    rollback: (previousData: T[] | undefined) => {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
    },

    // Get current data for rollback
    getCurrentData: () => queryClient.getQueryData<T[]>(queryKey),
  };
}
