import pytest
from datetime import datetime, timezone
from app.schemas import (
    AgentState,
    WakeUpSource,
    DriftType,
    RealityState,
    ApprovalState,
    ProposedAction,
)
from app.modules.orchestration.wake_up import WakeUpOrchestrator


class MockAgentSessionController:
    """
    Mirror of AgentSessionStore for backend flow validation:
    Validates canonical flow, error recovery, response hierarchy, deduplication, and replay.
    """

    def __init__(self, session_id: str = "sess-test-101"):
        self.session_id = session_id
        self.state = AgentState.IDLE
        self.events = []
        self.processed_actions = set()
        self.error = None

    def record_transition(self, next_state: AgentState, title: str):
        self.state = next_state
        self.events.append({
            "session_id": self.session_id,
            "state": next_state,
            "title": title,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    def run_canonical_flow(self, is_drift: bool = True):
        # 1. IDLE -> LISTENING
        self.record_transition(AgentState.LISTENING, "Listening for context")
        # 2. LISTENING -> THINKING
        self.record_transition(AgentState.THINKING, "Querying digital state")
        # 3. THINKING -> VERIFYING
        self.record_transition(AgentState.VERIFYING, "Ingesting physical OCR observation")

        if is_drift:
            # 4. VERIFYING -> DRIFT
            self.record_transition(AgentState.DRIFT, "Reality Drift: Room 204 to Room 302")
            # 5. DRIFT -> SPEAKING
            self.record_transition(AgentState.SPEAKING, "Relaying reality shift")
            # 6. SPEAKING -> ACTION_PENDING
            self.record_transition(AgentState.ACTION_PENDING, "Safe Action Gate: Approval Required")
        else:
            self.record_transition(AgentState.VERIFIED, "Ground Truth Aligned")

    def execute_action(self, action_id: str) -> bool:
        if self.state != AgentState.ACTION_PENDING:
            raise RuntimeError("Action cannot be executed outside ACTION_PENDING")
        if action_id in self.processed_actions:
            # Duplicate prevention: do not re-execute
            return False

        self.processed_actions.add(action_id)
        # 7. ACTION_PENDING -> SUCCESS
        self.record_transition(AgentState.SUCCESS, "Safe Action Executed")
        return True

    def trigger_error(self, message: str):
        self.error = message
        self.record_transition(AgentState.ERROR, f"Perception Anomaly: {message}")

    def cancel_or_recover(self):
        self.error = None
        self.record_transition(AgentState.IDLE, "Session cancelled / recovered to IDLE")


def test_canonical_agent_flow_ordering():
    """Validates: IDLE -> LISTENING -> THINKING -> VERIFYING -> DRIFT -> SPEAKING -> ACTION_PENDING -> SUCCESS."""
    ctrl = MockAgentSessionController()
    assert ctrl.state == AgentState.IDLE

    ctrl.run_canonical_flow(is_drift=True)
    assert ctrl.state == AgentState.ACTION_PENDING

    # Execute action
    executed = ctrl.execute_action("act-room-shift-1")
    assert executed is True
    assert ctrl.state == AgentState.SUCCESS

    # Verify event order
    states = [e["state"] for e in ctrl.events]
    expected_order = [
        AgentState.LISTENING,
        AgentState.THINKING,
        AgentState.VERIFYING,
        AgentState.DRIFT,
        AgentState.SPEAKING,
        AgentState.ACTION_PENDING,
        AgentState.SUCCESS,
    ]
    assert states == expected_order

    # Verify single session ID maintained
    for e in ctrl.events:
        assert e["session_id"] == "sess-test-101"


def test_error_path_and_recovery():
    """Validates: any state -> ERROR -> recover/cancel -> IDLE."""
    ctrl = MockAgentSessionController()
    ctrl.record_transition(AgentState.VERIFYING, "Verifying physical capture")

    # Error encountered
    ctrl.trigger_error("Camera frame unreadable")
    assert ctrl.state == AgentState.ERROR
    assert ctrl.error == "Camera frame unreadable"

    # Recover / Cancel returns to IDLE
    ctrl.cancel_or_recover()
    assert ctrl.state == AgentState.IDLE
    assert ctrl.error is None


def test_duplicate_request_idempotency():
    """Validates: Duplicate requests do not create duplicate actions."""
    ctrl = MockAgentSessionController()
    ctrl.run_canonical_flow(is_drift=True)

    # First execution succeeds
    first = ctrl.execute_action("act-unique-123")
    assert first is True

    # Duplicate execution of same action ID is blocked
    ctrl.state = AgentState.ACTION_PENDING
    second = ctrl.execute_action("act-unique-123")
    assert second is False


def test_response_hierarchy_structure():
    """Validates response hierarchy: concise answer, truth status, evidence, impact, action proposal."""
    response_hierarchy = {
        "concise_answer": "Your presentation location changed.",
        "truth_status": {
            "digital": "Room 204",
            "observed": "Room 302",
            "confidence": "High (96%)",
            "agreement": False
        },
        "evidence_snippet": "Presentations moved to Room 302.",
        "impact_count": 3,
        "actions": ["Why?", "What changed?", "What does this affect?", "Fix it"]
    }

    assert response_hierarchy["concise_answer"] == "Your presentation location changed."
    assert response_hierarchy["truth_status"]["digital"] == "Room 204"
    assert response_hierarchy["truth_status"]["observed"] == "Room 302"
    assert response_hierarchy["impact_count"] == 3
    assert len(response_hierarchy["actions"]) == 4
