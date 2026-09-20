import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from app.modules.commitments.schemas import (
    CommitmentStatus,
    CommitmentSource,
    Commitment,
    CommitmentEvidence,
    CommitmentExtractionRequest,
    CommitmentExtractionResponse,
    CommitmentUpdate,
    CommitmentLinkRequest,
    FollowUpProposal,
)
from app.schemas.commitment import Commitment as CoreCommitment
from app.schemas.enums import CommitmentStatus as CoreCommitmentStatus


def test_commitment_schema_valid_instantiation():
    cmt = Commitment(
        id="cmt-001",
        owner="current_user",
        action="Submit the presentation slides",
        deadline="Friday",
        source=CommitmentSource.VOICE_MEMO,
        status=CommitmentStatus.PENDING,
        confidence=0.95,
        evidence_ref="ev-audio-01",
    )
    assert cmt.id == "cmt-001"
    assert cmt.owner == "current_user"
    assert cmt.action == "Submit the presentation slides"
    assert cmt.deadline == "Friday"
    assert cmt.source == CommitmentSource.VOICE_MEMO
    assert cmt.status == CommitmentStatus.PENDING
    assert cmt.confidence == 0.95
    assert cmt.evidence_ref == "ev-audio-01"
    assert isinstance(cmt.created_at, datetime)
    assert isinstance(cmt.updated_at, datetime)


def test_commitment_serialization_and_deserialization():
    cmt = Commitment(
        id="cmt-002",
        owner="Sanjay",
        action="Send the review document",
        deadline="tomorrow 5 PM",
        source=CommitmentSource.MEETING_TRANSCRIPT,
        status=CommitmentStatus.IN_PROGRESS,
        confidence=0.88,
        related_event_id="evt-meeting-01",
        related_location="Room 302",
    )
    json_data = cmt.model_dump(by_alias=True)
    assert json_data["id"] == "cmt-002"
    assert json_data["relatedEventId"] == "evt-meeting-01"
    assert json_data["relatedLocation"] == "Room 302"

    # Reconstruct from camelCase dict
    reconstructed = Commitment.model_validate(json_data)
    assert reconstructed.id == cmt.id
    assert reconstructed.action == cmt.action
    assert reconstructed.related_event_id == "evt-meeting-01"
    assert reconstructed.related_location == "Room 302"


def test_commitment_action_validation_fails_on_empty():
    with pytest.raises(ValidationError):
        Commitment(
            id="cmt-003",
            owner="current_user",
            action="   ",  # whitespace only
        )


def test_commitment_confidence_bounds():
    with pytest.raises(ValidationError):
        Commitment(
            id="cmt-004",
            owner="current_user",
            action="Do something",
            confidence=1.5,  # > 1.0
        )
    with pytest.raises(ValidationError):
        Commitment(
            id="cmt-005",
            owner="current_user",
            action="Do something",
            confidence=-0.1,  # < 0.0
        )


def test_commitment_status_validation():
    with pytest.raises(ValidationError):
        Commitment(
            id="cmt-006",
            owner="current_user",
            action="Valid action",
            status="UNKNOWN_STATUS",  # not a valid enum
        )


def test_commitment_to_core_adapter():
    cmt = Commitment(
        id="cmt-adapter-01",
        owner="Sanjay",
        action="Complete the Reality Graph migration",
        deadline="2026-09-25T17:00:00Z",
        source=CommitmentSource.CONVERSATION,
        status=CommitmentStatus.PENDING,
        confidence=0.92,
        evidence_ref="ev-conv-123",
        related_event_id="evt-001",
    )
    core_model = cmt.to_core_commitment()
    assert isinstance(core_model, CoreCommitment)
    assert core_model.commitment_id == "cmt-adapter-01"
    assert core_model.title == "Complete the Reality Graph migration"
    assert core_model.counterparty == "Sanjay"
    assert core_model.status == CoreCommitmentStatus.OPEN
    assert core_model.confidence == 0.92
    assert core_model.evidence_ref == "ev-conv-123"
    assert core_model.metadata["domain_source"] == "CONVERSATION"
    assert core_model.metadata["related_event_id"] == "evt-001"


def test_all_commitment_schemas_instantiation():
    req = CommitmentExtractionRequest(
        transcript="I will send the files by Friday.",
        source=CommitmentSource.VOICE_MEMO,
    )
    assert req.transcript == "I will send the files by Friday."

    resp = CommitmentExtractionResponse(
        commitments=[],
        extraction_count=0,
        confidence=1.0,
        raw_transcript=req.transcript,
    )
    assert resp.extraction_count == 0

    upd = CommitmentUpdate(status=CommitmentStatus.COMPLETED)
    assert upd.status == CommitmentStatus.COMPLETED

    link = CommitmentLinkRequest(
        commitment_id="cmt-001",
        related_event_id="evt-100",
        reality_node_id="node-reality-01",
    )
    assert link.reality_node_id == "node-reality-01"

    prop = FollowUpProposal(
        proposal_id="prop-01",
        commitment_id="cmt-001",
        action_type="SCHEDULE_REMINDER",
        title="Reminder: Send files",
        description="Trigger a reminder before Friday",
        suggested_trigger_time="2026-09-25T16:00:00Z",
        target_person="Sanjay",
    )
    assert prop.proposal_id == "prop-01"


# --- CommitmentExtractor Unit Tests ---

from app.modules.commitments.extractor import CommitmentExtractor


def test_extractor_positive_first_person_with_deadline():
    extractor = CommitmentExtractor()
    req = CommitmentExtractionRequest(
        transcript="I will submit the presentation slides by Friday.",
        source=CommitmentSource.VOICE_MEMO,
        current_user_name="Bhupathi",
    )
    res = extractor.extract(req)
    assert res.extraction_count == 1
    cmt = res.commitments[0]
    assert cmt.owner == "Bhupathi"
    assert "Submit the presentation slides" in cmt.action
    assert cmt.deadline is not None
    assert "Friday" in cmt.deadline
    assert cmt.confidence >= 0.85
    assert cmt.status == CommitmentStatus.PENDING
    assert cmt.evidence is not None
    assert "submit the presentation slides" in cmt.evidence.raw_quote.lower()


def test_extractor_positive_third_person_with_deadline():
    extractor = CommitmentExtractor()
    req = CommitmentExtractionRequest(
        transcript="Sanjay will submit the slides by Friday.",
        source=CommitmentSource.MEETING_TRANSCRIPT,
    )
    res = extractor.extract(req)
    assert res.extraction_count == 1
    cmt = res.commitments[0]
    assert cmt.owner == "Sanjay"
    assert "Submit the slides" in cmt.action
    assert cmt.deadline is not None
    assert "Friday" in cmt.deadline
    assert cmt.confidence >= 0.85


def test_extractor_positive_without_deadline():
    extractor = CommitmentExtractor()
    req = CommitmentExtractionRequest(
        transcript="I will prepare the deployment checklist.",
        source=CommitmentSource.VOICE_MEMO,
    )
    res = extractor.extract(req)
    assert res.extraction_count == 1
    cmt = res.commitments[0]
    assert cmt.owner == "current_user"
    assert "Prepare the deployment checklist" in cmt.action
    # Deadline must NOT be fabricated!
    assert cmt.deadline is None


def test_extractor_positive_compound_multiple_commitments():
    extractor = CommitmentExtractor()
    req = CommitmentExtractionRequest(
        transcript="I'll submit the slides Friday and send the report Monday.",
        source=CommitmentSource.VOICE_MEMO,
    )
    res = extractor.extract(req)
    assert res.extraction_count == 2
    c1, c2 = res.commitments
    assert "Submit the slides" in c1.action
    assert "Friday" in c1.deadline
    assert "Send the report" in c2.action
    assert "Monday" in c2.deadline


def test_extractor_positive_dialog_with_speaker_tag():
    extractor = CommitmentExtractor()
    req = CommitmentExtractionRequest(
        transcript="Priya: I will review the architecture document by tomorrow at 5 PM.",
        source=CommitmentSource.MEETING_TRANSCRIPT,
    )
    res = extractor.extract(req)
    assert res.extraction_count == 1
    cmt = res.commitments[0]
    assert cmt.owner == "Priya"
    assert "Review the architecture document" in cmt.action
    assert "tomorrow" in cmt.deadline.lower()


def test_extractor_negative_questions_disqualified():
    extractor = CommitmentExtractor()
    # Question with question mark
    res1 = extractor.extract(CommitmentExtractionRequest(transcript="Did you submit the slides?"))
    assert res1.extraction_count == 0

    # Question starting with auxiliary verb
    res2 = extractor.extract(CommitmentExtractionRequest(transcript="Can you send it?"))
    assert res2.extraction_count == 0


def test_extractor_negative_speculative_and_collective_disqualified():
    extractor = CommitmentExtractor()
    # "We should" is suggestive, not an individual binding commitment
    res1 = extractor.extract(CommitmentExtractionRequest(transcript="We should probably finish this."))
    assert res1.extraction_count == 0

    res2 = extractor.extract(CommitmentExtractionRequest(transcript="Maybe we could review the deck later."))
    assert res2.extraction_count == 0


def test_extractor_negative_past_tense_disqualified():
    extractor = CommitmentExtractor()
    res1 = extractor.extract(CommitmentExtractionRequest(transcript="The slides were submitted yesterday."))
    assert res1.extraction_count == 0

    res2 = extractor.extract(CommitmentExtractionRequest(transcript="I sent the email already."))
    assert res2.extraction_count == 0


# --- Commitment Repository Unit Tests ---

from app.modules.commitments.repository import (
    InMemoryCommitmentRepository,
    CommitmentNotFoundException,
    CommitmentAlreadyExistsException,
    InvalidStatusTransitionException,
)


@pytest.mark.asyncio
async def test_repository_crud_lifecycle():
    repo = InMemoryCommitmentRepository()
    cmt = Commitment(
        id="cmt-repo-1",
        owner="Sanjay",
        action="Complete VEYRA X integration",
        deadline="Friday",
    )

    # 1. Create
    created = await repo.create(cmt)
    assert created.id == "cmt-repo-1"
    assert created.status == CommitmentStatus.PENDING

    # 2. Prevent duplicate ID
    with pytest.raises(CommitmentAlreadyExistsException):
        await repo.create(cmt)

    # 3. Get
    fetched = await repo.get("cmt-repo-1")
    assert fetched is not None
    assert fetched.action == "Complete VEYRA X integration"

    # 4. Update (partial)
    updated = await repo.update("cmt-repo-1", CommitmentUpdate(deadline="Monday 10 AM"))
    assert updated.deadline == "Monday 10 AM"

    # 5. Link to event & location
    linked_event = await repo.link_to_event("cmt-repo-1", "evt-hackathon-01")
    assert linked_event.related_event_id == "evt-hackathon-01"

    linked_loc = await repo.link_to_location("cmt-repo-1", "Room 302")
    assert linked_loc.related_location == "Room 302"

    # 6. Mark at risk
    at_risk = await repo.mark_at_risk("cmt-repo-1", reason="Room changed unexpectedly")
    assert at_risk.status == CommitmentStatus.AT_RISK
    assert at_risk.metadata.get("at_risk_reason") == "Room changed unexpectedly"

    # 7. Update status to COMPLETED
    completed = await repo.update_status("cmt-repo-1", CommitmentStatus.COMPLETED)
    assert completed.status == CommitmentStatus.COMPLETED

    # 8. Delete
    deleted = await repo.delete("cmt-repo-1")
    assert deleted is True

    # 9. Get after delete returns None
    assert await repo.get("cmt-repo-1") is None

    # 10. Delete non-existent raises not found
    with pytest.raises(CommitmentNotFoundException):
        await repo.delete("cmt-repo-1")


@pytest.mark.asyncio
async def test_repository_status_transitions_and_invariants():
    repo = InMemoryCommitmentRepository()
    cmt = Commitment(id="cmt-trans-1", owner="Bhupathi", action="Write tests")
    await repo.create(cmt)

    # PENDING -> IN_PROGRESS is valid
    await repo.update_status("cmt-trans-1", CommitmentStatus.IN_PROGRESS)
    # IN_PROGRESS -> COMPLETED is valid
    await repo.update_status("cmt-trans-1", CommitmentStatus.COMPLETED)

    # COMPLETED is terminal; COMPLETED -> PENDING should fail
    with pytest.raises(InvalidStatusTransitionException):
        await repo.update_status("cmt-trans-1", CommitmentStatus.PENDING)


@pytest.mark.asyncio
async def test_repository_list_filtering_and_ordering():
    repo = InMemoryCommitmentRepository()
    c1 = Commitment(id="cmt-1", owner="Alice", action="Task 1", status=CommitmentStatus.PENDING)
    c2 = Commitment(id="cmt-2", owner="Bob", action="Task 2", status=CommitmentStatus.COMPLETED)
    c3 = Commitment(id="cmt-3", owner="Alice", action="Task 3", status=CommitmentStatus.IN_PROGRESS, related_location="Room 101")

    await repo.create(c1)
    await repo.create(c2)
    await repo.create(c3)

    # Filter by owner
    alice_items = await repo.list(owner="Alice")
    assert len(alice_items) == 2
    assert all(c.owner == "Alice" for c in alice_items)

    # Filter by status
    completed_items = await repo.list(status=CommitmentStatus.COMPLETED)
    assert len(completed_items) == 1
    assert completed_items[0].id == "cmt-2"

    # Filter by location
    loc_items = await repo.list(related_location="Room 101")
    assert len(loc_items) == 1
    assert loc_items[0].id == "cmt-3"


# --- Commitment API Endpoint Tests ---

from fastapi.testclient import TestClient
from app.main import app
from app.modules.commitments.repository import commitment_repository


@pytest.fixture(autouse=True)
def clean_repository():
    commitment_repository.clear()
    yield
    commitment_repository.clear()


def test_api_extract_commitments():
    client = TestClient(app)
    payload = {
        "transcript": "I will prepare the presentation slides by Friday.",
        "source": "VOICE_MEMO",
        "currentUserName": "Bhupathi"
    }
    response = client.post("/api/v1/commitments/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["extractionCount"] == 1
    assert data["commitments"][0]["owner"] == "Bhupathi"
    assert "Prepare the presentation slides" in data["commitments"][0]["action"]


def test_api_crud_and_status_transitions():
    client = TestClient(app)

    # 1. Create Commitment
    new_cmt = {
        "id": "cmt-api-101",
        "owner": "Sanjay",
        "action": "Sync ground truth database",
        "deadline": "tomorrow 3 PM",
        "source": "VOICE_MEMO",
        "status": "PENDING",
        "confidence": 0.95
    }
    create_resp = client.post("/api/v1/commitments", json=new_cmt)
    assert create_resp.status_code == 201
    created_body = create_resp.json()
    assert created_body["id"] == "cmt-api-101"
    assert created_body["status"] == "PENDING"

    # Duplicate create fails with 409
    dup_resp = client.post("/api/v1/commitments", json=new_cmt)
    assert dup_resp.status_code == 409

    # 2. Get Commitment
    get_resp = client.get("/api/v1/commitments/cmt-api-101")
    assert get_resp.status_code == 200
    assert get_resp.json()["action"] == "Sync ground truth database"

    # Get non-existent returns 404
    not_found = client.get("/api/v1/commitments/non-existent-id")
    assert not_found.status_code == 404

    # 3. List Commitments with query filters
    list_resp = client.get("/api/v1/commitments?owner=Sanjay&status=PENDING")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1
    assert items[0]["id"] == "cmt-api-101"

    # 4. Partial Update
    patch_resp = client.patch(
        "/api/v1/commitments/cmt-api-101",
        json={"deadline": "Monday 9 AM"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["deadline"] == "Monday 9 AM"

    # 5. Link event and location
    link_resp = client.patch(
        "/api/v1/commitments/cmt-api-101/link",
        json={
            "commitmentId": "cmt-api-101",
            "relatedEventId": "evt-calendar-404",
            "relatedLocation": "Room 302"
        }
    )
    assert link_resp.status_code == 200
    assert link_resp.json()["relatedEventId"] == "evt-calendar-404"
    assert link_resp.json()["relatedLocation"] == "Room 302"

    # 6. Status Update (valid: PENDING -> IN_PROGRESS -> COMPLETED)
    status_resp1 = client.patch(
        "/api/v1/commitments/cmt-api-101/status",
        json={"status": "IN_PROGRESS"}
    )
    assert status_resp1.status_code == 200
    assert status_resp1.json()["status"] == "IN_PROGRESS"

    status_resp2 = client.patch(
        "/api/v1/commitments/cmt-api-101/status",
        json={"status": "COMPLETED"}
    )
    assert status_resp2.status_code == 200
    assert status_resp2.json()["status"] == "COMPLETED"

    # 7. Invalid status transition from terminal COMPLETED -> PENDING returns 400
    invalid_status = client.patch(
        "/api/v1/commitments/cmt-api-101/status",
        json={"status": "PENDING"}
    )
    assert invalid_status.status_code == 400

    # 8. Delete Commitment
    del_resp = client.delete("/api/v1/commitments/cmt-api-101")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # 9. Verify gone
    assert client.get("/api/v1/commitments/cmt-api-101").status_code == 404


# --- Commitment Reality Graph Adapter Tests ---

from app.modules.commitments.adapter import CommitmentRealityAdapter


@pytest.mark.asyncio
async def test_reality_adapter_event_and_location_lookup():
    repo = InMemoryCommitmentRepository()
    adapter = CommitmentRealityAdapter(repository=repo)

    c1 = Commitment(
        id="cmt-adap-1",
        owner="Sanjay",
        action="Submit presentation slides by Friday",
        deadline="Friday",
        related_event_id="Final Presentation",
        related_location="Room 204",
    )
    c2 = Commitment(
        id="cmt-adap-2",
        owner="Bhupathi",
        action="Bring projector HDMI cable",
        deadline="Friday 8:30 AM",
        related_event_id="Final Presentation",
        related_location="Room 204",
    )
    c3 = Commitment(
        id="cmt-adap-3",
        owner="Alice",
        action="Prepare quarterly sales forecast",
        related_event_id="Quarterly Review",
        related_location="Boardroom B",
    )

    await repo.create(c1)
    await repo.create(c2)
    await repo.create(c3)

    # 1. Event Lookup
    event_commitments = await adapter.get_commitments_for_event("Final Presentation")
    assert len(event_commitments) == 2
    ids = {c.id for c in event_commitments}
    assert ids == {"cmt-adap-1", "cmt-adap-2"}

    # 2. Location Lookup
    loc_commitments = await adapter.get_commitments_for_location("Room 204")
    assert len(loc_commitments) == 2

    # 3. Entity Lookup (checks event, location, metadata)
    entity_matches = await adapter.get_commitments_for_entity("Final Presentation")
    assert len(entity_matches) == 2

    loc_matches = await adapter.get_commitments_for_entity("Boardroom B")
    assert len(loc_matches) == 1
    assert loc_matches[0].id == "cmt-adap-3"

    # 4. Missing Entity
    assert await adapter.get_commitments_for_entity("NonExistentEntity") == []
    assert await adapter.get_commitments_for_event("NonExistentEvent") == []
    assert await adapter.get_commitments_for_location("NonExistentRoom") == []

    # 5. Dynamic Linking
    await adapter.link_commitment_to_event("cmt-adap-3", "Annual All-Hands")
    updated_c3 = await repo.get("cmt-adap-3")
    assert updated_c3.related_event_id == "Annual All-Hands"

    await adapter.link_commitment_to_location("cmt-adap-3", "Main Auditorium")
    updated_c3_loc = await repo.get("cmt-adap-3")
    assert updated_c3_loc.related_location == "Main Auditorium"

    # 6. Mark At Risk and Preserve Reason
    drift_reason = "Reality Drift: Final Presentation location moved from Room 204 to Room 302"
    at_risk_c1 = await adapter.mark_at_risk("cmt-adap-1", reason=drift_reason)
    assert at_risk_c1.status == CommitmentStatus.AT_RISK
    assert at_risk_c1.metadata.get("at_risk_reason") == drift_reason
    assert "at_risk_marked_at" in at_risk_c1.metadata




