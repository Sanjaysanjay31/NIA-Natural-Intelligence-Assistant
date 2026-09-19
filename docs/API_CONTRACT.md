# NIA — API Contract Specification (v1)

This document specifies the REST API contract between the phone frontend (React Native + Expo) and the backend (FastAPI). All endpoints are versioned under `/api/v1`.

---

## 1. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/wakeup` | Ingests a wake-up event from one of the 4 triggers |
| `POST` | `/api/v1/reality/check` | Evaluates a physical observation against digital state for Reality Drift |
| `GET` | `/api/v1/reality/{reality_id}/impact` | Computes downstream impacted entities |
| `GET` | `/api/v1/evidence/{evidence_id}` | Retrieves full evidence bundle and provenance data |
| `POST` | `/api/v1/actions/propose` | Proposes a safe action based on detected drift |
| `POST` | `/api/v1/actions/{action_id}/approve` | **Safe Action Gate:** Approves and executes a proposed action |
| `POST` | `/api/v1/actions/{action_id}/reject` | Rejects a proposed action with reason |
| `GET` | `/api/v1/timeline` | Retrieves chronological Reality Timeline events |
| `POST` | `/api/v1/commitments/extract` | Extracts structured commitments from voice transcript (Bhupathi hook) |

---

## 2. Detailed Request / Response Payloads

### 2.1 Reality Check (`POST /api/v1/reality/check`)

**Request:**
```json
{
  "entity": "Final Presentation",
  "observation": {
    "source": "ocr",
    "rawText": "Notice: Final Presentations moved to Room 302 due to maintenance",
    "extractedLocation": "Room 302",
    "timestamp": "2026-09-19T09:15:00Z",
    "confidence": 0.94,
    "mediaRef": "file:///storage/emulated/0/DCIM/notice_01.jpg"
  },
  "currentContext": {
    "userLocation": "Engineering Hallway",
    "activeSessionId": "sess-4029"
  }
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
  "explanation": "Digital calendar specifies Room 204, but physical signage confirms relocation to Room 302.",
  "evidenceRefs": ["ev-calendar-1", "ev-ocr-1"],
  "impactRefs": ["impact-reminder-1", "impact-alarm-1"],
  "proposedActionRef": "act-9901",
  "approvalRequired": true,
  "evaluatedAt": "2026-09-19T09:15:02Z"
}
```

---

### 2.2 Evidence Bundle (`GET /api/v1/evidence/{evidence_id}`)

**Response:**
```json
{
  "evidenceId": "ev-ocr-1",
  "source": "ocr",
  "snippet": "Presentations moved to Room 302",
  "confidence": 0.94,
  "capturedAt": "2026-09-19T09:15:00Z",
  "metadata": {
    "boundingBox": {"x": 120, "y": 340, "width": 640, "height": 80},
    "deviceModel": "iQOO Neo",
    "sensorType": "camera_back"
  }
}
```

---

### 2.3 Impact Analysis (`GET /api/v1/reality/{reality_id}/impact`)

**Response:**
```json
{
  "realityId": "real-8821",
  "impacts": [
    {
      "impactId": "impact-reminder-1",
      "targetType": "reminder",
      "targetId": "rem-201",
      "description": "Reminder 'Check Room 204 projector' is now invalid.",
      "severity": "HIGH",
      "suggestedRemediation": "Update reminder destination to Room 302"
    },
    {
      "impactId": "impact-alarm-1",
      "targetType": "alarm",
      "targetId": "alm-405",
      "description": "Travel buffer may need adjustment (+3 minutes to 3rd floor).",
      "severity": "MEDIUM",
      "suggestedRemediation": "Advance alarm by 5 minutes"
    }
  ]
}
```

---

### 2.4 Action Proposal (`POST /api/v1/actions/propose`)

**Response:**
```json
{
  "actionId": "act-9901",
  "realityId": "real-8821",
  "title": "Update Final Presentation Location",
  "description": "Change calendar location from Room 204 to Room 302 and adjust associated reminders.",
  "beforeState": {
    "calendarLocation": "Room 204",
    "reminderNotes": "Room 204 projector check"
  },
  "afterState": {
    "calendarLocation": "Room 302",
    "reminderNotes": "Room 302 projector check"
  },
  "approvalState": "PENDING_APPROVAL",
  "approvalRequired": true,
  "evidenceRefs": ["ev-calendar-1", "ev-ocr-1"],
  "createdAt": "2026-09-19T09:15:03Z"
}
```

---

### 2.5 Action Approval — Safe Action Gate (`POST /api/v1/actions/{action_id}/approve`)

**Request:**
```json
{
  "approvedBy": "user",
  "approvalMethod": "biometric_tap",
  "notes": "Confirmed with hallway signage"
}
```

**Response:**
```json
{
  "actionId": "act-9901",
  "approvalState": "APPROVED",
  "executionStatus": "EXECUTED_SUCCESSFULLY",
  "executedAt": "2026-09-19T09:15:20Z",
  "timelineEventId": "evt-7719",
  "auditSummary": "Calendar event 'Final Presentation' location updated from Room 204 to Room 302."
}
```

---

### 2.6 Reality Timeline (`GET /api/v1/timeline`)

**Response:**
```json
{
  "events": [
    {
      "eventId": "evt-7719",
      "timestamp": "2026-09-19T09:15:20Z",
      "eventType": "ACTION_EXECUTED",
      "title": "Room 204 -> Room 302 Location Updated",
      "entity": "Final Presentation",
      "evidenceRefs": ["ev-ocr-1"],
      "actor": "user"
    },
    {
      "eventId": "evt-7718",
      "timestamp": "2026-09-19T09:15:02Z",
      "eventType": "DRIFT_DETECTED",
      "title": "Location Contradiction Flagged",
      "entity": "Final Presentation",
      "evidenceRefs": ["ev-calendar-1", "ev-ocr-1"],
      "actor": "veyra_x"
    }
  ]
}
```

---

### 2.7 Wake-Up Event (`POST /api/v1/wakeup`)

**Request:**
```json
{
  "triggerType": "VOICE_HOTWORD",
  "timestamp": "2026-09-19T09:14:55Z",
  "payload": {
    "transcription": "Hey NIA, check my presentation room",
    "confidence": 0.98
  }
}
```

**Response:**
```json
{
  "sessionId": "sess-4029",
  "agentState": "LISTENING_AND_EVALUATING",
  "promptMessage": "Checking current presentation schedule and live notices..."
}
```

---

### 2.8 Commitment Integration (`POST /api/v1/commitments/extract`)

**Request:**
```json
{
  "transcript": "I promised Prof. Sharma I would submit the revised slides by 5 PM today.",
  "recordedAt": "2026-09-19T10:00:00Z",
  "sourceAudioRef": "audio-memo-104.m4a"
}
```

**Response:**
```json
{
  "commitmentId": "cmt-5501",
  "title": "Submit revised slides to Prof. Sharma",
  "counterparty": "Prof. Sharma",
  "deadline": "2026-09-19T17:00:00Z",
  "confidence": 0.91,
  "status": "OPEN",
  "evidenceRef": "audio-memo-104.m4a"
}
```
