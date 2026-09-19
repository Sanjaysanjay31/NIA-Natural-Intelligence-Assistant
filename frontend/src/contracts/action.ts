import { ApprovalState } from './enums';

export interface ProposedAction {
  actionId: string;
  realityId?: string;
  title: string;
  description: string;
  beforeState: Record<string, any>;
  afterState: Record<string, any>;
  approvalState: ApprovalState;
  approvalRequired: boolean;
  evidenceRefs: string[];
  createdAt: string;
}

export interface ActionApprovalRequest {
  approvedBy?: string;
  approvalMethod?: string;
  notes?: string;
}

export interface ActionExecutionResult {
  actionId: string;
  approvalState: ApprovalState;
  executionStatus: string;
  executedAt: string;
  timelineEventId?: string;
  auditSummary: string;
}
