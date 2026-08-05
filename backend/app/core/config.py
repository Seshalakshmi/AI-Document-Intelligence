from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Document Intelligence"
    app_env: str = "development"

    database_url: str
    upload_dir: str = "uploads"

    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    secret_key: str = "insecure-dev-key-override-in-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    openai_api_key: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_host: str = "https://cloud.langfuse.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

import os
if settings.openai_api_key:
    os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
if settings.langfuse_public_key:
    os.environ.setdefault("LANGFUSE_PUBLIC_KEY", settings.langfuse_public_key)
if settings.langfuse_secret_key:
    os.environ.setdefault("LANGFUSE_SECRET_KEY", settings.langfuse_secret_key)
os.environ.setdefault("LANGFUSE_HOST", settings.langfuse_host)