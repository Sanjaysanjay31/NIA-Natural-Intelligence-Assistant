import pytest
from app.modules.reality.mind_pulse import MindPulseExtractor, MindPulseVerifier


def test_mind_pulse_full_context_extraction():
    """Extracts events, commitments, locations, deadlines, tasks, people, and decisions from screen."""
    raw_text = (
        'Team WhatsApp: "Update: Final Presentation moved to Room 302 at 09:00 AM! '
        'Please inform Prof. Sharma. Task: bring HDMI adapter. We must deliver slides early."'
    )
    extracted = MindPulseExtractor.extract(raw_text, base_confidence=0.96)

    assert "Final Presentation" in extracted["events"]
    assert "Room 302" in extracted["locations"]
    assert "Prof. Sharma" in extracted["people"]
    assert any("09:00" in d for d in extracted["deadlines"])
    assert any("bring" in t.lower() or "hdmi" in t.lower() for t in extracted["tasks"])
    assert any("deliver" in c.lower() or "must" in c.lower() for c in extracted["commitments"])
    assert extracted["confidence"] >= 0.90


def test_mind_pulse_drift_detection():
    """Deterministic comparison: Digital Room 204 vs Screen Room 302 -> DRIFT without LLM dependency."""
    extracted = {
        "locations": ["Room 302"],
        "confidence": 0.95,
        "raw_text": "Final Presentation moved to Room 302"
    }

    result = MindPulseVerifier.verify(
        extracted=extracted,
        digital_location="Room 204",
        digital_time="09:00 AM"
    )

    assert result["status"] == "DRIFT"
    assert "Room 204 → Room 302" in result["headline"]
    assert result["requires_review"] is False


def test_mind_pulse_verified_confirmation():
    """Screen matches digital calendar -> VERIFIED confirmation."""
    extracted = {
        "locations": ["Room 204"],
        "confidence": 0.95,
        "raw_text": "Final Presentation confirmed for Room 204 at 09:00 AM"
    }

    result = MindPulseVerifier.verify(
        extracted=extracted,
        digital_location="Room 204",
        digital_time="09:00 AM"
    )

    assert result["status"] == "VERIFIED"
    assert "Ground Truth Verified" in result["headline"]


def test_mind_pulse_low_confidence_shows_needs_review():
    """Low confidence / obscured text -> 'Needs review' instead of inventing certainty."""
    extracted = MindPulseExtractor.extract(
        "Notice: Event relocated to R... [obscured notification banner]",
        base_confidence=0.45
    )

    assert extracted["confidence"] < 0.60
    result = MindPulseVerifier.verify(
        extracted=extracted,
        digital_location="Room 204",
        digital_time="09:00 AM"
    )

    assert result["status"] == "NEEDS_REVIEW"
    assert "Needs Review" in result["headline"]
    assert result["requires_review"] is True


def test_mind_pulse_cancellation_detection():
    """Event postponed on screen -> DRIFT with cancellation summary."""
    extracted = MindPulseExtractor.extract(
        "Urgent: Final Presentation postponed until next week due to faculty symposium.",
        base_confidence=0.92
    )

    result = MindPulseVerifier.verify(
        extracted=extracted,
        digital_location="Room 204",
        digital_time="09:00 AM"
    )

    assert result["status"] == "DRIFT"
    assert "Cancelled" in result["headline"] or "Postponed" in result["headline"]
