import { AgentState, IntentSource, IntentType, WakeUpSource } from './enums';

export type CapabilityStatus = 'supported' | 'simulation' | 'unavailable';

export interface WakeUpCapabilities {
  alwaysListening: CapabilityStatus;
  screenCapture: CapabilityStatus;
  gestureSupport: CapabilityStatus;
  platformMode: 'expo_go' | 'native_android' | 'web';
}

export interface Intent {
  name: IntentType;
  confidence: number;
  source: IntentSource;
  rawInput?: string;
  parameters?: Record<string, any>;
}

export interface WakeUpEvent {
  source: WakeUpSource;
  timestamp: string;
  sessionId: string;
  payload?: Record<string, any>;
  capabilities: WakeUpCapabilities;
  eventId?: string; // backward-compat alias
  triggerType?: IntentSource; // backward-compat alias
}

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  activeState: AgentState;
  context?: Record<string, any>;
}
