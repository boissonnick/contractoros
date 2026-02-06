"use client";

import { useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Message, MessageChannel, MessageChannelType } from '@/types';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface MessageSearchResult {
  /** The matched message */
  message: Message;
  /** Channel the message belongs to */
  channelId: string;
  /** Human-readable channel name */
  channelName: string;
  /** The portion of text that matched the search query */
  matchedText: string;
  /** Relevance score: 3 = exact match, 2 = starts with, 1 = contains */
  relevance: number;
}

export interface UseMessageSearchReturn {
  /** Search results */
  results: MessageSearchResult[];
  /** Whether a search is in progress */
  loading: boolean;
  /** Error message if the search failed */
  error: string | null;
  /** Trigger a search across all user channels */
  search: (query: string) => Promise<void>;
  /** Clear current search results */
  clearResults: () => void;
}

// ============================================================================
// Firestore Converters
// ============================================================================

function channelFromFirestore(
  id: string,
  data: Record<string, unknown>
): MessageChannel {
  return {
    id,
    orgId: data.orgId as string,
    type: data.type as MessageChannelType,
    name: data.name as string,
    projectId: data.projectId as string | undefined,
    participantIds: (data.participantIds as string[]) || [],
    lastMessageAt: data.lastMessageAt
      ? (data.lastMessageAt as Timestamp).toDate()
      : undefined,
    lastMessageText: data.lastMessageText as string | undefined,
    lastMessageBy: data.lastMessageBy as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt
      ? (data.createdAt as Timestamp).toDate()
      : new Date(),
  };
}

function messageFromFirestore(
  id: string,
  data: Record<string, unknown>
): Message {
  return {
    id,
    channelId: data.channelId as string,
    orgId: data.orgId as string,
    senderId: data.senderId as string,
    senderName: data.senderName as string,
    senderAvatar: data.senderAvatar as string | undefined,
    text: data.text as string,
    mentions: (data.mentions as string[]) || [],
    attachmentURL: data.attachmentURL as string | undefined,
    attachmentName: data.attachmentName as string | undefined,
    isEdited: (data.isEdited as boolean) || false,
    readBy: data.readBy
      ? Object.fromEntries(
          Object.entries(data.readBy as Record<string, Timestamp>).map(
            ([uid, ts]) => [
              uid,
              ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date(),
            ]
          )
        )
      : undefined,
    createdAt: data.createdAt
      ? (data.createdAt as Timestamp).toDate()
      : new Date(),
    updatedAt: data.updatedAt
      ? (data.updatedAt as Timestamp).toDate()
      : undefined,
  };
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RESULTS = 20;
const MESSAGES_PER_CHANNEL = 100;
const DEBOUNCE_MS = 300;

// ============================================================================
// Hook: useMessageSearch
// ============================================================================

/**
 * Hook for searching messages across all channels the current user participates in.
 *
 * Since Firestore doesn't support full-text search, this fetches recent messages
 * from all user channels and filters client-side with case-insensitive string matching.
 * Results are cached to avoid re-fetching on every search invocation.
 *
 * @example
 * const { results, loading, search, clearResults } = useMessageSearch();
 * await search('budget approval');
 */
export function useMessageSearch(): UseMessageSearchReturn {
  const { user, profile } = useAuth();
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache: maps channelId -> { channel, messages }
  const cacheRef = useRef<{
    orgId: string;
    channels: Map<string, { channel: MessageChannel; messages: Message[] }>;
    fetchedAt: number;
  } | null>(null);

  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch all channels and their recent messages.
   * Results are cached for CACHE_TTL_MS to avoid repeated Firestore reads.
   */
  const fetchAllMessages = useCallback(async (): Promise<
    Map<string, { channel: MessageChannel; messages: Message[] }>
  > => {
    if (!profile?.orgId || !user?.uid) return new Map();

    // Return cached data if still fresh
    const cache = cacheRef.current;
    if (
      cache &&
      cache.orgId === profile.orgId &&
      Date.now() - cache.fetchedAt < CACHE_TTL_MS
    ) {
      return cache.channels;
    }

    // 1. Fetch channels the user participates in
    const channelsQuery = query(
      collection(db, 'messageChannels'),
      where('orgId', '==', profile.orgId),
      where('participantIds', 'array-contains', user.uid)
    );

    const channelSnap = await getDocs(channelsQuery);
    const channels = channelSnap.docs.map((d) =>
      channelFromFirestore(d.id, d.data() as Record<string, unknown>)
    );

    // 2. Fetch recent messages from each channel in parallel
    const channelMap = new Map<
      string,
      { channel: MessageChannel; messages: Message[] }
    >();

    const messageFetches = channels.map(async (ch) => {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('channelId', '==', ch.id),
        orderBy('createdAt', 'desc'),
        firestoreLimit(MESSAGES_PER_CHANNEL)
      );

      const msgSnap = await getDocs(messagesQuery);
      const msgs = msgSnap.docs.map((d) =>
        messageFromFirestore(d.id, d.data() as Record<string, unknown>)
      );

      channelMap.set(ch.id, { channel: ch, messages: msgs });
    });

    await Promise.all(messageFetches);

    // Update cache
    cacheRef.current = {
      orgId: profile.orgId,
      channels: channelMap,
      fetchedAt: Date.now(),
    };

    return channelMap;
  }, [profile?.orgId, user?.uid]);

  /**
   * Extract the matched portion of text around the query match.
   * Returns a window of text centered around the match for context.
   */
  const extractMatchedText = useCallback(
    (text: string, queryText: string): string => {
      const lowerText = text.toLowerCase();
      const lowerQuery = queryText.toLowerCase();
      const matchIndex = lowerText.indexOf(lowerQuery);

      if (matchIndex === -1) return text.slice(0, 80);

      // Show ~20 chars before and after the match
      const contextPadding = 20;
      const start = Math.max(0, matchIndex - contextPadding);
      const end = Math.min(
        text.length,
        matchIndex + queryText.length + contextPadding
      );

      let snippet = text.slice(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';

      return snippet;
    },
    []
  );

  /**
   * Score relevance of a message text against the search term.
   * 3 = exact match, 2 = starts with, 1 = contains, 0 = no match.
   */
  const scoreRelevance = useCallback(
    (text: string, term: string): number => {
      const lower = text.toLowerCase();
      const lowerTerm = term.toLowerCase();
      if (lower === lowerTerm) return 3;
      if (lower.startsWith(lowerTerm)) return 2;
      if (lower.includes(lowerTerm)) return 1;
      return 0;
    },
    []
  );

  /**
   * Internal search implementation. Fetches data if not cached,
   * then filters client-side with relevance scoring.
   */
  const executeSearch = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        return;
      }

      if (!profile?.orgId || !user?.uid) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const channelMap = await fetchAllMessages();
        const matchedResults: MessageSearchResult[] = [];

        // Iterate through all channels and their messages
        const entries = Array.from(channelMap.entries());
        for (let i = 0; i < entries.length; i++) {
          const [channelId, { channel, messages }] = entries[i];
          for (let j = 0; j < messages.length; j++) {
            const msg = messages[j];
            if (!msg.text) continue;
            const relevance = scoreRelevance(msg.text, trimmed);
            if (relevance > 0) {
              matchedResults.push({
                message: msg,
                channelId,
                channelName: channel.name,
                matchedText: extractMatchedText(msg.text, trimmed),
                relevance,
              });
            }
          }
        }

        // Sort by relevance first, then most recent
        matchedResults.sort((a, b) => {
          if (b.relevance !== a.relevance) return b.relevance - a.relevance;
          return b.message.createdAt.getTime() - a.message.createdAt.getTime();
        });

        setResults(matchedResults.slice(0, MAX_RESULTS));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Search failed';
        logger.error('Message search failed', {
          error: err,
          hook: 'useMessageSearch',
        });
        setError(message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [profile?.orgId, user?.uid, fetchAllMessages, extractMatchedText, scoreRelevance]
  );

  // Debounce ref for the search function
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Debounced search (300ms). Clears previous pending search on each call.
   * Call this from input onChange handlers for smooth UX.
   */
  const search = useCallback(
    async (queryText: string) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const trimmed = queryText.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Wrap the actual search in a debounced timeout
      return new Promise<void>((resolve) => {
        debounceRef.current = setTimeout(async () => {
          await executeSearch(queryText);
          resolve();
        }, DEBOUNCE_MS);
      });
    },
    [executeSearch]
  );

  const clearResults = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { results, loading, error, search, clearResults };
}

export default useMessageSearch;
