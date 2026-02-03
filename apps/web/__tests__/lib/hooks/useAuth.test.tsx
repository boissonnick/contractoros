/**
 * useAuth Hook Test Suite
 *
 * CRITICAL AUTHENTICATION TESTS
 * These tests verify the core authentication hook (useAuth) and AuthProvider
 * that handle login state, user profile fetching, and sign out functionality.
 *
 * This is the most critical hook in the application - all auth state flows through it.
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types';

// Mock functions - declared at module level
let mockOnAuthStateChanged: jest.Mock;
let mockSignOut: jest.Mock;
let mockGetDoc: jest.Mock;
let mockDoc: jest.Mock;
let mockUnsubscribe: jest.Mock;

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

// Mock firebase config (already mocked globally in jest.setup.js, but we override for control)
jest.mock('@/lib/firebase/config', () => ({
  auth: { mockAuth: true },
  db: { mockDb: true },
}));

// Import after mocks
import { AuthProvider, useAuth } from '@/lib/auth';

// Helper to create mock Firebase User objects
function createMockUser(overrides?: Partial<User>): User {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    isAnonymous: false,
    photoURL: null,
    phoneNumber: null,
    tenantId: null,
    providerId: 'firebase',
    metadata: {} as User['metadata'],
    providerData: [],
    refreshToken: '',
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    ...overrides,
  } as User;
}

// Helper to create mock UserProfile objects
function createMockProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'OWNER',
    orgId: 'test-org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
    ...overrides,
  } as UserProfile;
}

// Test component to access hook values
function TestComponent({ onRender }: { onRender?: (ctx: ReturnType<typeof useAuth>) => void }) {
  const authContext = useAuth();
  const { user, profile, loading, authError, signOut } = authContext;

  // Allow tests to capture the context
  React.useEffect(() => {
    onRender?.(authContext);
  }, [authContext, onRender]);

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.uid || 'null'}</span>
      <span data-testid="profile">{profile?.displayName || 'null'}</span>
      <span data-testid="profile-role">{profile?.role || 'null'}</span>
      <span data-testid="profile-orgId">{profile?.orgId || 'null'}</span>
      <span data-testid="error">{authError || 'null'}</span>
      <button onClick={signOut} data-testid="signout-button">Sign Out</button>
    </div>
  );
}

// Helper to render with provider
function renderWithAuth(props?: { onRender?: (ctx: ReturnType<typeof useAuth>) => void }) {
  return render(
    <AuthProvider>
      <TestComponent onRender={props?.onRender} />
    </AuthProvider>
  );
}

// Setup mocks before each test
beforeEach(() => {
  // Initialize all mocks
  mockUnsubscribe = jest.fn();
  mockOnAuthStateChanged = jest.fn().mockReturnValue(mockUnsubscribe);
  mockSignOut = jest.fn().mockResolvedValue(undefined);
  mockDoc = jest.fn().mockReturnValue({ id: 'mock-doc-ref' });
  mockGetDoc = jest.fn();

  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('useAuth Hook', () => {
  describe('Initial State', () => {
    it('returns loading: true initially while auth state is being determined', () => {
      renderWithAuth();

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('profile')).toHaveTextContent('null');
    });

    it('sets up auth state listener on mount', () => {
      renderWithAuth();

      expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        { mockAuth: true },
        expect.any(Function)
      );
    });
  });

  describe('Auth State Changes - User Signs In', () => {
    it('sets user after auth state change when user signs in', async () => {
      const mockUser = createMockUser({ uid: 'user-abc-123' });
      const mockProfile = createMockProfile({
        uid: 'user-abc-123',
        displayName: 'John Doe'
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      // Trigger the auth state change callback
      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('user-abc-123');
    });

    it('fetches user profile from Firestore after auth', async () => {
      const mockUser = createMockUser({ uid: 'firestore-user-123' });
      const mockProfile = createMockProfile({
        displayName: 'Jane Smith',
        role: 'PM',
        orgId: 'org-xyz-789'
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('Jane Smith');
      });

      expect(screen.getByTestId('profile-role')).toHaveTextContent('PM');
      expect(screen.getByTestId('profile-orgId')).toHaveTextContent('org-xyz-789');

      // Verify Firestore was called correctly
      expect(mockDoc).toHaveBeenCalledWith({ mockDb: true }, 'users', 'firestore-user-123');
      expect(mockGetDoc).toHaveBeenCalled();
    });

    it('clears authError when auth state changes successfully', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });
  });

  describe('Auth State Changes - User Signs Out', () => {
    it('sets user to null after auth state change when user signs out', async () => {
      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

      // Trigger auth state change with null user (signed out)
      await act(async () => {
        await authCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('sets profile to null when user signs out', async () => {
      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

      await act(async () => {
        await authCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('null');
      });
    });

    it('does not fetch profile when user is null', async () => {
      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

      await act(async () => {
        await authCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // getDoc should not have been called
      expect(mockGetDoc).not.toHaveBeenCalled();
    });
  });

  describe('Profile Fetching Edge Cases', () => {
    it('sets profile to null when user document does not exist in Firestore', async () => {
      const mockUser = createMockUser({ uid: 'no-profile-user' });

      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      // Spy on console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-profile-user');
      expect(screen.getByTestId('profile')).toHaveTextContent('null');
      expect(consoleSpy).toHaveBeenCalledWith(
        'User authenticated but no profile found in Firestore.'
      );

      consoleSpy.mockRestore();
    });

    it('handles Firestore errors gracefully without crashing', async () => {
      const mockUser = createMockUser({ uid: 'error-user' });

      const firestoreError = new Error('Firestore permission denied');
      mockGetDoc.mockRejectedValue(firestoreError);

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // User should still be set even if profile fetch fails
      expect(screen.getByTestId('user')).toHaveTextContent('error-user');
      // Profile should be null due to error
      expect(screen.getByTestId('profile')).toHaveTextContent('null');
      // Error should have been logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching user profile:',
        firestoreError
      );

      consoleSpy.mockRestore();
    });

    it('handles network timeout during profile fetch', async () => {
      const mockUser = createMockUser();

      const networkError = new Error('Network timeout');
      mockGetDoc.mockRejectedValue(networkError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should not crash - profile is null but app continues
      expect(screen.getByTestId('profile')).toHaveTextContent('null');

      consoleSpy.mockRestore();
    });
  });

  describe('Sign Out Functionality', () => {
    it('returns correct signOut function that calls Firebase signOut', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockProfile = createMockProfile();
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      // First, simulate user being signed in
      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(createMockUser());
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null');
      });

      // Click sign out button
      const signOutButton = screen.getByTestId('signout-button');
      await act(async () => {
        await user.click(signOutButton);
      });

      // Verify Firebase signOut was called with the auth instance
      expect(mockSignOut).toHaveBeenCalledWith({ mockAuth: true });
    });

    it('clears user and profile state after sign out', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      // Sign in
      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test-user-123');
      });

      // Sign out
      const signOutButton = screen.getByTestId('signout-button');
      await act(async () => {
        await user.click(signOutButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('profile')).toHaveTextContent('null');
      });
    });

    it('handles sign out errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const signOutError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(signOutError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockProfile = createMockProfile();
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      // Sign in first
      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(createMockUser());
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null');
      });

      // Attempt sign out
      const signOutButton = screen.getByTestId('signout-button');
      await act(async () => {
        await user.click(signOutButton);
      });

      // Should log error but not crash
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', signOutError);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Auth Timeout', () => {
    it('sets authError after timeout if auth state is not determined', async () => {
      // Don't trigger auth callback - simulating slow/stuck auth
      renderWithAuth();

      // Initially no error
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      // Fast-forward past the 10 second timeout
      await act(async () => {
        jest.advanceTimersByTime(10001);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Auth is taking longer than expected. The server may be unreachable.'
        );
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    it('does not set authError if auth resolves before timeout', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      // Trigger auth callback before timeout
      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

      await act(async () => {
        jest.advanceTimersByTime(5000); // Half the timeout
      });

      await act(async () => {
        await authCallback(mockUser);
      });

      // Advance past timeout
      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      // Should not have error since auth resolved
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('does not set authError if auth resolves with null user before timeout', async () => {
      renderWithAuth();

      // Trigger auth callback with null (no user) before timeout
      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await act(async () => {
        await authCallback(null);
      });

      // Advance past timeout
      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      // Should not have error - null user is a valid resolved state
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });
});

describe('AuthProvider', () => {
  describe('Context Provider', () => {
    it('provides context to children', async () => {
      const mockUser = createMockUser({ uid: 'context-user' });
      const mockProfile = createMockProfile({ displayName: 'Context User' });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      renderWithAuth();

      const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
      await act(async () => {
        await authCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('context-user');
        expect(screen.getByTestId('profile')).toHaveTextContent('Context User');
      });
    });

    it('renders children correctly', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child Component</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toHaveTextContent('Child Component');
    });

    it('allows multiple children', () => {
      render(
        <AuthProvider>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes from auth listener on unmount', () => {
      const { unmount } = renderWithAuth();

      expect(mockUnsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = renderWithAuth();

      unmount();

      // clearTimeout should be called (the actual timer ID is implementation detail)
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('unsubscribes and clears timeout even with pending auth', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = renderWithAuth();

      // Don't resolve auth - unmount while still loading
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });
});

describe('useAuth without Provider', () => {
  it('returns default context values when used outside provider', () => {
    // Render TestComponent without AuthProvider - uses default context
    function StandaloneComponent() {
      const { user, profile, loading, authError } = useAuth();
      return (
        <div>
          <span data-testid="standalone-loading">{String(loading)}</span>
          <span data-testid="standalone-user">{user?.uid || 'null'}</span>
          <span data-testid="standalone-profile">{profile?.displayName || 'null'}</span>
          <span data-testid="standalone-error">{authError || 'null'}</span>
        </div>
      );
    }

    render(<StandaloneComponent />);

    // Default context values
    expect(screen.getByTestId('standalone-loading')).toHaveTextContent('true');
    expect(screen.getByTestId('standalone-user')).toHaveTextContent('null');
    expect(screen.getByTestId('standalone-profile')).toHaveTextContent('null');
    expect(screen.getByTestId('standalone-error')).toHaveTextContent('null');
  });

  it('default signOut is a no-op function', async () => {
    let capturedSignOut: (() => Promise<void>) | null = null;

    function StandaloneComponent() {
      const { signOut } = useAuth();
      capturedSignOut = signOut;
      return <button onClick={signOut}>Sign Out</button>;
    }

    render(<StandaloneComponent />);

    // Should not throw
    await expect(capturedSignOut!()).resolves.toBeUndefined();
  });
});

describe('Multiple Auth State Changes', () => {
  it('handles user switching (sign out then sign in as different user)', async () => {
    const user1 = createMockUser({ uid: 'user-1', email: 'user1@test.com' });
    const user2 = createMockUser({ uid: 'user-2', email: 'user2@test.com' });
    const profile1 = createMockProfile({ uid: 'user-1', displayName: 'User One' });
    const profile2 = createMockProfile({ uid: 'user-2', displayName: 'User Two' });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => profile1 })
      .mockResolvedValueOnce({ exists: () => true, data: () => profile2 });

    renderWithAuth();

    const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

    // First user signs in
    await act(async () => {
      await authCallback(user1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user-1');
      expect(screen.getByTestId('profile')).toHaveTextContent('User One');
    });

    // User signs out
    await act(async () => {
      await authCallback(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('profile')).toHaveTextContent('null');
    });

    // Second user signs in
    await act(async () => {
      await authCallback(user2);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user-2');
      expect(screen.getByTestId('profile')).toHaveTextContent('User Two');
    });
  });

  it('handles rapid auth state changes', async () => {
    const user1 = createMockUser({ uid: 'rapid-user-1' });
    const user2 = createMockUser({ uid: 'rapid-user-2' });
    const profile1 = createMockProfile({ displayName: 'Rapid One' });
    const profile2 = createMockProfile({ displayName: 'Rapid Two' });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => profile1 })
      .mockResolvedValueOnce({ exists: () => true, data: () => profile2 });

    renderWithAuth();

    const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

    // Rapid changes
    await act(async () => {
      authCallback(user1);
      authCallback(user2);
    });

    // Should eventually settle on the last state
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('always clears authError on new auth state change', async () => {
    renderWithAuth();

    // Wait for timeout to trigger error
    await act(async () => {
      jest.advanceTimersByTime(10001);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('null');
    });

    // Now auth resolves
    const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
    const mockProfile = createMockProfile();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => mockProfile });

    await act(async () => {
      await authCallback(createMockUser());
    });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });
});

describe('Edge Cases', () => {
  it('handles user with minimal properties', async () => {
    const minimalUser = {
      uid: 'minimal-user',
    } as User;

    const mockProfile = createMockProfile();
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
    });

    renderWithAuth();

    const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
    await act(async () => {
      await authCallback(minimalUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('minimal-user');
    });
  });

  it('handles profile with minimal properties', async () => {
    const mockUser = createMockUser();
    const minimalProfile = {
      uid: 'minimal-profile-user',
      displayName: 'Minimal',
    } as UserProfile;

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => minimalProfile,
    });

    renderWithAuth();

    const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
    await act(async () => {
      await authCallback(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile')).toHaveTextContent('Minimal');
    });
  });

  it('handles getDoc returning undefined data', async () => {
    const mockUser = createMockUser();

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => undefined,
    });

    renderWithAuth();

    const authCallback = mockOnAuthStateChanged.mock.calls[0][1];
    await act(async () => {
      await authCallback(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Profile will be undefined (cast to UserProfile, treated as such)
    // This tests that the code doesn't crash on edge case data
  });
});
