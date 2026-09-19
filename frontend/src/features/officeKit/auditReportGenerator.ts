import { RealityAuditReport } from './types';

export class AuditReportGenerator {
  /**
   * Generates deterministic demo report:
   * Room 204 -> Room 302 with evidence and approved reminder update.
   */
  public static generateDemoReport(sessionId: string = `sess-audit-${Date.now()}`): RealityAuditReport {
    const now = new Date().toISOString();
    return {
      title: 'NIA Reality Audit Report',
      generatedAt: now,
      session: {
        sessionId,
        timestamp: now,
        device: 'iQOO Neo / Android Prototype',
        runtimeMode: 'On-Device VEYRA X Reality Intelligence',
      },
      whatNiaKnew: {
        entity: 'Final Presentation',
        location: 'Room 204',
        scheduledTime: '09:00 AM',
        source: 'Google Calendar (Synchronized)',
        lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      whatWasObserved: {
        location: 'Room 302',
        observedAt: now,
        source: 'Camera / Notice Board OCR',
        rawSnippet: 'Presentations moved to Room 302.',
      },
      realityDrift: {
        state: 'REALITY_DRIFT',
        driftType: 'LOCATION_CHANGED',
        confidence: 0.96,
        driftSummary: 'Physical evidence contradicts digital calendar ground truth (Room 204 != Room 302).',
      },
      evidence: [
        {
          evidenceId: 'ev-ocr-hackathon-1',
          source: 'camera/OCR',
          snippet: 'Presentations moved to Room 302.',
          confidence: 0.96,
          capturedAt: now,
          privacyStatus: 'PROCESSED_ON_DEVICE_LOCAL_ONLY',
        },
      ],
      impact: {
        affectedEntities: [
          'Final Presentation Reminder',
          'Departure Walk Alarm (Room 204)',
          'Faculty Review Meeting with Prof. Sharma',
        ],
        items: [
          {
            targetType: 'reminder',
            description: 'Prepare presentation deck (Target: Room 204)',
            severity: 'HIGH',
          },
          {
            targetType: 'alarm',
            description: 'Departure Alarm: Walk to Room 204',
            severity: 'HIGH',
          },
          {
            targetType: 'meeting',
            description: 'Faculty review session with Prof. Sharma',
            severity: 'MEDIUM',
          },
        ],
      },
      proposedAction: {
        actionId: 'act-update-room-302',
        title: 'Update reminder location',
        description: 'Update reminder and calendar location from Room 204 to Room 302?',
        beforeState: { location: 'Room 204' },
        afterState: { location: 'Room 302' },
      },
      approval: {
        state: 'APPROVED',
        approvalMethod: 'Explicit Safe Gate Button Tap',
        approvedAt: now,
        notes: 'User approved proposed relocation to Room 302.',
      },
      result: {
        executionStatus: 'SUCCEEDED',
        summary: 'Reminder and calendar entity successfully updated to Room 302 and logged to timeline.',
        recordedAt: now,
      },
      timeline: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          eventType: 'TRUTH_CONFIRMED',
          title: 'Calendar Ground Truth: Final Presentation scheduled in Room 204',
        },
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          eventType: 'OBSERVATION_INGESTED',
          title: 'Notice Board OCR captured: "Presentations moved to Room 302."',
        },
        {
          timestamp: new Date(Date.now() - 90000).toISOString(),
          eventType: 'DRIFT_DETECTED',
          title: 'Location Drift Detected: Room 204 → Room 302 (Confidence: 96%)',
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          eventType: 'ACTION_PROPOSED',
          title: 'Safe Action Gate: Update reminder location proposed',
        },
        {
          timestamp: new Date(Date.now() - 30000).toISOString(),
          eventType: 'ACTION_APPROVED',
          title: 'User explicitly approved action via Safe Gate',
        },
        {
          timestamp: now,
          eventType: 'ACTION_EXECUTED',
          title: 'Reminder updated to Room 302; Ground truth re-aligned',
        },
      ],
    };
  }

  /**
   * Render clean, portable Markdown representation of the 10 sections.
   */
  public static toMarkdown(report: RealityAuditReport): string {
    return `# ${report.title}
Generated: ${report.generatedAt}

---

### 1. Session
- **Session ID:** \`${report.session.sessionId}\`
- **Timestamp:** ${report.session.timestamp}
- **Device:** ${report.session.device}
- **Runtime Mode:** ${report.session.runtimeMode}

### 2. What NIA Knew (Digital Ground Truth)
- **Entity:** ${report.whatNiaKnew.entity}
- **Location:** ${report.whatNiaKnew.location || 'N/A'}
- **Scheduled Time:** ${report.whatNiaKnew.scheduledTime || 'N/A'}
- **Source:** ${report.whatNiaKnew.source}

### 3. What Was Observed (Physical Perception)
- **Observed Location:** ${report.whatWasObserved.location}
- **Observation Source:** ${report.whatWasObserved.source}
- **Raw Snippet:** "${report.whatWasObserved.rawSnippet}"
- **Timestamp:** ${report.whatWasObserved.observedAt}

### 4. Reality Drift
- **State:** ${report.realityDrift.state}
- **Drift Type:** ${report.realityDrift.driftType}
- **Confidence:** ${(report.realityDrift.confidence * 100).toFixed(0)}%
- **Summary:** ${report.realityDrift.driftSummary}

### 5. Evidence
${report.evidence
  .map(
    (e) => `- **ID:** \`${e.evidenceId}\` | **Source:** ${e.source} | **Snippet:** "${e.snippet}" | **Confidence:** ${(e.confidence * 100).toFixed(0)}% | **Privacy:** ${e.privacyStatus}`
  )
  .join('\n')}

### 6. Impact
${report.impact.items
  .map((i) => `- **${i.targetType.toUpperCase()}** (${i.severity}): ${i.description}`)
  .join('\n')}

### 7. Proposed Action
- **Action ID:** \`${report.proposedAction.actionId}\`
- **Description:** ${report.proposedAction.description}
- **Before:** ${JSON.stringify(report.proposedAction.beforeState)}
- **After:** ${JSON.stringify(report.proposedAction.afterState)}

### 8. Approval
- **Status:** ${report.approval.state}
- **Method:** ${report.approval.approvalMethod}
- **Timestamp:** ${report.approval.approvedAt}
- **Notes:** ${report.approval.notes || 'None'}

### 9. Result
- **Status:** ${report.result.executionStatus}
- **Summary:** ${report.result.summary}
- **Recorded At:** ${report.result.recordedAt}

### 10. Timeline
${report.timeline
  .map((t) => `1. \`${t.timestamp.slice(11, 19)}\` — **${t.eventType}**: ${t.title}`)
  .join('\n')}
`;
  }
}
