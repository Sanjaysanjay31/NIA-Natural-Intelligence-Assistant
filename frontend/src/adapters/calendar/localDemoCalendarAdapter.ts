import { ICalendarAdapter, NormalizedEvent } from './types';

/**
 * Local deterministic Calendar Adapter for Expo Go development and testing.
 * Seeded with the primary deterministic demo:
 * "Final Presentation" at 09:00 in "Room 204".
 */
export class LocalDemoCalendarAdapter implements ICalendarAdapter {
  private events: Map<string, NormalizedEvent> = new Map();

  constructor() {
    this.seedDemoEvents();
  }

  private seedDemoEvents() {
    const demoEvent: NormalizedEvent = {
      id: 'evt-final-presentation',
      title: 'Final Presentation',
      start: '2026-09-19T09:00:00Z',
      end: '2026-09-19T10:00:00Z',
      location: 'Room 204',
      source: 'local_demo_calendar',
      lastSyncedAt: new Date().toISOString(),
      metadata: { attendees: ['team@nia.ai', 'prof.sharma@univ.edu'] },
    };
    this.events.set(demoEvent.id, demoEvent);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getUpcomingEvents(): Promise<NormalizedEvent[]> {
    return Array.from(this.events.values());
  }

  async getEventById(eventId: string): Promise<NormalizedEvent | null> {
    return this.events.get(eventId) || null;
  }

  async refreshEvents(): Promise<NormalizedEvent[]> {
    const now = new Date().toISOString();
    this.events.forEach((ev) => {
      ev.lastSyncedAt = now;
    });
    return Array.from(this.events.values());
  }

  normalizeEvent(rawEvent: Record<string, any>): NormalizedEvent {
    let startIso = new Date().toISOString();
    let endIso = new Date().toISOString();

    if (rawEvent.start) {
      startIso = new Date(rawEvent.start).toISOString();
    }
    if (rawEvent.end) {
      endIso = new Date(rawEvent.end).toISOString();
    }

    return {
      id: String(rawEvent.id || `evt-${Date.now()}`),
      title: String(rawEvent.title || 'Untitled Event'),
      start: startIso,
      end: endIso,
      location: rawEvent.location ? String(rawEvent.location).trim() : undefined,
      source: String(rawEvent.source || 'calendar'),
      lastSyncedAt: new Date().toISOString(),
      metadata: rawEvent.metadata || {},
    };
  }

  // Helper for test mutations
  setEvent(event: NormalizedEvent) {
    this.events.set(event.id, event);
  }

  clearEvents() {
    this.events.clear();
  }
}
