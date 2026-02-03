# Sprint 40 - CLI 4: Schedule Enhancements & Weather

**Copy this entire prompt into a new Claude Code session.**

---

## Context

You are CLI 4 working on ContractorOS Sprint 40. Your role is to enhance the schedule module with weather integration, day view, and team assignment capabilities.

**Project:** `/Users/nickbodkins/contractoros`
**App:** `apps/web/`
**Dev Server:** `npm run dev` (port 3000)

---

## Sprint 39 Completed

### Notifications - COMPLETE ✅
- Browser notification permissions
- Service worker registration
- Granular notification type control
- Do Not Disturb / Quiet Hours

### Research Documents - COMPLETE ✅
- docs/ANIMATION_GUIDELINES.md
- docs/research/BANK_INTEGRATION.md
- docs/research/NEOBANK_INTEGRATION.md
- docs/research/PAYROLL_INTEGRATION.md
- docs/research/MESSAGING_ARCHITECTURE.md
- docs/research/CUSTOM_REPORTS.md
- docs/research/AI_INSIGHTS.md
- docs/research/AI_PROVIDER_MANAGEMENT.md

---

## Your Tasks

### Task 1: Weather Integration Service (Issue #36)
**Effort:** 8-10h

Add weather data to inform schedule planning.

**Files to create:**
```
apps/web/lib/services/weather.ts
apps/web/components/schedule/WeatherWidget.tsx
apps/web/components/schedule/WeatherAlert.tsx
```

**Weather Service:**
```typescript
// lib/services/weather.ts
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  date: string;
  dayOfWeek: string;
  high: number;
  low: number;
  precipitation: number; // percentage
  conditions: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'snow' | 'storm';
  icon: string;
  description: string;
  windSpeed: number;
  humidity: number;
}

export interface WeatherAlert {
  type: 'heat' | 'cold' | 'rain' | 'storm' | 'wind';
  severity: 'advisory' | 'warning' | 'emergency';
  message: string;
  startTime: Date;
  endTime: Date;
}

export async function getWeatherForecast(
  lat: number,
  lng: number,
  days: number = 7
): Promise<WeatherData[]> {
  // If no API key, return mock data for demo
  if (!WEATHER_API_KEY) {
    return getMockWeatherData(days);
  }

  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lng}&cnt=${days * 8}&appid=${WEATHER_API_KEY}&units=imperial`
    );

    if (!response.ok) {
      console.warn('Weather API error, using mock data');
      return getMockWeatherData(days);
    }

    const data = await response.json();
    return transformWeatherData(data);
  } catch (error) {
    console.error('Weather fetch error:', error);
    return getMockWeatherData(days);
  }
}

function getMockWeatherData(days: number): WeatherData[] {
  const conditions: WeatherData['conditions'][] = ['sunny', 'partly_cloudy', 'cloudy', 'rain'];
  const result: WeatherData[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    result.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(55 + Math.random() * 30),
      low: Math.round(40 + Math.random() * 20),
      precipitation: Math.round(Math.random() * 60),
      conditions: conditions[Math.floor(Math.random() * conditions.length)],
      icon: '01d',
      description: 'Clear sky',
      windSpeed: Math.round(5 + Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 40),
    });
  }

  return result;
}

export function shouldShowWeatherAlert(weather: WeatherData): WeatherAlert | null {
  if (weather.conditions === 'storm') {
    return {
      type: 'storm',
      severity: 'warning',
      message: 'Storm expected - consider rescheduling outdoor work',
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  if (weather.precipitation > 70) {
    return {
      type: 'rain',
      severity: 'advisory',
      message: `High chance of rain (${weather.precipitation}%) - plan indoor activities`,
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  if (weather.high > 95) {
    return {
      type: 'heat',
      severity: 'warning',
      message: 'Extreme heat expected - ensure crew hydration and breaks',
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  return null;
}
```

**Weather Widget:**
```tsx
// components/schedule/WeatherWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { getWeatherForecast, WeatherData } from '@/lib/services/weather';
import { Card } from '@/components/ui';
import { SunIcon, CloudIcon } from '@heroicons/react/24/outline';

interface WeatherWidgetProps {
  lat?: number;
  lng?: number;
  days?: number;
  compact?: boolean;
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny: <SunIcon className="h-6 w-6 text-yellow-500" />,
  partly_cloudy: <CloudIcon className="h-6 w-6 text-gray-400" />,
  cloudy: <CloudIcon className="h-6 w-6 text-gray-500" />,
  rain: <CloudIcon className="h-6 w-6 text-blue-500" />,
  snow: <CloudIcon className="h-6 w-6 text-blue-200" />,
  storm: <CloudIcon className="h-6 w-6 text-purple-600" />,
};

export function WeatherWidget({ lat = 37.7749, lng = -122.4194, days = 5, compact }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherForecast(lat, lng, days)
      .then(setWeather)
      .finally(() => setLoading(false));
  }, [lat, lng, days]);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-24 rounded-lg" />;
  }

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weather.slice(0, 5).map((day) => (
          <div key={day.date} className="flex flex-col items-center min-w-[60px] p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">{day.dayOfWeek}</span>
            {WEATHER_ICONS[day.conditions]}
            <span className="text-sm font-medium">{day.high}°</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Weather Forecast</h3>
      <div className="grid grid-cols-5 gap-2">
        {weather.map((day) => (
          <div key={day.date} className="text-center p-2 rounded-lg hover:bg-gray-50">
            <p className="text-xs text-gray-500">{day.dayOfWeek}</p>
            <div className="my-2">{WEATHER_ICONS[day.conditions]}</div>
            <p className="text-sm font-medium">{day.high}°</p>
            <p className="text-xs text-gray-400">{day.low}°</p>
            {day.precipitation > 30 && (
              <p className="text-xs text-blue-500 mt-1">{day.precipitation}%</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Weather service works (with mock fallback)
- [ ] Widget displays 5-day forecast
- [ ] Weather alerts show for bad conditions
- [ ] Works without API key (demo mode)

---

### Task 2: Day View for Schedule (Issue #37)
**Effort:** 8-12h

Add Day view to existing Week/Month views.

**Location:** `apps/web/app/dashboard/schedule/`

**View Toggle:**
```tsx
const VIEW_OPTIONS = ['day', 'week', 'month'] as const;
type ViewOption = typeof VIEW_OPTIONS[number];

function ViewToggle({ active, onChange }: { active: ViewOption; onChange: (view: ViewOption) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {VIEW_OPTIONS.map((view) => (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors',
            active === view
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {view}
        </button>
      ))}
    </div>
  );
}
```

**Day View Component:**
```tsx
// components/schedule/DayView.tsx
interface DayViewProps {
  date: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
}

export function DayView({ date, events, onEventClick }: DayViewProps) {
  // Hours from 6 AM to 8 PM
  const hours = Array.from({ length: 15 }, (_, i) => i + 6);

  const dayEvents = events.filter(e =>
    isSameDay(new Date(e.startTime), date)
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h3>
        <WeatherWidget lat={37.7749} lng={-122.4194} days={1} compact />
      </div>

      {/* Time Grid */}
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b border-gray-100">
            <div className="w-16 py-3 px-2 text-xs text-gray-500 text-right bg-gray-50">
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
            <div className="flex-1 min-h-[60px] relative">
              {dayEvents
                .filter(e => new Date(e.startTime).getHours() === hour)
                .map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Day/Week/Month toggle works
- [ ] Day view shows hourly grid
- [ ] Events positioned correctly
- [ ] Weather shown for the day
- [ ] Crew assignments visible

---

### Task 3: Team Assignment from Calendar (Issue #38)
**Effort:** 8-12h

Assign team members directly from calendar view.

**Event Card with Assignment:**
```tsx
function EventCard({ event, onAssign }: { event: ScheduleEvent; onAssign?: (event: ScheduleEvent) => void }) {
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <div className="absolute left-1 right-1 bg-blue-100 border-l-4 border-blue-500 rounded p-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm text-gray-900">{event.title}</p>
          <p className="text-xs text-gray-500">{event.projectName}</p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="p-1 hover:bg-blue-200 rounded"
        >
          <UserPlusIcon className="h-4 w-4 text-blue-600" />
        </button>
      </div>

      {/* Assigned crew */}
      {event.assignedTo && event.assignedTo.length > 0 && (
        <div className="flex -space-x-2 mt-2">
          {event.assignedTo.slice(0, 3).map((userId) => (
            <UserAvatar key={userId} userId={userId} size="xs" />
          ))}
          {event.assignedTo.length > 3 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs">
              +{event.assignedTo.length - 3}
            </span>
          )}
        </div>
      )}

      {showAssignModal && (
        <AssignmentModal
          event={event}
          onClose={() => setShowAssignModal(false)}
          onAssign={(userIds) => {
            onAssign?.(event);
            setShowAssignModal(false);
          }}
        />
      )}
    </div>
  );
}
```

**Assignment Modal:**
```tsx
// components/schedule/AssignmentModal.tsx
interface AssignmentModalProps {
  event: ScheduleEvent;
  onClose: () => void;
  onAssign: (userIds: string[]) => void;
}

export function AssignmentModal({ event, onClose, onAssign }: AssignmentModalProps) {
  const { teamMembers } = useTeamMembers();
  const [selectedIds, setSelectedIds] = useState<string[]>(event.assignedTo || []);

  const availableCrew = useMemo(() => {
    // Filter to show only available crew for this date
    return teamMembers.filter(m =>
      m.role === 'FIELD' || m.role === 'EMPLOYEE'
    );
  }, [teamMembers, event.startTime]);

  const handleSave = async () => {
    // Update event with assigned crew
    await updateScheduleEvent(event.id, { assignedTo: selectedIds });
    onAssign(selectedIds);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Assign Crew to ${event.title}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {format(new Date(event.startTime), 'EEEE, MMMM d')} • {event.projectName}
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableCrew.map((member) => (
            <label
              key={member.uid}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(member.uid)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds([...selectedIds, member.uid]);
                  } else {
                    setSelectedIds(selectedIds.filter(id => id !== member.uid));
                  }
                }}
                className="rounded border-gray-300"
              />
              <UserAvatar user={member} size="sm" />
              <div>
                <p className="font-medium text-sm">{member.displayName}</p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Assignment</Button>
        </div>
      </div>
    </Modal>
  );
}
```

**Acceptance Criteria:**
- [ ] Assignment button on event cards
- [ ] Modal shows available crew
- [ ] Can select multiple crew members
- [ ] Assignment persists to Firestore
- [ ] Assigned crew shown on event

---

### Task 4: Schedule Event CRUD Hook
**Effort:** 4-6h

Ensure useScheduleEvents hook supports full CRUD:

```typescript
// lib/hooks/useScheduleEvents.ts
export function useScheduleEvents(options?: {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  // ... existing implementation

  const createEvent = async (event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Create event
  };

  const updateEvent = async (eventId: string, updates: Partial<ScheduleEvent>) => {
    // Update event
  };

  const deleteEvent = async (eventId: string) => {
    // Delete event
  };

  const assignCrew = async (eventId: string, userIds: string[]) => {
    await updateEvent(eventId, { assignedTo: userIds });
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    assignCrew,
  };
}
```

---

### Task 5: Schedule Page Integration
**Effort:** 4-6h

Wire up all components on main schedule page:

```tsx
// app/dashboard/schedule/page.tsx
export default function SchedulePage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { events, loading, assignCrew } = useScheduleEvents();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Plan and manage your team's schedule"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <ViewToggle active={view} onChange={setView} />
        <WeatherWidget compact />
      </div>

      {/* Calendar View */}
      {view === 'day' && (
        <DayView
          date={selectedDate}
          events={events}
          onEventClick={(e) => console.log('Event clicked', e)}
        />
      )}
      {view === 'week' && (
        <WeekView
          startDate={startOfWeek(selectedDate)}
          events={events}
        />
      )}
      {view === 'month' && (
        <MonthView
          month={selectedDate}
          events={events}
        />
      )}
    </div>
  );
}
```

---

## File Ownership

CLI 4 owns:
- `lib/services/weather.ts`
- `components/schedule/WeatherWidget.tsx`
- `components/schedule/WeatherAlert.tsx`
- `components/schedule/DayView.tsx`
- `components/schedule/AssignmentModal.tsx`
- Schedule page enhancements

**Coordinate with:**
- CLI 1 for schedule event demo data
- CLI 2 for component styling
- CLI 3 if navigation changes needed

---

## Commands

```bash
# Create files
mkdir -p apps/web/lib/services
mkdir -p apps/web/components/schedule

# TypeScript check
cd apps/web && npx tsc --noEmit

# Test weather (if API key set)
# Add NEXT_PUBLIC_WEATHER_API_KEY to .env.local

# Commit pattern
git add apps/web/lib/services/ apps/web/components/schedule/
git commit -m "feat(schedule): Add weather integration and day view

- Weather service with mock fallback
- WeatherWidget component
- Day view with hourly grid
- Team assignment from calendar

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Environment Variables (Optional)

For live weather data, add to `.env.local`:
```
NEXT_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key
```

Get a free API key from: https://openweathermap.org/api

---

## Success Criteria

- [ ] Weather widget displays forecast
- [ ] Mock data works without API key
- [ ] Day/Week/Month toggle works
- [ ] Day view shows hourly schedule
- [ ] Can assign crew from calendar
- [ ] Assignments persist
- [ ] TypeScript passes
- [ ] All changes committed
