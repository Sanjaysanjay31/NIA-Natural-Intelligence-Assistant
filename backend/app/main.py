from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import ValidationError
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.request_context import RequestContextMiddleware
from app.core.errors import (
    NIABaseException,
    nia_exception_handler,
    validation_exception_handler,
    global_exception_handler,
)
from app.api.router import api_router
from app.api.health import router as root_health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown hooks."""
    # Startup
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} in {settings.APP_ENV} mode")
    logger.info("Critical Render rule active: No heavy model weights loaded.")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="NIA (Natural Intelligence Assistant) - Reality-Verified Personal Intelligence Layer",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Add Request Correlation ID Middleware
app.add_middleware(RequestContextMiddleware)

# 2. Add CORS Middleware for Expo & Mobile Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Add Custom Exception Handlers
app.add_exception_handler(NIABaseException, nia_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# 4. Mount API Routers
app.include_router(api_router)
app.include_router(root_health_router)  # Provides /health and /ready directly at root as well


@app.get("/", tags=["Root"])
async def root():
    """Root informative discovery endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "status": "online",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "ready": f"{settings.API_V1_STR}/ready"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
