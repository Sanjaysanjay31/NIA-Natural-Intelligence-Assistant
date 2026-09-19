import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.modules.settings.manager import SettingsManager

client = TestClient(app)


def test_settings_default_invariants():
    manager = SettingsManager()
    settings = manager.get_default_settings()

    # Invariant: Version is tracked
    assert settings.version == 1

    # Invariant: Privacy defaults are strictly local and zero-cloud
    assert settings.privacy.local_processing_only is True
    assert settings.privacy.cloud_upload_policy == "NEVER"
    assert settings.privacy.evidence_retention_days == 30

    # Invariant: Accessibility service is NEVER silently enabled
    assert settings.permissions.accessibility_service is False

    # Invariant: Local AI is available
    assert settings.ai_and_models.local_ai_available is True


def test_diagnostics_zero_secrets():
    manager = SettingsManager()
    diag = manager.get_diagnostics()

    # Verify diagnostic fields exist
    assert diag.app_version == "0.1.0-alpha"
    assert diag.demo_mode is True
    assert diag.backend_target == "local_lan"

    # Invariant: Zero secrets or tokens exposed in serialization
    serialized = diag.model_dump()
    forbidden_keys = ["secret", "api_key", "password", "token", "auth"]
    for key, val in serialized.items():
        assert not any(fk in key.lower() for fk in forbidden_keys)
        assert not any(fk in str(val).lower() for fk in forbidden_keys)


def test_settings_version_migration():
    manager = SettingsManager()

    # Legacy v0 state missing accessibility and privacy additions
    legacy_payload = {
        "version": 0,
        "ai_and_models": {"local_ai_available": True, "model_storage_mb": 1500},
        "permissions": {"microphone": True},
    }

    migrated = manager.migrate_settings(legacy_payload)
    assert migrated.version == 1
    assert migrated.privacy.local_processing_only is True
    assert migrated.accessibility.visual_captions is True
    assert migrated.ai_and_models.model_storage_mb == 1500


def test_delete_evidence_cache():
    manager = SettingsManager()
    res = manager.delete_evidence_cache()
    assert res["status"] == "success"
    assert res["deleted_count"] > 0
    assert "local_storage_freed_mb" in res


def test_settings_api_endpoints():
    # 1. GET /api/v1/settings
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    data = res.json()
    assert data["version"] == 1
    assert data["privacy"]["cloud_upload_policy"] == "NEVER"

    # 2. GET /api/v1/settings/diagnostics
    diag_res = client.get("/api/v1/settings/diagnostics")
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert "backend_target" in diag_data

    # 3. POST /api/v1/settings/delete-evidence
    del_res = client.post("/api/v1/settings/delete-evidence")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"
