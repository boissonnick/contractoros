/**
 * useBidIntelligence Hook
 *
 * Provides bid analysis, subcontractor scoring, and recommendations
 * for making better subcontractor selection decisions.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Bid,
  Subcontractor,
  SubAssignment,
  BidAnalysis,
  SubcontractorIntelligence,
  BidRecommendation,
} from '@/types';
import {
  analyzeBid,
  generateSubcontractorIntelligence,
  generateBidRecommendations,
} from '@/lib/intelligence/bid-intelligence';

interface UseBidIntelligenceOptions {
  /** All bids for the current project */
  projectBids?: Bid[];
  /** All subcontractors in the organization */
  subcontractors?: Subcontractor[];
  /** All sub assignments across projects */
  assignments?: SubAssignment[];
  /** Historical bids by subcontractor ID */
  bidHistory?: Map<string, Bid[]>;
}

interface UseBidIntelligenceReturn {
  /** Analyze a specific bid */
  analyzeBid: (bidId: string) => BidAnalysis | null;
  /** Get intelligence for a subcontractor */
  getSubIntelligence: (subId: string) => SubcontractorIntelligence | null;
  /** Get recommendations for requesting bids */
  getBidRecommendations: (trade: string) => BidRecommendation | null;
  /** All bid analyses for current project */
  bidAnalyses: Map<string, BidAnalysis>;
  /** All sub intelligence scores */
  subIntelligence: Map<string, SubcontractorIntelligence>;
  /** Rank bids by score */
  rankedBids: Array<{ bid: Bid; analysis: BidAnalysis }>;
  /** Top recommended subs by trade */
  getTopSubsForTrade: (trade: string, limit?: number) => Array<{ sub: Subcontractor; score: number }>;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
}

export function useBidIntelligence(options: UseBidIntelligenceOptions = {}): UseBidIntelligenceReturn {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    projectBids = [],
    subcontractors = [],
    assignments = [],
    bidHistory = new Map(),
  } = options;

  // Build sub intelligence map
  const subIntelligence = useMemo(() => {
    const intelligence = new Map<string, SubcontractorIntelligence>();

    subcontractors.forEach(sub => {
      const subAssignments = assignments.filter(a => a.subId === sub.id);
      const subBids = bidHistory.get(sub.id) || [];

      const intel = generateSubcontractorIntelligence(sub, subAssignments, subBids);
      intelligence.set(sub.id, intel);
    });

    return intelligence;
  }, [subcontractors, assignments, bidHistory]);

  // Analyze all bids for current project
  const bidAnalyses = useMemo(() => {
    const analyses = new Map<string, BidAnalysis>();

    projectBids.forEach(bid => {
      const sub = subcontractors.find(s => s.id === bid.subId);
      if (!sub) return;

      const subBidHistory = bidHistory.get(bid.subId) || [];
      const subAssignments = assignments.filter(a => a.subId === bid.subId);

      const analysis = analyzeBid(
        bid,
        sub,
        projectBids,
        { bids: subBidHistory, assignments: subAssignments }
      );

      analyses.set(bid.id, analysis);
    });

    return analyses;
  }, [projectBids, subcontractors, bidHistory, assignments]);

  // Rank bids by score
  const rankedBids = useMemo(() => {
    return projectBids
      .map(bid => {
        const analysis = bidAnalyses.get(bid.id);
        return analysis ? { bid, analysis } : null;
      })
      .filter((item): item is { bid: Bid; analysis: BidAnalysis } => item !== null)
      .sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
  }, [projectBids, bidAnalyses]);

  // Analyze a specific bid
  const analyzeBidById = useCallback(
    (bidId: string): BidAnalysis | null => {
      return bidAnalyses.get(bidId) || null;
    },
    [bidAnalyses]
  );

  // Get intelligence for a subcontractor
  const getSubIntelligence = useCallback(
    (subId: string): SubcontractorIntelligence | null => {
      return subIntelligence.get(subId) || null;
    },
    [subIntelligence]
  );

  // Get bid recommendations for a trade
  const getBidRecommendations = useCallback(
    (trade: string): BidRecommendation | null => {
      if (!profile?.orgId) return null;

      try {
        return generateBidRecommendations(
          'current-project', // Would come from context
          trade,
          subcontractors,
          subIntelligence
        );
      } catch (err) {
        console.error('Error generating bid recommendations:', err);
        return null;
      }
    },
    [profile?.orgId, subcontractors, subIntelligence]
  );

  // Get top subs for a trade
  const getTopSubsForTrade = useCallback(
    (trade: string, limit = 5): Array<{ sub: Subcontractor; score: number }> => {
      return subcontractors
        .filter(s => s.trade.toLowerCase() === trade.toLowerCase() && s.isActive)
        .map(sub => ({
          sub,
          score: subIntelligence.get(sub.id)?.overallScore || 50,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    [subcontractors, subIntelligence]
  );

  return {
    analyzeBid: analyzeBidById,
    getSubIntelligence,
    getBidRecommendations,
    bidAnalyses,
    subIntelligence,
    rankedBids,
    getTopSubsForTrade,
    loading,
    error,
  };
}

/**
 * Hook for analyzing a single bid
 */
export function useBidAnalysis(
  bid: Bid | null,
  sub: Subcontractor | null,
  allProjectBids: Bid[] = [],
  bidHistory: Bid[] = [],
  assignments: SubAssignment[] = []
): BidAnalysis | null {
  return useMemo(() => {
    if (!bid || !sub) return null;

    return analyzeBid(bid, sub, allProjectBids, { bids: bidHistory, assignments });
  }, [bid, sub, allProjectBids, bidHistory, assignments]);
}

/**
 * Hook for subcontractor scoring
 */
export function useSubcontractorScore(
  sub: Subcontractor | null,
  assignments: SubAssignment[] = [],
  bids: Bid[] = []
): SubcontractorIntelligence | null {
  return useMemo(() => {
    if (!sub) return null;

    return generateSubcontractorIntelligence(sub, assignments, bids);
  }, [sub, assignments, bids]);
}

export default useBidIntelligence;
