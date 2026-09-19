from pydantic import BaseModel, Field
from typing import Literal, Optional


class AIAndModelsSettings(BaseModel):
    local_ai_available: bool = True
    model_storage_mb: int = 2240
    allow_cloud_fallback: bool = False


class WakeUpSettings(BaseModel):
    hey_nia_hotword: bool = False
    orb_tap_enabled: bool = True
    mind_pulse_enabled: bool = True
    native_sensitivity: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"


class PermissionsSettings(BaseModel):
    microphone: bool = True
    camera: bool = True
    calendar: bool = True
    notifications: bool = True
    accessibility_service: bool = False  # NEVER silently enabled!


class PrivacySettings(BaseModel):
    local_processing_only: bool = True  # Invariant: on-device local execution
    evidence_retention_days: int = 30
    cloud_upload_policy: Literal["NEVER", "ON_EXPLICIT_APPROVAL"] = "NEVER"
    recording_consent: bool = False


class AccessibilitySettings(BaseModel):
    talk_back_labels: bool = True
    large_controls: bool = False
    reduced_motion: bool = False
    haptics_enabled: bool = True
    visual_captions: bool = True


class DiagnosticsInfo(BaseModel):
    backend_target: str = "local_lan"
    native_capability_status: str = "Expo Go Sandbox (Demo Mode)"
    ai_provider: str = "On-Device Deterministic VEYRA X + ML Kit"
    model_status: str = "Whisper Tiny & MLKit Active"
    app_version: str = "0.1.0-alpha"
    demo_mode: bool = True
    # Invariant: No secrets or credentials exposed!


class SettingsState(BaseModel):
    version: int = 1
    last_updated: str
    ai_and_models: AIAndModelsSettings
    wake_up: WakeUpSettings
    permissions: PermissionsSettings
    privacy: PrivacySettings
    accessibility: AccessibilitySettings
    diagnostics: DiagnosticsInfo
