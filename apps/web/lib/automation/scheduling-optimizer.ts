/**
 * Scheduling Optimizer Utility
 * Analyzes crew availability and suggests optimal assignments
 */

export interface ScheduleEvent {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  projectLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  startTime: Date;
  endTime: Date;
  assignedCrew: string[];
  requiredSkills?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface CrewMember {
  id: string;
  name: string;
  skills: string[];
  availability: {
    dayOfWeek: number; // 0-6, Sunday-Saturday
    startHour: number;
    endHour: number;
  }[];
  currentLocation?: {
    lat: number;
    lng: number;
  };
  maxHoursPerDay: number;
}

export interface ScheduleConstraints {
  maxTravelTimeMinutes?: number;
  minBreakBetweenEventsMinutes?: number;
  respectAvailability?: boolean;
  prioritizeSkillMatch?: boolean;
}

export interface ScheduleConflict {
  type: 'overlap' | 'travel-time' | 'availability' | 'skill-mismatch' | 'overwork';
  severity: 'warning' | 'error';
  eventId: string;
  crewMemberId: string;
  crewMemberName: string;
  description: string;
  suggestedResolution?: string;
}

export interface ScheduleSuggestion {
  type: 'reassign' | 'reschedule' | 'add-crew' | 'split-shift';
  eventId: string;
  eventTitle: string;
  currentAssignment: string[];
  suggestedAssignment: string[];
  reason: string;
  estimatedImprovement: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ScheduleAnalysis {
  conflicts: ScheduleConflict[];
  suggestions: ScheduleSuggestion[];
  crewUtilization: CrewUtilization[];
  unassignedEvents: string[];
}

export interface CrewUtilization {
  crewMemberId: string;
  crewMemberName: string;
  scheduledHours: number;
  availableHours: number;
  utilizationPercent: number;
  status: 'underutilized' | 'optimal' | 'overworked';
}

const DEFAULT_CONSTRAINTS: Required<ScheduleConstraints> = {
  maxTravelTimeMinutes: 45,
  minBreakBetweenEventsMinutes: 30,
  respectAvailability: true,
  prioritizeSkillMatch: true,
};

/**
 * Calculate travel time between two locations (simplified distance-based)
 */
function estimateTravelTime(
  from: { lat: number; lng: number } | undefined,
  to: { lat: number; lng: number } | undefined
): number {
  if (!from || !to) return 0;

  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Estimate: 30 km/h average speed in construction areas
  return Math.round(distance / 0.5); // minutes
}

/**
 * Check if two time ranges overlap
 */
function eventsOverlap(event1: ScheduleEvent, event2: ScheduleEvent): boolean {
  return event1.startTime < event2.endTime && event2.startTime < event1.endTime;
}

/**
 * Get hours between two dates
 */
function getHoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Check if crew member is available during event time
 */
function isAvailableDuring(crew: CrewMember, event: ScheduleEvent): boolean {
  const dayOfWeek = event.startTime.getDay();
  const startHour = event.startTime.getHours();
  const endHour = event.endTime.getHours();

  return crew.availability.some(avail =>
    avail.dayOfWeek === dayOfWeek &&
    avail.startHour <= startHour &&
    avail.endHour >= endHour
  );
}

/**
 * Check if crew has required skills for event
 */
function hasRequiredSkills(crew: CrewMember, event: ScheduleEvent): boolean {
  if (!event.requiredSkills || event.requiredSkills.length === 0) return true;
  return event.requiredSkills.every(skill =>
    crew.skills.some(s => s.toLowerCase() === skill.toLowerCase())
  );
}

/**
 * Detect scheduling conflicts
 */
function detectConflicts(
  events: ScheduleEvent[],
  crew: CrewMember[],
  constraints: Required<ScheduleConstraints>
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const crewMap = new Map(crew.map(c => [c.id, c]));

  // Group events by crew member
  const crewEvents = new Map<string, ScheduleEvent[]>();
  events.forEach(event => {
    event.assignedCrew.forEach(crewId => {
      const existing = crewEvents.get(crewId) || [];
      existing.push(event);
      crewEvents.set(crewId, existing);
    });
  });

  // Check each crew member's assignments
  crewEvents.forEach((memberEvents, crewId) => {
    const crewMember = crewMap.get(crewId);
    if (!crewMember) return;

    // Sort by start time
    const sorted = [...memberEvents].sort((a, b) =>
      a.startTime.getTime() - b.startTime.getTime()
    );

    sorted.forEach((event, index) => {
      // Check availability
      if (constraints.respectAvailability && !isAvailableDuring(crewMember, event)) {
        conflicts.push({
          type: 'availability',
          severity: 'error',
          eventId: event.id,
          crewMemberId: crewId,
          crewMemberName: crewMember.name,
          description: `${crewMember.name} is not available during scheduled time`,
          suggestedResolution: 'Reassign to available crew member or reschedule event',
        });
      }

      // Check skill match
      if (constraints.prioritizeSkillMatch && !hasRequiredSkills(crewMember, event)) {
        conflicts.push({
          type: 'skill-mismatch',
          severity: 'warning',
          eventId: event.id,
          crewMemberId: crewId,
          crewMemberName: crewMember.name,
          description: `${crewMember.name} may lack required skills: ${event.requiredSkills?.join(', ')}`,
          suggestedResolution: 'Consider assigning crew with matching skills',
        });
      }

      // Check for overlaps with next event
      if (index < sorted.length - 1) {
        const nextEvent = sorted[index + 1];

        // Direct overlap
        if (eventsOverlap(event, nextEvent)) {
          conflicts.push({
            type: 'overlap',
            severity: 'error',
            eventId: event.id,
            crewMemberId: crewId,
            crewMemberName: crewMember.name,
            description: `${crewMember.name} has overlapping assignments: ${event.title} and ${nextEvent.title}`,
            suggestedResolution: 'Reschedule one event or reassign crew',
          });
        }

        // Travel time conflict
        const travelTime = estimateTravelTime(event.projectLocation, nextEvent.projectLocation);
        const gapMinutes = (nextEvent.startTime.getTime() - event.endTime.getTime()) / (1000 * 60);

        if (travelTime > 0 && gapMinutes < travelTime + constraints.minBreakBetweenEventsMinutes) {
          conflicts.push({
            type: 'travel-time',
            severity: 'warning',
            eventId: event.id,
            crewMemberId: crewId,
            crewMemberName: crewMember.name,
            description: `${crewMember.name} needs ${travelTime}min travel time but only has ${Math.round(gapMinutes)}min gap`,
            suggestedResolution: 'Add buffer time between events or reassign to closer crew',
          });
        }
      }
    });

    // Check daily hours
    const dailyHours = new Map<string, number>();
    sorted.forEach(event => {
      const dateKey = event.startTime.toDateString();
      const hours = getHoursBetween(event.startTime, event.endTime);
      dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hours);
    });

    dailyHours.forEach((hours, dateKey) => {
      if (hours > crewMember.maxHoursPerDay) {
        conflicts.push({
          type: 'overwork',
          severity: 'warning',
          eventId: sorted[0].id,
          crewMemberId: crewId,
          crewMemberName: crewMember.name,
          description: `${crewMember.name} scheduled for ${hours.toFixed(1)} hours on ${dateKey} (max: ${crewMember.maxHoursPerDay})`,
          suggestedResolution: 'Redistribute workload across team',
        });
      }
    });
  });

  return conflicts;
}

/**
 * Generate schedule optimization suggestions
 */
function generateSuggestions(
  events: ScheduleEvent[],
  crew: CrewMember[],
  conflicts: ScheduleConflict[]
): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = [];
  const crewMap = new Map(crew.map(c => [c.id, c]));

  // Group conflicts by event
  const eventConflicts = new Map<string, ScheduleConflict[]>();
  conflicts.forEach(conflict => {
    const existing = eventConflicts.get(conflict.eventId) || [];
    existing.push(conflict);
    eventConflicts.set(conflict.eventId, existing);
  });

  // Find unassigned events
  const unassignedEvents = events.filter(e => e.assignedCrew.length === 0);
  unassignedEvents.forEach(event => {
    // Find available crew with matching skills
    const availableCrew = crew.filter(c =>
      isAvailableDuring(c, event) && hasRequiredSkills(c, event)
    );

    if (availableCrew.length > 0) {
      suggestions.push({
        type: 'add-crew',
        eventId: event.id,
        eventTitle: event.title,
        currentAssignment: [],
        suggestedAssignment: [availableCrew[0].id],
        reason: 'Event has no assigned crew',
        estimatedImprovement: 'Event will have coverage',
        priority: event.priority === 'urgent' ? 'high' : 'medium',
      });
    }
  });

  // Generate suggestions for conflicts
  eventConflicts.forEach((eventConflictList, eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Handle overlap conflicts
    const overlapConflicts = eventConflictList.filter(c => c.type === 'overlap');
    if (overlapConflicts.length > 0) {
      const conflictedCrew = overlapConflicts[0].crewMemberId;
      const availableReplacement = crew.find(c =>
        c.id !== conflictedCrew &&
        isAvailableDuring(c, event) &&
        hasRequiredSkills(c, event)
      );

      if (availableReplacement) {
        suggestions.push({
          type: 'reassign',
          eventId: event.id,
          eventTitle: event.title,
          currentAssignment: event.assignedCrew,
          suggestedAssignment: event.assignedCrew
            .filter(id => id !== conflictedCrew)
            .concat(availableReplacement.id),
          reason: 'Resolves scheduling overlap',
          estimatedImprovement: 'Eliminates double-booking conflict',
          priority: 'high',
        });
      }
    }

    // Handle skill mismatch
    const skillConflicts = eventConflictList.filter(c => c.type === 'skill-mismatch');
    if (skillConflicts.length > 0 && overlapConflicts.length === 0) {
      const mismatchedCrew = skillConflicts[0].crewMemberId;
      const skilledReplacement = crew.find(c =>
        c.id !== mismatchedCrew &&
        isAvailableDuring(c, event) &&
        hasRequiredSkills(c, event)
      );

      if (skilledReplacement) {
        suggestions.push({
          type: 'reassign',
          eventId: event.id,
          eventTitle: event.title,
          currentAssignment: event.assignedCrew,
          suggestedAssignment: event.assignedCrew
            .filter(id => id !== mismatchedCrew)
            .concat(skilledReplacement.id),
          reason: `${crewMap.get(skilledReplacement.id)?.name} has required skills`,
          estimatedImprovement: 'Better skill match for task requirements',
          priority: 'medium',
        });
      }
    }
  });

  return suggestions;
}

/**
 * Calculate crew utilization metrics
 */
function calculateUtilization(
  events: ScheduleEvent[],
  crew: CrewMember[]
): CrewUtilization[] {
  return crew.map(member => {
    const memberEvents = events.filter(e => e.assignedCrew.includes(member.id));
    const scheduledHours = memberEvents.reduce((sum, event) =>
      sum + getHoursBetween(event.startTime, event.endTime), 0
    );

    // Calculate available hours (assuming weekly view)
    const availableHours = member.availability.reduce((sum, avail) =>
      sum + (avail.endHour - avail.startHour), 0
    );

    const utilizationPercent = availableHours > 0
      ? Math.round((scheduledHours / availableHours) * 100)
      : 0;

    let status: CrewUtilization['status'] = 'optimal';
    if (utilizationPercent < 50) status = 'underutilized';
    else if (utilizationPercent > 100) status = 'overworked';

    return {
      crewMemberId: member.id,
      crewMemberName: member.name,
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      availableHours,
      utilizationPercent,
      status,
    };
  });
}

/**
 * Main function: Optimize schedule and generate suggestions
 */
export function optimizeSchedule(
  events: ScheduleEvent[],
  crew: CrewMember[],
  constraints: ScheduleConstraints = {}
): ScheduleSuggestion[] {
  const mergedConstraints = { ...DEFAULT_CONSTRAINTS, ...constraints };
  const conflicts = detectConflicts(events, crew, mergedConstraints);
  return generateSuggestions(events, crew, conflicts);
}

/**
 * Extended function: Full schedule analysis
 */
export function analyzeSchedule(
  events: ScheduleEvent[],
  crew: CrewMember[],
  constraints: ScheduleConstraints = {}
): ScheduleAnalysis {
  const mergedConstraints = { ...DEFAULT_CONSTRAINTS, ...constraints };
  const conflicts = detectConflicts(events, crew, mergedConstraints);
  const suggestions = generateSuggestions(events, crew, conflicts);
  const crewUtilization = calculateUtilization(events, crew);
  const unassignedEvents = events
    .filter(e => e.assignedCrew.length === 0)
    .map(e => e.id);

  return {
    conflicts,
    suggestions,
    crewUtilization,
    unassignedEvents,
  };
}
