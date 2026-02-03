// Schedule Hooks - Barrel Export
// Split from useSchedule.ts for better maintainability

export {
  useScheduleEvents,
  type UseScheduleEventsOptions,
  type UseScheduleEventsReturn,
  type CreateEventData,
  type UpdateEventData,
} from './useScheduleEvents';

export {
  useCrewAvailability,
  type UseCrewAvailabilityOptions,
  type UseCrewAvailabilityReturn,
  type SetAvailabilityData,
} from './useCrewAvailability';

export {
  useTimeOffRequests,
  type UseTimeOffRequestsOptions,
  type UseTimeOffRequestsReturn,
  type SubmitTimeOffData,
} from './useTimeOffRequests';

export { useSchedulePreferences } from './useSchedulePreferences';
