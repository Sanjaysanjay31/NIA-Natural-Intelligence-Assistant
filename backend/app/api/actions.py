from fastapi import APIRouter, HTTPException, status
from app.schemas.action import (
    ProposedAction,
    ActionApprovalRequest,
    ActionExecutionResult,
)
from app.modules.actions.service import action_service

router = APIRouter(tags=["Safe Action Gate"])


@router.post("/actions/propose", response_model=ProposedAction)
async def propose_action(action: ProposedAction) -> ProposedAction:
    """Stage 1: PROPOSE non-destructive action."""
    return action_service.propose(action)


@router.get("/actions/{action_id}", response_model=ProposedAction)
async def get_action(action_id: str) -> ProposedAction:
    """Retrieve details of a proposed action."""
    action = action_service.get_action(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ProposedAction '{action_id}' not found"
        )
    return action


@router.post("/actions/{action_id}/approve", response_model=ActionExecutionResult)
async def approve_and_execute_action(
    action_id: str,
    request: ActionApprovalRequest
) -> ActionExecutionResult:
    """
    Stage 2 & 3: APPROVE & EXECUTE action via Safe Action Gate.
    Explicit approval required before mutation.
    """
    # Ensure action exists in service
    action = action_service.get_action(action_id)
    if not action:
        # Register on demand for demo integration
        action = ProposedAction(
            action_id=action_id,
            type="UPDATE_REMINDER",
            title="Update Final Presentation Location",
            description="Update reminder from Room 204 to Room 302?",
            affected_entity="Final Presentation",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"},
            evidence_refs=["ev-ocr-1"]
        )
        action_service.propose(action)

    action_service.approve(action_id, approved_by=request.approved_by)
    result = await action_service.execute(action_id)
    return result


@router.post("/actions/{action_id}/reject", response_model=ProposedAction)
async def reject_action(action_id: str, notes: str = "Rejected by user") -> ProposedAction:
    """Stage 2 (Alternate): Explicit REJECT of proposed action."""
    return action_service.reject(action_id, reason=notes)
