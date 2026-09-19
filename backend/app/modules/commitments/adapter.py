from typing import List, Optional
from app.modules.commitments.schemas import Commitment, CommitmentStatus
from app.modules.commitments.repository import (
    BaseCommitmentRepository,
    commitment_repository,
    CommitmentNotFoundException,
)


class CommitmentRealityAdapter:
    """Isolated integration adapter connecting the Commitment Intelligence module
    to Sanjay's VEYRA X Reality Graph and Drift Engine.
    
    Adheres strictly to the ownership boundary:
    - Bhupathi module provides structured commitment lookup and metadata.
    - Sanjay/VEYRA X determines reality drift, downstream impact, and verification.
    - No external graph database dependencies are required.
    """

    def __init__(self, repository: Optional[BaseCommitmentRepository] = None):
        self.repository = repository or commitment_repository

    async def get_commitments_for_entity(self, entity_id: str) -> List[Commitment]:
        """Finds all commitments matching an entity ID across events, locations, or metadata tags."""
        cleaned = entity_id.strip()
        if not cleaned:
            return []

        all_commitments = await self.repository.list()
        matches: List[Commitment] = []

        for cmt in all_commitments:
            # Check direct event link
            if cmt.related_event_id and cmt.related_event_id.lower() == cleaned.lower():
                matches.append(cmt)
                continue
            # Check location link
            if cmt.related_location and cmt.related_location.lower() == cleaned.lower():
                matches.append(cmt)
                continue
            # Check metadata tags
            meta = cmt.metadata or {}
            if meta.get("entity_id", "").lower() == cleaned.lower():
                matches.append(cmt)
                continue
            if meta.get("reality_node_id", "").lower() == cleaned.lower():
                matches.append(cmt)
                continue
            if meta.get("entity", "").lower() == cleaned.lower():
                matches.append(cmt)
                continue

        return matches

    async def get_commitments_for_event(self, event_id: str) -> List[Commitment]:
        """Finds all commitments associated with a calendar or digital state event."""
        cleaned = event_id.strip()
        if not cleaned:
            return []
        return await self.repository.list(related_event_id=cleaned)

    async def get_commitments_for_location(self, location: str) -> List[Commitment]:
        """Finds all commitments associated with a specific physical location."""
        cleaned = location.strip()
        if not cleaned:
            return []
        return await self.repository.list(related_location=cleaned)

    async def link_commitment_to_event(self, commitment_id: str, event_id: str) -> Commitment:
        """Links an existing commitment to an event."""
        return await self.repository.link_to_event(commitment_id, event_id)

    async def link_commitment_to_location(self, commitment_id: str, location: str) -> Commitment:
        """Links an existing commitment to a physical location."""
        return await self.repository.link_to_location(commitment_id, location)

    async def mark_at_risk(self, commitment_id: str, reason: str) -> Commitment:
        """Flags a commitment as AT_RISK when VEYRA X detects reality drift on a related entity."""
        return await self.repository.mark_at_risk(commitment_id, reason=reason)

    # CamelCase parity aliases for cross-layer consistency
    getCommitmentsForEntity = get_commitments_for_entity
    getCommitmentsForEvent = get_commitments_for_event
    getCommitmentsForLocation = get_commitments_for_location
    linkCommitmentToEvent = link_commitment_to_event
    linkCommitmentToLocation = link_commitment_to_location
    markAtRisk = mark_at_risk


# Default singleton adapter instance
commitment_reality_adapter = CommitmentRealityAdapter()
