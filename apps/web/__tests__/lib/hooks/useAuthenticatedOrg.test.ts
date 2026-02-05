import { renderHook } from '@testing-library/react';
import { UserProfile } from '@/types';

let mockUseAuth: jest.Mock;

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useAuthenticatedOrg } from '@/lib/hooks/useAuthenticatedOrg';

function createMockProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'OWNER',
    orgId: 'test-org-123',
    isActive: true,
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
    ...overrides,
  } as UserProfile;
}

beforeEach(() => {
  mockUseAuth = jest.fn();
});

describe('useAuthenticatedOrg', () => {
  it('returns not ready with loading true when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: true,
      user: null,
      authError: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useAuthenticatedOrg());

    expect(result.current.ready).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.orgId).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('returns not ready with loading false when no profile (user not logged in)', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: false,
      user: null,
      authError: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useAuthenticatedOrg());

    expect(result.current.ready).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.orgId).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('returns not ready when profile has no orgId (new user, no org yet)', () => {
    const profileWithoutOrg = createMockProfile({ orgId: '' });
    mockUseAuth.mockReturnValue({
      profile: profileWithoutOrg,
      loading: false,
      user: { uid: 'test-user-123' },
      authError: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useAuthenticatedOrg());

    expect(result.current.ready).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.orgId).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('returns ready with orgId and profile when profile has orgId', () => {
    const profile = createMockProfile();
    mockUseAuth.mockReturnValue({
      profile,
      loading: false,
      user: { uid: 'test-user-123' },
      authError: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useAuthenticatedOrg());

    expect(result.current.ready).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.orgId).toBe('test-org-123');
    expect(result.current.profile).toBe(profile);
  });

  it('orgId is typed as string (not null) when ready is true', () => {
    const profile = createMockProfile({ orgId: 'org-abc-456' });
    mockUseAuth.mockReturnValue({
      profile,
      loading: false,
      user: { uid: 'test-user-123' },
      authError: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useAuthenticatedOrg());

    if (result.current.ready) {
      // TypeScript narrows orgId to string here (not string | null)
      const orgId: string = result.current.orgId;
      expect(typeof orgId).toBe('string');
      expect(orgId).toBe('org-abc-456');
    } else {
      fail('Expected ready to be true');
    }
  });

  it('profile is typed as UserProfile (not null) when ready is true', () => {
    const profile = createMockProfile({ displayName: 'Jane Contractor' });
    mockUseAuth.mockReturnValue({
      profile,
      loading: false,
      user: { uid: 'test-user-123' },
      authError: null,
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useAuthenticatedOrg());

    if (result.current.ready) {
      // TypeScript narrows profile to UserProfile here (not UserProfile | null)
      const narrowedProfile: UserProfile = result.current.profile;
      expect(narrowedProfile.displayName).toBe('Jane Contractor');
      expect(narrowedProfile.orgId).toBe('test-org-123');
    } else {
      fail('Expected ready to be true');
    }
  });
});
