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

