from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app.modules.demo.fixture import (
    DEMO_ENTITY,
    DEMO_EVENT_ID,
    DEMO_SESSION_ID,
    DEMO_DIGITAL_LOCATION,
    DEMO_DIGITAL_TIME,
    DEMO_DIGITAL_SOURCE,
    DEMO_PHYSICAL_NOTICE_TEXT,
    DEMO_PHYSICAL_LOCATION,
    DEMO_PHYSICAL_SOURCE,
    DEMO_USER_QUERY,
    DEMO_DRIFT_TYPE,
    DEMO_CONFIDENCE,
    DEMO_IMPACT_ITEMS,
    DEMO_PROPOSED_ACTION,
    DEMO_STEPS_METADATA,
)
from app.schemas.observation import DigitalObservation
from app.schemas.enums import RealityState, DriftType, ApprovalState, ExecutionState
from app.schemas.action import ProposedAction
from app.modules.reality.engine import veyra_x_engine
from app.modules.reality.graph import reality_graph
from app.modules.reality.observation_normalizer import ObservationNormalizer
from app.modules.reality.evidence_builder import EvidenceBuilder
from app.modules.actions.service import action_service
from app.modules.evidence.timeline_repository import timeline_repository
from app.modules.office_kit.audit_generator import AuditReportGenerator
from app.modules.digital_state.provider import digital_state_provider


class DemoScenarioController:
    """
    Deterministic E2E Hackathon Demo Scenario Controller.
    Executes the canonical 17-step flow from initial calendar ground truth
    to physical notice OCR, VEYRA X drift detection, safe action gate,
    and Office Kit Reality Audit export.
    """

    TOTAL_STEPS = 17

    def __init__(self):
        self.current_step = 1
        self.action_id: Optional[str] = None
        self.last_drift_result: Optional[Dict[str, Any]] = None
        self.last_audit_report: Optional[Dict[str, Any]] = None

    def reset(self) -> Dict[str, Any]:
        """Resets the demo scenario back to step 1."""
        self.current_step = 1
        self.action_id = None
        self.last_drift_result = None
        self.last_audit_report = None
        reality_graph.reset()
        return self.get_current_state()

    def step_forward(self) -> Dict[str, Any]:
        """Advances scenario by one step up to 17."""
        if self.current_step < self.TOTAL_STEPS:
            self.current_step += 1
        return self.get_current_state()

    def step_backward(self) -> Dict[str, Any]:
        """Rewinds scenario by one step down to 1."""
        if self.current_step > 1:
            self.current_step -= 1
        return self.get_current_state()

    def jump_to_step(self, step: int) -> Dict[str, Any]:
        """Jumps directly to a specified step between 1 and 17."""
        if 1 <= step <= self.TOTAL_STEPS:
            self.current_step = step
        return self.get_current_state()

    def get_current_state(self) -> Dict[str, Any]:
        """Returns the full deterministic state at the active step."""
        meta = DEMO_STEPS_METADATA[self.current_step - 1]

        # Calculate progress variables based on current step
        is_verifying = self.current_step >= 5
        has_physical_notice = self.current_step >= 6
        has_ocr = self.current_step >= 7
        has_drift = self.current_step >= 8
        has_evidence_replay = self.current_step >= 9
        has_impact = self.current_step >= 10
        has_proposed_action = self.current_step >= 11
        is_awaiting_approval = self.current_step == 12
        is_approved = self.current_step >= 13
        is_executed = self.current_step >= 14
        is_success = self.current_step >= 15
        has_timeline_event = self.current_step >= 16
        has_exported_audit = self.current_step >= 17

        approval_state = "NONE"
        if is_awaiting_approval:
            approval_state = "PENDING"
        elif is_approved:
            approval_state = "APPROVED"

        execution_state = "NOT_EXECUTED"
        if is_executed:
            execution_state = "SUCCEEDED"

        current_location = DEMO_DIGITAL_LOCATION
        if is_executed:
            current_location = DEMO_PHYSICAL_LOCATION

        return {
            "session_id": DEMO_SESSION_ID,
            "step": self.current_step,
            "total_steps": self.TOTAL_STEPS,
            "title": meta["title"],
            "description": meta["description"],
            "agent_state": meta["agent_state"],
            "entity": DEMO_ENTITY,
            "digital_state": {
                "event_id": DEMO_EVENT_ID,
                "title": DEMO_ENTITY,
                "time": DEMO_DIGITAL_TIME,
                "location": DEMO_DIGITAL_LOCATION,
                "source": DEMO_DIGITAL_SOURCE,
            },
            "user_query": DEMO_USER_QUERY if self.current_step >= 4 else None,
            "physical_observation": {
                "raw_text": DEMO_PHYSICAL_NOTICE_TEXT if has_physical_notice else None,
                "extracted_location": DEMO_PHYSICAL_LOCATION if has_ocr else None,
                "source": DEMO_PHYSICAL_SOURCE if has_physical_notice else None,
            },
            "drift": {
                "detected": has_drift,
                "drift_type": DEMO_DRIFT_TYPE if has_drift else "NONE",
                "confidence": DEMO_CONFIDENCE if has_drift else 1.0,
                "before": DEMO_DIGITAL_LOCATION if has_drift else None,
                "current": DEMO_PHYSICAL_LOCATION if has_drift else None,
            },
            "evidence_replay_active": has_evidence_replay,
            "impact_items": DEMO_IMPACT_ITEMS if has_impact else [],
            "action": {
                "proposed": has_proposed_action,
                "action_id": DEMO_PROPOSED_ACTION["action_id"],
                "type": DEMO_PROPOSED_ACTION["type"],
                "description": DEMO_PROPOSED_ACTION["description"],
                "approval_state": approval_state,
                "execution_state": execution_state,
            },
            "current_effective_location": current_location,
            "timeline_recorded": has_timeline_event,
            "audit_exported": has_exported_audit,
        }

    async def run_full_e2e_flow(self) -> Dict[str, Any]:
        """
        Executes the entire end-to-end flow using real underlying module services:
        fixture -> observation -> VEYRA -> evidence -> impact -> action -> approval -> result -> timeline -> export.
        """
        # 1. Digital Ground Truth
        calendar_events = await digital_state_provider.get_upcoming_events()
        assert len(calendar_events) > 0
        ground_truth_event = calendar_events[0]

        # 2. Physical Observation Extraction
        extracted = ObservationNormalizer.extract_from_text(DEMO_PHYSICAL_NOTICE_TEXT)
        assert extracted["location"] == DEMO_PHYSICAL_LOCATION
        obs = EvidenceBuilder.build_physical_observation(
            raw_text=DEMO_PHYSICAL_NOTICE_TEXT,
            location=extracted["location"],
            confidence=extracted["confidence"],
            entity=DEMO_ENTITY,
        )
        assert obs.location == DEMO_PHYSICAL_LOCATION

        # 3. VEYRA X Engine Drift Processing
        digital_obs = DigitalObservation(
            id="dig-calendar-seed-1",
            source=DEMO_DIGITAL_SOURCE,
            entity=DEMO_ENTITY,
            location=ground_truth_event.location,
            scheduled_time=ground_truth_event.start,
            timestamp=datetime.now(timezone.utc),
        )
        drift_result = veyra_x_engine.evaluate(digital_obs, obs)
        assert drift_result.state == RealityState.REALITY_DRIFT
        assert drift_result.drift_type == DriftType.LOCATION_CHANGED
        assert drift_result.confidence >= 0.90
        self.last_drift_result = drift_result.model_dump()

        # 4. Safe Action Gate: Propose -> Approve -> Execute
        action_payload = ProposedAction(
            action_id=DEMO_PROPOSED_ACTION["action_id"],
            type=DEMO_PROPOSED_ACTION["type"],
            title="Update Reminder Location",
            description=f"Update reminder from {ground_truth_event.location} to {obs.location}",
            affected_entity=DEMO_ENTITY,
            before_state={"location": ground_truth_event.location},
            proposed_state={"location": obs.location},
            evidence_refs=[obs.id],
            confidence=drift_result.confidence,
        )
        proposed = action_service.propose(action_payload)
        self.action_id = proposed.action_id
        assert proposed.approval_state == ApprovalState.PENDING
        assert proposed.execution_state == ExecutionState.NOT_EXECUTED

        # User Approves
        approved = action_service.approve(self.action_id)
        assert approved.approval_state == ApprovalState.APPROVED

        # Safe Execution
        exec_result = await action_service.execute(self.action_id)
        assert exec_result.execution_state == ExecutionState.SUCCEEDED

        # 5. Record Timeline
        timeline_event = timeline_repository.add_event(
            entity=DEMO_ENTITY,
            event_type="REALITY_DRIFT_CORRECTED",
            description=f"Presentation moved: {ground_truth_event.location} -> {obs.location}",
            before_state=ground_truth_event.location,
            current_state=obs.location,
            source="VEYRA_X_SAFE_ACTION",
            confidence=drift_result.confidence,
            evidence_refs=[obs.id],
        )
        assert timeline_event.event_id is not None

        # 6. Office Kit Reality Audit Generation
        audit_report = AuditReportGenerator.generate_demo_report(session_id=DEMO_SESSION_ID)
        markdown = AuditReportGenerator.to_markdown(audit_report)
        assert len(markdown) > 200
        assert "Room 204" in markdown
        assert "Room 302" in markdown
        self.last_audit_report = audit_report

        self.current_step = 17
        return {
            "status": "E2E_DEMO_COMPLETED_SUCCESSFULLY",
            "drift_result": self.last_drift_result,
            "action": exec_result.model_dump(),
            "timeline_event_id": timeline_event.event_id,
            "audit_report_session": audit_report["session"]["session_id"],
            "state": self.get_current_state(),
        }


demo_controller = DemoScenarioController()
