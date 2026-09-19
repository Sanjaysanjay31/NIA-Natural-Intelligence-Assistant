from datetime import datetime, timezone
from typing import List, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import TimelineEventType


class TimelineEvent(NIABaseModel):
    """Immutable audit record within the Reality Timeline."""
    event_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: TimelineEventType
    title: str
    entity: str
    evidence_refs: List[str] = Field(default_factory=list)
    actor: str = Field(description="Actor responsible: user, veyra_x, system")
    details: Dict[str, Any] = Field(default_factory=dict)
