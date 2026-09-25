from functools import lru_cache
from pathlib import Path

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict
)


BACKEND_ROOT = Path(
    __file__
).resolve().parents[2]


class Settings(BaseSettings):

    app_name: str = (
        "Plant Disease Detection API"
    )

    app_version: str = "1.0.0"

    app_env: str = "development"

    debug: bool = True

    api_v1_prefix: str = "/api/v1"

    hf_repo_id: str = (
        "viraj1920/plant-disease-models"
    )

    hf_token: str | None = None

    model_cache_dir: str = "model_cache"

    model_device: str = "auto"

    model_preload: bool = False

    plant_validator_enabled: bool = False

    crop_validator_enabled: bool = False

    max_upload_size_mb: int = 10

    object_storage_provider: str = "supabase"

    object_storage_enabled: bool = False

    supabase_url: str | None = None

    supabase_secret_key: str | None = None

    supabase_storage_bucket: str = (
        "plant-disease-images"
    )

    mistral_api_key: str | None = None

    mistral_model: str = "mistral-small-latest"

    mistral_enabled: bool = True

    mistral_timeout_seconds: int = 30

    jwt_secret_key: str

    jwt_algorithm: str = "HS256"

    jwt_access_token_expire_minutes: int =  1440

    signed_url_expiry_seconds: int = 900

    max_saved_images_per_user: int = 50

    image_retention_days: int = 90

    saved_image_max_dimension: int = 1600

    saved_image_jpeg_quality: int = 85

    allowed_image_types: str = (
        "image/jpeg,image/png,image/webp"
    )

    cors_origins: str = (
        "http://localhost:5173"
    )

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def model_cache_path(self) -> Path:

        configured_path = Path(
            self.model_cache_dir
        )

        if configured_path.is_absolute():
            return configured_path

        return (
            BACKEND_ROOT /
            configured_path
        ).resolve()

    @property
    def allowed_content_types(
        self
    ) -> set[str]:

        return {
            item.strip()
            for item in
            self.allowed_image_types.split(",")
            if item.strip()
        }

    @property
    def cors_origin_list(
        self
    ) -> list[str]:

        return [
            item.strip()
            for item in
            self.cors_origins.split(",")
            if item.strip()
        ]


@lru_cache
def get_settings() -> Settings:

    return Settings()


settings = get_settings()