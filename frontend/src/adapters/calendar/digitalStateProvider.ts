import {
  ICalendarAdapter,
  NormalizedEvent,
  CalendarPermissionStatus,
  PermissionExplanation,
} from './types';
import { LocalDemoCalendarAdapter } from './localDemoCalendarAdapter';
import { NativeCalendarAdapter } from './nativeCalendarAdapter';

export class DigitalStateProvider {
  private adapter: ICalendarAdapter;
  private permissionStatus: CalendarPermissionStatus = 'NOT_REQUESTED';
  private lastSyncedAt: Date | null = null;

  constructor(adapter?: ICalendarAdapter) {
    this.adapter = adapter || new LocalDemoCalendarAdapter();
  }

  setAdapter(adapter: ICalendarAdapter) {
    this.adapter = adapter;
  }

  getPermissionStatus(): CalendarPermissionStatus {
    return this.permissionStatus;
  }

  /**
   * Explains why NIA needs calendar access before the user decides.
   * "explain why NIA needs calendar access"
   */
  getPermissionExplanation(): PermissionExplanation {
    return {
      title: 'Reality Verification Access',
      message:
        'NIA connects to your calendar to continuously verify "Is what I know still true?" against physical evidence like room change posters or schedule boards.',
      impact:
        'NIA will never silently alter your calendar. Any proposed update requires your explicit gate approval.',
    };
  }

  /**
   * Two-step permission flow:
   * 1. Explain why NIA needs calendar access
   * 2. User chooses Allow / Not Now
   * 3. Only then request/grant permission
   * Never claim access if permission is absent.
   */
  async handleUserPermissionChoice(choice: 'ALLOW' | 'NOT_NOW'): Promise<CalendarPermissionStatus> {
    if (choice === 'NOT_NOW') {
      this.permissionStatus = 'DENIED';
      return 'DENIED';
    }

    // User chose Allow
    this.permissionStatus = 'GRANTED';
    if (this.adapter instanceof NativeCalendarAdapter) {
      this.adapter.setPermissionStatus(true);
    }
    return 'GRANTED';
  }

  isSyncStale(thresholdSeconds: number = 7200): boolean {
    if (!this.lastSyncedAt) return true;
    const diffSeconds = (Date.now() - this.lastSyncedAt.getTime()) / 1000;
    return diffSeconds > thresholdSeconds;
  }

  async getUpcomingEvents(): Promise<NormalizedEvent[]> {
    if (this.permissionStatus !== 'GRANTED') {
      throw new Error(
        'CALENDAR_PERMISSION_DENIED: Calendar access cannot be claimed because permission is absent.'
      );
    }

    const events = await this.adapter.getUpcomingEvents();
    this.lastSyncedAt = new Date();
    return this.deduplicateEvents(events);
  }

  async getEventById(eventId: string): Promise<NormalizedEvent | null> {
    if (this.permissionStatus !== 'GRANTED') {
      throw new Error(
        'CALENDAR_PERMISSION_DENIED: Calendar access cannot be claimed because permission is absent.'
      );
    }
    return this.adapter.getEventById(eventId);
  }

  async refreshEvents(): Promise<NormalizedEvent[]> {
    if (this.permissionStatus !== 'GRANTED') {
      throw new Error(
        'CALENDAR_PERMISSION_DENIED: Calendar access cannot be claimed because permission is absent.'
      );
    }
    const events = await this.adapter.refreshEvents();
    this.lastSyncedAt = new Date();
    return this.deduplicateEvents(events);
  }

  normalizeEvent(rawEvent: Record<string, any>): NormalizedEvent {
    return this.adapter.normalizeEvent(rawEvent);
  }

  /**
   * Deduplicate events based on ID or (title + start time)
   */
  deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
    const seen = new Map<string, NormalizedEvent>();
    for (const ev of events) {
      const key = ev.id || `${ev.title}-${ev.start}`;
      if (!seen.has(key)) {
        seen.set(key, ev);
      }
    }
    return Array.from(seen.values());
  }
}

// Singleton for UI-independent reality intelligence feeding
export const digitalStateProvider = new DigitalStateProvider();
