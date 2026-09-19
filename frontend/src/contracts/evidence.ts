export interface EvidenceItem {
  evidenceId: string;
  source: string;
  snippet: string;
  confidence: number;
  capturedAt: string;
  mediaRef?: string;
  metadata?: Record<string, any>;
}
