from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: str = "development"
    debug: bool = False

    # Database — SQLite locally, Render Postgres in production
    database_url: str = "sqlite:///./mediguardian.db"

    # Auth
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # CORS — comma-separated origins (Vercel URL + localhost)
    cors_origins: str = "*"

    # Microservice URLs (used only when running gateway mode via docker-compose)
    symptom_service_url: str = "http://localhost:8001"
    auth_service_url: str = "http://localhost:8002"
    history_service_url: str = "http://localhost:8003"
    report_service_url: str = "http://localhost:8004"
    hospital_service_url: str = "http://localhost:8005"
    chatbot_service_url: str = "http://localhost:8006"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql+psycopg://", 1)
        elif value.startswith("postgresql://") and "+psycopg" not in value:
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
