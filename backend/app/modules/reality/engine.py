import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.schemas.enums import RealityState, DriftType, ApprovalState
from app.schemas.observation import DigitalObservation, PhysicalObservation
from app.schemas.evidence import EvidenceItem
from app.schemas.reality import DriftResult
from app.schemas.action import ProposedAction
from app.schemas.impact import ImpactItem
from app.modules.reality.normalizer import RealityNormalizer
from app.modules.reality.graph import reality_graph, RealityGraph


class VeyraXEngine:
    """
    Deterministic Reality Intelligence Engine.
    Executes: Perception -> Normalization -> Truth -> Drift -> Evidence -> Timeline -> Impact -> Action.
    Strict Invariant: No LLM is used for drift detection.
    """

    def __init__(self, graph: Optional[RealityGraph] = None):
        self.graph = graph or reality_graph
        self.seen_evidence_hashes: set[str] = set()

    def evaluate(
        self,
        digital: Optional[DigitalObservation],
        physical: PhysicalObservation,
        stale_threshold_seconds: int = 86400  # 24 hours
    ) -> DriftResult:
        """
        Execute deterministic reality evaluation across the 8 VEYRA X stages.
        """
        reality_id = f"real-{uuid.uuid4().hex[:8]}"
        eval_time = datetime.now(timezone.utc)

        # STAGE 1 & 2: PERCEPTION & NORMALIZATION
        norm_phys_location = RealityNormalizer.normalize_room(physical.location)
        norm_phys_text = RealityNormalizer.normalize_text(physical.raw_text)

        # Fallback: extract room directly from raw text if physical.location was empty
        if not norm_phys_location and norm_phys_text:
            extracted = RealityNormalizer.normalize_room(norm_phys_text)
            if extracted:
                norm_phys_location = extracted

        # STAGE 3: TRUTH (Digital ground truth lookup & verification)
        if digital is None:
            # Stage 4: DRIFT - Missing Digital State
            return DriftResult(
                reality_id=reality_id,
                entity=physical.entity or "Unknown Entity",
                digital={},
                physical={
                    "location": norm_phys_location or physical.raw_text,
                    "source": physical.source,
                    "observedAt": physical.observed_at.isoformat()
                },
                state=RealityState.UNKNOWN_UNVERIFIED,
                drift_type=DriftType.FACT_CONTRADICTED,
                confidence=physical.confidence,
                agreement=False,
                evidence_refs=[],
                impact_refs=[],
                affected_entities=[],
                approval_required=False,
                explanation=f"Observation received for '{physical.entity}', but no digital calendar or state was found.",
                evaluated_at=eval_time
            )

        norm_dig_location = RealityNormalizer.normalize_room(digital.location)

        # STAGE 4: DRIFT EVALUATION

        # Rule 4.1: Low confidence observations require manual review
        if physical.confidence < 0.60:
            return DriftResult(
                reality_id=reality_id,
                entity=digital.entity,
                digital={"location": norm_dig_location, "source": digital.source},
                physical={"location": norm_phys_location, "source": physical.source, "rawText": physical.raw_text},
                state=RealityState.CONFLICTING_EVIDENCE,
                drift_type=DriftType.FACT_CONTRADICTED,
                confidence=physical.confidence,
                agreement=False,
                evidence_refs=[],
                impact_refs=[],
                affected_entities=[],
                approval_required=True,
                explanation=f"Low confidence ({physical.confidence:.2f}) observation. Review required before updating.",
                evaluated_at=eval_time
            )

        # Rule 4.2: Stale evidence check (observation older than threshold)
        age_seconds = (eval_time - physical.observed_at).total_seconds()
        if age_seconds > stale_threshold_seconds:
            return DriftResult(
                reality_id=reality_id,
                entity=digital.entity,
                digital={"location": norm_dig_location, "source": digital.source},
                physical={"location": norm_phys_location, "source": physical.source},
                state=RealityState.CONFLICTING_EVIDENCE,
                drift_type=DriftType.FACT_CONTRADICTED,
                confidence=physical.confidence,
                agreement=False,
                evidence_refs=[],
                impact_refs=[],
                affected_entities=[],
                approval_required=True,
                explanation=f"Stale physical evidence: observation is {int(age_seconds / 3600)} hours old.",
                evaluated_at=eval_time
            )

        # Rule 4.3: Status cancellation check in observation text
        if any(w in norm_phys_text.lower() for w in ["cancelled", "canceled", "postponed"]):
            ev_id = f"ev-{physical.source}-{uuid.uuid4().hex[:6]}"
            ev_dig_id = f"ev-{digital.source}-{uuid.uuid4().hex[:6]}"
            return DriftResult(
                reality_id=reality_id,
                entity=digital.entity,
                digital={"location": norm_dig_location, "source": digital.source},
                physical={"location": norm_phys_location, "source": physical.source, "rawText": physical.raw_text},
                state=RealityState.REALITY_DRIFT,
                drift_type=DriftType.STATUS_CANCELLED,
                confidence=physical.confidence,
                agreement=False,
                evidence_refs=[ev_dig_id, ev_id],
                impact_refs=[],
                affected_entities=[],
                proposed_action_ref=None,
                approval_required=True,
                explanation=f"Physical notice indicates event '{digital.entity}' is cancelled.",
                evaluated_at=eval_time
            )

        # Rule 4.4: Exact agreement
        if norm_dig_location and norm_phys_location and norm_dig_location == norm_phys_location:
            ev_id = f"ev-{physical.source}-{uuid.uuid4().hex[:6]}"
            return DriftResult(
                reality_id=reality_id,
                entity=digital.entity,
                digital={"location": norm_dig_location, "source": digital.source},
                physical={"location": norm_phys_location, "source": physical.source},
                state=RealityState.VERIFIED_TRUE,
                drift_type=DriftType.NO_DRIFT,
                confidence=physical.confidence,
                agreement=True,
                evidence_refs=[ev_id],
                impact_refs=[],
                affected_entities=[],
                approval_required=False,
                explanation=f"Ground truth verified: Digital state and physical observation agree on {norm_dig_location}.",
                evaluated_at=eval_time
            )
        is_location_drift = norm_dig_location and norm_phys_location and norm_dig_location != norm_phys_location
        if is_location_drift:
            drift_type = DriftType.LOCATION_CHANGED
            explanation = (
                f"Calendar says {norm_dig_location}, but the latest physical evidence says {norm_phys_location}."
            )
        else:
            # Check status cancellation in text
            if any(w in norm_phys_text.lower() for w in ["cancelled", "canceled", "postponed"]):
                drift_type = DriftType.STATUS_CANCELLED
                explanation = f"Physical notice indicates event '{digital.entity}' is cancelled."
            else:
                drift_type = DriftType.FACT_CONTRADICTED
                explanation = f"Observation contradicts digital state for '{digital.entity}'."

        # STAGE 5: EVIDENCE BUNDLING
        ev_id = f"ev-{physical.source}-{uuid.uuid4().hex[:6]}"
        ev_dig_id = f"ev-{digital.source}-{uuid.uuid4().hex[:6]}"
        evidence_refs = [ev_dig_id, ev_id]

        # STAGE 6 & 7: IMPACT GRAPH TRAVERSAL
        event_node = self.graph.find_event_by_name(digital.entity)
        impacts: List[ImpactItem] = []
        if event_node:
            impacts = self.graph.query_impacted_entities(event_node.node_id, new_location=norm_phys_location)

        impact_refs = [imp.impact_id for imp in impacts]
        affected_entities = [f"{imp.target_type.title()}: {imp.target_id}" for imp in impacts]

        # STAGE 8: ACTION PROPOSAL (Requires Safe Action Gate Approval)
        action_id = f"act-{uuid.uuid4().hex[:6]}"
        proposed_action = ProposedAction(
            action_id=action_id,
            reality_id=reality_id,
            title=f"Update {digital.entity} Location",
            description=f"Update location from {norm_dig_location} to {norm_phys_location} and adjust {len(impacts)} downstream items.",
            before_state={"location": norm_dig_location, "entity": digital.entity},
            after_state={"location": norm_phys_location, "entity": digital.entity},
            approval_state=ApprovalState.PENDING_APPROVAL,
            approval_required=True,
            evidence_refs=evidence_refs,
            created_at=eval_time
        )

        return DriftResult(
            reality_id=reality_id,
            entity=digital.entity,
            digital={"location": norm_dig_location, "source": digital.source},
            physical={"location": norm_phys_location, "source": physical.source, "rawText": physical.raw_text},
            state=RealityState.REALITY_DRIFT,
            drift_type=drift_type,
            confidence=physical.confidence,
            agreement=False,
            evidence_refs=evidence_refs,
            impact_refs=impact_refs,
            affected_entities=affected_entities,
            proposed_action_ref=action_id,
            proposed_action=proposed_action,
            approval_required=True,
            explanation=explanation,
            evaluated_at=eval_time
        )


veyra_x_engine = VeyraXEngine()
