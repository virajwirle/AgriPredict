from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import (
    UTC,
    datetime,
)
from io import BytesIO

from PIL import (
    Image,
    ImageOps,
)

from app.core.config import settings
from app.services.supabase_storage import (
    SupabaseStorageError,
    supabase_storage_service,
)


class ImageStorageError(RuntimeError):
    """Raised when an image storage operation fails."""


@dataclass(frozen=True)
class OptimizedImage:
    data: bytes
    width: int
    height: int
    size_bytes: int
    content_type: str = "image/jpeg"
    extension: str = "jpg"


@dataclass(frozen=True)
class StoredImage:
    object_key: str
    width: int
    height: int
    size_bytes: int
    content_type: str
    signed_url: str | None = None

    def to_dict(self) -> dict:
        return {
            "object_key": self.object_key,
            "width": self.width,
            "height": self.height,
            "size_bytes": self.size_bytes,
            "content_type": self.content_type,
            "signed_url": self.signed_url,
        }


class ImageStorageService:

    @staticmethod
    def optimize_image(
        image: Image.Image,
    ) -> OptimizedImage:

        if image is None:
            raise ImageStorageError(
                "Cannot optimize an empty image."
            )

        try:
            processed = ImageOps.exif_transpose(
                image
            )

            if processed.mode in (
                "RGBA",
                "LA",
            ):
                background = Image.new(
                    "RGB",
                    processed.size,
                    color=(255, 255, 255),
                )

                alpha = processed.getchannel(
                    "A"
                )

                background.paste(
                    processed.convert("RGB"),
                    mask=alpha,
                )

                processed = background

            elif processed.mode != "RGB":
                processed = processed.convert(
                    "RGB"
                )

            processed.thumbnail(
                (
                    settings
                    .saved_image_max_dimension,
                    settings
                    .saved_image_max_dimension,
                ),
                Image.Resampling.LANCZOS,
            )

            output = BytesIO()

            processed.save(
                output,
                format="JPEG",
                quality=(
                    settings
                    .saved_image_jpeg_quality
                ),
                optimize=True,
                progressive=True,
            )

            image_bytes = output.getvalue()

            return OptimizedImage(
                data=image_bytes,
                width=processed.width,
                height=processed.height,
                size_bytes=len(image_bytes),
            )

        except ImageStorageError:
            raise

        except Exception as error:
            raise ImageStorageError(
                "Image optimization failed."
            ) from error

    @staticmethod
    def build_object_key(
        request_id: str,
        crop: str,
    ) -> str:

        safe_request_id = re.sub(
            r"[^a-zA-Z0-9-]",
            "",
            request_id,
        )

        safe_crop = re.sub(
            r"[^a-z0-9-]",
            "",
            crop.strip().lower(),
        )

        if not safe_request_id:
            raise ImageStorageError(
                "A valid request ID is required."
            )

        if not safe_crop:
            raise ImageStorageError(
                "A valid crop is required."
            )

        now = datetime.now(UTC)

        return (
            f"predictions/{safe_crop}/"
            f"{now:%Y}/{now:%m}/"
            f"{safe_request_id}.jpg"
        )

    def upload_prediction_image(
        self,
        *,
        image: Image.Image,
        request_id: str,
        crop: str,
        include_signed_url: bool = False,
    ) -> StoredImage:

        optimized = self.optimize_image(
            image
        )

        object_key = self.build_object_key(
            request_id=request_id,
            crop=crop,
        )

        try:
            client = (
                supabase_storage_service
                .get_client()
            )

            bucket = client.storage.from_(
                settings.supabase_storage_bucket
            )

            bucket.upload(
                path=object_key,
                file=optimized.data,
                file_options={
                    "content-type":
                        optimized.content_type,
                    "upsert": "false",
                    "cache-control": "3600",
                },
            )

            signed_url = None

            if include_signed_url:
                signed_url = (
                    self.create_signed_url(
                        object_key
                    )
                )

            return StoredImage(
                object_key=object_key,
                width=optimized.width,
                height=optimized.height,
                size_bytes=(
                    optimized.size_bytes
                ),
                content_type=(
                    optimized.content_type
                ),
                signed_url=signed_url,
            )

        except SupabaseStorageError:
            raise

        except Exception as error:
            raise ImageStorageError(
                "Failed to upload the optimized "
                "image to Supabase Storage."
            ) from error

    def create_signed_url(
        self,
        object_key: str,
    ) -> str:

        try:
            client = (
                supabase_storage_service
                .get_client()
            )

            response = (
                client.storage
                .from_(
                    settings
                    .supabase_storage_bucket
                )
                .create_signed_url(
                    object_key,
                    settings
                    .signed_url_expiry_seconds,
                )
            )

            if isinstance(response, dict):
                signed_url = (
                    response.get("signedURL")
                    or response.get("signedUrl")
                    or response.get(
                        "signed_url"
                    )
                )
            else:
                signed_url = getattr(
                    response,
                    "signed_url",
                    None,
                )

            if not signed_url:
                raise ImageStorageError(
                    "Supabase did not return a "
                    "signed URL."
                )

            return str(signed_url)

        except ImageStorageError:
            raise

        except Exception as error:
            raise ImageStorageError(
                "Failed to create a signed image URL."
            ) from error

    def delete_image(
        self,
        object_key: str,
    ) -> None:

        if not object_key:
            raise ImageStorageError(
                "An object key is required."
            )

        try:
            client = (
                supabase_storage_service
                .get_client()
            )

            (
                client.storage
                .from_(
                    settings
                    .supabase_storage_bucket
                )
                .remove([object_key])
            )

        except Exception as error:
            raise ImageStorageError(
                "Failed to delete the stored image."
            ) from error


image_storage_service = ImageStorageService()