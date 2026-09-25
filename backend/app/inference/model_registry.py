import json
from pathlib import Path

from pydantic import ValidationError

from app.inference.model_metadata import (
    ModelMetadata
)

# model_registry.py is located at:
# backend/app/inference/model_registry.py
#
# parents[2] resolves to:
# backend/
DEFAULT_MODELS_DIRECTORY = (
    Path(__file__).resolve().parents[2]
    /
    "models"
)


class ModelRegistry:

    def __init__(
        self,
        models_directory: (
            str |
            Path |
            None
        ) = None
    ):

        self.models_directory = Path(
            models_directory
            if models_directory is not None
            else DEFAULT_MODELS_DIRECTORY
        ).resolve()

        self.models: dict[
            str,
            ModelMetadata
        ] = {}

        self.errors: dict[
            str,
            str
        ] = {}

    def discover_models(self) -> None:

        self.models.clear()
        self.errors.clear()

        if not self.models_directory.exists():

            self.errors[
                str(self.models_directory)
            ] = (
                "Models directory does not exist."
            )

            return

        metadata_paths = sorted(
            self.models_directory.glob(
                "*/metadata.json"
            )
        )

        if not metadata_paths:

            self.errors[
                str(self.models_directory)
            ] = (
                "No metadata.json files found."
            )

            return

        for metadata_path in metadata_paths:

            try:

                with metadata_path.open(
                    "r",
                    encoding="utf-8"
                ) as file:

                    raw_metadata = json.load(
                        file
                    )

                metadata = ModelMetadata(
                    **raw_metadata
                )

                crop = metadata.crop

                if crop in self.models:

                    raise ValueError(
                        "Duplicate crop registered: "
                        f"{crop}"
                    )

                if metadata.model_id in {
                    registered.model_id
                    for registered
                    in self.models.values()
                }:

                    raise ValueError(
                        "Duplicate model_id registered: "
                        f"{metadata.model_id}"
                    )

                self.models[
                    crop
                ] = metadata

            except (
                json.JSONDecodeError,
                ValidationError,
                ValueError,
                OSError
            ) as error:

                self.errors[
                    str(metadata_path)
                ] = str(error)

    def get_model(
        self,
        crop: str
    ) -> ModelMetadata | None:

        return self.models.get(
            crop.strip().lower()
        )

    def require_model(
        self,
        crop: str
    ) -> ModelMetadata:

        normalized_crop = (
            crop.strip().lower()
        )

        metadata = self.get_model(
            normalized_crop
        )

        if metadata is None:

            supported_crops = sorted(
                self.get_enabled_models()
            )

            raise KeyError(
                f"Unsupported crop: "
                f"{normalized_crop}. "
                f"Supported crops: "
                f"{supported_crops}"
            )

        if not metadata.enabled:

            raise ValueError(
                f"Model is disabled: "
                f"{normalized_crop}"
            )

        return metadata

    def get_all_models(
        self
    ) -> dict[str, ModelMetadata]:

        return dict(
            self.models
        )

    def get_enabled_models(
        self
    ) -> dict[str, ModelMetadata]:

        return {
            crop: metadata

            for crop, metadata
            in self.models.items()

            if metadata.enabled
        }

    def get_errors(
        self
    ) -> dict[str, str]:

        return dict(
            self.errors
        )


model_registry = ModelRegistry()