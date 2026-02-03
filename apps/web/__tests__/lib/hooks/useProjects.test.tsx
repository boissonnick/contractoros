import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Firebase Firestore
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  query: jest.fn((ref) => ref),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

// Mock Firebase config
jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Mock toast
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useAuth hook
const mockProfile = {
  orgId: 'test-org-123',
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'PM',
};

let mockAuthProfile: typeof mockProfile | null = mockProfile;

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: mockAuthProfile ? { uid: 'test-user-123' } : null,
    profile: mockAuthProfile,
    loading: false,
    authError: null,
    signOut: jest.fn(),
  }),
}));

import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  queryKeys,
} from '@/lib/hooks/useQueryHooks';
import { toast } from '@/components/ui/Toast';

// Helper to create a wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock project data
const mockProjects = [
  {
    id: 'project-1',
    name: 'Kitchen Renovation',
    status: 'active',
    clientId: 'client-1',
    orgId: 'test-org-123',
    createdAt: { seconds: 1234567890, nanoseconds: 0 },
    updatedAt: { seconds: 1234567890, nanoseconds: 0 },
  },
  {
    id: 'project-2',
    name: 'Bathroom Remodel',
    status: 'completed',
    clientId: 'client-2',
    orgId: 'test-org-123',
    createdAt: { seconds: 1234567800, nanoseconds: 0 },
    updatedAt: { seconds: 1234567800, nanoseconds: 0 },
  },
];

describe('useProjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthProfile = mockProfile;
  });

  it('returns loading state initially', async () => {
    mockGetDocs.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ docs: [] }), 100))
    );

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns projects after successful fetch', async () => {
    mockGetDocs.mockResolvedValue({
      docs: mockProjects.map((project) => {
        const { id, ...rest } = project;
        return {
          id,
          data: () => rest,
        };
      }),
    });

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toEqual(mockProjects[0]);
    expect(result.current.data?.[1]).toEqual(mockProjects[1]);
  });

  it('returns empty array when no projects exist', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('does not fetch when profile is null (no orgId)', async () => {
    mockAuthProfile = null;
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    // The query should be disabled when there's no profile
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });

    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    const error = new Error('Firestore error');
    mockGetDocs.mockRejectedValue(error);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('uses correct query key', () => {
    const orgId = 'test-org-123';
    const key = queryKeys.projects.list(orgId);
    expect(key).toEqual(['projects', 'list', 'test-org-123']);
  });
});

describe('useProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthProfile = mockProfile;
  });

  it('returns loading state initially', async () => {
    mockGetDoc.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                exists: () => true,
                id: 'project-1',
                data: () => mockProjects[0],
              }),
            100
          )
        )
    );

    const { result } = renderHook(() => useProject('project-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns project data when found', async () => {
    const { id, ...projectWithoutId } = mockProjects[0];
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id,
      data: () => projectWithoutId,
    });

    const { result } = renderHook(() => useProject('project-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: 'project-1',
      name: 'Kitchen Renovation',
    });
  });

  it('returns null when project not found', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const { result } = renderHook(() => useProject('non-existent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('does not fetch when projectId is undefined', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const { result } = renderHook(() => useProject(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });

    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('handles fetch errors', async () => {
    const error = new Error('Document fetch failed');
    mockGetDoc.mockRejectedValue(error);

    const { result } = renderHook(() => useProject('project-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('uses correct query key for detail', () => {
    const key = queryKeys.projects.detail('project-1');
    expect(key).toEqual(['projects', 'detail', 'project-1']);
  });
});

describe('useCreateProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthProfile = mockProfile;
  });

  it('creates project successfully', async () => {
    const newProjectId = 'new-project-123';
    mockAddDoc.mockResolvedValue({ id: newProjectId });

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: 'New Project',
        status: 'active',
        clientId: 'client-1',
      });
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'New Project',
        status: 'active',
        clientId: 'client-1',
        orgId: 'test-org-123',
      })
    );
    expect(toast.success).toHaveBeenCalledWith('Project created');
  });

  it('includes timestamps on creation', async () => {
    mockAddDoc.mockResolvedValue({ id: 'new-project' });

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Test Project' });
    });

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      })
    );
  });

  it('shows error toast on failure', async () => {
    mockAddDoc.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'Test' });
      } catch {
        // Expected to throw
      }
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to create project');
  });

  it('returns the new project id on success', async () => {
    const newId = 'created-project-id';
    mockAddDoc.mockResolvedValue({ id: newId });

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    let returnedId: string | undefined;
    await act(async () => {
      returnedId = await result.current.mutateAsync({ name: 'Test' });
    });

    expect(returnedId).toBe(newId);
  });
});

describe('useUpdateProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthProfile = mockProfile;
  });

  it('updates project successfully', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'project-1',
        data: { name: 'Updated Name', status: 'completed' },
      });
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'Updated Name',
        status: 'completed',
        updatedAt: expect.anything(),
      })
    );
    expect(toast.success).toHaveBeenCalledWith('Project updated');
  });

  it('always includes updatedAt timestamp', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'project-1',
        data: { name: 'Test' },
      });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        updatedAt: expect.anything(),
      })
    );
  });

  it('shows error toast on failure', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: 'project-1',
          data: { name: 'Test' },
        });
      } catch {
        // Expected to throw
      }
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to update project');
  });

  it('handles partial updates', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'project-1',
        data: { status: 'on-hold' },
      });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'on-hold',
      })
    );
  });
});

describe('queryKeys', () => {
  it('generates correct project list key', () => {
    expect(queryKeys.projects.list('org-1')).toEqual(['projects', 'list', 'org-1']);
  });

  it('generates correct project detail key', () => {
    expect(queryKeys.projects.detail('proj-1')).toEqual(['projects', 'detail', 'proj-1']);
  });

  it('generates unique keys for different organizations', () => {
    const key1 = queryKeys.projects.list('org-1');
    const key2 = queryKeys.projects.list('org-2');
    expect(key1).not.toEqual(key2);
  });

  it('generates unique keys for different projects', () => {
    const key1 = queryKeys.projects.detail('proj-1');
    const key2 = queryKeys.projects.detail('proj-2');
    expect(key1).not.toEqual(key2);
  });

  it('has consistent all key for cache invalidation', () => {
    expect(queryKeys.projects.all).toEqual(['projects']);
  });
});

describe('integration scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthProfile = mockProfile;
  });

  it('handles rapid successive fetches', async () => {
    mockGetDocs.mockResolvedValue({
      docs: mockProjects.map((project) => ({
        id: project.id,
        data: () => ({ ...project, id: undefined }),
      })),
    });

    const { result, rerender } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    // Rerender multiple times
    rerender();
    rerender();
    rerender();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should deduplicate requests
    expect(result.current.data).toHaveLength(2);
  });

  it('maintains data consistency across create and list', async () => {
    // Initial fetch returns empty
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockAddDoc.mockResolvedValue({ id: 'new-project' });

    const wrapper = createWrapper();

    const { result: listResult } = renderHook(() => useProjects(), {
      wrapper,
    });

    await waitFor(() => {
      expect(listResult.current.isSuccess).toBe(true);
    });

    expect(listResult.current.data).toEqual([]);

    // Create should trigger invalidation
    const { result: createResult } = renderHook(() => useCreateProject(), {
      wrapper,
    });

    await act(async () => {
      await createResult.current.mutateAsync({ name: 'New Project' });
    });

    expect(toast.success).toHaveBeenCalledWith('Project created');
  });
});
