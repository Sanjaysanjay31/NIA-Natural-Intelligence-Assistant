from __future__ import annotations

from enum import Enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import Field, field_validator
from app.schemas.base import NIABaseModel
from app.schemas.commitment import Commitment as CoreCommitment
from app.schemas.enums import CommitmentStatus as CoreCommitmentStatus


class CommitmentStatus(str, Enum):
    """Lifecycle statuses for structured commitments."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    AT_RISK = "AT_RISK"


class CommitmentSource(str, Enum):
    """Origin context of a commitment."""
    CONVERSATION = "CONVERSATION"
    MEETING_TRANSCRIPT = "MEETING_TRANSCRIPT"
    VOICE_MEMO = "VOICE_MEMO"
    IMPORTED_TEXT = "IMPORTED_TEXT"
    DEMO = "DEMO"


class CommitmentEvidence(NIABaseModel):
    """Verifiable evidence snippet anchoring a commitment to spoken or written text."""
    evidence_ref: Optional[str] = Field(default=None, description="Unique reference ID or URI to audio/transcript evidence")
    raw_quote: Optional[str] = Field(default=None, description="Exact spoken or written phrase")
    start_char: Optional[int] = Field(default=None, description="Starting character offset in source text")
    end_char: Optional[int] = Field(default=None, description="Ending character offset in source text")
    speaker: Optional[str] = Field(default=None, description="Attributed speaker name or role")
    audio_ref: Optional[str] = Field(default=None, description="Optional audio memo file path or timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional contextual metadata")


class Commitment(NIABaseModel):
    """Domain model representing a structured, provenance-backed interpersonal or personal commitment."""
    id: str = Field(..., description="Stable unique identifier for the commitment (e.g. cmt-12345)")
    owner: str = Field(..., min_length=1, description="Person responsible for executing the commitment")
    action: str = Field(..., min_length=1, description="Action or promise to be performed")
    deadline: Optional[str] = Field(default=None, description="Normalized or raw relative deadline expression (never fabricated)")
    source: CommitmentSource = Field(default=CommitmentSource.VOICE_MEMO, description="Source modality of the commitment")
    status: CommitmentStatus = Field(default=CommitmentStatus.PENDING, description="Current lifecycle status")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Extraction confidence score (0.0 to 1.0)")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Creation timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last update timestamp")
    related_event_id: Optional[str] = Field(default=None, description="Optional link to calendar or digital state event")
    related_location: Optional[str] = Field(default=None, description="Optional physical location associated with the action")
    evidence_ref: Optional[str] = Field(default=None, description="Reference to source audio memo or transcript")
    evidence: Optional[CommitmentEvidence] = Field(default=None, description="Embedded evidence details")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional arbitrary metadata")

    @field_validator("id")
    @classmethod
    def validate_id_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Commitment id cannot be empty or whitespace")
        return cleaned

    @field_validator("action")
    @classmethod
    def validate_action_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Commitment action cannot be empty or whitespace")
        return cleaned

    @field_validator("owner")
    @classmethod
    def validate_owner_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Commitment owner cannot be empty or whitespace")
        return cleaned

    @field_validator("deadline")
    @classmethod
    def validate_deadline_not_fabricated(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                return None
            return cleaned
        return None

    def to_core_commitment(self) -> CoreCommitment:
        """Compatibility Adapter: Translates Bhupathi's rich domain model to Sanjay's core CoreCommitment schema."""
        # Map domain status to core status
        status_mapping = {
            CommitmentStatus.PENDING: CoreCommitmentStatus.OPEN,
            CommitmentStatus.IN_PROGRESS: CoreCommitmentStatus.OPEN,
            CommitmentStatus.COMPLETED: CoreCommitmentStatus.COMPLETED,
            CommitmentStatus.CANCELLED: CoreCommitmentStatus.DISMISSED,
            CommitmentStatus.AT_RISK: CoreCommitmentStatus.OVERDUE,
        }
        core_status = status_mapping.get(self.status, CoreCommitmentStatus.OPEN)

        # Attempt to parse deadline if it looks like an ISO datetime, else store in metadata
        parsed_deadline: Optional[datetime] = None
        if self.deadline:
            try:
                parsed_deadline = datetime.fromisoformat(self.deadline)
            except (ValueError, TypeError):
                parsed_deadline = None

        meta = dict(self.metadata)
        meta.update({
            "domain_owner": self.owner,
            "domain_source": self.source.value,
            "domain_status": self.status.value,
            "raw_deadline": self.deadline,
            "related_event_id": self.related_event_id,
            "related_location": self.related_location,
        })

        return CoreCommitment(
            commitment_id=self.id,
            title=self.action,
            counterparty=self.owner,
            deadline=parsed_deadline,
            confidence=self.confidence,
            status=core_status,
            evidence_ref=self.evidence_ref,
            created_at=self.created_at,
            metadata=meta,
        )


class CommitmentExtractionRequest(NIABaseModel):
    """Request payload for extracting commitments from text or voice transcript."""
    transcript: str = Field(..., min_length=1, description="Raw transcript text to extract commitments from")
    source: CommitmentSource = Field(default=CommitmentSource.VOICE_MEMO, description="Source modality")
    source_id: Optional[str] = Field(default=None, description="Optional audio recording or session ID")
    reference_time: Optional[datetime] = Field(default=None, description="Optional reference datetime for relative time resolution")
    known_participants: Optional[List[str]] = Field(default=None, description="List of recognized meeting or conversation participants")
    current_user_name: Optional[str] = Field(default="current_user", description="Name/identifier of the active device user")

    @field_validator("transcript")
    @classmethod
    def validate_transcript_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Transcript cannot be empty or whitespace")
        return cleaned


class CommitmentExtractionResponse(NIABaseModel):
    """Result payload containing extracted commitments and extraction metadata."""
    commitments: List[Commitment] = Field(default_factory=list, description="Extracted commitments")
    extraction_count: int = Field(default=0, description="Total commitments extracted")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Overall extraction confidence score")
    raw_transcript: str = Field(default="", description="Source transcript")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostics, processing time, and token info")


class CommitmentUpdate(NIABaseModel):
    """Payload for updating mutable commitment attributes."""
    status: Optional[CommitmentStatus] = Field(default=None, description="Updated status")
    action: Optional[str] = Field(default=None, min_length=1, description="Updated action description")
    owner: Optional[str] = Field(default=None, min_length=1, description="Updated owner")
    deadline: Optional[str] = Field(default=None, description="Updated deadline")
    related_event_id: Optional[str] = Field(default=None, description="Associated calendar event ID")
    related_location: Optional[str] = Field(default=None, description="Associated location")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Updated extraction confidence")


class CommitmentLinkRequest(NIABaseModel):
    """Payload to associate a commitment with external reality entities."""
    commitment_id: str = Field(..., description="ID of commitment to link")
    related_event_id: Optional[str] = Field(default=None, description="Associated calendar or digital event")
    related_location: Optional[str] = Field(default=None, description="Associated physical location")
    reality_node_id: Optional[str] = Field(default=None, description="Reality Graph entity ID")


class FollowUpProposal(NIABaseModel):
    """Actionable recommendation generated by NIA Commitment Intelligence."""
    proposal_id: str = Field(..., description="Unique proposal identifier")
    commitment_id: str = Field(..., description="Associated commitment ID")
    action_type: str = Field(default="SCHEDULE_REMINDER", description="Action type: SCHEDULE_REMINDER, CALENDAR_HOLD, STATUS_INQUIRY")
    title: str = Field(..., description="Concise title for the proposed action")
    description: str = Field(..., description="Detailed explanation of the proposed follow-up")
    suggested_trigger_time: Optional[str] = Field(default=None, description="Suggested execution or reminder timestamp")
    target_person: Optional[str] = Field(default=None, description="Counterparty or owner involved")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0, description="Proposal confidence")
