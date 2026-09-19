import logging
import sys
from app.core.config import settings
from app.core.request_context import get_request_id


class RequestIdFilter(logging.Filter):
    """Injects current request ID into log records."""
    def filter(self, record):
        record.request_id = get_request_id()
        return True


def setup_logging():
    """Configure structured logging for NIA FastAPI backend."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    log_format = (
        "%(asctime)s [%(levelname)s] [%(name)s] [req_id=%(request_id)s] %(message)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestIdFilter())
    handler.setFormatter(logging.Formatter(log_format))

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("nia")
