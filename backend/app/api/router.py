from fastapi import APIRouter
from app.core.config import settings
from app.api.health import router as health_router
from app.api.reality import router as reality_router
from app.api.actions import router as actions_router
from app.api.timeline import router as timeline_router
from app.api.digital_state import router as digital_state_router
from app.api.office_kit import router as office_kit_router
from app.api.settings import router as settings_router

api_router = APIRouter(prefix=settings.API_V1_STR)

# Mount system health and readiness router
api_router.include_router(health_router)

# Mount VEYRA X Reality Intelligence router
api_router.include_router(reality_router)

# Mount Safe Action Gate router
api_router.include_router(actions_router)

# Mount Reality Timeline router
api_router.include_router(timeline_router)

# Mount Digital State Ground Truth router
api_router.include_router(digital_state_router)

# Mount Office Kit Reality Audit router
api_router.include_router(office_kit_router)

# Mount Settings & Diagnostics router
api_router.include_router(settings_router)
