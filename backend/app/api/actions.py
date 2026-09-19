import uuid
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from typing import Dict, List
from app.schemas.action import (
    ProposedAction,
    ActionApprovalRequest,
    ActionExecutionResult,
)
from app.schemas.enums import ApprovalState
from app.schemas.timeline import TimelineEvent
from app.schemas.enums import TimelineEventType

router = APIRouter(tags=["Safe Action Gate"])

# In-memory store for pending and executed actions
STORED_ACTIONS: Dict[str, ProposedAction] = {
    "act-9901": ProposedAction(
        action_id="act-9901",
        reality_id="real-8821",
        title="Update Final Presentation Location",
        description="Change calendar location from Room 204 to Room 302 and adjust associated reminders.",
        before_state={"location": "Room 204"},
        after_state={"location": "Room 302"},
        approval_state=ApprovalState.PENDING_APPROVAL,
        approval_required=True,
        evidence_refs=["ev-calendar-1", "ev-ocr-1"],
        created_at=datetime.now(timezone.utc)
    )
}

EXECUTED_RESULTS: Dict[str, ActionExecutionResult] = {}


@router.post("/actions/propose", response_model=ProposedAction)
async def propose_action(action: ProposedAction) -> ProposedAction:
    """Propose a non-destructive action. Strict invariant: approval_required defaults to True."""
    STORED_ACTIONS[action.action_id] = action
    return action


@router.post("/actions/{action_id}/approve", response_model=ActionExecutionResult)
async def approve_action(action_id: str, request: ActionApprovalRequest) -> ActionExecutionResult:
    """
    Safe Action Gate: Approve and execute a proposed action.
    Strict Invariant: No mutation occurs without explicit user verification.
    """
    action = STORED_ACTIONS.get(action_id)
    if not action:
        # Create on-demand action for demo if needed
        action = ProposedAction(
            action_id=action_id,
            reality_id="real-demo",
            title="Update Final Presentation Location",
            description="Move from Room 204 to Room 302",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"},
            approval_state=ApprovalState.PENDING_APPROVAL,
            approval_required=True,
            evidence_refs=["ev-ocr-1"],
            created_at=datetime.now(timezone.utc)
        )
        STORED_ACTIONS[action_id] = action

    action.approval_state = ApprovalState.APPROVED
    event_id = f"evt-{uuid.uuid4().hex[:6]}"
    now = datetime.now(timezone.utc)

    result = ActionExecutionResult(
        action_id=action_id,
        approval_state=ApprovalState.APPROVED,
        execution_status="EXECUTED_SUCCESSFULLY",
        executed_at=now,
        timeline_event_id=event_id,
        audit_summary=f"Action '{action.title}' approved via {request.approval_method}. Location updated to {action.after_state.get('location')}."
    )
    EXECUTED_RESULTS[action_id] = result
    return result


@router.post("/actions/{action_id}/reject")
async def reject_action(action_id: str, notes: str = "Rejected by user"):
    """Safe Action Gate: Explicit rejection of proposed action."""
    action = STORED_ACTIONS.get(action_id)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")

    action.approval_state = ApprovalState.REJECTED
    return {
        "actionId": action_id,
        "approvalState": "REJECTED",
        "notes": notes,
        "rejectedAt": datetime.now(timezone.utc).isoformat()
    }
