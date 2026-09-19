from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import Field
from .base import NIABaseModel


class EvidenceItem(NIABaseModel):
    """Immutable evidence bundle providing verifiable provenance for reality claims."""
    evidence_id: str
    source: str = Field(description="Evidence origin e.g. ocr, audio_transcript, digital_calendar")
    snippet: str = Field(description="Extract text or observation excerpt demonstrating proof")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score of extracted observation")
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    media_ref: Optional[str] = Field(default=None, description="URI or path to raw media asset")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Bounding boxes, device sensor tags, etc.")
