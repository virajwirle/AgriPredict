from uuid import uuid4

from PIL import Image

from app.services.image_storage import (
    image_storage_service,
)


def main() -> None:

    request_id = f"storage-test-{uuid4()}"

    test_image = Image.new(
        mode="RGB",
        size=(2000, 1200),
        color=(72, 145, 78),
    )

    stored_image = None

    try:
        stored_image = (
            image_storage_service
            .upload_prediction_image(
                image=test_image,
                request_id=request_id,
                crop="test",
                include_signed_url=True,
            )
        )

        print(
            {
                "upload": "PASSED",
                "object_key":
                    stored_image.object_key,
                "optimized_width":
                    stored_image.width,
                "optimized_height":
                    stored_image.height,
                "stored_size_bytes":
                    stored_image.size_bytes,
                "signed_url_created":
                    bool(
                        stored_image.signed_url
                    ),
            }
        )

    finally:
        if stored_image is not None:
            (
                image_storage_service
                .delete_image(
                    stored_image.object_key
                )
            )

            print(
                {
                    "delete": "PASSED",
                    "object_key":
                        stored_image.object_key,
                }
            )


if __name__ == "__main__":
    main()