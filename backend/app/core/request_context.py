import uuid
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context variable to hold request correlation ID across async execution stack
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="system")


def get_request_id() -> str:
    """Retrieve active correlation/request ID."""
    return request_id_ctx.get()


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware that extracts or generates a unique correlation ID for every request,
    attaches it to contextvars, and injects it into response headers.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        req_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID")
        if not req_id:
            req_id = f"req-{uuid.uuid4().hex[:12]}"

        token = request_id_ctx.set(req_id)
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            return response
        finally:
            request_id_ctx.reset(token)
