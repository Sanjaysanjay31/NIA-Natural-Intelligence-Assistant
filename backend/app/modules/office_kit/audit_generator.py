from datetime import datetime, timezone
from typing import Dict, Any, List


class AuditReportGenerator:
    """
    Generates deterministic Reality Audit export in 10 sections.
    Invariant: Laptop is an extension/mirror, NOT the primary UI.
    """

    @classmethod
    def generate_demo_report(cls, session_id: str = "sess-demo-audit-1") -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        return {
            "title": "NIA Reality Audit Report",
            "generated_at": now,
            # 1. Session
            "session": {
                "session_id": session_id,
                "timestamp": now,
                "device": "iQOO Neo / Android Prototype",
                "runtime_mode": "On-Device VEYRA X Reality Intelligence"
            },
            # 2. What NIA knew
            "what_nia_knew": {
                "entity": "Final Presentation",
                "location": "Room 204",
                "scheduled_time": "09:00 AM",
                "source": "Google Calendar (Synchronized)",
                "last_synced_at": now
            },
            # 3. What was observed
            "what_was_observed": {
                "location": "Room 302",
                "observed_at": now,
                "source": "Camera / Notice Board OCR",
                "raw_snippet": "Presentations moved to Room 302."
            },
            # 4. Reality Drift
            "reality_drift": {
                "state": "REALITY_DRIFT",
                "drift_type": "LOCATION_CHANGED",
                "confidence": 0.96,
                "drift_summary": "Physical evidence contradicts digital calendar ground truth (Room 204 != Room 302)."
            },
            # 5. Evidence
            "evidence": [
                {
                    "evidence_id": "ev-ocr-hackathon-1",
                    "source": "camera/OCR",
                    "snippet": "Presentations moved to Room 302.",
                    "confidence": 0.96,
                    "captured_at": now,
                    "privacy_status": "PROCESSED_ON_DEVICE_LOCAL_ONLY"
                }
            ],
            # 6. Impact
            "impact": {
                "affected_entities": [
                    "Final Presentation Reminder",
                    "Departure Walk Alarm (Room 204)",
                    "Faculty Review Meeting with Prof. Sharma"
                ],
                "items": [
                    {
                        "target_type": "reminder",
                        "description": "Prepare presentation deck (Target: Room 204)",
                        "severity": "HIGH"
                    },
                    {
                        "target_type": "alarm",
                        "description": "Departure Alarm: Walk to Room 204",
                        "severity": "HIGH"
                    },
                    {
                        "target_type": "meeting",
                        "description": "Faculty review session with Prof. Sharma",
                        "severity": "MEDIUM"
                    }
                ]
            },
            # 7. Proposed Action
            "proposed_action": {
                "action_id": "act-update-room-302",
                "title": "Update reminder location",
                "description": "Update reminder and calendar location from Room 204 to Room 302?",
                "before_state": {"location": "Room 204"},
                "after_state": {"location": "Room 302"}
            },
            # 8. Approval
            "approval": {
                "state": "APPROVED",
                "approval_method": "Explicit Safe Gate Button Tap",
                "approved_at": now,
                "notes": "User approved proposed relocation to Room 302."
            },
            # 9. Result
            "result": {
                "execution_status": "SUCCEEDED",
                "summary": "Reminder and calendar entity successfully updated to Room 302 and logged to timeline.",
                "recorded_at": now
            },
            # 10. Timeline
            "timeline": [
                {
                    "timestamp": now,
                    "event_type": "TRUTH_CONFIRMED",
                    "title": "Calendar Ground Truth: Final Presentation scheduled in Room 204"
                },
                {
                    "timestamp": now,
                    "event_type": "OBSERVATION_INGESTED",
                    "title": "Notice Board OCR captured: 'Presentations moved to Room 302.'"
                },
                {
                    "timestamp": now,
                    "event_type": "DRIFT_DETECTED",
                    "title": "Location Drift Detected: Room 204 → Room 302 (Confidence: 96%)"
                },
                {
                    "timestamp": now,
                    "event_type": "ACTION_PROPOSED",
                    "title": "Safe Action Gate: Update reminder location proposed"
                },
                {
                    "timestamp": now,
                    "event_type": "ACTION_APPROVED",
                    "title": "User explicitly approved action via Safe Gate"
                },
                {
                    "timestamp": now,
                    "event_type": "ACTION_EXECUTED",
                    "title": "Reminder updated to Room 302; Ground truth re-aligned"
                }
            ]
        }

    @classmethod
    def to_markdown(cls, report: Dict[str, Any]) -> str:
        s = report["session"]
        k = report["what_nia_knew"]
        o = report["what_was_observed"]
        d = report["reality_drift"]
        a = report["proposed_action"]
        ap = report["approval"]
        r = report["result"]

        return f"""# {report["title"]}
Generated: {report["generated_at"]}

### 1. Session
- **ID:** `{s["session_id"]}`
- **Device:** {s["device"]}

### 2. What NIA Knew
- **Location:** {k["location"]}
- **Time:** {k["scheduled_time"]}

### 3. What Was Observed
- **Observed:** {o["location"]}
- **Snippet:** "{o["raw_snippet"]}"

### 4. Reality Drift
- **State:** {d["state"]}
- **Confidence:** {int(d["confidence"] * 100)}%

### 5. Evidence
- Count: {len(report["evidence"])}

### 6. Impact
- Affected: {len(report["impact"]["affected_entities"])} items

### 7. Proposed Action
- Shift: {a["before_state"]["location"]} -> {a["after_state"]["location"]}

### 8. Approval
- Status: {ap["state"]}

### 9. Result
- Status: {r["execution_status"]}

### 10. Timeline
- Events: {len(report["timeline"])}
"""
