'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ClipboardDocumentIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CloudIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  UsersIcon,
  WrenchIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  EyeSlashIcon,
  FlagIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { DailyLogEntry, DailyLogCategory, DAILY_LOG_CATEGORIES, WEATHER_CONDITIONS } from '@/types';
import { formatDate } from '@/lib/date-utils';

interface DailyLogCardProps {
  log: DailyLogEntry;
  showProject?: boolean;
  showUser?: boolean;
  onEdit?: (log: DailyLogEntry) => void;
  onDelete?: (logId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

// Get icon component for category
function getCategoryIcon(category: DailyLogCategory) {
  const iconMap: Record<DailyLogCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    general: ClipboardDocumentIcon,
    progress: ArrowTrendingUpIcon,
    issue: ExclamationTriangleIcon,
    safety: ShieldCheckIcon,
    weather: CloudIcon,
    delivery: TruckIcon,
    inspection: ClipboardDocumentCheckIcon,
    client_interaction: UserIcon,
    subcontractor: UsersIcon,
    equipment: WrenchIcon,
  };
  return iconMap[category] || ClipboardDocumentIcon;
}

// Get badge variant for category
function getCategoryVariant(category: DailyLogCategory): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  switch (category) {
    case 'progress':
      return 'success';
    case 'issue':
      return 'danger';
    case 'safety':
      return 'warning';
    case 'inspection':
      return 'info';
    default:
      return 'default';
  }
}

export function DailyLogCard({
  log,
  showProject = true,
  showUser = false,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: DailyLogCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const categoryInfo = DAILY_LOG_CATEGORIES.find(c => c.value === log.category);
  const CategoryIcon = getCategoryIcon(log.category);
  const weatherInfo = log.weather ? WEATHER_CONDITIONS.find(w => w.value === log.weather?.condition) : null;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Category Icon */}
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${categoryInfo?.color}15` }}
            >
              {/* eslint-disable-next-line react-hooks/static-components -- dynamic icon component selected by log category */}
              <CategoryIcon
                className="h-5 w-5"
                style={{ color: categoryInfo?.color }}
              />
            </div>

            {/* Title and Meta */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{log.title}</h3>
                {log.isPrivate && (
                  <EyeSlashIcon className="h-4 w-4 text-gray-400" title="Private" />
                )}
                {log.requiresFollowUp && (
                  <FlagIcon className="h-4 w-4 text-orange-500" title="Requires follow-up" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                <span>{formatDate(new Date(log.date + 'T00:00:00'))}</span>
                {showProject && (
                  <>
                    <span>•</span>
                    <span>{log.projectName}</span>
                  </>
                )}
                {showUser && (
                  <>
                    <span>•</span>
                    <span>{log.userName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <Badge variant={getCategoryVariant(log.category)}>
            {categoryInfo?.label || log.category}
          </Badge>
        </div>

        {/* Description */}
        <p className={`text-sm text-gray-700 ${!showDetails && 'line-clamp-2'}`}>
          {log.description}
        </p>

        {/* Quick Stats Row */}
        <div className="flex flex-wrap gap-3 text-sm">
          {log.crewCount && log.crewCount > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <UsersIcon className="h-4 w-4" />
              <span>{log.crewCount} crew</span>
            </div>
          )}
          {log.hoursWorked && log.hoursWorked > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <span>{log.hoursWorked}h worked</span>
            </div>
          )}
          {log.photos && log.photos.length > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <PhotoIcon className="h-4 w-4" />
              <span>{log.photos.length} photo{log.photos.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {log.issues && log.issues.length > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{log.issues.length} issue{log.issues.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {weatherInfo && (
            <div className="flex items-center gap-1 text-blue-600">
              <CloudIcon className="h-4 w-4" />
              <span>{weatherInfo.label}</span>
              {log.weather?.temperatureHigh && (
                <span className="text-gray-500">
                  {log.weather.temperatureHigh}°F
                </span>
              )}
            </div>
          )}
        </div>

        {/* Photo Thumbnails */}
        {log.photos && log.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {log.photos.slice(0, 4).map((photo) => (
              <div
                key={photo.id}
                className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.caption || 'Log photo'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {log.photos.length > 4 && (
              <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                +{log.photos.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            {/* Work Performed */}
            {log.workPerformed && log.workPerformed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Work Performed</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {log.workPerformed.map((work, idx) => (
                    <li key={idx}>{work}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {log.issues && log.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Issues</h4>
                <div className="space-y-2">
                  {log.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded ${
                        issue.resolved
                          ? 'bg-green-50 text-green-800'
                          : issue.impact === 'high'
                          ? 'bg-red-50 text-red-800'
                          : issue.impact === 'medium'
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{issue.description}</span>
                        <Badge
                          variant={issue.resolved ? 'success' : issue.impact === 'high' ? 'danger' : 'warning'}
                          className="text-xs"
                        >
                          {issue.resolved ? 'Resolved' : issue.impact}
                        </Badge>
                      </div>
                      {issue.resolution && (
                        <p className="mt-1 text-xs opacity-80">Resolution: {issue.resolution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliveries */}
            {log.deliveries && log.deliveries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Deliveries</h4>
                <div className="space-y-1">
                  {log.deliveries.map((delivery, idx) => (
                    <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                      <div className="font-medium">{delivery.supplier}</div>
                      <div className="text-gray-600">{delivery.items}</div>
                      {delivery.quantity && (
                        <div className="text-gray-500 text-xs">Qty: {delivery.quantity}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visitors */}
            {log.visitors && log.visitors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Visitors</h4>
                <div className="space-y-1">
                  {log.visitors.map((visitor, idx) => (
                    <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                      <div className="font-medium">{visitor.name}</div>
                      {visitor.company && <div className="text-gray-600">{visitor.company}</div>}
                      <div className="text-gray-500 text-xs">{visitor.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Notes */}
            {log.safetyNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Safety Notes</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">{log.safetyNotes}</p>
              </div>
            )}

            {/* Follow-up Date */}
            {log.requiresFollowUp && log.followUpDate && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <CalendarIcon className="h-4 w-4" />
                <span>Follow-up: {formatDate(log.followUpDate)}</span>
              </div>
            )}

            {/* Tags */}
            {log.tags && log.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showDetails ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Less details
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                More details
              </>
            )}
          </button>

          {/* Edit/Delete */}
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(log)}>
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(log.id)}>
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
