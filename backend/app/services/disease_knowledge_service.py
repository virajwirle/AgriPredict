from __future__ import annotations

import json
from pathlib import Path

from pydantic import (
    TypeAdapter,
    ValidationError,
)

from app.knowledge.schemas import (
    DiseaseKnowledge,
)


KNOWLEDGE_DIRECTORY = (
    Path(__file__)
    .resolve()
    .parents[1]
    / "knowledge"
    / "crops"
)


class DiseaseKnowledgeError(RuntimeError):
    """Base disease-knowledge error."""


class DiseaseKnowledgeNotFoundError(
    DiseaseKnowledgeError
):
    """Raised when no matching knowledge exists."""


class DiseaseKnowledgeConfigurationError(
    DiseaseKnowledgeError
):
    """Raised when knowledge files are invalid."""


class DiseaseKnowledgeService:

    def __init__(
        self,
        knowledge_directory: Path = (
            KNOWLEDGE_DIRECTORY
        ),
    ) -> None:

        self.knowledge_directory = (
            knowledge_directory
        )

        self._entries: dict[
            tuple[str, str],
            DiseaseKnowledge,
        ] = {}

        self._source_files: list[str] = []

        self._loaded = False

    @staticmethod
    def _build_key(
        crop: str,
        class_code: str,
    ) -> tuple[str, str]:

        return (
            crop.strip().lower(),
            class_code.strip().upper(),
        )

    @staticmethod
    def _load_file(
        knowledge_file: Path,
    ) -> list[DiseaseKnowledge]:

        try:
            raw_data = json.loads(
                knowledge_file.read_text(
                    encoding="utf-8"
                )
            )

        except json.JSONDecodeError as error:
            raise (
                DiseaseKnowledgeConfigurationError(
                    "Invalid JSON in knowledge "
                    f"file: {knowledge_file.name}"
                )
            ) from error

        try:
            return TypeAdapter(
                list[DiseaseKnowledge]
            ).validate_python(raw_data)

        except ValidationError as error:
            raise (
                DiseaseKnowledgeConfigurationError(
                    "Schema validation failed "
                    f"for knowledge file: "
                    f"{knowledge_file.name}. "
                    f"Details: {error}"
                )
            ) from error

    def load(self) -> None:

        if not self.knowledge_directory.exists():
            raise (
                DiseaseKnowledgeConfigurationError(
                    "Knowledge directory does "
                    "not exist: "
                    f"{self.knowledge_directory}"
                )
            )

        knowledge_files = sorted(
            self.knowledge_directory.glob(
                "*.json"
            )
        )

        if not knowledge_files:
            raise (
                DiseaseKnowledgeConfigurationError(
                    "No crop knowledge JSON "
                    "files were found in: "
                    f"{self.knowledge_directory}"
                )
            )

        loaded_entries: dict[
            tuple[str, str],
            DiseaseKnowledge,
        ] = {}

        loaded_files: list[str] = []

        for knowledge_file in knowledge_files:

            entries = self._load_file(
                knowledge_file
            )

            if not entries:
                raise (
                    DiseaseKnowledgeConfigurationError(
                        "Knowledge file contains "
                        "no entries: "
                        f"{knowledge_file.name}"
                    )
                )

            file_crop = (
                knowledge_file.stem
                .strip()
                .lower()
            )

            for entry in entries:

                normalized_entry_crop = (
                    entry.crop.strip().lower()
                )

                if (
                    normalized_entry_crop
                    != file_crop
                ):
                    raise (
                        DiseaseKnowledgeConfigurationError(
                            "Crop mismatch in "
                            f"{knowledge_file.name}: "
                            f"entry crop is "
                            f"'{entry.crop}', but the "
                            f"filename requires "
                            f"'{file_crop}'."
                        )
                    )

                key = self._build_key(
                    entry.crop,
                    entry.class_code,
                )

                if key in loaded_entries:
                    raise (
                        DiseaseKnowledgeConfigurationError(
                            "Duplicate disease "
                            "knowledge entry for "
                            f"crop='{key[0]}' and "
                            f"class_code='{key[1]}'."
                        )
                    )

                loaded_entries[key] = entry

            loaded_files.append(
                knowledge_file.name
            )

        self._entries = loaded_entries
        self._source_files = loaded_files
        self._loaded = True

    def reload(self) -> None:

        self._loaded = False
        self._entries = {}
        self._source_files = []

        self.load()

    def _ensure_loaded(self) -> None:

        if not self._loaded:
            self.load()

    def get(
        self,
        crop: str,
        class_code: str,
    ) -> DiseaseKnowledge | None:

        self._ensure_loaded()

        key = self._build_key(
            crop,
            class_code,
        )

        return self._entries.get(key)

    def require(
        self,
        crop: str,
        class_code: str,
    ) -> DiseaseKnowledge:

        entry = self.get(
            crop,
            class_code,
        )

        if entry is None:
            raise DiseaseKnowledgeNotFoundError(
                "No verified disease knowledge "
                f"exists for crop='{crop}' and "
                f"class_code='{class_code}'."
            )

        return entry

    def list_for_crop(
        self,
        crop: str,
    ) -> list[DiseaseKnowledge]:

        self._ensure_loaded()

        normalized_crop = (
            crop.strip().lower()
        )

        return sorted(
            [
                entry
                for (
                    entry_crop,
                    _,
                ), entry in self._entries.items()
                if (
                    entry_crop
                    == normalized_crop
                )
            ],
            key=lambda entry: (
                entry.class_name.lower()
            ),
        )

    def get_status(self) -> dict:

        self._ensure_loaded()

        crop_counts: dict[str, int] = {}

        for crop, _ in self._entries:
            crop_counts[crop] = (
                crop_counts.get(crop, 0)
                + 1
            )

        return {
            "loaded": self._loaded,
            "knowledge_directory": str(
                self.knowledge_directory
            ),
            "source_files":
                self._source_files,
            "entry_count": len(
                self._entries
            ),
            "crop_counts":
                crop_counts,
        }


disease_knowledge_service = (
    DiseaseKnowledgeService()
)