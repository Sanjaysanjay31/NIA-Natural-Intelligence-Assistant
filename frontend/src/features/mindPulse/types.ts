export type MindPulseState =
  | 'IDLE'
  | 'PULSING'           // "Mind Pulse"
  | 'CAPTURING'         // "Reading current screen…"
  | 'EXTRACTING'        // "Extracting context…"
  | 'CHECKING'          // "Reality check complete"
  | 'RESULT'
  | 'ERROR';

export type MindPulseResultStatus = 'VERIFIED' | 'DRIFT' | 'NEEDS_REVIEW';

export interface ScreenCaptureResult {
  rawText: string;
  sourceApp: string;
  capturedAt: string;
  isSimulated: boolean;
  confidence: number;
}

export interface MindPulseExtractedContext {
  events: string[];
  commitments: string[];
  locations: string[];
  deadlines: string[];
  tasks: string[];
  people: string[];
  decisions: string[];
  confidence: number;
  rawText: string;
}

export interface MindPulseOutcome {
  status: MindPulseResultStatus;
  summary: string;
  headline: string;
  digitalState: {
    entity: string;
    location?: string;
    scheduledTime?: string;
    source: string;
  };
  screenObserved: {
    location?: string;
    time?: string;
    sourceApp: string;
  };
  confidence: number;
  extracted: MindPulseExtractedContext;
  requiresReview: boolean;
}

export interface IScreenCaptureAdapter {
  isAccessibilityEnabled(): Promise<boolean>;
  captureCurrentScreen(): Promise<ScreenCaptureResult>;
  getAdapterType(): 'SIMULATED' | 'NATIVE_ACCESSIBILITY';
}
