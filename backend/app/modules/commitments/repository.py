from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from app.modules.commitments.schemas import (
    Commitment,
    CommitmentStatus,
    CommitmentUpdate,
)


class CommitmentRepositoryException(Exception):
    """Base exception for commitment repository errors."""
    pass


class CommitmentNotFoundException(CommitmentRepositoryException):
    """Raised when a requested commitment ID does not exist."""
    def __init__(self, commitment_id: str):
        super().__init__(f"Commitment with ID '{commitment_id}' not found.")
        self.commitment_id = commitment_id


class CommitmentAlreadyExistsException(CommitmentRepositoryException):
    """Raised when attempting to create a commitment with an existing ID."""
    def __init__(self, commitment_id: str):
        super().__init__(f"Commitment with ID '{commitment_id}' already exists.")
        self.commitment_id = commitment_id


class InvalidStatusTransitionException(CommitmentRepositoryException):
    """Raised when an invalid lifecycle status transition is requested."""
    def __init__(self, from_status: CommitmentStatus, to_status: CommitmentStatus):
        super().__init__(f"Invalid status transition from {from_status.value} to {to_status.value}.")
        self.from_status = from_status
        self.to_status = to_status


class BaseCommitmentRepository(ABC):
    """Abstract interface for commitment persistence and state management."""

    @abstractmethod
    async def create(self, commitment: Commitment) -> Commitment:
        """Persist a new commitment. Fails if ID already exists."""
        pass

    @abstractmethod
    async def get(self, commitment_id: str) -> Optional[Commitment]:
        """Retrieve a commitment by ID. Returns None if not found."""
        pass

    @abstractmethod
    async def list(
        self,
        owner: Optional[str] = None,
        status: Optional[CommitmentStatus] = None,
        related_event_id: Optional[str] = None,
        related_location: Optional[str] = None,
    ) -> List[Commitment]:
        """List commitments matching filter criteria in deterministic order."""
        pass

    @abstractmethod
    async def update(self, commitment_id: str, update_data: CommitmentUpdate) -> Commitment:
        """Apply partial updates to a commitment."""
        pass

    @abstractmethod
    async def update_status(self, commitment_id: str, new_status: CommitmentStatus) -> Commitment:
        """Safely transition commitment status with transition validation."""
        pass

    @abstractmethod
    async def delete(self, commitment_id: str) -> bool:
        """Delete a commitment by ID."""
        pass

    @abstractmethod
    async def link_to_event(self, commitment_id: str, event_id: str) -> Commitment:
        """Associate commitment with a calendar / digital state event."""
        pass

    @abstractmethod
    async def link_to_location(self, commitment_id: str, location: str) -> Commitment:
        """Associate commitment with a physical location."""
        pass

    @abstractmethod
    async def mark_at_risk(self, commitment_id: str, reason: Optional[str] = None) -> Commitment:
        """Mark a commitment as AT_RISK with an optional diagnostic reason."""
        pass


class InMemoryCommitmentRepository(BaseCommitmentRepository):
    """Lightweight in-memory storage implementation for isolated module operation."""

    # Explicit allowed lifecycle transitions
    ALLOWED_TRANSITIONS = {
        CommitmentStatus.PENDING: {
            CommitmentStatus.IN_PROGRESS,
            CommitmentStatus.COMPLETED,
            CommitmentStatus.CANCELLED,
            CommitmentStatus.AT_RISK,
        },
        CommitmentStatus.IN_PROGRESS: {
            CommitmentStatus.COMPLETED,
            CommitmentStatus.CANCELLED,
            CommitmentStatus.AT_RISK,
        },
        CommitmentStatus.AT_RISK: {
            CommitmentStatus.IN_PROGRESS,
            CommitmentStatus.COMPLETED,
            CommitmentStatus.CANCELLED,
        },
        CommitmentStatus.COMPLETED: set(),  # Terminal state
        CommitmentStatus.CANCELLED: set(),  # Terminal state
    }

    def __init__(self):
        self._storage: Dict[str, Commitment] = {}

    def clear(self):
        """Clears all stored commitments (useful in unit tests)."""
        self._storage.clear()

    async def create(self, commitment: Commitment) -> Commitment:
        if commitment.id in self._storage:
            raise CommitmentAlreadyExistsException(commitment.id)

        # Store a deep copy via model_validate(model_dump())
        stored = Commitment.model_validate(commitment.model_dump())
        self._storage[commitment.id] = stored
        return stored

    async def get(self, commitment_id: str) -> Optional[Commitment]:
        found = self._storage.get(commitment_id)
        if not found:
            return None
        return Commitment.model_validate(found.model_dump())

    async def list(
        self,
        owner: Optional[str] = None,
        status: Optional[CommitmentStatus] = None,
        related_event_id: Optional[str] = None,
        related_location: Optional[str] = None,
    ) -> List[Commitment]:
        results: List[Commitment] = []
        for cmt in self._storage.values():
            if owner and cmt.owner.lower() != owner.lower():
                continue
            if status and cmt.status != status:
                continue
            if related_event_id and cmt.related_event_id != related_event_id:
                continue
            if related_location and (not cmt.related_location or cmt.related_location.lower() != related_location.lower()):
                continue
            results.append(Commitment.model_validate(cmt.model_dump()))

        # Deterministic ordering: descending created_at, then ascending id
        results.sort(key=lambda c: (c.created_at, c.id), reverse=True)
        return results

    async def update(self, commitment_id: str, update_data: CommitmentUpdate) -> Commitment:
        target = self._storage.get(commitment_id)
        if not target:
            raise CommitmentNotFoundException(commitment_id)

        update_dict = update_data.model_dump(exclude_unset=True)

        # If status is being updated, validate transition
        if "status" in update_dict and update_dict["status"] is not None:
            new_status = update_dict["status"]
            self._validate_transition(target.status, new_status)

        current_data = target.model_dump()
        current_data.update(update_dict)
        current_data["updated_at"] = datetime.now(timezone.utc)

        updated_instance = Commitment.model_validate(current_data)
        self._storage[commitment_id] = updated_instance
        return updated_instance

    async def update_status(self, commitment_id: str, new_status: CommitmentStatus) -> Commitment:
        target = self._storage.get(commitment_id)
        if not target:
            raise CommitmentNotFoundException(commitment_id)

        self._validate_transition(target.status, new_status)
        current_data = target.model_dump()
        current_data["status"] = new_status
        current_data["updated_at"] = datetime.now(timezone.utc)

        updated_instance = Commitment.model_validate(current_data)
        self._storage[commitment_id] = updated_instance
        return updated_instance

    async def delete(self, commitment_id: str) -> bool:
        if commitment_id not in self._storage:
            raise CommitmentNotFoundException(commitment_id)
        del self._storage[commitment_id]
        return True

    async def link_to_event(self, commitment_id: str, event_id: str) -> Commitment:
        target = self._storage.get(commitment_id)
        if not target:
            raise CommitmentNotFoundException(commitment_id)

        current_data = target.model_dump()
        current_data["related_event_id"] = event_id
        current_data["updated_at"] = datetime.now(timezone.utc)

        updated_instance = Commitment.model_validate(current_data)
        self._storage[commitment_id] = updated_instance
        return updated_instance

    async def link_to_location(self, commitment_id: str, location: str) -> Commitment:
        target = self._storage.get(commitment_id)
        if not target:
            raise CommitmentNotFoundException(commitment_id)

        current_data = target.model_dump()
        current_data["related_location"] = location
        current_data["updated_at"] = datetime.now(timezone.utc)

        updated_instance = Commitment.model_validate(current_data)
        self._storage[commitment_id] = updated_instance
        return updated_instance

    async def mark_at_risk(self, commitment_id: str, reason: Optional[str] = None) -> Commitment:
        target = self._storage.get(commitment_id)
        if not target:
            raise CommitmentNotFoundException(commitment_id)

        self._validate_transition(target.status, CommitmentStatus.AT_RISK)
        current_data = target.model_dump()
        current_data["status"] = CommitmentStatus.AT_RISK
        current_data["updated_at"] = datetime.now(timezone.utc)
        if reason:
            metadata = dict(current_data.get("metadata", {}))
            metadata["at_risk_reason"] = reason
            metadata["at_risk_marked_at"] = datetime.now(timezone.utc).isoformat()
            current_data["metadata"] = metadata

        updated_instance = Commitment.model_validate(current_data)
        self._storage[commitment_id] = updated_instance
        return updated_instance

    def _validate_transition(self, from_status: CommitmentStatus, to_status: CommitmentStatus):
        if from_status == to_status:
            return  # No-op transition is always permissible
        allowed = self.ALLOWED_TRANSITIONS.get(from_status, set())
        if to_status not in allowed:
            raise InvalidStatusTransitionException(from_status, to_status)


# Default singleton instance for the module
commitment_repository = InMemoryCommitmentRepository()
