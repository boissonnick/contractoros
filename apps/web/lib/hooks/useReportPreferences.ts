"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ReportPreferences, FinancialMetricId, MetricCardDefinition } from '@/types';

/**
 * Default metric card definitions for financial reports
 */
export const METRIC_CARD_DEFINITIONS: MetricCardDefinition[] = [
  // KPI Cards
  {
    id: 'total-revenue',
    title: 'Total Revenue',
    description: 'Sum of all paid invoices',
    category: 'kpi',
    defaultVisible: true,
  },
  {
    id: 'total-expenses',
    title: 'Total Expenses',
    description: 'Sum of all approved expenses',
    category: 'kpi',
    defaultVisible: true,
  },
  {
    id: 'net-profit',
    title: 'Net Profit',
    description: 'Revenue minus all costs',
    category: 'kpi',
    defaultVisible: true,
  },
  {
    id: 'net-margin',
    title: 'Net Margin',
    description: 'Net profit as percentage of revenue',
    category: 'kpi',
    defaultVisible: true,
  },
  // P&L Statement
  {
    id: 'pnl-statement',
    title: 'Profit & Loss Statement',
    description: 'Detailed breakdown of revenue and costs',
    category: 'table',
    defaultVisible: true,
  },
  // Charts
  {
    id: 'revenue-trend',
    title: 'Revenue & Profit Trend',
    description: 'Monthly revenue, expenses, and profit over time',
    category: 'chart',
    defaultVisible: true,
  },
  {
    id: 'cost-breakdown',
    title: 'Cost Breakdown',
    description: 'Distribution of all costs by category',
    category: 'chart',
    defaultVisible: true,
  },
  {
    id: 'revenue-by-client',
    title: 'Revenue by Client',
    description: 'Top clients ranked by paid invoices',
    category: 'chart',
    defaultVisible: true,
  },
  {
    id: 'revenue-by-project',
    title: 'Revenue by Project',
    description: 'Project revenue with P&L detail',
    category: 'chart',
    defaultVisible: true,
  },
  // Budget & Cash Flow
  {
    id: 'budget-summary',
    title: 'Budget Summary',
    description: 'Total budget and cash flow status',
    category: 'kpi',
    defaultVisible: true,
  },
  // Additional Charts
  {
    id: 'expenses-by-category',
    title: 'Expenses by Category',
    description: 'Distribution of approved expenses',
    category: 'chart',
    defaultVisible: true,
  },
  {
    id: 'invoice-aging',
    title: 'Invoice Aging Chart',
    description: 'Outstanding invoices by age (bar chart)',
    category: 'chart',
    defaultVisible: true,
  },
  // Tables
  {
    id: 'project-profitability',
    title: 'Project Profitability Table',
    description: 'Budget vs actual spend by project',
    category: 'table',
    defaultVisible: true,
  },
  {
    id: 'invoice-aging-detail',
    title: 'Invoice Aging Summary',
    description: 'Detailed invoice aging breakdown',
    category: 'table',
    defaultVisible: true,
  },
];

/**
 * Get default preferences with all metrics visible
 */
export function getDefaultPreferences(orgId: string, userId: string): ReportPreferences {
  const allMetricIds = METRIC_CARD_DEFINITIONS.map(m => m.id);
  return {
    id: 'financial',
    orgId,
    userId,
    visibleMetrics: allMetricIds,
    metricOrder: allMetricIds,
    favoriteMetrics: ['total-revenue', 'net-profit', 'net-margin'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Hook for managing financial report preferences
 */
export function useReportPreferences(orgId?: string, userId?: string) {
  const [preferences, setPreferences] = useState<ReportPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      if (!orgId || !userId) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'organizations', orgId, 'reportPreferences', 'financial');
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setPreferences({
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ReportPreferences);
        } else {
          // Use default preferences
          setPreferences(getDefaultPreferences(orgId, userId));
        }
      } catch (err) {
        console.error('Failed to load report preferences:', err);
        setError(err as Error);
        // Fall back to defaults on error
        setPreferences(getDefaultPreferences(orgId, userId));
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [orgId, userId]);

  // Save preferences to Firestore
  const savePreferences = useCallback(async (updates: Partial<ReportPreferences>) => {
    if (!orgId || !userId || !preferences) return;

    setSaving(true);
    setError(null);

    try {
      const docRef = doc(db, 'organizations', orgId, 'reportPreferences', 'financial');
      const updatedPreferences = {
        ...preferences,
        ...updates,
        userId, // Track who last modified
        updatedAt: Timestamp.now(),
      };

      await setDoc(docRef, {
        ...updatedPreferences,
        createdAt: preferences.createdAt instanceof Date
          ? Timestamp.fromDate(preferences.createdAt)
          : preferences.createdAt,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setPreferences({
        ...updatedPreferences,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('Failed to save report preferences:', err);
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId, userId, preferences]);

  // Toggle metric visibility
  const toggleMetricVisibility = useCallback((metricId: FinancialMetricId) => {
    if (!preferences) return;

    const isVisible = preferences.visibleMetrics.includes(metricId);
    const newVisibleMetrics = isVisible
      ? preferences.visibleMetrics.filter(id => id !== metricId)
      : [...preferences.visibleMetrics, metricId];

    // Also update order if adding back
    let newMetricOrder = preferences.metricOrder;
    if (!isVisible && !preferences.metricOrder.includes(metricId)) {
      newMetricOrder = [...preferences.metricOrder, metricId];
    }

    savePreferences({
      visibleMetrics: newVisibleMetrics,
      metricOrder: newMetricOrder,
    });
  }, [preferences, savePreferences]);

  // Toggle metric favorite status
  const toggleMetricFavorite = useCallback((metricId: FinancialMetricId) => {
    if (!preferences) return;

    const isFavorite = preferences.favoriteMetrics.includes(metricId);
    const newFavoriteMetrics = isFavorite
      ? preferences.favoriteMetrics.filter(id => id !== metricId)
      : [...preferences.favoriteMetrics, metricId];

    savePreferences({ favoriteMetrics: newFavoriteMetrics });
  }, [preferences, savePreferences]);

  // Move metric up in order
  const moveMetricUp = useCallback((metricId: FinancialMetricId) => {
    if (!preferences) return;

    const currentIndex = preferences.metricOrder.indexOf(metricId);
    if (currentIndex <= 0) return;

    const newOrder = [...preferences.metricOrder];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

    savePreferences({ metricOrder: newOrder });
  }, [preferences, savePreferences]);

  // Move metric down in order
  const moveMetricDown = useCallback((metricId: FinancialMetricId) => {
    if (!preferences) return;

    const currentIndex = preferences.metricOrder.indexOf(metricId);
    if (currentIndex < 0 || currentIndex >= preferences.metricOrder.length - 1) return;

    const newOrder = [...preferences.metricOrder];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

    savePreferences({ metricOrder: newOrder });
  }, [preferences, savePreferences]);

  // Reset to default preferences
  const resetToDefaults = useCallback(() => {
    if (!orgId || !userId) return;
    const defaults = getDefaultPreferences(orgId, userId);
    savePreferences(defaults);
  }, [orgId, userId, savePreferences]);

  // Get ordered visible metrics
  const getOrderedVisibleMetrics = useCallback((): FinancialMetricId[] => {
    if (!preferences) return [];

    return preferences.metricOrder.filter(id => preferences.visibleMetrics.includes(id));
  }, [preferences]);

  // Check if metric is visible
  const isMetricVisible = useCallback((metricId: FinancialMetricId): boolean => {
    return preferences?.visibleMetrics.includes(metricId) ?? true;
  }, [preferences]);

  // Check if metric is favorite
  const isMetricFavorite = useCallback((metricId: FinancialMetricId): boolean => {
    return preferences?.favoriteMetrics.includes(metricId) ?? false;
  }, [preferences]);

  return {
    preferences,
    loading,
    saving,
    error,
    savePreferences,
    toggleMetricVisibility,
    toggleMetricFavorite,
    moveMetricUp,
    moveMetricDown,
    resetToDefaults,
    getOrderedVisibleMetrics,
    isMetricVisible,
    isMetricFavorite,
    metricDefinitions: METRIC_CARD_DEFINITIONS,
  };
}
