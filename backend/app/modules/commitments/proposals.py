import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.modules.commitments.schemas import (
    Commitment,
    CommitmentStatus,
    FollowUpProposal,
)


class CommitmentFollowUpService:
    """Proposal-only follow-up engine for Commitment Intelligence.
    
    Generates structured, non-destructive follow-up proposals requiring
    explicit user approval via the Safe Action Gate.
    
    Invariants:
    - Propose only: Never mutates external state or dispatches messages automatically.
    - Factual: Never fabricates deadlines or assumes past dates.
    - Terminal safety: Completed and cancelled commitments never generate reminder proposals.
    """

    def generate_proposal(
        self,
        commitment: Commitment,
        current_time: Optional[datetime] = None,
        impact_context: Optional[Dict[str, Any]] = None,
    ) -> Optional[FollowUpProposal]:
        """Generates an actionable follow-up recommendation for a commitment."""
        now = current_time or datetime.now(timezone.utc)
        impact = impact_context or {}

        # 1. Terminal / Inactive State Check
        # If commitment is completed or cancelled, do not create standard reminder proposals
        if commitment.status in (CommitmentStatus.COMPLETED, CommitmentStatus.CANCELLED):
            return None

        # 2. Location Drift / Reality Impact Priority
        location_changed = (
            impact.get("drift_type") == "LOCATION_CHANGED"
            or "new_location" in impact
            or "location" in impact.get("changed_fields", [])
        )
        if location_changed:
            new_loc = impact.get("new_location") or impact.get("physical_location", "a new location")
            event_name = commitment.related_event_id or "event"
            return FollowUpProposal(
                proposal_id=f"prop-{uuid.uuid4().hex[:8]}",
                commitment_id=commitment.id,
                action_type="ALERT_LOCATION_DRIFT",
                title=f"Location Drift: {event_name}",
                description=f"Reality check detected that {event_name} moved to {new_loc}. Related commitment may require relocation.",
                message=f"Your {event_name} location changed to {new_loc}. The related commitment to {commitment.action.lower()} may be affected.",
                reason=f"Reality Drift detected on physical location (now {new_loc}).",
                created_at=now,
                requires_approval=True,
                target_person=commitment.owner,
                confidence=commitment.confidence,
            )

        # 3. AT_RISK Status Check
        if commitment.status == CommitmentStatus.AT_RISK:
            at_risk_reason = (
                commitment.metadata.get("at_risk_reason")
                or impact.get("reason")
                or "Divergence detected in reality conditions"
            )
            return FollowUpProposal(
                proposal_id=f"prop-{uuid.uuid4().hex[:8]}",
                commitment_id=commitment.id,
                action_type="REVIEW_AT_RISK_COMMITMENT",
                title="Review At-Risk Commitment",
                description=f"Commitment '{commitment.action}' is flagged at risk: {at_risk_reason}",
                message=f"Commitment '{commitment.action}' is currently at risk: {at_risk_reason}.",
                reason=at_risk_reason,
                created_at=now,
                requires_approval=True,
                target_person=commitment.owner,
                confidence=commitment.confidence,
            )

        # 4. Active Commitment with Explicit Deadline
        if commitment.deadline:
            deadline_clean = commitment.deadline.strip()
            return FollowUpProposal(
                proposal_id=f"prop-{uuid.uuid4().hex[:8]}",
                commitment_id=commitment.id,
                action_type="SCHEDULE_REMINDER",
                title=f"Reminder: {commitment.action}",
                description=f"Schedule proactive reminder for upcoming deadline {deadline_clean}.",
                message=f"You have a pending commitment to {commitment.action.lower()} by {deadline_clean}.",
                reason=f"Upcoming scheduled deadline: {deadline_clean}",
                suggested_trigger_time=deadline_clean,
                created_at=now,
                requires_approval=True,
                target_person=commitment.owner,
                confidence=commitment.confidence,
            )

        # 5. Active Commitment without Deadline (Missing Deadline: DO NOT INVENT ONE)
        return FollowUpProposal(
            proposal_id=f"prop-{uuid.uuid4().hex[:8]}",
            commitment_id=commitment.id,
            action_type="SCHEDULE_REMINDER",
            title=f"Follow-up: {commitment.action}",
            description="Open commitment with no target deadline specified.",
            message=f"You have an open commitment to {commitment.action.lower()}.",
            reason="Open commitment without specified target deadline.",
            created_at=now,
            requires_approval=True,
            target_person=commitment.owner,
            confidence=commitment.confidence,
        )


# Default singleton instance
commitment_followup_service = CommitmentFollowUpService()
