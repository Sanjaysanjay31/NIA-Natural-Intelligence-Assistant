from typing import List, Optional
from app.modules.commitments.schemas import (
    Commitment,
    CommitmentStatus,
    CommitmentUpdate,
    CommitmentExtractionRequest,
    CommitmentExtractionResponse,
)
from app.modules.commitments.extractor import CommitmentExtractor
from app.modules.commitments.repository import (
    BaseCommitmentRepository,
    commitment_repository,
)


class CommitmentService:
    """Business logic service orchestrating commitment extraction, lifecycle, and persistence."""

    def __init__(
        self,
        repository: Optional[BaseCommitmentRepository] = None,
        extractor: Optional[CommitmentExtractor] = None,
    ):
        self.repository = repository or commitment_repository
        self.extractor = extractor or CommitmentExtractor()

    def extract_commitments(self, request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
        """Extracts structured commitments deterministically from transcript text."""
        return self.extractor.extract(request)

    async def create_commitment(self, commitment: Commitment) -> Commitment:
        """Creates and stores a new structured commitment."""
        return await self.repository.create(commitment)

    async def get_commitment(self, commitment_id: str) -> Optional[Commitment]:
        """Retrieves a commitment by ID."""
        return await self.repository.get(commitment_id)

    async def list_commitments(
        self,
        owner: Optional[str] = None,
        status: Optional[CommitmentStatus] = None,
        related_event_id: Optional[str] = None,
        related_location: Optional[str] = None,
    ) -> List[Commitment]:
        """Lists commitments matching query parameters."""
        return await self.repository.list(
            owner=owner,
            status=status,
            related_event_id=related_event_id,
            related_location=related_location,
        )

    async def update_commitment(self, commitment_id: str, update_data: CommitmentUpdate) -> Commitment:
        """Updates mutable attributes of an existing commitment."""
        return await self.repository.update(commitment_id, update_data)

    async def update_status(self, commitment_id: str, new_status: CommitmentStatus) -> Commitment:
        """Transitions commitment to a new status with validation."""
        return await self.repository.update_status(commitment_id, new_status)

    async def link_commitment(
        self,
        commitment_id: str,
        related_event_id: Optional[str] = None,
        related_location: Optional[str] = None,
    ) -> Commitment:
        """Associates a commitment with an event or physical location."""
        current = await self.repository.get(commitment_id)
        if not current:
            return await self.repository.link_to_event(commitment_id, related_event_id or "")  # Will raise NotFound

        res = current
        if related_event_id is not None:
            res = await self.repository.link_to_event(commitment_id, related_event_id)
        if related_location is not None:
            res = await self.repository.link_to_location(commitment_id, related_location)
        return res

    async def delete_commitment(self, commitment_id: str) -> bool:
        """Deletes a commitment by ID."""
        return await self.repository.delete(commitment_id)


# Default singleton instance
commitment_service = CommitmentService()
