import { ICalendarAdapter, NormalizedEvent } from './types';

/**
 * Mock Calendar Adapter for deterministic frontend testing.
 */
export class MockCalendarAdapter implements ICalendarAdapter {
  private events: NormalizedEvent[] = [];
  private available: boolean = true;

  constructor(initialEvents: NormalizedEvent[] = []) {
    this.events = [...initialEvents];
  }

  setAvailable(available: boolean) {
    this.available = available;
  }

  setEvents(events: NormalizedEvent[]) {
    this.events = [...events];
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async getUpcomingEvents(): Promise<NormalizedEvent[]> {
    return [...this.events];
  }

  async getEventById(eventId: string): Promise<NormalizedEvent | null> {
    return this.events.find((e) => e.id === eventId) || null;
  }

  async refreshEvents(): Promise<NormalizedEvent[]> {
    return [...this.events];
  }

  normalizeEvent(rawEvent: Record<string, any>): NormalizedEvent {
    return {
      id: rawEvent.id || 'mock-id',
      title: rawEvent.title || 'Mock Event',
      start: rawEvent.start || new Date().toISOString(),
      end: rawEvent.end || new Date().toISOString(),
      location: rawEvent.location,
      source: 'mock_calendar',
      lastSyncedAt: new Date().toISOString(),
      metadata: rawEvent.metadata || {},
    };
  }
}
