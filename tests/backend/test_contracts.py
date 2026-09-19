import pytest
from datetime import datetime, timezone
from pydantic import ValidationError
from app.schemas import (
    DriftResult,
    RealityState,
    DriftType,
    AgentState,
    Intent,
    IntentSource,
    IntentType,
    WakeUpEvent,
    Session,
    DigitalObservation,
    PhysicalObservation,
    EvidenceItem,
    ImpactItem,
    ImpactSeverity,
    ProposedAction,
    ApprovalState,
    ActionApprovalRequest,
    ActionExecutionResult,
    Commitment,
    CommitmentStatus,
    TimelineEvent,
    TimelineEventType,
    NIAResponse,
    HealthResponse,
)


class TestDomainContractSerialization:
    """Serialization and deserialization tests for all shared NIA contracts."""

    def test_prompt_example_reality_result(self):
        """Verify the exact example reality result payload from Prompt 2."""
        raw_payload = {
            "entity": "Final Presentation",
            "digital": {"location": "Room 204", "source": "calendar"},
            "physical": {"location": "Room 302", "source": "ocr"},
            "state": "REALITY_DRIFT",
            "driftType": "LOCATION_CHANGED",
            "confidence": 0.94,
            "evidenceRefs": ["ev-calendar-1", "ev-ocr-1"],
            "impactRefs": ["reminder-1", "alarm-1"],
            "proposedActionRef": "action-1",
            "approvalRequired": True
        }

        # Deserialization from camelCase
        result = DriftResult.model_validate(raw_payload)
        assert result.entity == "Final Presentation"
        assert result.digital["location"] == "Room 204"
        assert result.physical["location"] == "Room 302"
        assert result.state == RealityState.REALITY_DRIFT
        assert result.drift_type == DriftType.LOCATION_CHANGED
        assert result.confidence == 0.94
        assert result.evidence_refs == ["ev-calendar-1", "ev-ocr-1"]
        assert result.impact_refs == ["reminder-1", "alarm-1"]
        assert result.proposed_action_ref == "action-1"
        assert result.approval_required is True

        # Serialization to camelCase JSON
        dumped = result.model_dump(by_alias=True)
        assert dumped["driftType"] == "LOCATION_CHANGED"
        assert dumped["evidenceRefs"] == ["ev-calendar-1", "ev-ocr-1"]
        assert dumped["impactRefs"] == ["reminder-1", "alarm-1"]
        assert dumped["proposedActionRef"] == "action-1"
        assert dumped["approvalRequired"] is True

    def test_intent_and_wakeup_contracts(self):
        """Verify Intent, WakeUpEvent, and Session models."""
        now = datetime.now(timezone.utc)
        intent = Intent(
            name=IntentType.CHECK_REALITY,
            confidence=0.98,
            source=IntentSource.VOICE_HOTWORD,
            raw_input="Hey NIA, check presentation room"
        )
        assert intent.name == IntentType.CHECK_REALITY
        dumped = intent.model_dump(by_alias=True)
        assert dumped["rawInput"] == "Hey NIA, check presentation room"

        wakeup = WakeUpEvent(
            event_id="evt-w1",
            trigger_type=IntentSource.MIND_PULSE_GESTURE,
            timestamp=now
        )
        assert wakeup.trigger_type == IntentSource.MIND_PULSE_GESTURE
        assert wakeup.model_dump(by_alias=True)["triggerType"] == "MIND_PULSE_GESTURE"

        session = Session(
            session_id="sess-01",
            user_id="usr-sanjay",
            active_state=AgentState.LISTENING
        )
        assert session.active_state == AgentState.LISTENING
        assert session.model_dump(by_alias=True)["activeState"] == "LISTENING"

    def test_observation_and_evidence_contracts(self):
        """Verify DigitalObservation, PhysicalObservation, and EvidenceItem."""
        now = datetime.now(timezone.utc)
        digital = DigitalObservation(
            id="dig-01",
            source="calendar",
            entity="Final Presentation",
            location="Room 204",
            scheduled_time=now
        )
        assert digital.source == "calendar"
        assert digital.model_dump(by_alias=True)["scheduledTime"] is not None

        physical = PhysicalObservation(
            id="phy-01",
            source="ocr",
            entity="Final Presentation",
            location="Room 302",
            raw_text="Presentations moved to Room 302",
            confidence=0.92
        )
        assert physical.raw_text == "Presentations moved to Room 302"
        assert physical.model_dump(by_alias=True)["rawText"] is not None

        evidence = EvidenceItem(
            evidence_id="ev-ocr-1",
            source="ocr",
            snippet="Presentations moved to Room 302",
            confidence=0.94,
            media_ref="file:///storage/emulated/0/DCIM/notice.jpg"
        )
        assert evidence.evidence_id == "ev-ocr-1"
        assert evidence.model_dump(by_alias=True)["mediaRef"] == "file:///storage/emulated/0/DCIM/notice.jpg"

    def test_impact_and_action_contracts(self):
        """Verify ImpactItem, ProposedAction, and Safe Action Gate models."""
        impact = ImpactItem(
            impact_id="imp-01",
            target_type="reminder",
            target_id="rem-204",
            description="Projector check reminder invalid",
            severity=ImpactSeverity.HIGH,
            suggested_remediation="Update to Room 302"
        )
        assert impact.severity == ImpactSeverity.HIGH
        assert impact.model_dump(by_alias=True)["suggestedRemediation"] == "Update to Room 302"

        action = ProposedAction(
            action_id="act-01",
            reality_id="real-01",
            title="Relocate Presentation",
            description="Change room to 302",
            before_state={"location": "Room 204"},
            after_state={"location": "Room 302"},
            approval_state=ApprovalState.PENDING_APPROVAL,
            approval_required=True,
            evidence_refs=["ev-ocr-1"]
        )
        assert action.approval_required is True
        dumped_action = action.model_dump(by_alias=True)
        assert dumped_action["approvalRequired"] is True
        assert dumped_action["beforeState"] == {"location": "Room 204"}

        approval = ActionApprovalRequest(
            approved_by="sanjay",
            approval_method="biometric_tap"
        )
        assert approval.model_dump(by_alias=True)["approvalMethod"] == "biometric_tap"

        execution = ActionExecutionResult(
            action_id="act-01",
            approval_state=ApprovalState.APPROVED,
            execution_status="SUCCESS",
            executed_at=datetime.now(timezone.utc),
            audit_summary="Updated Room 204 to Room 302"
        )
        assert execution.approval_state == ApprovalState.APPROVED

    def test_commitment_and_timeline_contracts(self):
        """Verify Commitment and TimelineEvent models."""
        now = datetime.now(timezone.utc)
        commitment = Commitment(
            commitment_id="cmt-01",
            title="Submit slides to Prof. Sharma",
            counterparty="Prof. Sharma",
            deadline=now,
            confidence=0.91,
            status=CommitmentStatus.OPEN
        )
        assert commitment.status == CommitmentStatus.OPEN
        assert commitment.model_dump(by_alias=True)["commitmentId"] == "cmt-01"

        event = TimelineEvent(
            event_id="evt-01",
            timestamp=now,
            event_type=TimelineEventType.DRIFT_DETECTED,
            title="Drift Detected",
            entity="Final Presentation",
            evidence_refs=["ev-ocr-1"],
            actor="veyra_x"
        )
        assert event.event_type == TimelineEventType.DRIFT_DETECTED
        assert event.model_dump(by_alias=True)["eventType"] == "DRIFT_DETECTED"

    def test_nia_response_generic_wrapper(self):
        """Verify NIAResponse generic serialization."""
        response = NIAResponse[DriftResult](
            success=True,
            message="Reality drift detected",
            data=DriftResult(
                entity="Final Presentation",
                digital={"location": "Room 204"},
                physical={"location": "Room 302"},
                state=RealityState.REALITY_DRIFT,
                drift_type=DriftType.LOCATION_CHANGED,
                confidence=0.95,
                approval_required=True
            )
        )
        dumped = response.model_dump(by_alias=True)
        assert dumped["success"] is True
        assert dumped["data"]["driftType"] == "LOCATION_CHANGED"


class TestInvalidPayloadRejection:
    """Negative testing: verify that malformed or invalid payloads are rejected with ValidationError."""

    def test_missing_required_entity_field(self):
        """Payload missing 'entity' must fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            DriftResult.model_validate({
                "digital": {"location": "Room 204"},
                "physical": {"location": "Room 302"},
                "state": "REALITY_DRIFT",
                "driftType": "LOCATION_CHANGED",
                "confidence": 0.94
            })
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("entity",) for e in errors)

    def test_invalid_confidence_range(self):
        """Confidence outside [0.0, 1.0] must fail validation."""
        with pytest.raises(ValidationError):
            DriftResult.model_validate({
                "entity": "Test",
                "digital": {},
                "physical": {},
                "state": "REALITY_DRIFT",
                "driftType": "LOCATION_CHANGED",
                "confidence": 1.5  # Invalid: > 1.0
            })

        with pytest.raises(ValidationError):
            DriftResult.model_validate({
                "entity": "Test",
                "digital": {},
                "physical": {},
                "state": "REALITY_DRIFT",
                "driftType": "LOCATION_CHANGED",
                "confidence": -0.1  # Invalid: < 0.0
            })

    def test_invalid_enum_values(self):
        """Invalid enum values must fail validation."""
        with pytest.raises(ValidationError):
            DriftResult.model_validate({
                "entity": "Test",
                "digital": {},
                "physical": {},
                "state": "INVALID_STATE",  # Not a valid RealityState
                "driftType": "LOCATION_CHANGED",
                "confidence": 0.8
            })

        with pytest.raises(ValidationError):
            DriftResult.model_validate({
                "entity": "Test",
                "digital": {},
                "physical": {},
                "state": "REALITY_DRIFT",
                "driftType": "SOME_FAKE_DRIFT",  # Not a valid DriftType
                "confidence": 0.8
            })

    def test_extra_forbidden_fields(self):
        """Extra unknown fields must be rejected (extra='forbid')."""
        with pytest.raises(ValidationError):
            DriftResult.model_validate({
                "entity": "Test",
                "digital": {},
                "physical": {},
                "state": "REALITY_DRIFT",
                "driftType": "LOCATION_CHANGED",
                "confidence": 0.8,
                "malicious_injected_field": "hacker_payload"
            })
