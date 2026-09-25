from abc import (
    ABC,
    abstractmethod
)

from pathlib import Path
from typing import Any

from PIL import Image

from app.inference.model_metadata import (
    ModelMetadata
)


class PredictorAdapter(
    ABC
):

    def __init__(
        self,
        metadata: ModelMetadata,
        device: str
    ):

        self.metadata = metadata
        self.device = device

    @property
    @abstractmethod
    def is_loaded(self) -> bool:
        pass

    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def predict(
        self,
        image: (
            Image.Image |
            str |
            Path
        )
    ) -> dict[str, Any]:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass