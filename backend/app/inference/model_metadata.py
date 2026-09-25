from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator
)


class HuggingFaceSource(BaseModel):

    repo_id: str = Field(
        min_length=1
    )

    path_in_repo: str = Field(
        min_length=1
    )

    revision: str = "main"

    private: bool = True

    @field_validator(
        "repo_id",
        "path_in_repo",
        "revision"
    )
    @classmethod
    def remove_surrounding_spaces(
        cls,
        value: str
    ) -> str:

        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Value cannot be empty."
            )

        return cleaned_value


class ModelMetadata(BaseModel):

    model_id: str = Field(
        min_length=1
    )

    crop: str = Field(
        min_length=1
    )

    display_name: str = Field(
        min_length=1
    )

    version: str = Field(
        min_length=1
    )

    framework: Literal[
        "pytorch"
    ] = "pytorch"

    adapter: str = Field(
        min_length=1
    )

    source: HuggingFaceSource

    enabled: bool = True

    preload: bool = False

    @field_validator(
        "model_id",
        "crop",
        "display_name",
        "version",
        "adapter"
    )
    @classmethod
    def clean_text(
        cls,
        value: str
    ) -> str:

        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Value cannot be empty."
            )

        return cleaned_value

    @field_validator("crop")
    @classmethod
    def normalize_crop(
        cls,
        value: str
    ) -> str:

        return value.lower()