import asyncio
import pytest
from starlette.testclient import TestClient
from app.main import app
from app.modules.actions.service import ActionService
from app.modules.actions.repository import MockReminderRepository
from app.modules.reality.graph import RealityGraph
from app.schemas.action import ProposedAction
from app.schemas.enums import ApprovalState, ExecutionState
from app.core.errors import ActionSafetyViolationException

client = TestClient(app)


@pytest.fixture
def repo():
    return MockReminderRepository()


@pytest.fixture
def graph():
    return RealityGraph()


@pytest.fixture
def action_service(repo, graph):
    return ActionService(reminder_repo=repo, graph=graph)


class TestSafeActionGateCore:
    """Core domain tests enforcing the Safe Action Gate boundary."""

    def test_propose_creates_pending_action(self, action_service):
        """Actions must start in PENDING and NOT_EXECUTED states."""
        action = ProposedAction(
            action_id="act-test-01",
            type="UPDATE_REMINDER",
            description="Update reminder from Room 204 to Room 302?",
            affected_entity="Final Presentation",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"}
        )
        proposed = action_service.propose(action)
        assert proposed.approval_state == ApprovalState.PENDING
        assert proposed.execution_state == ExecutionState.NOT_EXECUTED

    def test_direct_execution_without_approval_is_blocked(self, action_service):
        """CRITICAL INVARIANT: Cannot execute action without prior explicit approval."""
        action = ProposedAction(
            action_id="act-unapproved",
            type="UPDATE_REMINDER",
            description="Update reminder",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"}
        )
        action_service.propose(action)

        # Direct execution must raise ActionSafetyViolationException
        with pytest.raises(ActionSafetyViolationException):
            asyncio.run(action_service.execute("act-unapproved"))

    def test_approve_then_execute_succeeds(self, action_service, repo):
        """Full lifecycle: PROPOSE -> APPROVE -> EXECUTE -> RECORD."""
        # Initial repository state check
        initial_reminder = asyncio.run(repo.get_reminder("rem-204"))
        assert initial_reminder.location == "Room 204"

        action = ProposedAction(
            action_id="act-approved-01",
            type="UPDATE_REMINDER",
            description="Update reminder from Room 204 to Room 302?",
            affected_entity="Final Presentation",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"}
        )
        action_service.propose(action)

        # Stage 2: Approve
        approved = action_service.approve("act-approved-01", approved_by="user")
        assert approved.approval_state == ApprovalState.APPROVED

        # Stage 3: Execute
        result = asyncio.run(action_service.execute("act-approved-01"))
        assert result.execution_state == ExecutionState.SUCCEEDED
        assert result.execution_status == "EXECUTED_SUCCESSFULLY"

        # Verify repository was updated safely
        updated_reminder = asyncio.run(repo.get_reminder("rem-204"))
        assert updated_reminder.location == "Room 302"

    def test_rejection_prevents_execution(self, action_service, repo):
        """Rejected actions cannot be executed."""
        action = ProposedAction(
            action_id="act-rejected-01",
            type="UPDATE_REMINDER",
            description="Update reminder",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"}
        )
        action_service.propose(action)
        action_service.reject("act-rejected-01", reason="Physical sign was for a different day")

        with pytest.raises(ActionSafetyViolationException):
            asyncio.run(action_service.execute("act-rejected-01"))

        # Repository location unchanged
        reminder = asyncio.run(repo.get_reminder("rem-204"))
        assert reminder.location == "Room 204"


class TestSafeActionGateApi:
    """HTTP API integration tests for Safe Action Gate."""

    def test_api_approve_and_execute_flow(self):
        """Verify POST /api/v1/actions/{id}/approve returns executed status."""
        approval_body = {
            "approvedBy": "sanjay",
            "approvalMethod": "button_tap",
            "notes": "Confirmed on hall sign"
        }
        res = client.post("/api/v1/actions/act-9901/approve", json=approval_body)
        assert res.status_code == 200
        data = res.json()
        assert data["approvalState"] == "APPROVED"
        assert data["executionStatus"] == "EXECUTED_SUCCESSFULLY"
        assert "Room 302" in data["auditSummary"]

    def test_api_reject_flow(self):
        """Verify POST /api/v1/actions/{id}/reject."""
        res = client.post("/api/v1/actions/act-9901/reject?notes=False alarm")
        assert res.status_code == 200
        data = res.json()
        assert data["approvalState"] == "REJECTED"
