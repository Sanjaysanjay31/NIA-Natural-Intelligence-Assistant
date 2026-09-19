export interface DigitalObservation {
  id: string;
  source: string;
  entity: string;
  location?: string;
  scheduledTime?: string;
  status?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PhysicalObservation {
  id: string;
  source: string;
  entity?: string;
  location?: string;
  rawText?: string;
  confidence: number;
  mediaRef?: string;
  observedAt: string;
  metadata?: Record<string, any>;
}

export interface ObservationSummary {
  source: string;
  location?: string;
  scheduledTime?: string;
  observedAt?: string;
  rawSnippet?: string;
  extra?: Record<string, any>;
}
