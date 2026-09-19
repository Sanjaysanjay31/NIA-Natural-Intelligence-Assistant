from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Core application settings for NIA backend."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "NIA (Natural Intelligence Assistant)"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"
    
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:8081",  # Expo Metro Bundler
        "http://localhost:19006", # Expo Web
        "http://localhost:3000",
        "*"
    ]

    # Safety Gate Flags
    SAFE_ACTION_AUTO_APPROVE: bool = False
    DEBUG_SIMULATION_MODE: bool = True


settings = Settings()
