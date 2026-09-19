export type CalendarPermissionStatus = 'GRANTED' | 'DENIED' | 'NOT_REQUESTED';

export interface NormalizedEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 UTC
  end: string;   // ISO 8601 UTC
  location?: string;
  source: string;
  lastSyncedAt: string;
  metadata?: Record<string, any>;
}

// Backward-compatible alias
export type CalendarEvent = NormalizedEvent;

export interface ICalendarAdapter {
  isAvailable(): Promise<boolean>;
  getUpcomingEvents(): Promise<NormalizedEvent[]>;
  getEventById(eventId: string): Promise<NormalizedEvent | null>;
  refreshEvents(): Promise<NormalizedEvent[]>;
  normalizeEvent(rawEvent: Record<string, any>): NormalizedEvent;
}

export interface PermissionExplanation {
  title: string;
  message: string;
  impact: string;
}
