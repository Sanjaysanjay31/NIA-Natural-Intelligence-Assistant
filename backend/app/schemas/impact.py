from typing import Optional, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import ImpactSeverity


class ImpactItem(NIABaseModel):
    """Downstream entity impacted by detected reality drift."""
    impact_id: str
    target_type: str = Field(description="Type of affected entity: reminder, alarm, calendar, commitment")
    target_id: str = Field(description="Unique ID of the affected entity")
    description: str = Field(description="Explanation of why this entity is affected")
    severity: ImpactSeverity = ImpactSeverity.MEDIUM
    suggested_remediation: Optional[str] = Field(default=None, description="Recommended adjustment")
    metadata: Dict[str, Any] = Field(default_factory=dict)
