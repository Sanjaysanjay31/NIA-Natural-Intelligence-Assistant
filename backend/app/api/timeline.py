from fastapi import APIRouter
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.schemas.timeline import TimelineEvent
from app.schemas.enums import TimelineEventType

router = APIRouter(tags=["Reality Timeline"])

STORED_EVENTS: List[TimelineEvent] = [
    TimelineEvent(
        event_id="evt-001",
        timestamp=datetime.now(timezone.utc),
        event_type=TimelineEventType.DRIFT_DETECTED,
        title="Reality Drift Detected: LOCATION_CHANGED",
        entity="Final Presentation",
        evidence_refs=["ev-calendar-1", "ev-ocr-1"],
        actor="veyra_x",
        details={"from": "Room 204", "to": "Room 302", "confidence": 0.94}
    ),
    TimelineEvent(
        event_id="evt-000",
        timestamp=datetime.now(timezone.utc),
        event_type=TimelineEventType.TRUTH_CONFIRMED,
        title="Digital Ground Truth Initialized from Calendar",
        entity="Final Presentation",
        evidence_refs=["ev-calendar-1"],
        actor="system",
        details={"location": "Room 204", "time": "09:00 AM"}
    )
]


@router.get("/timeline", response_model=List[TimelineEvent])
async def get_timeline() -> List[TimelineEvent]:
    """Retrieve immutable chronological Reality Timeline event audit log."""
    return sorted(STORED_EVENTS, key=lambda e: e.timestamp, reverse=True)
