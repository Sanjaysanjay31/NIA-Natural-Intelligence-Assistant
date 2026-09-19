from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import CommitmentStatus


class Commitment(NIABaseModel):
    """Structured commitment extracted from voice memos or conversations (Bhupathi module contract)."""
    commitment_id: str
    title: str
    counterparty: Optional[str] = Field(default=None, description="Person or team committed to")
    deadline: Optional[datetime] = Field(default=None, description="Promised fulfillment deadline")
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    status: CommitmentStatus = CommitmentStatus.OPEN
    evidence_ref: Optional[str] = Field(default=None, description="Reference to source audio memo or transcript")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)
