/**
 * @fileoverview Unit tests for useMessages and useChannels hooks
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useChannels: Message channel management
 * - useMessages: Message CRUD within channels
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useChannels, useMessages } from '@/lib/hooks/useMessages';
import { MessageChannel, Message, MessageChannelType } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock useAuth
const mockUser = { uid: 'user-123', email: 'test@example.com' };
const mockProfile = {
  uid: 'user-123',
  orgId: 'org-123',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    profile: mockProfile,
  })),
}));

// Mock Firestore
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  limit: jest.fn((n) => ({ n, _type: 'limit' })),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((d) => ({ toDate: () => d })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules
import { useAuth } from '@/lib/auth';
import { onSnapshot, addDoc, updateDoc } from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'org-123';
const mockUserId = 'user-123';

const createMockChannel = (overrides: Partial<MessageChannel> = {}): MessageChannel => ({
  id: `channel-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  type: 'project' as MessageChannelType,
  name: 'Test Channel',
  participantIds: [mockUserId],
  createdBy: mockUserId,
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: `msg-${Math.random().toString(36).slice(2)}`,
  channelId: 'channel-1',
  orgId: mockOrgId,
  senderId: mockUserId,
  senderName: 'Test User',
  text: 'Hello, world!',
  mentions: [],
  isEdited: false,
  createdAt: new Date('2024-01-15T10:00:00'),
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Reset useAuth mock
  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
  });

  // Default mock for onSnapshot
  (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
    setTimeout(() => {
      onNext({ docs: [] });
    }, 0);
    return jest.fn(); // Unsubscribe function
  });

  // Default mock implementations
  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-doc-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// useChannels TESTS
// =============================================================================

describe('useChannels', () => {
  describe('basic functionality', () => {
    it('should return empty channels when no data', async () => {
      const { result } = renderHook(() => useChannels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.channels).toEqual([]);
    });

    it('should return channels from Firestore', async () => {
      const mockChannels = [
        createMockChannel({ id: 'channel-1', name: 'General' }),
        createMockChannel({ id: 'channel-2', name: 'Project Updates' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockChannels.map((channel) => ({
              id: channel.id,
              data: () => ({
                ...channel,
                createdAt: { toDate: () => channel.createdAt },
                lastMessageAt: channel.lastMessageAt
                  ? { toDate: () => channel.lastMessageAt }
                  : undefined,
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useChannels());

      await waitFor(() => {
        expect(result.current.channels).toHaveLength(2);
      });
    });

    it('should sort channels by lastMessageAt or createdAt', async () => {
      const channel1 = createMockChannel({
        id: 'channel-1',
        createdAt: new Date('2024-01-01'),
        lastMessageAt: new Date('2024-01-10'),
      });
      const channel2 = createMockChannel({
        id: 'channel-2',
        createdAt: new Date('2024-01-05'),
        lastMessageAt: new Date('2024-01-15'),
      });
      const channel3 = createMockChannel({
        id: 'channel-3',
        createdAt: new Date('2024-01-12'),
      });

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [channel1, channel2, channel3].map((channel) => ({
              id: channel.id,
              data: () => ({
                ...channel,
                createdAt: { toDate: () => channel.createdAt },
                lastMessageAt: channel.lastMessageAt
                  ? { toDate: () => channel.lastMessageAt }
                  : undefined,
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useChannels());

      await waitFor(() => {
        expect(result.current.channels).toHaveLength(3);
      });

      // Should be sorted by most recent activity first
      expect(result.current.channels[0].id).toBe('channel-2'); // lastMessageAt: Jan 15
      expect(result.current.channels[1].id).toBe('channel-3'); // createdAt: Jan 12
      expect(result.current.channels[2].id).toBe('channel-1'); // lastMessageAt: Jan 10
    });

    it('should not fetch without orgId', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useChannels());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should not fetch without user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useChannels());

      expect(result.current.loading).toBe(false);
      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('createChannel', () => {
    it('should create a channel and return id', async () => {
      const { result } = renderHook(() => useChannels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let channelId: string;
      await act(async () => {
        channelId = await result.current.createChannel({
          name: 'New Channel',
          type: 'project',
          participantIds: ['user-456'],
        });
      });

      expect(addDoc).toHaveBeenCalled();
      expect(channelId!).toBe('new-doc-id');
    });

    it('should include current user in participants if not already', async () => {
      const { result } = renderHook(() => useChannels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createChannel({
          name: 'New Channel',
          type: 'project',
          participantIds: ['user-456'],
        });
      });

      // Check that addDoc was called with participantIds including both users
      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.participantIds).toContain(mockUserId);
      expect(callArg.participantIds).toContain('user-456');
      expect(callArg.participantIds).toHaveLength(2);
    });

    it('should not duplicate current user in participants', async () => {
      const { result } = renderHook(() => useChannels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createChannel({
          name: 'New Channel',
          type: 'project',
          participantIds: [mockUserId, 'user-456'],
        });
      });

      // Check that participantIds doesn't have duplicates
      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.participantIds).toEqual([mockUserId, 'user-456']);
    });

    it('should throw error without organization', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useChannels());

      await expect(
        result.current.createChannel({
          name: 'Test',
          type: 'direct',
          participantIds: [],
        })
      ).rejects.toThrow('No organization');
    });

    it('should throw error without user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useChannels());

      await expect(
        result.current.createChannel({
          name: 'Test',
          type: 'direct',
          participantIds: [],
        })
      ).rejects.toThrow('No organization');
    });
  });
});

// =============================================================================
// useMessages TESTS
// =============================================================================

describe('useMessages', () => {
  describe('basic functionality', () => {
    it('should return empty messages when channelId is null', async () => {
      const { result } = renderHook(() => useMessages(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should return messages from Firestore', async () => {
      const mockMessages = [
        createMockMessage({ id: 'msg-1', text: 'Hello' }),
        createMockMessage({ id: 'msg-2', text: 'World' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockMessages.map((msg) => ({
              id: msg.id,
              data: () => ({
                ...msg,
                createdAt: { toDate: () => msg.createdAt },
                updatedAt: msg.updatedAt ? { toDate: () => msg.updatedAt } : undefined,
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useMessages('channel-1'));

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      expect(result.current.messages[0].text).toBe('Hello');
      expect(result.current.messages[1].text).toBe('World');
    });

    it('should clear messages when channelId becomes null', async () => {
      const mockMessages = [createMockMessage({ id: 'msg-1' })];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockMessages.map((msg) => ({
              id: msg.id,
              data: () => ({
                ...msg,
                createdAt: { toDate: () => msg.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result, rerender } = renderHook(
        ({ channelId }) => useMessages(channelId),
        { initialProps: { channelId: 'channel-1' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
      });

      // Change to null
      rerender({ channelId: null });

      await waitFor(() => {
        expect(result.current.messages).toEqual([]);
      });
    });

    it('should query with correct constraints', () => {
      renderHook(() => useMessages('channel-1'));

      const { where, orderBy, limit } = require('firebase/firestore');
      expect(where).toHaveBeenCalledWith('channelId', '==', 'channel-1');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc');
      expect(limit).toHaveBeenCalledWith(200);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage('Hello, world!');
      });

      // First call to addDoc should be for the message
      const messageCall = (addDoc as jest.Mock).mock.calls[0];
      expect(messageCall[1]).toMatchObject({
        channelId: 'channel-1',
        orgId: mockOrgId,
        senderId: mockUserId,
        senderName: 'Test User',
        text: 'Hello, world!',
        mentions: [],
        isEdited: false,
      });
    });

    it('should update channel last message info', async () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage('Hello!');
      });

      // updateDoc should be called for channel update
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1]).toMatchObject({
        lastMessageText: 'Hello!',
        lastMessageBy: 'Test User',
      });
    });

    it('should truncate long messages in channel preview', async () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const longMessage = 'A'.repeat(150);

      await act(async () => {
        await result.current.sendMessage(longMessage);
      });

      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      expect(updateCall[1].lastMessageText).toBe('A'.repeat(100));
    });

    it('should include mentions in message', async () => {
      const { result } = renderHook(() => useMessages('channel-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage('Hey @user-456!', ['user-456']);
      });

      const messageCall = (addDoc as jest.Mock).mock.calls[0];
      expect(messageCall[1]).toMatchObject({
        text: 'Hey @user-456!',
        mentions: ['user-456'],
      });
    });

    it('should throw error without channelId', async () => {
      const { result } = renderHook(() => useMessages(null));

      await expect(result.current.sendMessage('Hello')).rejects.toThrow('Missing context');
    });

    it('should throw error without user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useMessages('channel-1'));

      await expect(result.current.sendMessage('Hello')).rejects.toThrow('Missing context');
    });

    it('should throw error without profile', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useMessages('channel-1'));

      await expect(result.current.sendMessage('Hello')).rejects.toThrow('Missing context');
    });
  });
});
