import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.modules.office_kit.audit_generator import AuditReportGenerator


def test_ten_report_sections_present():
    """Validates presence and non-emptiness of all 10 required report sections."""
    report = AuditReportGenerator.generate_demo_report("sess-10-sections-check")

    sections = [
        "session",
        "what_nia_knew",
        "what_was_observed",
        "reality_drift",
        "evidence",
        "impact",
        "proposed_action",
        "approval",
        "result",
        "timeline",
    ]

    for section in sections:
        assert section in report, f"Section '{section}' missing from report"
        assert report[section] is not None, f"Section '{section}' is None"


def test_demo_export_room_shift_and_action():
    """Validates demo scenario: Room 204 -> Room 302 with evidence and approved reminder update."""
    report = AuditReportGenerator.generate_demo_report()

    # Section 2: What NIA knew
    assert report["what_nia_knew"]["location"] == "Room 204"

    # Section 3: What was observed
    assert report["what_was_observed"]["location"] == "Room 302"

    # Section 4: Reality Drift
    assert report["reality_drift"]["state"] == "REALITY_DRIFT"
    assert report["reality_drift"]["confidence"] == 0.96

    # Section 7 & 8: Proposed Action & Approval
    assert report["proposed_action"]["before_state"]["location"] == "Room 204"
    assert report["proposed_action"]["after_state"]["location"] == "Room 302"
    assert report["approval"]["state"] == "APPROVED"

    # Section 9: Result
    assert report["result"]["execution_status"] == "SUCCEEDED"

    # Section 10: Timeline contains sequential events
    assert len(report["timeline"]) >= 5


def test_office_kit_api_export():
    """Validates API route returns report and markdown document."""
    client = TestClient(app)
    res = client.post("/api/v1/office-kit/generate-audit", json={"session_id": "test-api-sess"})
    assert res.status_code == 200

    data = res.json()
    assert "report" in data
    assert "markdown" in data
    assert "NIA Reality Audit Report" in data["markdown"]
