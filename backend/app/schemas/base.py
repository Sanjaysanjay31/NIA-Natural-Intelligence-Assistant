from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class NIABaseModel(BaseModel):
    """Base model for all NIA domain schemas with standard configuration."""
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
        extra="forbid"
    )


class HealthResponse(NIABaseModel):
    status: str
    appName: str
    version: str
    environment: str
    timestamp: datetime
