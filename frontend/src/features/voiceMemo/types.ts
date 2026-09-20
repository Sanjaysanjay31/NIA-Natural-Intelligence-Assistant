export type VoiceMemoState =
  | 'idle'
  | 'recording'
  | 'stopped'
  | 'processing'
  | 'extracted'
  | 'saved'
  | 'error';

export interface ExtractedCommitmentItem {
  id: string;
  owner: string;
  action: string;
  deadline?: string;
  confidence: number;
  status: string;
  source: string;
  relatedEventId?: string;
  relatedLocation?: string;
  evidenceRef?: string;
}

export interface VoiceMemoSession {
  sessionId: string;
  durationSeconds: number;
  transcript?: string;
  audioUri?: string;
  commitments: ExtractedCommitmentItem[];
  errorMessage?: string;
  isDemoMode: boolean;
}

export interface IRecordingAdapter {
  isAvailable(): boolean;
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ audioUri?: string; durationSeconds: number }>;
}
