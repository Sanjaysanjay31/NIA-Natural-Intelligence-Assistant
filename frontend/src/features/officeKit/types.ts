export interface RealityAuditReport {
  title: string;
  generatedAt: string;
  // Section 1: Session
  session: {
    sessionId: string;
    timestamp: string;
    device: string;
    runtimeMode: string;
  };
  // Section 2: What NIA knew
  whatNiaKnew: {
    entity: string;
    location?: string;
    scheduledTime?: string;
    source: string;
    lastSyncedAt: string;
  };
  // Section 3: What was observed
  whatWasObserved: {
    location?: string;
    observedAt: string;
    source: string;
    rawSnippet: string;
  };
  // Section 4: Reality Drift
  realityDrift: {
    state: string;
    driftType: string;
    confidence: number;
    driftSummary: string;
  };
  // Section 5: Evidence
  evidence: Array<{
    evidenceId: string;
    source: string;
    snippet: string;
    confidence: number;
    capturedAt: string;
    privacyStatus: string;
  }>;
  // Section 6: Impact
  impact: {
    affectedEntities: string[];
    items: Array<{
      targetType: string;
      description: string;
      severity: string;
    }>;
  };
  // Section 7: Proposed Action
  proposedAction: {
    actionId: string;
    title: string;
    description: string;
    beforeState: Record<string, any>;
    afterState: Record<string, any>;
  };
  // Section 8: Approval
  approval: {
    state: string;
    approvalMethod: string;
    approvedAt: string;
    notes?: string;
  };
  // Section 9: Result
  result: {
    executionStatus: string;
    summary: string;
    recordedAt: string;
  };
  // Section 10: Timeline
  timeline: Array<{
    timestamp: string;
    eventType: string;
    title: string;
  }>;
}
