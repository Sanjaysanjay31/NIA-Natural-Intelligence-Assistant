from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import Field
from .base import NIABaseModel


class DigitalObservation(NIABaseModel):
    """Structured ground truth retrieved from digital sources (calendars, reminders, alarms)."""
    id: str
    source: str = Field(description="Originating source e.g. calendar, reminder, alarm")
    entity: str = Field(description="Primary entity name, e.g. Final Presentation")
    location: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    status: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PhysicalObservation(NIABaseModel):
    """Raw or pre-processed observation captured from physical world sensors."""
    id: str
    source: str = Field(description="Sensor source e.g. ocr, voice, camera")
    entity: Optional[str] = None
    location: Optional[str] = None
    raw_text: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    media_ref: Optional[str] = None
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)
