from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import ApprovalState, ExecutionState


class ProposedAction(NIABaseModel):
    """
    Action proposed by VEYRA X requiring explicit Safe Action Gate confirmation.
    NIA cannot silently mutate reminders, calendars, or messaging state.
    """
    action_id: str
    type: str = Field(default="UPDATE_REMINDER", description="Action type e.g. UPDATE_REMINDER, RESCHEDULE_CALENDAR")
    title: str = "Update Reminder Location"
    description: str = "Update reminder from Room 204 to Room 302?"
    affected_entity: str = Field(default="Final Presentation", description="Entity affected e.g. Final Presentation")
    reality_id: Optional[str] = Field(default=None, description="Associated reality drift ID")
    before_state: Dict[str, Any] = Field(description="Snapshot of state prior to mutation")
    after_state: Dict[str, Any] = Field(default_factory=dict, description="Proposed mutation target state")
    proposed_state: Dict[str, Any] = Field(default_factory=dict, description="Proposed mutation state alias")
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    approval_state: ApprovalState = ApprovalState.PENDING
    execution_state: ExecutionState = ExecutionState.NOT_EXECUTED
    approval_required: bool = Field(default=True, description="Strictly true for all consequential state changes")
    evidence_refs: List[str] = Field(default_factory=list, description="Associated evidence IDs")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    failure_reason: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        # Sync proposed_state and after_state if either is provided
        if not self.proposed_state and self.after_state:
            self.proposed_state = self.after_state.copy()
        elif not self.after_state and self.proposed_state:
            self.after_state = self.proposed_state.copy()


class ActionApprovalRequest(NIABaseModel):
    """User decision dispatched through the Safe Action Gate UI."""
    approved_by: str = "user"
    approval_method: str = Field(default="button_tap", description="button_tap, biometric_tap, explicit_voice_confirm")
    notes: Optional[str] = None


class ActionExecutionResult(NIABaseModel):
    """Audit payload emitted after an approved action is safely executed or failed."""
    action_id: str
    approval_state: ApprovalState
    execution_state: ExecutionState = ExecutionState.SUCCEEDED
    execution_status: str = "EXECUTED_SUCCESSFULLY"
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    timeline_event_id: Optional[str] = None
    audit_summary: str
    failure_reason: Optional[str] = None
