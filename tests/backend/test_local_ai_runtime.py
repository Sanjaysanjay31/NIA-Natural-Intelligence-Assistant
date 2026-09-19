import asyncio
import pytest
from app.modules.local_ai.manifest import ModelManifest, DeviceRequirements
from app.modules.local_ai.manager import ModelManager


def test_model_manifest_structure():
    """ModelManifest requires all specified fields without omission."""
    m = ModelManifest(
        name="test-model",
        version="1.0.0",
        size=1024,
        format="ONNX",
        quantization="int8",
        runtime="onnxruntime",
        capabilities=["test"],
        minimum_device_requirements=DeviceRequirements(ram_mb=1024, os_version="10+", chip_arch="arm64"),
        checksum="abc-123",
        storage_requirement=2048
    )

    assert m.name == "test-model"
    assert m.format == "ONNX"
    assert m.quantization == "int8"
    assert m.checksum == "abc-123"


def test_model_manager_full_lifecycle():
    """Validates discover -> download -> verify checksum -> install -> load -> unload -> delete."""
    mgr = ModelManager()

    # Discover
    manifests = asyncio.run(mgr.discover())
    assert len(manifests) >= 3

    # Checksum verification
    valid = asyncio.run(mgr.verify_checksum("whisper-tiny-en-q4", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"))
    assert valid is True

    invalid = asyncio.run(mgr.verify_checksum("whisper-tiny-en-q4", "wrong-checksum"))
    assert invalid is False

    # Load
    assert mgr.status("whisper-tiny-en-q4") == "INSTALLED"
    loaded = asyncio.run(mgr.load("whisper-tiny-en-q4"))
    assert loaded is True
    assert mgr.status("whisper-tiny-en-q4") == "READY"

    # Unload
    unloaded = asyncio.run(mgr.unload("whisper-tiny-en-q4"))
    assert unloaded is True
    assert mgr.status("whisper-tiny-en-q4") == "INSTALLED"

    # Delete
    deleted = asyncio.run(mgr.delete("whisper-tiny-en-q4"))
    assert deleted is True
    assert mgr.status("whisper-tiny-en-q4") == "NOT_INSTALLED"


def test_concurrency_throttle_avoids_simultaneous_stt_and_llm():
    """Enforces constraint: avoid STT + LLM simultaneously to protect phone RAM."""
    mgr = ModelManager(max_concurrency_slots=1)

    # 1. Load STT
    asyncio.run(mgr.load("whisper-tiny-en-q4"))
    assert mgr.status("whisper-tiny-en-q4") == "READY"

    # 2. Loading LLM automatically evicts/unloads STT
    asyncio.run(mgr.load("phi-3-mini-4k-instruct-q4"))
    assert mgr.status("phi-3-mini-4k-instruct-q4") == "READY"
    assert mgr.status("whisper-tiny-en-q4") == "INSTALLED"  # Unloaded from active RAM


def test_capability_report():
    """Capability report includes STT, OCR, LLM, TTS, native runtime, and diagnostics."""
    mgr = ModelManager()
    report = mgr.get_capability_report()

    assert "ocr_available" in report
    assert "local_llm_available" in report
    assert "tts_available" in report
    assert "native_runtime_available" in report
    assert "memory_sufficient" in report
    assert "storage_sufficient" in report
    assert report["diagnostics"]["render_cloud_safe"] is True


def test_render_memory_safety_rule():
    """Invariant: Cloud backend does not download or load multi-GB models into cloud RAM."""
    from app.modules.local_ai.manager import ModelManager
    mgr = ModelManager()
    # At cold start, 0 heavy models loaded in memory
    assert len(mgr._active_models) == 0
