export type DemoAgentState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'VERIFYING'
  | 'DRIFT_DETECTED'
  | 'PROPOSING_ACTION'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING'
  | 'SUCCESS';

export interface DemoStepMeta {
  step: number;
  title: string;
  description: string;
  agentState: DemoAgentState;
}

export interface DemoImpactItem {
  id: string;
  entityType: string;
  name: string;
  impactDescription: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DemoScenarioState {
  sessionId: string;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  agentState: DemoAgentState;
  entity: string;
  digitalState: {
    eventId: string;
    title: string;
    time: string;
    location: string;
    source: string;
  };
  userQuery: string | null;
  physicalObservation: {
    rawText: string | null;
    extractedLocation: string | null;
    source: string | null;
  };
  drift: {
    detected: boolean;
    driftType: string;
    confidence: number;
    before: string | null;
    current: string | null;
  };
  evidenceReplayActive: boolean;
  impactItems: DemoImpactItem[];
  action: {
    proposed: boolean;
    actionId: string;
    type: string;
    description: string;
    approvalState: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    executionState: 'NOT_EXECUTED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED';
  };
  currentEffectiveLocation: string;
  timelineRecorded: boolean;
  auditExported: boolean;
  isAutoPlaying: boolean;
  debugMode: boolean;
}
