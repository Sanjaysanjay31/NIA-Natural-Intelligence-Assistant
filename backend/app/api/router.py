from fastapi import APIRouter
from datetime import datetime, timezone
from app.schemas.base import HealthResponse
from app.core.config import settings

api_router = APIRouter(prefix=settings.API_V1_STR)


@api_router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """System health check endpoint verifying NIA backend readiness."""
    return HealthResponse(
        status="healthy",
        appName=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc)
    )

# Note: Sub-routers for VEYRA X, Evidence, Actions, Timeline, and Bhupathi's Commitments
# will be mounted here in subsequent prompts as shared contracts and services are implemented.
