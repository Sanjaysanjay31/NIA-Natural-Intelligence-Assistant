from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.core.request_context import get_request_id
from app.core.logging import logger


class NIABaseException(Exception):
    """Base domain exception for NIA application."""
    def __init__(
        self,
        message: str,
        code: str = "NIA_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class EntityNotFoundException(NIABaseException):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(
            message=f"{entity_name} with ID '{entity_id}' not found.",
            code="ENTITY_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"entity": entity_name, "id": entity_id}
        )


class DriftConflictException(NIABaseException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="DRIFT_CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class ActionSafetyViolationException(NIABaseException):
    def __init__(self, message: str = "Action violates Safe Action Gate policy."):
        super().__init__(
            message=message,
            code="ACTION_SAFETY_VIOLATION",
            status_code=status.HTTP_403_FORBIDDEN
        )


def format_error_response(
    message: str,
    code: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    req_id = get_request_id()
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
        "requestId": req_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return JSONResponse(status_code=status_code, content=payload)


async def nia_exception_handler(request: Request, exc: NIABaseException) -> JSONResponse:
    logger.warning(f"Domain exception: {exc.code} - {exc.message}")
    return format_error_response(
        message=exc.message,
        code=exc.code,
        status_code=exc.status_code,
        details=exc.details
    )


async def validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    logger.warning(f"Validation error: {exc.errors()}")
    return format_error_response(
        message="Invalid request payload structure.",
        code="VALIDATION_ERROR",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"errors": exc.errors()}
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled server error: {exc}")
    return format_error_response(
        message="An internal reality engine error occurred.",
        code="INTERNAL_SERVER_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
