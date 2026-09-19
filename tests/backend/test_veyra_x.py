import pytest
from datetime import datetime, timezone, timedelta
from app.modules.reality.engine import VeyraXEngine
from app.modules.reality.graph import RealityGraph
from app.modules.reality.normalizer import RealityNormalizer
from app.schemas.observation import DigitalObservation, PhysicalObservation
from app.schemas.enums import RealityState, DriftType, ImpactSeverity


@pytest.fixture
def engine():
    return VeyraXEngine()


@pytest.fixture
def base_digital():
    return DigitalObservation(
        id="dig-pres-01",
        source="calendar",
        entity="Final Presentation",
        location="Room 204",
        scheduled_time=datetime.now(timezone.utc),
        timestamp=datetime.now(timezone.utc)
    )


class TestVeyraXDeterministicEngine:
    """Comprehensive test suite for the 8-stage deterministic VEYRA X reality engine."""

    def test_primary_hackathon_demo_room_drift(self, engine, base_digital):
        """
        Primary Hackathon Story:
        Digital: Final Presentation at 09:00 in Room 204
        Physical: 'Presentations moved to Room 302.'
        Result: REALITY_DRIFT / LOCATION_CHANGED
        Explanation: 'Calendar says Room 204, but the latest physical evidence says Room 302.'
        """
        phys = PhysicalObservation(
            id="phy-ocr-01",
            source="ocr",
            entity="Final Presentation",
            location="Room 302",
            raw_text="Presentations moved to Room 302 due to AC repair.",
            confidence=0.94,
            observed_at=datetime.now(timezone.utc)
        )

        result = engine.evaluate(digital=base_digital, physical=phys)

        assert result.state == RealityState.REALITY_DRIFT
        assert result.drift_type == DriftType.LOCATION_CHANGED
        assert result.confidence == 0.94
        assert result.agreement is False
        assert "Room 204" in result.explanation
        assert "Room 302" in result.explanation
        assert result.approval_required is True
        assert result.proposed_action is not None
        assert result.proposed_action.before_state["location"] == "Room 204"
        assert result.proposed_action.after_state["location"] == "Room 302"
        # Verify multiple affected entities from graph
        assert len(result.impact_refs) >= 2

    def test_no_drift_exact_match(self, engine, base_digital):
        """Observations matching known state yield VERIFIED_TRUE / NO_DRIFT."""
        phys = PhysicalObservation(
            id="phy-ocr-02",
            source="ocr",
            entity="Final Presentation",
            location="Room 204",
            raw_text="Final Presentation: Room 204",
            confidence=0.98,
            observed_at=datetime.now(timezone.utc)
        )

        result = engine.evaluate(digital=base_digital, physical=phys)
        assert result.state == RealityState.VERIFIED_TRUE
        assert result.drift_type == DriftType.NO_DRIFT
        assert result.agreement is True
        assert result.approval_required is False

    def test_same_room_different_formatting(self, engine, base_digital):
        """Canonical normalization reconciles 'ROOM-204', 'room 204', 'rm 204' without drift."""
        formats = ["ROOM-204", "room 204", "rm. 204", "Room: 204", "  204  "]
        for fmt in formats:
            phys = PhysicalObservation(
                id="phy-ocr-fmt",
                source="ocr",
                entity="Final Presentation",
                location=fmt,
                confidence=0.95,
                observed_at=datetime.now(timezone.utc)
            )
            result = engine.evaluate(digital=base_digital, physical=phys)
            assert result.state == RealityState.VERIFIED_TRUE, f"Failed for format '{fmt}'"
            assert result.drift_type == DriftType.NO_DRIFT

    def test_status_cancelled_drift(self, engine, base_digital):
        """Physical notice of cancellation yields STATUS_CANCELLED drift."""
        phys = PhysicalObservation(
            id="phy-ocr-cancel",
            source="ocr",
            entity="Final Presentation",
            location="Room 204",
            raw_text="Notice: Final Presentation is cancelled until further notice.",
            confidence=0.96,
            observed_at=datetime.now(timezone.utc)
        )
        result = engine.evaluate(digital=base_digital, physical=phys)
        assert result.state == RealityState.REALITY_DRIFT
        assert result.drift_type == DriftType.STATUS_CANCELLED

    def test_low_confidence_requires_review(self, engine, base_digital):
        """Observations below 0.60 confidence trigger CONFLICTING_EVIDENCE / review."""
        phys = PhysicalObservation(
            id="phy-ocr-blurry",
            source="ocr",
            entity="Final Presentation",
            location="Room 302",
            raw_text="Unclear blurry sign maybe 302",
            confidence=0.42,  # Low confidence
            observed_at=datetime.now(timezone.utc)
        )
        result = engine.evaluate(digital=base_digital, physical=phys)
        assert result.state == RealityState.CONFLICTING_EVIDENCE
        assert "Low confidence" in result.explanation
        assert result.approval_required is True

    def test_missing_digital_state(self, engine):
        """Observation without corresponding digital state triggers UNKNOWN_UNVERIFIED."""
        phys = PhysicalObservation(
            id="phy-ocr-ghost",
            source="ocr",
            entity="Ad-hoc Workshop",
            location="Room 101",
            raw_text="Workshop in Room 101",
            confidence=0.90,
            observed_at=datetime.now(timezone.utc)
        )
        result = engine.evaluate(digital=None, physical=phys)
        assert result.state == RealityState.UNKNOWN_UNVERIFIED
        assert "no digital calendar or state was found" in result.explanation

    def test_stale_evidence_handling(self, engine, base_digital):
        """Evidence older than threshold is flagged as stale."""
        stale_time = datetime.now(timezone.utc) - timedelta(days=2)
        phys = PhysicalObservation(
            id="phy-ocr-old",
            source="ocr",
            entity="Final Presentation",
            location="Room 302",
            confidence=0.90,
            observed_at=stale_time
        )
        result = engine.evaluate(digital=base_digital, physical=phys)
        assert result.state == RealityState.CONFLICTING_EVIDENCE
        assert "Stale physical evidence" in result.explanation

    def test_multiple_affected_entities_graph_traversal(self, engine, base_digital):
        """Drift computes impacted reminder, alarm, and commitment."""
        phys = PhysicalObservation(
            id="phy-ocr-reloc",
            source="ocr",
            entity="Final Presentation",
            location="Room 302",
            confidence=0.94,
            observed_at=datetime.now(timezone.utc)
        )
        result = engine.evaluate(digital=base_digital, physical=phys)
        # Should link reminder, alarm, commitment
        target_types = [ent.split(":")[0].lower() for ent in result.affected_entities]
        assert "reminder" in target_types
        assert "alarm" in target_types
        assert "commitment" in target_types


class TestRealityNormalizer:
    """Unit tests for deterministic room and time normalization rules."""

    def test_room_normalization(self):
        assert RealityNormalizer.normalize_room("room 204") == "Room 204"
        assert RealityNormalizer.normalize_room("ROOM-302") == "Room 302"
        assert RealityNormalizer.normalize_room("Rm. 101B") == "Room 101B"
        assert RealityNormalizer.normalize_room("405") == "Room 405"

    def test_time_normalization(self):
        assert RealityNormalizer.normalize_time("09:00") == "09:00"
        assert RealityNormalizer.normalize_time("9:00 AM") == "09:00"
        assert RealityNormalizer.normalize_time("2:30 PM") == "14:30"
        assert RealityNormalizer.normalize_time("5 PM") == "17:00"
