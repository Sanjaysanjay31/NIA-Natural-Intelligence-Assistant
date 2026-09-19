from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import datetime, timezone
from typing import Optional, Generic, TypeVar

T = TypeVar("T")


class NIABaseModel(BaseModel):
    """Base model for all NIA domain schemas with camelCase serialization and strict validation."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        str_strip_whitespace=True,
        extra="forbid",
        from_attributes=True
    )


class HealthResponse(NIABaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    timestamp: datetime


class NIAResponse(NIABaseModel, Generic[T]):
    """Standardized API response wrapper ensuring consistent envelope structure."""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: datetime = datetime.now(timezone.utc)
