from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import Field
from .base import NIABaseModel
from .enums import IntentSource, IntentType, AgentState, WakeUpSource


class Intent(NIABaseModel):
    """Structured user intention extracted from multi-modal inputs."""
    name: IntentType
    confidence: float = Field(ge=0.0, le=1.0)
    source: IntentSource
    raw_input: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)


class WakeUpEvent(NIABaseModel):
    """Wake-up activation event ingested by WakeUpOrchestrator."""
    source: WakeUpSource = WakeUpSource.ORB
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    capabilities: Dict[str, Any] = Field(default_factory=dict)
    # Backward compatibility aliases
    event_id: Optional[str] = None
    trigger_type: Optional[IntentSource] = None


class Session(NIABaseModel):
    """Active conversational and reality-checking session."""
    session_id: str
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    active_state: AgentState = AgentState.IDLE
    context: Dict[str, Any] = Field(default_factory=dict)
