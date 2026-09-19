# NIA — Complete REST API Specification (v1)
> **Authoritative Contract for Frontend-Backend Communication in NIA**

All endpoints are versioned under the base prefix `/api/v1`.

---

## 📑 1. Global Route Table

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health` | Application health and timestamp |
| | `GET` | `/ready` | Subsystem readiness probe |
| **Reality (VEYRA X)** | `POST` | `/api/v1/reality/check` | Ingests observation and evaluates Reality Drift |
| | `GET` | `/api/v1/reality/{reality_id}/impact` | Computes cascading downstream affected entities |
| **Safe Action Gate** | `POST` | `/api/v1/actions/propose` | Proposes non-destructive remediation action |
| | `POST` | `/api/v1/actions/{action_id}/approve` | Explicit human approval and execution |
| | `POST` | `/api/v1/actions/{action_id}/reject` | Explicit human rejection with reason |
| **Reality Timeline** | `GET` | `/api/v1/timeline` | Retrieves chronological immutable audit log |
| **Digital State** | `GET` | `/api/v1/digital-state/events` | Retrieves upcoming calendar ground truth events |
| | `POST` | `/api/v1/digital-state/sync` | Force synchronizes ground truth from adapters |
| **Office Kit** | `POST` | `/api/v1/office-kit/generate-audit` | Generates 10-section Reality Audit Report |
| **Settings** | `GET` | `/api/v1/settings` | Retrieves current user configuration |
| | `POST` | `/api/v1/settings` | Updates configuration with invariant checks |
| | `GET` | `/api/v1/settings/diagnostics` | Retrieves safe diagnostics (zero secrets) |
| | `POST` | `/api/v1/settings/delete-evidence` | Purges local device evidence cache |
| **Hackathon Demo** | `GET` | `/api/v1/demo/state` | Retrieves active state across the 17 steps |
| | `POST` | `/api/v1/demo/reset` | Resets demo to Step 1 and restores ground truth |
| | `POST` | `/api/v1/demo/step-forward` | Advances demo scenario by one step |
| | `POST` | `/api/v1/demo/step-backward` | Rewinds demo scenario by one step |
| | `POST` | `/api/v1/demo/jump/{step}` | Jumps directly to any step (1..17) |
| | `POST` | `/api/v1/demo/run-e2e` | Executes complete end-to-end integration flow |

---

## 📡 2. Endpoint Payloads & Schemas

### 2.1 Reality Drift Evaluation
`POST /api/v1/reality/check`

**Request:**
```json
{
  "entity": "Final Presentation",
  "rawText": "Notice: Departmental Presentations moved to Room 302 due to AC repair.",
  "extractedLocation": "Room 302",
  "source": "ocr"
}
```

**Response (Drift Detected):**
```json
{
  "realityId": "real-8821",
  "entity": "Final Presentation",
  "digital": {
    "location": "Room 204",
    "source": "calendar",
    "scheduledTime": "2026-09-19T09:00:00Z"
  },
  "physical": {
    "location": "Room 302",
    "source": "ocr",
    "observedAt": "2026-09-19T09:15:00Z"
  },
  "state": "REALITY_DRIFT",
  "driftType": "LOCATION_CHANGED",
  "confidence": 0.94,
  "evidenceRefs": ["ev-calendar-1", "ev-ocr-1"],
  "impactRefs": ["imp-001", "imp-002"],
  "proposedActionRef": "act-9901",
  "approvalRequired": true,
  "explanation": "Digital calendar specifies Room 204, but physical camera OCR observed Room 302."
}
```

---

### 2.2 Safe Action Gate
`POST /api/v1/actions/{action_id}/approve`

**Request:**
```json
{
  "approvedBy": "user",
  "approvalMethod": "button_tap",
  "notes": "Verified against hallway notice"
}
```

**Response:**
```json
{
  "actionId": "act-9901",
  "approvalState": "APPROVED",
  "executionState": "SUCCEEDED",
  "executionStatus": "EXECUTION_SUCCEEDED",
  "executedAt": "2026-09-19T09:16:02Z",
  "auditSummary": "Updated reminder location to Room 302 upon explicit user approval."
}
```

---

### 2.3 Office Kit Reality Audit Export
`POST /api/v1/office-kit/generate-audit`

**Request:**
```json
{
  "session_id": "sess-hackathon-2026-demo"
}
```

**Response:**
```json
{
  "report": {
    "title": "NIA Reality Audit Report",
    "session": {
      "session_id": "sess-hackathon-2026-demo",
      "timestamp": "2026-09-19T09:16:05Z",
      "device": "iQOO Neo / Android Prototype",
      "runtime_mode": "On-Device VEYRA X Reality Intelligence"
    },
    "what_nia_knew": {
      "entity": "Final Presentation",
      "location": "Room 204",
      "scheduled_time": "09:00 AM",
      "source": "Google Calendar (Synchronized)"
    },
    "what_was_observed": {
      "location": "Room 302",
      "source": "Camera / Notice Board OCR",
      "raw_snippet": "Presentations moved to Room 302."
    },
    "reality_drift": {
      "state": "REALITY_DRIFT",
      "drift_type": "LOCATION_CHANGED",
      "confidence": 0.96
    },
    "evidence": [ ... ],
    "impact": [ ... ],
    "proposed_action": { ... },
    "approval": { "approved_by": "user", "approval_state": "APPROVED" },
    "result": { "status": "SUCCEEDED" },
    "timeline": [ ... ]
  },
  "markdown": "# NIA REALITY AUDIT REPORT\n\n## 1. SESSION\n..."
}
```

---

### 2.4 Deterministic Hackathon Demo Mode
`POST /api/v1/demo/run-e2e`

**Response:**
```json
{
  "status": "E2E_DEMO_COMPLETED_SUCCESSFULLY",
  "drift_result": {
    "state": "REALITY_DRIFT",
    "drift_type": "LOCATION_CHANGED",
    "confidence": 0.94
  },
  "action": {
    "action_id": "act-demo-room-update-001",
    "approval_state": "APPROVED",
    "execution_state": "SUCCEEDED"
  },
  "timeline_event_id": "evt-exec-f819",
  "audit_report_session": "sess-hackathon-2026-demo",
  "state": {
    "step": 17,
    "total_steps": 17,
    "current_effective_location": "Room 302",
    "audit_exported": true
  }
}
```
