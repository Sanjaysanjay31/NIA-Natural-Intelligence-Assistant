from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.schemas.reality import DriftResult, RealityCheckRequest
from app.schemas.observation import DigitalObservation, PhysicalObservation
from app.schemas.evidence import EvidenceItem
from app.schemas.impact import ImpactItem
from app.modules.reality.engine import veyra_x_engine
from app.modules.reality.graph import reality_graph

router = APIRouter(tags=["Reality Intelligence (VEYRA X)"])

# In-memory storage for evaluated reality results and evidence
STORED_EVIDENCE: Dict[str, EvidenceItem] = {
    "ev-calendar-1": EvidenceItem(
        evidence_id="ev-calendar-1",
        source="calendar",
        snippet="Final Presentation at 09:00 in Room 204",
        confidence=1.0,
        capturedAt=datetime.now(timezone.utc),
        metadata={"calendarId": "cal-primary-01"}
    ),
    "ev-ocr-1": EvidenceItem(
        evidence_id="ev-ocr-1",
        source="ocr",
        snippet="Notice: Presentations moved to Room 302 due to maintenance",
        confidence=0.94,
        capturedAt=datetime.now(timezone.utc),
        metadata={"sensor": "camera_back", "boundingBox": {"x": 120, "y": 340, "width": 640, "height": 80}}
    )
}

STORED_REALITY_RESULTS: Dict[str, DriftResult] = {}


@router.post("/reality/check", response_model=DriftResult)
async def check_reality(request: RealityCheckRequest) -> DriftResult:
    """
    Evaluate physical observation against digital ground truth for Reality Drift.
    Deterministic execution via VEYRA X engine.
    """
    # Look up digital state from graph
    event_node = reality_graph.find_event_by_name(request.entity)
    digital_obs = None
    if event_node:
        digital_obs = DigitalObservation(
            id=f"dig-{event_node.node_id}",
            source="calendar",
            entity=event_node.label,
            location=event_node.properties.get("location"),
            timestamp=datetime.now(timezone.utc)
        )

    # Ingest physical observation
    phys_obs = PhysicalObservation(
        id=request.physical_observation_id or "phy-live-01",
        source=request.source,
        entity=request.entity,
        location=request.extracted_location,
        raw_text=request.raw_text,
        confidence=0.94 if request.raw_text else 1.0,
        observed_at=datetime.now(timezone.utc)
    )

    result = veyra_x_engine.evaluate(digital=digital_obs, physical=phys_obs)
    if result.reality_id:
        STORED_REALITY_RESULTS[result.reality_id] = result

    return result


@router.get("/reality/{reality_id}/impact", response_model=List[ImpactItem])
async def get_impact(reality_id: str) -> List[ImpactItem]:
    """Retrieve downstream impacted entities for a detected reality drift."""
    stored = STORED_REALITY_RESULTS.get(reality_id)
    entity_name = stored.entity if stored else "Final Presentation"
    event_node = reality_graph.find_event_by_name(entity_name)
    if not event_node:
        return []
    return reality_graph.query_impacted_entities(event_node.node_id, new_location="Room 302")


@router.get("/evidence/{evidence_id}", response_model=EvidenceItem)
async def get_evidence(evidence_id: str) -> EvidenceItem:
    """Retrieve an evidence bundle by ID."""
    evidence = STORED_EVIDENCE.get(evidence_id)
    if not evidence:
        # Generate on-demand fixture if recognized
        if "ocr" in evidence_id:
            return EvidenceItem(
                evidence_id=evidence_id,
                source="ocr",
                snippet="Presentations moved to Room 302",
                confidence=0.94,
                captured_at=datetime.now(timezone.utc)
            )
        elif "cal" in evidence_id:
            return EvidenceItem(
                evidence_id=evidence_id,
                source="calendar",
                snippet="Room 204 scheduled in calendar",
                confidence=1.0,
                captured_at=datetime.now(timezone.utc)
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence with ID '{evidence_id}' not found."
        )
    return evidence
