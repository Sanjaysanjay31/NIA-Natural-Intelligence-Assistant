from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import ApprovalState


class ProposedAction(NIABaseModel):
    """Action proposed by VEYRA X requiring Safe Action Gate verification."""
    action_id: str
    reality_id: Optional[str] = Field(default=None, description="Associated reality drift ID")
    title: str
    description: str
    before_state: Dict[str, Any] = Field(description="Snapshot of state prior to mutation")
    after_state: Dict[str, Any] = Field(description="Proposed mutation target state")
    approval_state: ApprovalState = ApprovalState.PENDING_APPROVAL
    approval_required: bool = Field(default=True, description="Enforces Safe Action Gate confirmation")
    evidence_refs: List[str] = Field(default_factory=list, description="Associated evidence IDs")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ActionApprovalRequest(NIABaseModel):
    """User decision dispatched through the Safe Action Gate UI."""
    approved_by: str = "user"
    approval_method: str = Field(default="biometric_tap", description="biometric_tap, pin, confirm_button")
    notes: Optional[str] = None


class ActionExecutionResult(NIABaseModel):
    """Audit payload emitted after an approved action is safely executed."""
    action_id: str
    approval_state: ApprovalState
    execution_status: str
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    timeline_event_id: Optional[str] = None
    audit_summary: str
