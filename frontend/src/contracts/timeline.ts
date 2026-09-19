import { TimelineEventType } from './enums';

export interface TimelineEvent {
  eventId: string;
  timestamp: string;
  eventType: TimelineEventType;
  title: string;
  entity: string;
  evidenceRefs: string[];
  actor: string;
  details?: Record<string, any>;
}
