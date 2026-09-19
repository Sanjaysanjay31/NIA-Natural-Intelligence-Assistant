from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import uuid
from app.schemas.timeline import TimelineEvent
from app.schemas.enums import TimelineEventType


class TimelineRepository:
    def __init__(self):
        self._events: List[TimelineEvent] = []

    def add_event(
        self,
        entity: str,
        event_type: str,
        description: str,
        before_state: Optional[Any] = None,
        current_state: Optional[Any] = None,
        source: str = "VEYRA_X",
        confidence: float = 1.0,
        evidence_refs: Optional[List[str]] = None,
    ) -> TimelineEvent:
        # Map generic event string to strong TimelineEventType enum
        etype = TimelineEventType.ACTION_EXECUTED
        if "DRIFT" in event_type.upper():
            etype = TimelineEventType.DRIFT_DETECTED
        elif "CONFIRM" in event_type.upper():
            etype = TimelineEventType.TRUTH_CONFIRMED

        evt = TimelineEvent(
            event_id=f"evt-{uuid.uuid4().hex[:8]}",
            timestamp=datetime.now(timezone.utc),
            event_type=etype,
            title=description,
            entity=entity,
            evidence_refs=evidence_refs or [],
            actor=source,
            details={
                "before": before_state,
                "current": current_state,
                "confidence": confidence,
            },
        )
        self._events.append(evt)
        return evt

    def get_events(self) -> List[TimelineEvent]:
        return list(self._events)


timeline_repository = TimelineRepository()
