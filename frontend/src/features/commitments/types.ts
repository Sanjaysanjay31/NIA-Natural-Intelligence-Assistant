export type CommitmentStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'AT_RISK';

export type CommitmentSource =
  | 'CONVERSATION'
  | 'MEETING_TRANSCRIPT'
  | 'VOICE_MEMO'
  | 'IMPORTED_TEXT'
  | 'DEMO';

export interface CommitmentEvidenceItem {
  evidenceRef?: string;
  rawQuote?: string;
  startChar?: number;
  endChar?: number;
  speaker?: string;
  audioRef?: string;
  metadata?: Record<string, any>;
}

export interface CommitmentItem {
  id: string;
  owner: string;
  action: string;
  deadline?: string;
  source: CommitmentSource;
  status: CommitmentStatus;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  relatedEventId?: string;
  relatedLocation?: string;
  evidenceRef?: string;
  evidence?: CommitmentEvidenceItem;
  metadata?: Record<string, any>;
}

export interface CommitmentFilterOptions {
  owner?: string;
  status?: CommitmentStatus;
  relatedEventId?: string;
  relatedLocation?: string;
}
