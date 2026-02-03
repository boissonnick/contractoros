// ============================================
// Schedule & Time Tracking Types
// Extracted from types/index.ts
// ============================================

// ============================================
// Availability Types
// ============================================

export interface Availability {
  id: string;
  userId: string;
  date: Date;
  isAvailable: boolean;
  startTime?: string;       // "08:00"
  endTime?: string;         // "17:00"
  notes?: string;
  createdAt: Date;
}

export interface AvailabilityDefault {
  id: string;
  userId: string;
  orgId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  isAvailable: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
}

// ============================================
// Schedule Assignment Types
// ============================================

export interface ScheduleAssignment {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show';
  createdAt: Date;
  userName?: string;
  projectName?: string;
  notes?: string;
  orgId?: string;
}

// ============================================
// Schedule Event Types
// ============================================

/**
 * Schedule event status
 */
export type ScheduleEventStatus =
  | 'scheduled'     // Confirmed on schedule
  | 'tentative'     // Pending confirmation
  | 'in_progress'   // Currently happening
  | 'completed'     // Finished
  | 'cancelled'     // Cancelled
  | 'postponed';    // Moved to future date

/**
 * Schedule event type
 */
export type ScheduleEventType =
  | 'job'           // Project work
  | 'inspection'    // Building/permit inspection
  | 'meeting'       // Client/team meeting
  | 'delivery'      // Material delivery
  | 'milestone'     // Project milestone
  | 'time_off'      // Crew time off
  | 'training'      // Safety/skills training
  | 'other';

/**
 * Recurrence pattern for events
 */
export type RecurrencePattern =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly';

/**
 * Weather condition type
 */
export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'storm'
  | 'extreme_heat'
  | 'extreme_cold'
  | 'wind';

/**
 * Weather impact level
 */
export type WeatherImpact = 'none' | 'low' | 'moderate' | 'high' | 'severe';

/**
 * Schedule event - main scheduling unit
 */
export interface ScheduleEvent {
  id: string;
  orgId: string;

  // Event info
  title: string;
  description?: string;
  type: ScheduleEventType;
  status: ScheduleEventStatus;
  color?: string; // Custom color for calendar

  // Timing
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  estimatedHours?: number;

  // Recurrence
  recurrence: RecurrencePattern;
  recurrenceEndDate?: Date;
  parentEventId?: string; // For recurring event instances

  // Location
  location?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Relationships
  projectId?: string;
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  taskIds?: string[];
  clientId?: string;
  clientName?: string;

  // Crew assignment
  assignedUserIds: string[];
  assignedUsers?: {
    id: string;
    name: string;
    role?: string;
  }[];
  crewSize?: number;
  leadUserId?: string; // Crew lead for this job

  // Weather considerations
  weatherSensitive: boolean;
  weatherConditions?: WeatherCondition[];
  weatherImpact?: WeatherImpact;
  weatherNotes?: string;

  // Conflict tracking
  hasConflicts?: boolean;
  conflictEventIds?: string[];

  // Notifications
  notifyAssignees: boolean;
  notifyClient: boolean;
  reminderMinutes?: number[]; // e.g., [1440, 60] = 24 hours and 1 hour before

  // Notes
  internalNotes?: string;
  clientVisibleNotes?: string;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// ============================================
// Crew Availability Types
// ============================================

/**
 * Crew availability for scheduling
 */
export interface CrewAvailability {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Availability period
  date: Date;
  startTime?: string; // HH:mm format, null = all day
  endTime?: string;
  allDay: boolean;

  // Status
  status: 'available' | 'unavailable' | 'limited';
  reason?: 'time_off' | 'sick' | 'training' | 'other_job' | 'personal' | 'other';
  notes?: string;

  // Recurring availability (e.g., always off Sundays)
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;

  // Metadata
  createdAt: Date;
  createdBy: string;
}

// ============================================
// Time Off Types
// ============================================

/**
 * Time off request
 */
export interface TimeOffRequest {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Request details
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'other';
  startDate: Date;
  endDate: Date;
  halfDay?: 'morning' | 'afternoon';
  reason?: string;

  // Approval workflow
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  denialReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Weather Forecast Types
// ============================================

/**
 * Weather forecast data
 */
export interface WeatherForecast {
  id: string;
  orgId: string;

  // Location
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };

  // Forecast
  date: Date;
  condition: WeatherCondition;
  tempHigh: number;
  tempLow: number;
  precipitation: number; // percentage
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  uvIndex?: number;

  // Impact assessment
  impact: WeatherImpact;
  impactNotes?: string;
  affectedTrades?: string[]; // e.g., ['roofing', 'concrete', 'painting']

  // Source
  source: string; // e.g., 'openweathermap', 'weatherapi'
  fetchedAt: Date;
}

// ============================================
// Schedule Conflict Types
// ============================================

/**
 * Schedule conflict
 */
export interface ScheduleConflict {
  id: string;
  orgId: string;

  // Conflict type
  type: 'crew_overlap' | 'equipment_overlap' | 'location_overlap' | 'weather' | 'resource_shortage';
  severity: 'warning' | 'error';

  // Conflicting events
  eventIds: string[];
  eventTitles: string[];

  // Affected resources
  affectedUserIds?: string[];
  affectedUserNames?: string[];
  affectedEquipmentIds?: string[];

  // Description
  description: string;
  suggestedResolution?: string;

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;

  // Metadata
  detectedAt: Date;
}

// ============================================
// Schedule View & Stats Types
// ============================================

/**
 * Schedule view preferences
 */
export interface ScheduleViewPreferences {
  userId: string;
  defaultView: 'day' | 'week' | 'month' | 'timeline';
  showWeekends: boolean;
  startOfWeek: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  workingHoursStart: string; // HH:mm
  workingHoursEnd: string;
  showWeather: boolean;
  showConflicts: boolean;
  colorBy: 'type' | 'project' | 'status' | 'assignee';
  hiddenEventTypes?: ScheduleEventType[];
  hiddenUserIds?: string[];
}

/**
 * Schedule statistics
 */
export interface ScheduleStats {
  orgId: string;
  period: {
    start: Date;
    end: Date;
  };

  // Counts
  totalEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  postponedEvents: number;

  // Hours
  scheduledHours: number;
  completedHours: number;
  averageEventDuration: number;

  // Crew utilization
  crewUtilization: {
    userId: string;
    userName: string;
    scheduledHours: number;
    availableHours: number;
    utilizationPercent: number;
  }[];

  // Weather impact
  weatherDelayedEvents: number;
  weatherDelayedHours: number;

  // Conflicts
  totalConflicts: number;
  resolvedConflicts: number;
}

// ============================================
// Time Entry Types
// ============================================

import type { UserRole } from './index';

export type TimeEntryStatus = 'active' | 'paused' | 'completed' | 'pending_approval' | 'approved' | 'rejected';

export type TimeEntryType = 'clock' | 'manual' | 'imported';

export type BreakType = 'lunch' | 'short' | 'other';

export interface TimeEntryBreak {
  id: string;
  type: BreakType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  isPaid: boolean;
}

export interface TimeEntryLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  timestamp: Date;
}

export interface TimeEntry {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  type: TimeEntryType;
  status: TimeEntryStatus;

  // Time data
  clockIn: Date;
  clockOut?: Date;
  totalMinutes?: number;        // Calculated: clockOut - clockIn - unpaid breaks
  billableMinutes?: number;     // Subset that's billable

  // Breaks
  breaks: TimeEntryBreak[];
  totalBreakMinutes?: number;

  // Location tracking
  clockInLocation?: TimeEntryLocation;
  clockOutLocation?: TimeEntryLocation;
  locationHistory?: TimeEntryLocation[]; // For continuous tracking

  // Rates
  hourlyRate?: number;
  overtimeRate?: number;        // Usually 1.5x
  isOvertime?: boolean;

  // Notes & metadata
  notes?: string;
  tags?: string[];

  // Approval workflow
  submittedAt?: Date;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Audit
  createdAt: Date;
  updatedAt?: Date;
  editedBy?: string;
  editHistory?: TimeEntryEdit[];
}

export interface TimeEntryEdit {
  editedAt: Date;
  editedBy: string;
  editedByName: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export interface TimesheetPeriod {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalBreakHours: number;
  entries: string[]; // TimeEntry IDs
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TimeTrackingSettings {
  orgId: string;
  requireGeoLocation: boolean;
  geoFenceRadius?: number;      // meters
  projectGeoFences?: {
    projectId: string;
    lat: number;
    lng: number;
    radius: number;
  }[];
  autoClockOutAfter?: number;   // minutes of inactivity
  requireProjectSelection: boolean;
  requireTaskSelection: boolean;
  allowManualEntry: boolean;
  requireApproval: boolean;
  approvers?: string[];         // User IDs who can approve
  overtimeThreshold: number;    // hours per day (default 8)
  weeklyOvertimeThreshold: number; // hours per week (default 40)
  paidBreakMinutes: number;     // Default paid break per day
  workWeekStart: 'sunday' | 'monday';
  roundingInterval?: 0 | 5 | 6 | 15; // Round to nearest X minutes (0 = no rounding)
  roundingRule?: 'nearest' | 'up' | 'down';
}

export interface DailyTimeSummary {
  date: string; // ISO date
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  entries: TimeEntry[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hours: number;
  }[];
}

// ============================================
// Schedule Constants
// ============================================

export const SCHEDULE_EVENT_TYPES: { value: ScheduleEventType; label: string; color: string }[] = [
  { value: 'job', label: 'Job/Work', color: '#2563eb' },
  { value: 'inspection', label: 'Inspection', color: '#7c3aed' },
  { value: 'meeting', label: 'Meeting', color: '#0891b2' },
  { value: 'delivery', label: 'Delivery', color: '#059669' },
  { value: 'milestone', label: 'Milestone', color: '#d97706' },
  { value: 'time_off', label: 'Time Off', color: '#6b7280' },
  { value: 'training', label: 'Training', color: '#db2777' },
  { value: 'other', label: 'Other', color: '#71717a' },
];

export const SCHEDULE_EVENT_STATUSES: { value: ScheduleEventStatus; label: string; color: string }[] = [
  { value: 'scheduled', label: 'Scheduled', color: '#2563eb' },
  { value: 'tentative', label: 'Tentative', color: '#f59e0b' },
  { value: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'postponed', label: 'Postponed', color: '#6b7280' },
];

export const WEATHER_CONDITIONS: { value: WeatherCondition; label: string; icon: string }[] = [
  { value: 'clear', label: 'Clear', icon: 'sun' },
  { value: 'partly_cloudy', label: 'Partly Cloudy', icon: 'cloud-sun' },
  { value: 'cloudy', label: 'Cloudy', icon: 'cloud' },
  { value: 'rain', label: 'Rain', icon: 'cloud-rain' },
  { value: 'heavy_rain', label: 'Heavy Rain', icon: 'cloud-showers-heavy' },
  { value: 'snow', label: 'Snow', icon: 'snowflake' },
  { value: 'storm', label: 'Storm', icon: 'bolt' },
  { value: 'extreme_heat', label: 'Extreme Heat', icon: 'temperature-high' },
  { value: 'extreme_cold', label: 'Extreme Cold', icon: 'temperature-low' },
  { value: 'wind', label: 'High Wind', icon: 'wind' },
];

export const TIME_OFF_TYPES: { value: TimeOffRequest['type']; label: string }[] = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'other', label: 'Other' },
];
