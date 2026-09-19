from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import RealityState, DriftType
from .action import ProposedAction


class ObservationSummary(NIABaseModel):
    """Normalized observation snapshot for comparison."""
    source: str
    location: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    observed_at: Optional[datetime] = None
    raw_snippet: Optional[str] = None
    extra: Dict[str, Any] = Field(default_factory=dict)


class DriftResult(NIABaseModel):
    """
    Primary Reality Result contract explaining comparison between digital ground truth
    and physical observations.
    """
    reality_id: Optional[str] = Field(default=None, description="Unique identifier for this reality check evaluation")
    entity: str = Field(description="Name of the subject entity e.g. Final Presentation")
    digital: Dict[str, Any] = Field(description="Known digital ground truth (e.g. location, source, time)")
    physical: Dict[str, Any] = Field(description="Observed physical evidence (e.g. location, source, time)")
    state: RealityState = Field(description="Overall reality state e.g. REALITY_DRIFT or VERIFIED_TRUE")
    drift_type: DriftType = Field(description="Specific categorization of drift")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score of verification")
    agreement: bool = Field(default=False, description="Whether digital and physical observations agree")
    evidence_refs: List[str] = Field(default_factory=list, description="IDs of evidence proving this evaluation")
    impact_refs: List[str] = Field(default_factory=list, description="IDs of downstream affected entities")
    affected_entities: List[str] = Field(default_factory=list, description="Names/IDs of affected items (reminders, alarms, commitments)")
    proposed_action_ref: Optional[str] = Field(default=None, description="Reference ID to proposed remediation action")
    proposed_action: Optional[ProposedAction] = Field(default=None, description="Embedded proposed remediation action")
    approval_required: bool = Field(default=True, description="Strictly true for all consequential state changes")
    explanation: Optional[str] = Field(default=None, description="Human-readable explanation of agreement or contradiction")
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Evaluation timestamp")


class RealityCheckRequest(NIABaseModel):
    """Request payload for evaluating an observation against digital ground truth."""
    entity: str
    physical_observation_id: Optional[str] = None
    raw_text: Optional[str] = None
    extracted_location: Optional[str] = None
    source: str = "ocr"
    context: Dict[str, Any] = Field(default_factory=dict)
