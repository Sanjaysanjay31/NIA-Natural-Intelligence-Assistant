from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.schemas import PhysicalObservation, EvidenceItem


class EvidenceBuilder:
    """
    Constructs strongly-typed EvidenceItem and PhysicalObservation adhering to NIA shared domain contracts.
    Guarantees privacy: image stays on-device; only metadata and extracted observations are transferred.
    """

    @staticmethod
    def build_evidence(
        raw_text: str,
        confidence: float,
        evidence_id: Optional[str] = None,
        source: str = "camera/OCR",
        is_simulated: bool = False,
        is_blurry: bool = False,
        captured_at: Optional[datetime] = None
    ) -> EvidenceItem:
        eid = evidence_id or f"ev-ocr-{int(datetime.now(timezone.utc).timestamp())}"
        dt = captured_at or datetime.now(timezone.utc)
        return EvidenceItem(
            evidence_id=eid,
            source=source,
            snippet=raw_text or "No text detected",
            confidence=confidence,
            captured_at=dt,
            media_ref=None,  # Privacy invariant: raw images are not uploaded to backend
            metadata={
                "is_simulated": is_simulated,
                "is_blurry": is_blurry,
                "privacy_mode": "ON_DEVICE_ONLY"
            }
        )

    @staticmethod
    def build_physical_observation(
        raw_text: str,
        location: Optional[str],
        confidence: float,
        entity: str = "Final Presentation",
        obs_id: Optional[str] = None,
        source: str = "camera/OCR",
        observed_at: Optional[datetime] = None,
        is_simulated: bool = False
    ) -> PhysicalObservation:
        oid = obs_id or f"obs-phys-{int(datetime.now(timezone.utc).timestamp())}"
        dt = observed_at or datetime.now(timezone.utc)
        return PhysicalObservation(
            id=oid,
            source=source,
            entity=entity,
            location=location,
            raw_text=raw_text,
            confidence=confidence,
            media_ref=None,  # Privacy invariant: raw images stay on phone
            observed_at=dt,
            metadata={"is_simulated": is_simulated}
        )
