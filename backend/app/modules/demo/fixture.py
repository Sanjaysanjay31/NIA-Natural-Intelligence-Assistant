"""
Deterministic Single Source of Truth for NIA Hackathon Demo.
No strings scattered across components: all entities, queries, notices,
impact items, and actions are defined here.
"""

from typing import Dict, Any, List

DEMO_ENTITY = "Final Presentation"
DEMO_EVENT_ID = "evt-final-presentation"
DEMO_SESSION_ID = "sess-hackathon-2026-demo"

DEMO_DIGITAL_LOCATION = "Room 204"
DEMO_DIGITAL_TIME = "09:00"
DEMO_DIGITAL_SOURCE = "google_calendar"

DEMO_PHYSICAL_NOTICE_TEXT = "Presentations moved to Room 302."
DEMO_PHYSICAL_LOCATION = "Room 302"
DEMO_PHYSICAL_SOURCE = "camera_ocr"

DEMO_USER_QUERY = "Is my presentation information still correct?"

DEMO_DRIFT_TYPE = "LOCATION_CHANGED"
DEMO_CONFIDENCE = 0.94

DEMO_IMPACT_ITEMS: List[Dict[str, Any]] = [
    {
        "id": "imp-1",
        "entity_type": "calendar_event",
        "name": "Final Presentation",
        "impact_description": "Scheduled room changed from Room 204 to Room 302",
        "severity": "HIGH",
    },
    {
        "id": "imp-2",
        "entity_type": "reminder",
        "name": "Arrive 10m early for slides setup",
        "impact_description": "Location reference is outdated (Room 204)",
        "severity": "MEDIUM",
    },
    {
        "id": "imp-3",
        "entity_type": "alarm",
        "name": "Morning Presentation Alarm",
        "impact_description": "Walking travel time to Room 302 is +3 minutes",
        "severity": "LOW",
    },
    {
        "id": "imp-4",
        "entity_type": "commitment",
        "name": "Bring printed handout for judges",
        "impact_description": "Delivery destination shifted to Room 302",
        "severity": "MEDIUM",
    },
]

DEMO_PROPOSED_ACTION = {
    "action_id": "act-demo-room-update-001",
    "type": "UPDATE_REMINDER",
    "description": "Update reminder & calendar from Room 204 to Room 302",
    "affected_entity": DEMO_ENTITY,
    "before_state": {"location": DEMO_DIGITAL_LOCATION, "time": DEMO_DIGITAL_TIME},
    "proposed_state": {"location": DEMO_PHYSICAL_LOCATION, "time": DEMO_DIGITAL_TIME},
    "confidence": DEMO_CONFIDENCE,
}

DEMO_STEPS_METADATA = [
    {
        "step": 1,
        "title": "Calendar Ground Truth",
        "description": "Digital state seeds Final Presentation at 09:00 in Room 204.",
        "agent_state": "IDLE",
    },
    {
        "step": 2,
        "title": "Activate NIA",
        "description": "Wake-up trigger fired via hotword, tap, or gesture.",
        "agent_state": "LISTENING",
    },
    {
        "step": 3,
        "title": "Orb Appears",
        "description": "Cinematic dark base Orb glows cyan in foreground.",
        "agent_state": "LISTENING",
    },
    {
        "step": 4,
        "title": "User Inquires",
        "description": "User asks: 'Is my presentation information still correct?'",
        "agent_state": "PROCESSING",
    },
    {
        "step": 5,
        "title": "NIA Enters Verifying",
        "description": "Agent transitions to VERIFYING state to contrast reality.",
        "agent_state": "VERIFYING",
    },
    {
        "step": 6,
        "title": "Physical Notice Observed",
        "description": "Physical flyer detected: 'Presentations moved to Room 302.'",
        "agent_state": "VERIFYING",
    },
    {
        "step": 7,
        "title": "OCR Entity Extraction",
        "description": "Deterministic local OCR provider normalizes destination to Room 302.",
        "agent_state": "VERIFYING",
    },
    {
        "step": 8,
        "title": "VEYRA X Detects Location Drift",
        "description": "Reality engine flags LOCATION_CHANGED drift (Room 204 -> Room 302).",
        "agent_state": "DRIFT_DETECTED",
    },
    {
        "step": 9,
        "title": "Evidence Replay",
        "description": "Bilateral side-by-side contrast: Calendar (204) vs Notice (302).",
        "agent_state": "DRIFT_DETECTED",
    },
    {
        "step": 10,
        "title": "Impact Graph Evaluation",
        "description": "Traced cascade across presentation, reminder, alarm, and commitment.",
        "agent_state": "PROPOSING_ACTION",
    },
    {
        "step": 11,
        "title": "User Taps 'Fix It'",
        "description": "Intent router triggers safe action proposal flow.",
        "agent_state": "PROPOSING_ACTION",
    },
    {
        "step": 12,
        "title": "Safe Action Gate Asks Approval",
        "description": "Explicit approval prompt: Update reminder to Room 302?",
        "agent_state": "AWAITING_APPROVAL",
    },
    {
        "step": 13,
        "title": "User Approves",
        "description": "User gives explicit affirmative approval.",
        "agent_state": "EXECUTING",
    },
    {
        "step": 14,
        "title": "Adapter Updates Reminder",
        "description": "Safe action executes; reminder destination updated to Room 302.",
        "agent_state": "EXECUTING",
    },
    {
        "step": 15,
        "title": "NIA Shows SUCCESS",
        "description": "Orb pulses emerald green; state resolves to SUCCESS.",
        "agent_state": "SUCCESS",
    },
    {
        "step": 16,
        "title": "Timeline Records Change",
        "description": "Audit event appended to chronological reality timeline.",
        "agent_state": "SUCCESS",
    },
    {
        "step": 17,
        "title": "Reality Audit Exported",
        "description": "10-section portable audit generated for Office Kit review.",
        "agent_state": "SUCCESS",
    },
]
