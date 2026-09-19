import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.modules.demo.controller import DemoScenarioController
from app.modules.demo.fixture import (
    DEMO_ENTITY,
    DEMO_DIGITAL_LOCATION,
    DEMO_PHYSICAL_LOCATION,
    DEMO_DRIFT_TYPE,
    DEMO_CONFIDENCE,
    DEMO_SESSION_ID,
)

client = TestClient(app)


@pytest.mark.anyio
async def test_full_17_step_progression_and_reset():
    controller = DemoScenarioController()
    state = controller.reset()

    # Step 1: Initial ground truth
    assert state["step"] == 1
    assert state["entity"] == DEMO_ENTITY
    assert state["digital_state"]["location"] == DEMO_DIGITAL_LOCATION
    assert state["drift"]["detected"] is False

    # Step through until step 8 (Drift Detection)
    for _ in range(7):
        state = controller.step_forward()

    assert state["step"] == 8
    assert state["drift"]["detected"] is True
    assert state["drift"]["drift_type"] == DEMO_DRIFT_TYPE
    assert state["drift"]["before"] == DEMO_DIGITAL_LOCATION
    assert state["drift"]["current"] == DEMO_PHYSICAL_LOCATION

    # Jump to Step 12: Safe Action Gate Awaiting Approval
    state = controller.jump_to_step(12)
    assert state["step"] == 12
    assert state["action"]["proposed"] is True
    assert state["action"]["approval_state"] == "PENDING"
    assert state["action"]["execution_state"] == "NOT_EXECUTED"

    # Step to 14: Execution
    controller.jump_to_step(14)
    state = controller.get_current_state()
    assert state["action"]["approval_state"] == "APPROVED"
    assert state["action"]["execution_state"] == "SUCCEEDED"
    assert state["current_effective_location"] == DEMO_PHYSICAL_LOCATION

    # Step to 17: Reality Audit Export
    state = controller.jump_to_step(17)
    assert state["step"] == 17
    assert state["audit_exported"] is True
    assert state["timeline_recorded"] is True

    # Reset
    reset_state = controller.reset()
    assert reset_state["step"] == 1
    assert reset_state["current_effective_location"] == DEMO_DIGITAL_LOCATION


@pytest.mark.anyio
async def test_deterministic_e2e_full_service_pipeline():
    """
    Validates the prompt requirement:
    fixture
    → observation
    → VEYRA
    → evidence
    → impact
    → action
    → approval
    → result
    → timeline
    → export.
    """
    controller = DemoScenarioController()
    result = await controller.run_full_e2e_flow()

    assert result["status"] == "E2E_DEMO_COMPLETED_SUCCESSFULLY"

    # 1. Observation & VEYRA
    drift = result["drift_result"]
    assert drift["state"] == "REALITY_DRIFT"
    assert drift["drift_type"] == DEMO_DRIFT_TYPE
    assert drift["confidence"] >= 0.90

    # 2. Action & Approval & Result
    action = result["action"]
    assert action["approval_state"] == "APPROVED"
    assert action["execution_state"] == "SUCCEEDED"

    # 3. Timeline
    assert result["timeline_event_id"] is not None

    # 4. Office Kit Reality Audit Export
    assert result["audit_report_session"] == DEMO_SESSION_ID

    # Final verified state
    state = result["state"]
    assert state["step"] == 17
    assert state["current_effective_location"] == DEMO_PHYSICAL_LOCATION

    # Clean up state for subsequent test isolation
    controller.reset()


def test_demo_api_endpoints():
    # 1. GET /api/v1/demo/state
    res = client.get("/api/v1/demo/state")
    assert res.status_code == 200
    data = res.json()
    assert "step" in data
    assert data["total_steps"] == 17

    # 2. POST /api/v1/demo/reset
    res = client.post("/api/v1/demo/reset")
    assert res.status_code == 200
    assert res.json()["step"] == 1

    # 3. POST /api/v1/demo/step-forward
    res = client.post("/api/v1/demo/step-forward")
    assert res.status_code == 200
    assert res.json()["step"] == 2

    # 4. POST /api/v1/demo/jump/8
    res = client.post("/api/v1/demo/jump/8")
    assert res.status_code == 200
    assert res.json()["step"] == 8
    assert res.json()["drift"]["detected"] is True

    # 5. POST /api/v1/demo/run-e2e
    res = client.post("/api/v1/demo/run-e2e")
    assert res.status_code == 200
    e2e_data = res.json()
    assert e2e_data["status"] == "E2E_DEMO_COMPLETED_SUCCESSFULLY"
    assert e2e_data["action"]["execution_state"] == "SUCCEEDED"

    # Reset API state
    client.post("/api/v1/demo/reset")
