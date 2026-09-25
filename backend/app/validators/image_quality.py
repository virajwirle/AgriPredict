from dataclasses import (
    asdict,
    dataclass
)

from io import BytesIO

import cv2
import numpy as np

from PIL import (
    Image,
    UnidentifiedImageError
)


# ============================================================
# IMAGE-QUALITY RESULT
# ============================================================

@dataclass(frozen=True)
class ImageQualityResult:

    passed: bool

    reason_code: str | None

    message: str

    width: int | None = None

    height: int | None = None

    blur_score: float | None = None

    brightness_score: float | None = None

    def to_dict(
        self
    ) -> dict:

        return asdict(
            self
        )


# ============================================================
# IMAGE-QUALITY VALIDATOR
# ============================================================

class ImageQualityValidator:

    def __init__(
        self,
        minimum_width: int = 224,
        minimum_height: int = 224,
        minimum_blur_score: float = 50.0,
        minimum_brightness: float = 20.0,
        maximum_brightness: float = 240.0
    ):

        self.minimum_width = (
            minimum_width
        )

        self.minimum_height = (
            minimum_height
        )

        self.minimum_blur_score = (
            minimum_blur_score
        )

        self.minimum_brightness = (
            minimum_brightness
        )

        self.maximum_brightness = (
            maximum_brightness
        )

    # ========================================================
    # DECODE IMAGE
    # ========================================================

    @staticmethod
    def decode_image(
        image_bytes: bytes
    ) -> Image.Image:

        if not image_bytes:

            raise ValueError(
                "The uploaded image is empty."
            )

        try:

            with Image.open(
                BytesIO(
                    image_bytes
                )
            ) as image:

                image.load()

                return image.convert(
                    "RGB"
                )

        except (
            UnidentifiedImageError,
            OSError
        ) as error:

            raise ValueError(
                "The uploaded file is not a "
                "valid readable image."
            ) from error

    # ========================================================
    # VALIDATE IMAGE QUALITY
    #
    # Image.Image | None is correct because an invalid or
    # unreadable file cannot produce a decoded PIL image.
    # ========================================================

    def validate(
        self,
        image_bytes: bytes
    ) -> tuple[
        Image.Image | None,
        ImageQualityResult
    ]:

        # ----------------------------------------------------
        # Decode the uploaded image
        # ----------------------------------------------------

        try:

            image = self.decode_image(
                image_bytes
            )

        except ValueError as error:

            return (
                None,

                ImageQualityResult(
                    passed=False,

                    reason_code=(
                        "INVALID_IMAGE"
                    ),

                    message=str(
                        error
                    )
                )
            )

        # ----------------------------------------------------
        # Check image resolution
        # ----------------------------------------------------

        width, height = image.size

        if (
            width < self.minimum_width
            or
            height < self.minimum_height
        ):

            return (
                image,

                ImageQualityResult(
                    passed=False,

                    reason_code=(
                        "IMAGE_RESOLUTION_TOO_LOW"
                    ),

                    message=(
                        "Upload an image with a "
                        f"minimum resolution of "
                        f"{self.minimum_width} x "
                        f"{self.minimum_height} "
                        "pixels."
                    ),

                    width=width,

                    height=height
                )
            )

        # ----------------------------------------------------
        # Convert image to grayscale for quality analysis
        # ----------------------------------------------------

        rgb_array = np.asarray(
            image,
            dtype=np.uint8
        )

        gray_array = cv2.cvtColor(
            rgb_array,
            cv2.COLOR_RGB2GRAY
        )

        # ----------------------------------------------------
        # Calculate blur score
        #
        # Higher score = sharper image
        # Lower score = blurrier image
        # ----------------------------------------------------

        blur_score = float(
            cv2.Laplacian(
                gray_array,
                cv2.CV_64F
            ).var()
        )

        # ----------------------------------------------------
        # Calculate average brightness
        #
        # 0   = completely black
        # 255 = completely white
        # ----------------------------------------------------

        brightness_score = float(
            gray_array.mean()
        )

        rounded_blur_score = round(
            blur_score,
            2
        )

        rounded_brightness_score = round(
            brightness_score,
            2
        )

        # ----------------------------------------------------
        # Reject images that are too dark
        # ----------------------------------------------------

        if (
            brightness_score
            <
            self.minimum_brightness
        ):

            return (
                image,

                ImageQualityResult(
                    passed=False,

                    reason_code=(
                        "IMAGE_TOO_DARK"
                    ),

                    message=(
                        "The image is too dark. "
                        "Capture the leaf again in "
                        "better lighting."
                    ),

                    width=width,

                    height=height,

                    blur_score=(
                        rounded_blur_score
                    ),

                    brightness_score=(
                        rounded_brightness_score
                    )
                )
            )

        # ----------------------------------------------------
        # Reject overexposed images
        # ----------------------------------------------------

        if (
            brightness_score
            >
            self.maximum_brightness
        ):

            return (
                image,

                ImageQualityResult(
                    passed=False,

                    reason_code=(
                        "IMAGE_OVEREXPOSED"
                    ),

                    message=(
                        "The image is overexposed. "
                        "Capture the leaf again with "
                        "less direct light."
                    ),

                    width=width,

                    height=height,

                    blur_score=(
                        rounded_blur_score
                    ),

                    brightness_score=(
                        rounded_brightness_score
                    )
                )
            )

        # ----------------------------------------------------
        # Reject blurry images
        # ----------------------------------------------------

        if (
            blur_score
            <
            self.minimum_blur_score
        ):

            return (
                image,

                ImageQualityResult(
                    passed=False,

                    reason_code=(
                        "IMAGE_TOO_BLURRY"
                    ),

                    message=(
                        "The image is too blurry. "
                        "Hold the camera steady and "
                        "capture the leaf again."
                    ),

                    width=width,

                    height=height,

                    blur_score=(
                        rounded_blur_score
                    ),

                    brightness_score=(
                        rounded_brightness_score
                    )
                )
            )

        # ----------------------------------------------------
        # Image passed every quality check
        # ----------------------------------------------------

        return (
            image,

            ImageQualityResult(
                passed=True,

                reason_code=None,

                message=(
                    "Image quality checks passed."
                ),

                width=width,

                height=height,

                blur_score=(
                    rounded_blur_score
                ),

                brightness_score=(
                    rounded_brightness_score
                )
            )
        )


# ============================================================
# SHARED VALIDATOR INSTANCE
# ============================================================

image_quality_validator = (
    ImageQualityValidator()
)