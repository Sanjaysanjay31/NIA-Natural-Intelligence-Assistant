import pytest
from datetime import datetime, timezone
from app.modules.reality.observation_normalizer import ObservationNormalizer
from app.modules.reality.evidence_builder import EvidenceBuilder
from app.schemas import IntentSource


def test_primary_hackathon_notice_extraction():
    """Notice: 'Presentations moved to Room 302.' -> location = Room 302, high confidence, source = camera/OCR."""
    raw_text = "Presentations moved to Room 302."
    extracted = ObservationNormalizer.extract_from_text(raw_text, base_confidence=0.96)

    assert extracted["location"] == "Room 302"
    assert extracted["confidence"] >= 0.90
    assert extracted["is_ambiguous"] is False
    assert extracted["notice_type"] == "ROOM_CHANGE"

    obs = EvidenceBuilder.build_physical_observation(
        raw_text=raw_text,
        location=extracted["location"],
        confidence=extracted["confidence"],
        entity="Final Presentation"
    )
    assert obs.location == "Room 302"
    assert obs.raw_text == raw_text
    assert obs.source == "camera/OCR"
    assert obs.media_ref is None  # Privacy: raw image is not uploaded to Render


def test_blurry_image_handling():
    """Blurry image -> low confidence (< 0.5) triggering review in VEYRA X."""
    raw_blurry = "Pr...snt... m...vd R... 3.."
    extracted = ObservationNormalizer.extract_from_text(raw_blurry, base_confidence=0.35)

    assert extracted["confidence"] < 0.50
    # Building evidence with blurry flag
    evidence = EvidenceBuilder.build_evidence(
        raw_text=raw_blurry,
        confidence=extracted["confidence"],
        is_blurry=True
    )
    assert evidence.metadata["is_blurry"] is True
    assert evidence.confidence < 0.50


def test_no_text_image():
    """No text in image -> confidence 0.0, location None, handled safely without crashes."""
    extracted = ObservationNormalizer.extract_from_text("", base_confidence=0.95)
    assert extracted["location"] is None
    assert extracted["confidence"] == 0.0
    assert extracted["candidate_rooms"] == []


def test_multiple_rooms_directional_movement():
    """Notice with multiple rooms: 'moved from Room 204 to Room 302' -> chooses Room 302 as new destination."""
    raw = "Notice: Final Presentation moved from Room 204 to Room 302."
    extracted = ObservationNormalizer.extract_from_text(raw, base_confidence=0.95)

    assert extracted["location"] == "Room 302"
    assert extracted["previous_location"] == "Room 204"
    assert extracted["is_ambiguous"] is False
    assert "Room 204" in extracted["candidate_rooms"]
    assert "Room 302" in extracted["candidate_rooms"]


def test_ambiguous_room_numbers():
    """Ambiguous room notice: 'Room 101 or Room 102' -> flags is_ambiguous = True and confidence < 0.70."""
    raw = "Presentations relocated to Room 101 or Room 102. Check with coordinators."
    extracted = ObservationNormalizer.extract_from_text(raw, base_confidence=0.95)

    assert extracted["is_ambiguous"] is True
    assert len(extracted["candidate_rooms"]) >= 2
    assert extracted["confidence"] < 0.70  # Triggers LOW_CONFIDENCE_REQUIRES_REVIEW


def test_low_confidence_requires_review():
    """Smudged partial text with low confidence < 0.70 preserves warning."""
    raw = "Presentations moved to Room 302 (partial smudge)"
    extracted = ObservationNormalizer.extract_from_text(raw, base_confidence=0.55)

    assert extracted["confidence"] == 0.55
    assert extracted["confidence"] < 0.70


def test_privacy_invariant_raw_image_not_uploaded():
    """Privacy guarantee: raw image bytes/URIs are not included in backend data models."""
    obs = EvidenceBuilder.build_physical_observation(
        raw_text="Presentations moved to Room 302.",
        location="Room 302",
        confidence=0.96
    )
    ev = EvidenceBuilder.build_evidence(
        raw_text="Presentations moved to Room 302.",
        confidence=0.96
    )
    assert obs.media_ref is None
    assert ev.media_ref is None
    assert ev.metadata.get("privacy_mode") == "ON_DEVICE_ONLY"
