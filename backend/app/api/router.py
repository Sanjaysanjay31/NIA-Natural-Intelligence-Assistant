from fastapi import APIRouter
from app.core.config import settings
from app.api.health import router as health_router
from app.api.reality import router as reality_router

api_router = APIRouter(prefix=settings.API_V1_STR)

# Mount system health and readiness router
api_router.include_router(health_router)

# Mount VEYRA X Reality Intelligence router
api_router.include_router(reality_router)
