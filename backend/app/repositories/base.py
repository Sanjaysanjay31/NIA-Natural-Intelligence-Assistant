from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """Abstract base class defining standard repository operations."""

    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """Retrieve entity by its unique ID."""
        pass

    @abstractmethod
    async def list_all(self) -> List[T]:
        """List all entities."""
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create and persist a new entity."""
        pass

    @abstractmethod
    async def update(self, entity_id: str, entity: T) -> Optional[T]:
        """Update an existing entity."""
        pass

    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """Delete an entity by ID."""
        pass
