import { DemoImpactItem, DemoStepMeta } from './types';

export const DEMO_ENTITY = 'Final Presentation';
export const DEMO_EVENT_ID = 'evt-final-presentation';
export const DEMO_SESSION_ID = 'sess-hackathon-2026-demo';

export const DEMO_DIGITAL_LOCATION = 'Room 204';
export const DEMO_DIGITAL_TIME = '09:00';
export const DEMO_DIGITAL_SOURCE = 'google_calendar';

export const DEMO_PHYSICAL_NOTICE_TEXT = 'Presentations moved to Room 302.';
export const DEMO_PHYSICAL_LOCATION = 'Room 302';
export const DEMO_PHYSICAL_SOURCE = 'camera_ocr';

export const DEMO_USER_QUERY = 'Is my presentation information still correct?';

export const DEMO_DRIFT_TYPE = 'LOCATION_CHANGED';
export const DEMO_CONFIDENCE = 0.94;

export const DEMO_IMPACT_ITEMS: DemoImpactItem[] = [
  {
    id: 'imp-1',
    entityType: 'calendar_event',
    name: 'Final Presentation',
    impactDescription: 'Scheduled room changed from Room 204 to Room 302',
    severity: 'HIGH',
  },
  {
    id: 'imp-2',
    entityType: 'reminder',
    name: 'Arrive 10m early for slides setup',
    impactDescription: 'Location reference is outdated (Room 204)',
    severity: 'MEDIUM',
  },
  {
    id: 'imp-3',
    entityType: 'alarm',
    name: 'Morning Presentation Alarm',
    impactDescription: 'Walking travel time to Room 302 is +3 minutes',
    severity: 'LOW',
  },
  {
    id: 'imp-4',
    entityType: 'commitment',
    name: 'Bring printed handout for judges',
    impactDescription: 'Delivery destination shifted to Room 302',
    severity: 'MEDIUM',
  },
];

export const DEMO_PROPOSED_ACTION = {
  actionId: 'act-demo-room-update-001',
  type: 'UPDATE_REMINDER',
  description: 'Update reminder & calendar from Room 204 to Room 302',
  affectedEntity: DEMO_ENTITY,
  beforeState: { location: DEMO_DIGITAL_LOCATION, time: DEMO_DIGITAL_TIME },
  proposedState: { location: DEMO_PHYSICAL_LOCATION, time: DEMO_DIGITAL_TIME },
  confidence: DEMO_CONFIDENCE,
};

export const DEMO_STEPS_METADATA: DemoStepMeta[] = [
  {
    step: 1,
    title: 'Calendar Ground Truth',
    description: 'Digital state seeds Final Presentation at 09:00 in Room 204.',
    agentState: 'IDLE',
  },
  {
    step: 2,
    title: 'Activate NIA',
    description: 'Wake-up trigger fired via hotword, tap, or gesture.',
    agentState: 'LISTENING',
  },
  {
    step: 3,
    title: 'Orb Appears',
    description: 'Cinematic dark base Orb glows cyan in foreground.',
    agentState: 'LISTENING',
  },
  {
    step: 4,
    title: 'User Inquires',
    description: "User asks: 'Is my presentation information still correct?'",
    agentState: 'PROCESSING',
  },
  {
    step: 5,
    title: 'NIA Enters Verifying',
    description: 'Agent transitions to VERIFYING state to contrast reality.',
    agentState: 'VERIFYING',
  },
  {
    step: 6,
    title: 'Physical Notice Observed',
    description: "Physical flyer detected: 'Presentations moved to Room 302.'",
    agentState: 'VERIFYING',
  },
  {
    step: 7,
    title: 'OCR Entity Extraction',
    description: 'Deterministic local OCR provider normalizes destination to Room 302.',
    agentState: 'VERIFYING',
  },
  {
    step: 8,
    title: 'VEYRA X Detects Location Drift',
    description: 'Reality engine flags LOCATION_CHANGED drift (Room 204 -> Room 302).',
    agentState: 'DRIFT_DETECTED',
  },
  {
    step: 9,
    title: 'Evidence Replay',
    description: 'Bilateral side-by-side contrast: Calendar (204) vs Notice (302).',
    agentState: 'DRIFT_DETECTED',
  },
  {
    step: 10,
    title: 'Impact Graph Evaluation',
    description: 'Traced cascade across presentation, reminder, alarm, and commitment.',
    agentState: 'PROPOSING_ACTION',
  },
  {
    step: 11,
    title: "User Taps 'Fix It'",
    description: 'Intent router triggers safe action proposal flow.',
    agentState: 'PROPOSING_ACTION',
  },
  {
    step: 12,
    title: 'Safe Action Gate Asks Approval',
    description: 'Explicit approval prompt: Update reminder to Room 302?',
    agentState: 'AWAITING_APPROVAL',
  },
  {
    step: 13,
    title: 'User Approves',
    description: 'User gives explicit affirmative approval.',
    agentState: 'EXECUTING',
  },
  {
    step: 14,
    title: 'Adapter Updates Reminder',
    description: 'Safe action executes; reminder destination updated to Room 302.',
    agentState: 'EXECUTING',
  },
  {
    step: 15,
    title: 'NIA Shows SUCCESS',
    description: 'Orb pulses emerald green; state resolves to SUCCESS.',
    agentState: 'SUCCESS',
  },
  {
    step: 16,
    title: 'Timeline Records Change',
    description: 'Audit event appended to chronological reality timeline.',
    agentState: 'SUCCESS',
  },
  {
    step: 17,
    title: 'Reality Audit Exported',
    description: '10-section portable audit generated for Office Kit review.',
    agentState: 'SUCCESS',
  },
];
