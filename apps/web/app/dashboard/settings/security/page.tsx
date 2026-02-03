'use client';

/**
 * Security Checklist Dashboard
 *
 * Comprehensive security status view for organization administrators.
 * Displays security score, category breakdowns, issue tracking, and historical trends.
 * Restricted to OWNER role only.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { RouteGuard } from '@/components/auth';
import { Card, Button, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  runSecurityChecks,
  calculateSecurityScore,
  saveSecurityChecks,
  saveSecurityHistory,
  getSecurityHistory,
  updateSecurityCheck,
  groupChecksByCategory,
  getFailedChecksBySeverity,
  getScoreGrade,
  SecurityCheckItem,
  SecurityScore,
  SecurityCheckHistory,
  SecurityCategory,
  SecurityCheckStatus,
  SECURITY_CATEGORY_LABELS,
  SECURITY_CATEGORY_DESCRIPTIONS,
  SECURITY_STATUS_CONFIG,
  SECURITY_SEVERITY_CONFIG,
  DEFAULT_SECURITY_CHECKS,
} from '@/lib/security/security-checklist';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  KeyIcon,
  LockClosedIcon,
  GlobeAltIcon,
  DocumentCheckIcon,
  ClockIcon,
  InformationCircleIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================
// Security Score Gauge Component
// ============================================

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function ScoreGauge({ score, size = 'lg' }: ScoreGaugeProps) {
  const grade = getScoreGrade(score);

  const sizes = {
    sm: { width: 100, height: 100, strokeWidth: 8, fontSize: 'text-xl', gradeSize: 'text-xs' },
    md: { width: 140, height: 140, strokeWidth: 10, fontSize: 'text-3xl', gradeSize: 'text-sm' },
    lg: { width: 180, height: 180, strokeWidth: 12, fontSize: 'text-4xl', gradeSize: 'text-base' },
  };

  const { width, height, strokeWidth, fontSize, gradeSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color based on score
  const getStrokeColor = () => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 60) return '#eab308'; // yellow-500
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={height} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', fontSize, grade.color)}>{score}</span>
        <span className={cn('font-medium', gradeSize, 'text-gray-500')}>{grade.label}</span>
      </div>
    </div>
  );
}

// ============================================
// Category Score Card Component
// ============================================

interface CategoryScoreCardProps {
  category: SecurityCategory;
  score: number;
  checks: SecurityCheckItem[];
  expanded: boolean;
  onToggle: () => void;
}

function CategoryScoreCard({
  category,
  score,
  checks,
  expanded,
  onToggle,
}: CategoryScoreCardProps) {
  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  const getCategoryIcon = () => {
    switch (category) {
      case 'authentication':
        return <KeyIcon className="h-5 w-5" />;
      case 'authorization':
        return <ShieldCheckIcon className="h-5 w-5" />;
      case 'data':
        return <LockClosedIcon className="h-5 w-5" />;
      case 'network':
        return <GlobeAltIcon className="h-5 w-5" />;
      case 'compliance':
        return <DocumentCheckIcon className="h-5 w-5" />;
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', getScoreColor())}>{getCategoryIcon()}</div>
          <div className="text-left">
            <h4 className="font-medium text-gray-900">{SECURITY_CATEGORY_LABELS[category]}</h4>
            <p className="text-sm text-gray-500">{SECURITY_CATEGORY_DESCRIPTIONS[category]}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {passedCount > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                {passedCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {warningCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircleIcon className="h-4 w-4" />
                {failedCount}
              </span>
            )}
          </div>
          <div className={cn('px-3 py-1 rounded-full text-sm font-medium', getScoreColor())}>
            {score}%
          </div>
          {expanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {checks.map((check) => (
            <SecurityCheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================
// Security Check Row Component
// ============================================

interface SecurityCheckRowProps {
  check: SecurityCheckItem;
  showCategory?: boolean;
}

function SecurityCheckRow({ check, showCategory = false }: SecurityCheckRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const statusConfig = SECURITY_STATUS_CONFIG[check.status];
  const severityConfig = SECURITY_SEVERITY_CONFIG[check.severity];

  const getStatusIcon = () => {
    switch (check.status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="font-medium text-gray-900">{check.name}</h5>
              <Badge
                variant={
                  check.severity === 'critical'
                    ? 'danger'
                    : check.severity === 'high'
                    ? 'warning'
                    : 'default'
                }
                size="sm"
              >
                {severityConfig.label}
              </Badge>
              {check.autoCheck && (
                <span className="text-xs text-gray-400" title="Automatically checked">
                  Auto
                </span>
              )}
              {check.manualOverride && (
                <span className="text-xs text-blue-500" title="Manually verified">
                  Manual
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{check.description}</p>
            {check.details && (
              <p className="text-sm text-gray-600 mt-1 italic">{check.details}</p>
            )}
            {check.lastChecked && (
              <p className="text-xs text-gray-400 mt-1">
                Last checked: {formatDistanceToNow(check.lastChecked, { addSuffix: true })}
              </p>
            )}

            {/* Expandable remediation */}
            {check.remediation && (check.status === 'failed' || check.status === 'warning') && (
              <>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1"
                >
                  <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
                  {showDetails ? 'Hide remediation' : 'Show remediation'}
                </button>
                {showDetails && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">Recommended Action:</p>
                    <p>{check.remediation}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Badge
          variant={
            check.status === 'passed'
              ? 'success'
              : check.status === 'failed'
              ? 'danger'
              : check.status === 'warning'
              ? 'warning'
              : 'default'
          }
          size="sm"
        >
          {statusConfig.label}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// History Chart Component
// ============================================

interface HistoryChartProps {
  history: SecurityCheckHistory[];
}

function HistoryChart({ history }: HistoryChartProps) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
        No history data available yet. Run a security check to start tracking.
      </div>
    );
  }

  // Reverse to show oldest first for chart
  const sortedHistory = [...history].reverse().slice(-14); // Last 14 entries
  const maxScore = 100;

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-full gap-1">
        {sortedHistory.map((entry, index) => {
          const height = `${(entry.score / maxScore) * 100}%`;
          const getBarColor = () => {
            if (entry.score >= 80) return 'bg-green-500';
            if (entry.score >= 60) return 'bg-yellow-500';
            if (entry.score >= 40) return 'bg-orange-500';
            return 'bg-red-500';
          };

          return (
            <div
              key={entry.id}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              <div
                className={cn(
                  'w-full rounded-t transition-all hover:opacity-80',
                  getBarColor()
                )}
                style={{ height }}
                title={`${entry.score}% on ${format(entry.timestamp, 'MMM d, yyyy')}`}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <p className="font-medium">{entry.score}%</p>
                  <p>{format(entry.timestamp, 'MMM d, h:mm a')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{sortedHistory[0] && format(sortedHistory[0].timestamp, 'MMM d')}</span>
        <span>
          {sortedHistory[sortedHistory.length - 1] &&
            format(sortedHistory[sortedHistory.length - 1].timestamp, 'MMM d')}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Issues List Component
// ============================================

interface IssuesListProps {
  checks: SecurityCheckItem[];
}

function IssuesList({ checks }: IssuesListProps) {
  const failedChecks = getFailedChecksBySeverity(checks);

  if (failedChecks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mb-3" />
        <p className="text-gray-900 font-medium">No Issues Found</p>
        <p className="text-sm text-gray-500">All security checks are passing</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 -mx-4">
      {failedChecks.map((check) => (
        <SecurityCheckRow key={check.id} check={check} showCategory />
      ))}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function SecurityChecklistPage() {
  const { user, profile } = useAuth();
  const [checks, setChecks] = useState<SecurityCheckItem[]>([]);
  const [history, setHistory] = useState<SecurityCheckHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<SecurityCategory>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'history'>('overview');

  const orgId = profile?.orgId;
  const isOwner = profile?.role === 'OWNER';

  // Calculate score
  const score = useMemo(() => calculateSecurityScore(checks), [checks]);

  // Group checks by category
  const checksByCategory = useMemo(() => groupChecksByCategory(checks), [checks]);

  // Load initial data
  useEffect(() => {
    if (!orgId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Run security checks
        const checkResults = await runSecurityChecks(orgId);
        setChecks(checkResults);

        // Load history
        const historyData = await getSecurityHistory(orgId);
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to load security data:', error);
        setChecks(DEFAULT_SECURITY_CHECKS);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  // Run security check
  const handleRunCheck = useCallback(async () => {
    if (!orgId || !user?.uid) return;

    setRunning(true);
    try {
      const previousChecks = [...checks];
      const checkResults = await runSecurityChecks(orgId);
      const newScore = calculateSecurityScore(checkResults);

      // Save results
      await saveSecurityChecks(orgId, checkResults, user.uid);

      // Save history if there are changes
      const hasChanges = previousChecks.some((prev) => {
        const current = checkResults.find((c) => c.id === prev.id);
        return current && current.status !== prev.status;
      });

      if (hasChanges || history.length === 0) {
        await saveSecurityHistory(orgId, newScore, previousChecks, checkResults, user.uid);
        const newHistory = await getSecurityHistory(orgId);
        setHistory(newHistory);
      }

      setChecks(checkResults);
      toast.success('Security check completed');
    } catch (error) {
      console.error('Failed to run security check:', error);
      toast.error('Failed to run security check');
    } finally {
      setRunning(false);
    }
  }, [orgId, user?.uid, checks, history.length]);

  // Toggle category expansion
  const toggleCategory = (category: SecurityCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Check owner role
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShieldExclamationIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-center max-w-md">
          Security settings are only accessible to organization owners for security and compliance
          purposes.
        </p>
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security Checklist</h2>
            <p className="text-sm text-gray-500">
              Monitor your organization&apos;s security posture and compliance status.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleRunCheck}
            disabled={running || loading}
          >
            {running ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Running Check...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Run Security Check
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Score Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Score Card */}
              <Card className="lg:col-span-1 p-6">
                <div className="flex flex-col items-center">
                  <ScoreGauge score={score.overall} />
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {score.passedChecks} of {score.totalChecks} checks passing
                    </p>
                  </div>
                  {/* Issue counts */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    {score.criticalIssues > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {score.criticalIssues} Critical
                      </span>
                    )}
                    {score.highIssues > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        {score.highIssues} High
                      </span>
                    )}
                    {score.mediumIssues > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        {score.mediumIssues} Medium
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="lg:col-span-2 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {(Object.keys(SECURITY_CATEGORY_LABELS) as SecurityCategory[]).map((category) => {
                    const categoryScore = score.byCategory[category];
                    const grade = getScoreGrade(categoryScore);
                    return (
                      <div
                        key={category}
                        className="flex flex-col items-center p-3 rounded-lg bg-gray-50"
                      >
                        <ScoreGauge score={categoryScore} size="sm" />
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          {SECURITY_CATEGORY_LABELS[category]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <EyeIcon className="h-4 w-4 inline mr-1.5" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'issues'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 inline mr-1.5" />
                  Issues
                  {(score.criticalIssues + score.highIssues) > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
                      {score.criticalIssues + score.highIssues}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'history'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <ChartBarIcon className="h-4 w-4 inline mr-1.5" />
                  History
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Security Best Practices</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Run security checks regularly to ensure your organization maintains a strong
                        security posture. Address critical and high severity issues first.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Cards */}
                {(Object.keys(SECURITY_CATEGORY_LABELS) as SecurityCategory[]).map((category) => (
                  <CategoryScoreCard
                    key={category}
                    category={category}
                    score={score.byCategory[category]}
                    checks={checksByCategory[category]}
                    expanded={expandedCategories.has(category)}
                    onToggle={() => toggleCategory(category)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'issues' && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Security Issues</h3>
                <IssuesList checks={checks} />
              </Card>
            )}

            {activeTab === 'history' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Score History</h3>
                  <span className="text-sm text-gray-500">Last 14 checks</span>
                </div>
                <HistoryChart history={history} />

                {/* Recent History List */}
                {history.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Checks</h4>
                    <div className="space-y-2">
                      {history.slice(0, 5).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                                getScoreGrade(entry.score).bgColor,
                                getScoreGrade(entry.score).color
                              )}
                            >
                              {entry.score}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(entry.timestamp, 'MMMM d, yyyy')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry.passedChecks} of {entry.totalChecks} passed
                                {entry.changedItems.length > 0 &&
                                  ` | ${entry.changedItems.length} changes`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {entry.criticalIssues > 0 && (
                              <span className="px-2 py-1 rounded bg-red-100 text-red-600">
                                {entry.criticalIssues} critical
                              </span>
                            )}
                            {entry.highIssues > 0 && (
                              <span className="px-2 py-1 rounded bg-orange-100 text-orange-600">
                                {entry.highIssues} high
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Last Check Info */}
            {checks.length > 0 && checks[0].lastChecked && (
              <div className="text-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Last security check:{' '}
                {formatDistanceToNow(checks[0].lastChecked, { addSuffix: true })}
              </div>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
}
