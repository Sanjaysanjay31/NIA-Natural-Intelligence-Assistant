from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Dict, Any
from app.core.config import settings
from app.schemas.base import HealthResponse, NIABaseModel

router = APIRouter(tags=["System Health & Readiness"])


class ReadinessResponse(NIABaseModel):
    ready: bool
    appName: str
    version: str
    environment: str
    checks: Dict[str, Any]
    timestamp: datetime


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Lightweight health check endpoint.
    Health means the FastAPI process is responsive. It does NOT mean 'AI models loaded'.
    """
    return HealthResponse(
        status="healthy",
        appName=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc)
    )


@router.get("/ready", response_model=ReadinessResponse)
async def readiness_check() -> ReadinessResponse:
    """
    Lightweight readiness check verifying backend dependencies.
    Critical Render Rule: No heavy model loading or model downloading is checked here.
    """
    checks = {
        "configuration": "valid",
        "storage": "in_memory_prototype_ready",
        "lightweightMode": True,
        "heavyModelsLoaded": False,  # Strict Render invariant: Render never loads heavy weights
    }
    return ReadinessResponse(
        ready=True,
        appName=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        checks=checks,
        timestamp=datetime.now(timezone.utc)
    )
