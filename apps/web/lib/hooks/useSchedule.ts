"use client";

/**
 * @fileoverview Schedule Hooks Facade
 *
 * This file re-exports hooks from the schedule/ directory for backward compatibility.
 * The hooks have been split into focused modules for better maintainability:
 *
 * **Available Hooks:**
 *
 * - `useScheduleEvents` - Schedule event CRUD, conflict detection, filtering, drag-drop
 * - `useCrewAvailability` - Manage crew member availability windows
 * - `useTimeOffRequests` - Submit and manage time off requests
 * - `useSchedulePreferences` - User calendar view preferences (day/week/month)
 *
 * For new code, prefer importing directly from '@/lib/hooks/schedule'.
 *
 * @example
 * // Import from facade (backward compatible)
 * import { useScheduleEvents, useCrewAvailability } from '@/lib/hooks/useSchedule';
 *
 * @example
 * // Preferred: import directly from schedule module
 * import { useScheduleEvents } from '@/lib/hooks/schedule';
 *
 * @example
 * // Using schedule events
 * const { events, loading, createEvent, updateEvent } = useScheduleEvents({
 *   orgId,
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * @example
 * // Using crew availability
 * const { availability, setAvailability } = useCrewAvailability({ orgId, userId });
 *
 * await setAvailability({
 *   dayOfWeek: 1, // Monday
 *   startTime: '08:00',
 *   endTime: '17:00',
 *   isAvailable: true
 * });
 *
 * @example
 * // Using time off requests
 * const { requests, submitRequest, approveRequest } = useTimeOffRequests({ orgId });
 *
 * await submitRequest({
 *   userId,
 *   startDate: '2024-02-01',
 *   endDate: '2024-02-05',
 *   type: 'vacation',
 *   notes: 'Family trip'
 * });
 */

// Re-export all hooks and types from the schedule module
export {
  // Hooks
  useScheduleEvents,
  useCrewAvailability,
  useTimeOffRequests,
  useSchedulePreferences,

  // Types
  type UseScheduleEventsOptions,
  type UseScheduleEventsReturn,
  type CreateEventData,
  type UpdateEventData,
  type UseCrewAvailabilityOptions,
  type UseCrewAvailabilityReturn,
  type SetAvailabilityData,
  type UseTimeOffRequestsOptions,
  type UseTimeOffRequestsReturn,
  type SubmitTimeOffData,
} from './schedule';
