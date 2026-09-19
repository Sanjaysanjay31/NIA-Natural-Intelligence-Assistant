import { AgentState, IntentSource, IntentType } from './enums';

export interface Intent {
  name: IntentType;
  confidence: number;
  source: IntentSource;
  rawInput?: string;
  parameters?: Record<string, any>;
}

export interface WakeUpEvent {
  eventId: string;
  triggerType: IntentSource;
  timestamp: string;
  payload?: Record<string, any>;
}

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  activeState: AgentState;
  context?: Record<string, any>;
}
