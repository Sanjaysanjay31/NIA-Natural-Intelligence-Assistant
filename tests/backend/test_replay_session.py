import pytest
from starlette.testclient import TestClient
from datetime import datetime, timezone
from app.main import app

client = TestClient(app)


def test_complete_room_204_to_302_replay_session():
    """
    Verification for Prompt 7:
    Complete Room 204 -> Room 302 replay loop in one session:
    1. Digital calendar known: Room 204
    2. Physical notice observed: Room 302
    3. Reality check returns REALITY_DRIFT / LOCATION_CHANGED with ProposedAction
    4. Fetch impact graph: downstream reminder, alarm, commitment
    5. Fetch evidence bundle proving notice
    6. Safe Action Gate approval: POST /api/v1/actions/{action_id}/approve
    7. Verify execution status and audit summary
    8. Check Reality Timeline for audit trail
    """
    # 1 & 2 & 3: Trigger Reality Check
    check_payload = {
        "entity": "Final Presentation",
        "rawText": "Notice: Departmental Presentations moved to Room 302 due to AC repair.",
        "extractedLocation": "Room 302",
        "source": "ocr"
    }
    res_check = client.post("/api/v1/reality/check", json=check_payload)
    assert res_check.status_code == 200
    drift_data = res_check.json()

    assert drift_data["state"] == "REALITY_DRIFT"
    assert drift_data["driftType"] == "LOCATION_CHANGED"
    assert drift_data["digital"]["location"] == "Room 204"
    assert drift_data["physical"]["location"] == "Room 302"
    assert drift_data["approvalRequired"] is True
    assert len(drift_data["evidenceRefs"]) >= 2
    reality_id = drift_data["realityId"]
    action_id = drift_data["proposedActionRef"]
    assert action_id is not None

    # 4: Query Impact Graph
    res_impact = client.get(f"/api/v1/reality/{reality_id}/impact")
    assert res_impact.status_code == 200
    impacts = res_impact.json()
    assert len(impacts) >= 2
    impact_types = [imp["targetType"] for imp in impacts]
    assert "reminder" in impact_types

    # 5: Fetch Evidence Bundle
    res_evidence = client.get("/api/v1/evidence/ev-ocr-1")
    assert res_evidence.status_code == 200
    ev_data = res_evidence.json()
    assert ev_data["source"] == "ocr"
    assert "Room 302" in ev_data["snippet"]

    # 6 & 7: Safe Action Gate Approval
    approval_payload = {
        "approvedBy": "sanjay",
        "approvalMethod": "biometric_tap",
        "notes": "Verified with hallway sign"
    }
    res_approve = client.post(f"/api/v1/actions/{action_id}/approve", json=approval_payload)
    assert res_approve.status_code == 200
    exec_data = res_approve.json()
    assert exec_data["approvalState"] == "APPROVED"
    assert exec_data["executionStatus"] == "EXECUTED_SUCCESSFULLY"
    assert "Room 302" in exec_data["auditSummary"]

    # 8: Verify Reality Timeline
    res_timeline = client.get("/api/v1/timeline")
    assert res_timeline.status_code == 200
    timeline = res_timeline.json()
    assert len(timeline) >= 1
    assert any("Final Presentation" in evt["entity"] for evt in timeline)


def test_action_rejection_at_safe_gate():
    """Verify that an action can be safely rejected at the Safe Action Gate."""
    res_reject = client.post("/api/v1/actions/act-9901/reject?notes=Incorrect notice")
    assert res_reject.status_code == 200
    data = res_reject.json()
    assert data["approvalState"] == "REJECTED"
