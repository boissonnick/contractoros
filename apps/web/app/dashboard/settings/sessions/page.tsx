'use client';

/**
 * Session Management Page
 *
 * Allows users to view and manage their active sessions across devices.
 * Features include:
 * - View all active sessions with device info
 * - See current session highlighted
 * - Revoke individual sessions
 * - Sign out from all other devices
 * - Suspicious session alerts
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { RouteGuard } from '@/components/auth';
import { Card, Button, Badge, useConfirmDialog } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  useSessionManagement,
  UserSession,
} from '@/lib/hooks/useSessionManagement';
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
  ClockIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================
// Device Icon Component
// ============================================

function DeviceIcon({ deviceInfo }: { deviceInfo: UserSession['deviceInfo'] }) {
  if (deviceInfo.isMobile) {
    if (deviceInfo.device.toLowerCase().includes('tablet') || deviceInfo.device.toLowerCase().includes('ipad')) {
      return <DeviceTabletIcon className="h-8 w-8 text-gray-400" />;
    }
    return <DevicePhoneMobileIcon className="h-8 w-8 text-gray-400" />;
  }
  return <ComputerDesktopIcon className="h-8 w-8 text-gray-400" />;
}

// ============================================
// Session Card Component
// ============================================

interface SessionCardProps {
  session: UserSession;
  isCurrent: boolean;
  isSuspicious?: boolean;
  suspiciousReasons?: string[];
  onRevoke: (sessionId: string) => void;
  revoking: boolean;
}

function SessionCard({
  session,
  isCurrent,
  isSuspicious,
  suspiciousReasons,
  onRevoke,
  revoking,
}: SessionCardProps) {
  const { deviceInfo, location, ipAddress, createdAt, lastActiveAt } = session;

  // Format browser and OS info
  const browserInfo = deviceInfo.browserVersion
    ? `${deviceInfo.browser} ${deviceInfo.browserVersion}`
    : deviceInfo.browser;
  const osInfo = deviceInfo.osVersion
    ? `${deviceInfo.os} ${deviceInfo.osVersion}`
    : deviceInfo.os;

  // Format location
  const locationText = location?.city
    ? `${location.city}${location.region ? `, ${location.region}` : ''}${location.country ? `, ${location.country}` : ''}`
    : null;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-colors',
        isCurrent
          ? 'bg-green-50 border-green-200'
          : isSuspicious
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div
          className={cn(
            'p-3 rounded-lg flex-shrink-0',
            isCurrent ? 'bg-green-100' : isSuspicious ? 'bg-amber-100' : 'bg-gray-100'
          )}
        >
          <DeviceIcon deviceInfo={deviceInfo} />
        </div>

        {/* Session Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-gray-900">{deviceInfo.device}</h4>
            {isCurrent && (
              <Badge variant="success" size="sm">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Current Session
              </Badge>
            )}
            {isSuspicious && !isCurrent && (
              <Badge variant="warning" size="sm">
                <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                Suspicious
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {browserInfo} on {osInfo}
          </p>

          {/* Location and IP */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {locationText && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {locationText}
              </span>
            )}
            <span className="flex items-center gap-1">
              <GlobeAltIcon className="h-3.5 w-3.5" />
              {ipAddress === 'unknown' || ipAddress === 'client' ? 'Local' : ipAddress}
            </span>
          </div>

          {/* Activity Times */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              Last active: {formatDistanceToNow(lastActiveAt, { addSuffix: true })}
            </span>
            <span>
              First seen: {format(createdAt, 'MMM d, yyyy')}
            </span>
          </div>

          {/* Suspicious Reasons */}
          {isSuspicious && suspiciousReasons && suspiciousReasons.length > 0 && (
            <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-800">
              <p className="font-medium">Why this session is flagged:</p>
              <ul className="list-disc list-inside mt-1">
                {suspiciousReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Revoke Button */}
        {!isCurrent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRevoke(session.id)}
            disabled={revoking}
            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            {revoking ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                Sign Out
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function SessionsPage() {
  useAuth();
  const {
    sessions,
    loading,
    error,
    suspiciousSessions,
    refresh,
    revokeSessionById,
    revokeOtherSessions,
    formatDevice,
  } = useSessionManagement();

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // Confirm dialogs
  const confirmDialog = useConfirmDialog();

  // Create a map of suspicious sessions for quick lookup
  const suspiciousMap = useMemo(() => {
    const map = new Map<string, string[]>();
    suspiciousSessions.forEach(({ session, reasons }) => {
      map.set(session.id, reasons);
    });
    return map;
  }, [suspiciousSessions]);

  // Sort sessions: current first, then by last active
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.isCurrentSession) return -1;
      if (b.isCurrentSession) return 1;
      return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
    });
  }, [sessions]);

  // Handle revoking a single session
  const handleRevokeSession = async (session: UserSession) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Sign Out from Device?',
      message: `This will sign out the session on ${formatDevice(session)}. The user will need to sign in again on that device.`,
      confirmLabel: 'Sign Out',
      variant: 'danger',
    });

    if (confirmed) {
      setRevokingSessionId(session.id);
      try {
        await revokeSessionById(session.id, 'User initiated sign out');
        toast.success(`Signed out from ${formatDevice(session)}`);
      } catch {
        toast.error('Failed to sign out from device');
      } finally {
        setRevokingSessionId(null);
      }
    }
  };

  // Handle revoking all other sessions
  const handleRevokeAllOthers = async () => {
    const otherCount = sessions.filter((s) => !s.isCurrentSession).length;

    const confirmed = await confirmDialog.confirm({
      title: 'Sign Out from All Other Devices?',
      message: `This will sign out ${otherCount} other ${otherCount === 1 ? 'session' : 'sessions'}. You will remain signed in on this device.`,
      confirmLabel: `Sign Out ${otherCount} ${otherCount === 1 ? 'Session' : 'Sessions'}`,
      variant: 'danger',
    });

    if (confirmed) {
      setRevokingAll(true);
      try {
        const count = await revokeOtherSessions('User signed out from all other devices');
        toast.success(`Signed out from ${count} other ${count === 1 ? 'device' : 'devices'}`);
      } catch {
        toast.error('Failed to sign out from other devices');
      } finally {
        setRevokingAll(false);
      }
    }
  };

  // Stats
  const otherSessionsCount = sessions.filter((s) => !s.isCurrentSession).length;
  const mobileSessionsCount = sessions.filter((s) => s.deviceInfo.isMobile).length;
  const desktopSessionsCount = sessions.filter((s) => !s.deviceInfo.isMobile).length;

  return (
    <RouteGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
            <p className="text-sm text-gray-500">
              Manage your signed-in devices and sessions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <ArrowPathIcon className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            {otherSessionsCount > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevokeAllOthers}
                disabled={revokingAll}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1.5" />
                Sign Out All Others
              </Button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Session Security</p>
              <p className="text-sm text-blue-700 mt-1">
                If you notice any sessions you don&apos;t recognize, sign out from them immediately
                and consider changing your password. Sessions expire after 7 days of inactivity
                or 30 days maximum.
              </p>
            </div>
          </div>
        </div>

        {/* Suspicious Sessions Warning */}
        {suspiciousSessions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {suspiciousSessions.length} Suspicious{' '}
                  {suspiciousSessions.length === 1 ? 'Session' : 'Sessions'} Detected
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  We&apos;ve detected unusual activity patterns. Please review the flagged sessions below
                  and sign out from any you don&apos;t recognize.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{mobileSessionsCount}</p>
                <p className="text-sm text-gray-500">Mobile Devices</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ComputerDesktopIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{desktopSessionsCount}</p>
                <p className="text-sm text-gray-500">Desktop Devices</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
              Retry
            </Button>
          </div>
        )}

        {/* Sessions List */}
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <ComputerDesktopIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Sessions</h3>
            <p className="text-sm text-gray-500">
              You&apos;ll see your active sessions here once you&apos;re signed in.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isCurrent={session.isCurrentSession}
                isSuspicious={suspiciousMap.has(session.id)}
                suspiciousReasons={suspiciousMap.get(session.id)}
                onRevoke={() => handleRevokeSession(session)}
                revoking={revokingSessionId === session.id}
              />
            ))}
          </div>
        )}

        {/* Session Limits Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700">About Sessions</p>
              <ul className="mt-2 space-y-1">
                <li>You can be signed in on up to 5 devices at a time.</li>
                <li>Sessions are automatically signed out after 30 minutes of inactivity.</li>
                <li>All sessions expire after 7 days, even if active.</li>
                <li>If a new session exceeds the limit, the oldest session will be signed out.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Render the confirm dialog */}
        <confirmDialog.DialogComponent />
      </div>
    </RouteGuard>
  );
}
