export type VoiceIntentType =
  | 'NEXT_MEETING'
  | 'VERIFY_INFORMATION'
  | 'WHAT_CHANGED'
  | 'WHY'
  | 'WHAT_AFFECTS'
  | 'FIX_IT'
  | 'CANCEL'
  | 'HELP'
  // Extension point strictly reserved for Bhupathi's module:
  | 'COMMITMENT_EXTRACT';

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'ERROR';

export interface IntentRouteResult {
  intent: VoiceIntentType;
  confidence: number;
  rawInput: string;
  parameters?: Record<string, any>;
  isBhupathiExtensionPoint?: boolean;
}

export interface IIntentRouter {
  route(input: string): IntentRouteResult;
}

export interface VoiceSessionState {
  voiceState: VoiceState;
  transcript: string;
  interimTranscript: string;
  recognizedIntent: IntentRouteResult | null;
  micPermissionGranted: boolean;
  isTtsSpeaking: boolean;
  error?: string;
}
