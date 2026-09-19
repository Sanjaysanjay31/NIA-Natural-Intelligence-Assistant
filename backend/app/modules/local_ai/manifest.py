from typing import List, Dict, Any, Optional
from pydantic import Field
from app.schemas.base import NIABaseModel


class DeviceRequirements(NIABaseModel):
    ram_mb: int
    os_version: str
    chip_arch: str


class ModelManifest(NIABaseModel):
    """
    Metadata specification for on-device mobile AI models.
    Invariant: Models live on phone only; no weights loaded on Render.
    """
    name: str
    version: str
    size: int  # bytes
    format: str  # GGUF, ONNX, EXECUTORCH, TFLITE
    quantization: str  # q4_k_m, int8, fp16
    runtime: str  # onnxruntime, executorch, sherpa, system_tts
    capabilities: List[str] = Field(default_factory=list)
    minimum_device_requirements: DeviceRequirements
    checksum: str  # SHA-256
    storage_requirement: int  # bytes
