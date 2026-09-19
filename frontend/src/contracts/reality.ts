import { RealityState, DriftType } from './enums';
import { ProposedAction } from './action';

export interface DriftResult {
  realityId?: string;
  entity: string;
  digital: Record<string, any>;
  physical: Record<string, any>;
  state: RealityState;
  driftType: DriftType;
  confidence: number;
  agreement: boolean;
  evidenceRefs: string[];
  impactRefs: string[];
  affectedEntities: string[];
  proposedActionRef?: string;
  proposedAction?: ProposedAction;
  approvalRequired: boolean;
  explanation?: string;
  evaluatedAt: string;
}

export interface RealityCheckRequest {
  entity: string;
  physicalObservationId?: string;
  rawText?: string;
  extractedLocation?: string;
  source?: string;
  context?: Record<string, any>;
}
