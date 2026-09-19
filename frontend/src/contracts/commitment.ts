import { CommitmentStatus } from './enums';

export interface Commitment {
  commitmentId: string;
  title: string;
  counterparty?: string;
  deadline?: string;
  confidence: number;
  status: CommitmentStatus;
  evidenceRef?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
