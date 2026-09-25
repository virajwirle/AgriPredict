from threading import RLock

import torch

from app.core.config import settings

from app.inference.adapters.apple_v1 import (
    AppleV1Adapter
)

from app.inference.adapters.base import (
    PredictorAdapter
)

from app.inference.adapters.maize_v1 import (
    MaizeV1Adapter
)

from app.inference.model_metadata import (
    ModelMetadata
)

from app.inference.model_registry import (
    model_registry
)

from app.services.model_package_manager import (
    model_package_manager
)


class PredictorManagerError(
    RuntimeError
):
    pass


ADAPTER_CLASSES: dict[
    str,
    type[PredictorAdapter]
] = {
    "apple_v1":
        AppleV1Adapter,

    "maize_v1":
        MaizeV1Adapter
}


class PredictorManager:

    def __init__(
        self
    ):

        self._lock = RLock()

        self._active_crop: str | None = None

        self._active_adapter: (
            PredictorAdapter |
            None
        ) = None

    @staticmethod
    def resolve_device(
    ) -> str:

        configured_device = (
            settings.model_device
            .strip()
            .lower()
        )

        if configured_device == "auto":

            return (
                "cuda"
                if torch.cuda.is_available()
                else "cpu"
            )

        if configured_device == "cuda":

            if not torch.cuda.is_available():

                raise PredictorManagerError(
                    "MODEL_DEVICE=cuda but CUDA "
                    "is not available."
                )

            return "cuda"

        if configured_device == "cpu":
            return "cpu"

        raise PredictorManagerError(
            "MODEL_DEVICE must be one of: "
            "auto, cpu or cuda."
        )

    @staticmethod
    def _create_adapter(
        metadata: ModelMetadata,
        device: str
    ) -> PredictorAdapter:

        adapter_class = (
            ADAPTER_CLASSES.get(
                metadata.adapter
            )
        )

        if adapter_class is None:

            raise PredictorManagerError(
                "No adapter is registered for: "
                f"{metadata.adapter}"
            )

        return adapter_class(
            metadata=metadata,
            device=device
        )

    def get_adapter(
        self,
        crop: str
    ) -> PredictorAdapter:

        normalized_crop = (
            crop.strip().lower()
        )

        with self._lock:

            if (
                self._active_crop
                ==
                normalized_crop
                and
                self._active_adapter
                is not None
                and
                self._active_adapter
                .is_loaded
            ):

                return self._active_adapter

            metadata = (
                model_registry.require_model(
                    normalized_crop
                )
            )

            # Ensure all package files are available on disk
            # before unloading the currently active model.
            model_package_manager.ensure_available(
                metadata
            )

            # GTX 1650 has 4 GB VRAM. Unload the previous
            # crop model before allocating the next model.
            if (
                self._active_adapter
                is not None
            ):

                self._active_adapter.unload()

                self._active_adapter = None
                self._active_crop = None

            device = self.resolve_device()

            new_adapter = (
                self._create_adapter(
                    metadata=metadata,
                    device=device
                )
            )

            try:

                new_adapter.load()

            except Exception as error:

                new_adapter.unload()

                raise PredictorManagerError(
                    "Unable to load predictor "
                    f"for crop: {normalized_crop}"
                ) from error

            self._active_crop = (
                normalized_crop
            )

            self._active_adapter = (
                new_adapter
            )

            return new_adapter

    def predict(
        self,
        crop: str,
        image
    ) -> dict:

        with self._lock:

            adapter = self.get_adapter(
                crop
            )

            return adapter.predict(
                image
            )

    def unload_active_model(
        self
    ) -> None:

        with self._lock:

            if (
                self._active_adapter
                is not None
            ):

                self._active_adapter.unload()

            self._active_adapter = None
            self._active_crop = None

    def get_status(
        self
    ) -> dict:

        with self._lock:

            gpu_memory_allocated_mb = 0.0

            if torch.cuda.is_available():

                gpu_memory_allocated_mb = round(
                    torch.cuda.memory_allocated()
                    /
                    1024
                    /
                    1024,
                    2
                )

            return {
                "device":
                    self.resolve_device(),

                "active_crop":
                    self._active_crop,

                "model_loaded":
                    (
                        self._active_adapter
                        is not None
                        and
                        self._active_adapter
                        .is_loaded
                    ),

                "gpu_memory_allocated_mb":
                    gpu_memory_allocated_mb
            }


predictor_manager = (
    PredictorManager()
)