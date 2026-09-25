from dataclasses import dataclass

from supabase import (
    Client,
    create_client,
)

from app.core.config import settings


class SupabaseStorageError(RuntimeError):
    """Raised when Supabase Storage is unavailable."""


@dataclass(frozen=True)
class StorageConnectionResult:
    connected: bool
    provider: str
    bucket: str
    bucket_found: bool
    bucket_private: bool | None

    def to_dict(self) -> dict:
        return {
            "connected": self.connected,
            "provider": self.provider,
            "bucket": self.bucket,
            "bucket_found": self.bucket_found,
            "bucket_private": self.bucket_private,
        }


class SupabaseStorageService:

    def __init__(self) -> None:
        self._client: Client | None = None

    def _validate_configuration(self) -> None:

        if not settings.object_storage_enabled:
            raise SupabaseStorageError(
                "Object storage is disabled."
            )

        if (
            settings.object_storage_provider.lower()
            != "supabase"
        ):
            raise SupabaseStorageError(
                "Object storage provider is not Supabase."
            )

        if not settings.supabase_url:
            raise SupabaseStorageError(
                "SUPABASE_URL is missing."
            )

        if not settings.supabase_url.startswith(
            "https://"
        ):
            raise SupabaseStorageError(
                "SUPABASE_URL must use HTTPS."
            )

        if settings.supabase_url.rstrip("/").endswith(
            "/rest/v1"
        ):
            raise SupabaseStorageError(
                "SUPABASE_URL must be the base project "
                "URL without /rest/v1."
            )

        if not settings.supabase_secret_key:
            raise SupabaseStorageError(
                "SUPABASE_SECRET_KEY is missing."
            )

        if not settings.supabase_storage_bucket:
            raise SupabaseStorageError(
                "SUPABASE_STORAGE_BUCKET is missing."
            )

    def get_client(self) -> Client:

        self._validate_configuration()

        if self._client is None:

            try:
                self._client = create_client(
                    settings.supabase_url,
                    settings.supabase_secret_key,
                )

            except Exception as error:
                raise SupabaseStorageError(
                    "Failed to create the Supabase client."
                ) from error

        return self._client

    def test_connection(
        self,
    ) -> StorageConnectionResult:

        client = self.get_client()

        try:
            buckets = client.storage.list_buckets()

        except Exception as error:
            raise SupabaseStorageError(
                "Could not connect to Supabase Storage. "
                "Check the project URL and secret key."
            ) from error

        expected_bucket = (
            settings.supabase_storage_bucket
        )

        matching_bucket = next(
            (
                bucket
                for bucket in buckets
                if getattr(bucket, "name", None)
                == expected_bucket
            ),
            None,
        )

        if matching_bucket is None:
            raise SupabaseStorageError(
                "Supabase connection succeeded, but bucket "
                f"'{expected_bucket}' was not found."
            )

        public_value = getattr(
            matching_bucket,
            "public",
            None,
        )

        bucket_private = (
            not public_value
            if isinstance(public_value, bool)
            else None
        )

        if bucket_private is False:
            raise SupabaseStorageError(
                f"Bucket '{expected_bucket}' is public. "
                "Change it to private before continuing."
            )

        return StorageConnectionResult(
            connected=True,
            provider="supabase",
            bucket=expected_bucket,
            bucket_found=True,
            bucket_private=bucket_private,
        )


supabase_storage_service = (
    SupabaseStorageService()
)