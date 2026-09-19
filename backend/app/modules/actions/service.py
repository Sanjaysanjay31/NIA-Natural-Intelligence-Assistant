import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, List

from app.schemas.action import (
    ProposedAction,
    ActionExecutionResult,
)
from app.schemas.enums import ApprovalState, ExecutionState, TimelineEventType
from app.schemas.timeline import TimelineEvent
from app.core.errors import ActionSafetyViolationException, EntityNotFoundException
from app.modules.actions.repository import BaseReminderRepository, reminder_repository
from app.modules.reality.graph import reality_graph, RealityGraph
from app.api.timeline import STORED_EVENTS


class ActionService:
    """
    Action Safety Service managing the full lifecycle:
    PROPOSE -> ASK -> APPROVE/REJECT -> EXECUTE -> RECORD
    Strict Invariant: No direct repository mutations from UI; explicit approval required.
    """

    def __init__(
        self,
        reminder_repo: Optional[BaseReminderRepository] = None,
        graph: Optional[RealityGraph] = None
    ):
        self.reminder_repo = reminder_repo or reminder_repository
        self.graph = graph or reality_graph
        self.actions: Dict[str, ProposedAction] = {}
        self.results: Dict[str, ActionExecutionResult] = {}
        self._seed_default_actions()

    def _seed_default_actions(self):
        act_id = "act-9901"
        self.actions[act_id] = ProposedAction(
            action_id=act_id,
            type="UPDATE_REMINDER",
            title="Update Reminder Location",
            description="Update reminder from Room 204 to Room 302?",
            affected_entity="Final Presentation",
            reality_id="real-8821",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"},
            proposed_state={"location": "Room 302"},
            confidence=0.94,
            approval_state=ApprovalState.PENDING,
            execution_state=ExecutionState.NOT_EXECUTED,
            approval_required=True,
            evidence_refs=["ev-calendar-1", "ev-ocr-1"],
            created_at=datetime.now(timezone.utc)
        )

    def propose(self, action: ProposedAction) -> ProposedAction:
        """Stage 1: PROPOSE non-destructive action."""
        action.approval_state = ApprovalState.PENDING
        action.execution_state = ExecutionState.NOT_EXECUTED
        self.actions[action.action_id] = action
        return action

    def approve(self, action_id: str, approved_by: str = "user") -> ProposedAction:
        """Stage 2: Explicit human approval via Safe Action Gate."""
        action = self.actions.get(action_id)
        if not action:
            raise EntityNotFoundException("ProposedAction", action_id)

        action.approval_state = ApprovalState.APPROVED
        return action

    def reject(self, action_id: str, reason: str = "Rejected by user") -> ProposedAction:
        """Stage 2 (Alternate): Explicit rejection of proposed action."""
        action = self.actions.get(action_id)
        if not action:
            raise EntityNotFoundException("ProposedAction", action_id)

        action.approval_state = ApprovalState.REJECTED
        action.failure_reason = reason
        return action

    async def execute(self, action_id: str) -> ActionExecutionResult:
        """
        Stage 3: EXECUTE approved mutation.
        Safety Invariant: Fails if action has NOT been explicitly approved.
        """
        action = self.actions.get(action_id)
        if not action:
            raise EntityNotFoundException("ProposedAction", action_id)

        # Enforce Safe Action Gate invariant
        if action.approval_state != ApprovalState.APPROVED:
            raise ActionSafetyViolationException(
                f"Action '{action_id}' cannot be executed. Current approval state: '{action.approval_state}'. Explicit approval required."
            )

        now = datetime.now(timezone.utc)
        action.execution_state = ExecutionState.EXECUTING

        try:
            target_location = (
                action.proposed_state.get("location")
                or action.after_state.get("location")
                or "Room 302"
            )

            # Mutate MockReminderRepository safely
            updated_reminder = await self.reminder_repo.update_reminder_location("rem-204", target_location)
            if not updated_reminder:
                # Simulated failure path: preserve failure reason, do not claim success
                action.execution_state = ExecutionState.FAILED
                action.failure_reason = "Target reminder 'rem-204' could not be found for mutation."
                result = ActionExecutionResult(
                    action_id=action_id,
                    approval_state=ApprovalState.APPROVED,
                    execution_state=ExecutionState.FAILED,
                    execution_status="EXECUTION_FAILED",
                    executed_at=now,
                    audit_summary=f"Failed to update location for action '{action_id}'.",
                    failure_reason=action.failure_reason
                )
                self.results[action_id] = result
                return result

            # Update Reality Graph node
            event_node = self.graph.find_event_by_name(action.affected_entity)
            if event_node:
                event_node.properties["location"] = target_location

            # Stage 4: RECORD result in Reality Timeline
            event_id = f"evt-exec-{uuid.uuid4().hex[:6]}"
            timeline_event = TimelineEvent(
                event_id=event_id,
                timestamp=now,
                event_type=TimelineEventType.ACTION_EXECUTED,
                title=f"Location Updated to {target_location}",
                entity=action.affected_entity,
                evidence_refs=action.evidence_refs,
                actor="user",
                details={
                    "actionId": action_id,
                    "before": action.before_state,
                    "after": action.after_state,
                }
            )
            STORED_EVENTS.insert(0, timeline_event)

            # Set Succeeded state
            action.execution_state = ExecutionState.SUCCEEDED
            result = ActionExecutionResult(
                action_id=action_id,
                approval_state=ApprovalState.APPROVED,
                execution_state=ExecutionState.SUCCEEDED,
                execution_status="EXECUTED_SUCCESSFULLY",
                executed_at=now,
                timeline_event_id=event_id,
                audit_summary=f"Reminder '{action.affected_entity}' location safely updated from {action.before_state.get('location')} to {target_location}."
            )
            self.results[action_id] = result
            return result

        except Exception as e:
            action.execution_state = ExecutionState.FAILED
            action.failure_reason = str(e)
            result = ActionExecutionResult(
                action_id=action_id,
                approval_state=ApprovalState.APPROVED,
                execution_state=ExecutionState.FAILED,
                execution_status="EXECUTION_FAILED",
                executed_at=now,
                audit_summary=f"Execution error: {e}",
                failure_reason=str(e)
            )
            self.results[action_id] = result
            return result

    def get_action(self, action_id: str) -> Optional[ProposedAction]:
        return self.actions.get(action_id)

    def get_result(self, action_id: str) -> Optional[ActionExecutionResult]:
        return self.results.get(action_id)


action_service = ActionService()
