from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import Field
from app.schemas.base import NIABaseModel


class NormalizedEvent(NIABaseModel):
    """
    Standardized digital calendar event schema feeding Reality Intelligence.
    Strictly decoupled from UI representations.
    """
    id: str
    title: str
    start: datetime
    end: datetime
    location: Optional[str] = None
    source: str = "calendar"
    last_synced_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)
