from fastapi import APIRouter, Body
from typing import Dict, Any
from app.modules.settings.manager import settings_manager
from app.modules.settings.models import SettingsState, DiagnosticsInfo

router = APIRouter(prefix="/settings", tags=["Settings & Diagnostics"])


@router.get("", response_model=SettingsState)
async def get_settings() -> SettingsState:
    """Retrieve current system settings."""
    return settings_manager.get_current_settings()


@router.post("", response_model=SettingsState)
async def update_settings(updates: Dict[str, Any] = Body(...)) -> SettingsState:
    """Update settings with schema validation."""
    return settings_manager.update_settings(updates)


@router.get("/diagnostics", response_model=DiagnosticsInfo)
async def get_diagnostics() -> DiagnosticsInfo:
    """Retrieve system diagnostics without exposing any secret keys or credentials."""
    return settings_manager.get_diagnostics()


@router.post("/delete-evidence")
async def delete_evidence_cache() -> Dict[str, Any]:
    """Purge local evidence cache for user privacy."""
    return settings_manager.delete_evidence_cache()
