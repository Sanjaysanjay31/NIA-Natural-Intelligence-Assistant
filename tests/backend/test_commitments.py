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
