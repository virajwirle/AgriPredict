import gc
import importlib
import re
import sys

from pathlib import Path
from typing import Any

import torch

from PIL import Image

from app.inference.adapters.base import (
    PredictorAdapter
)

from app.inference.model_metadata import (
    ModelMetadata
)

from app.services.model_package_manager import (
    model_package_manager
)


class MaizeV1Adapter(
    PredictorAdapter
):

    def __init__(
        self,
        metadata: ModelMetadata,
        device: str
    ):

        super().__init__(
            metadata=metadata,
            device=device
        )

        safe_model_id = re.sub(
            r"[^A-Za-z0-9_]",
            "_",
            metadata.model_id
        )

        self.module_namespace = (
            f"_remote_{safe_model_id}"
        )

        self.package_path: Path | None = None

        self.predictor = None

    @property
    def is_loaded(self) -> bool:

        return self.predictor is not None

    def _clear_remote_modules(
        self
    ) -> None:

        module_names = [
            module_name
            for module_name in sys.modules
            if (
                module_name
                == self.module_namespace
                or module_name.startswith(
                    f"{self.module_namespace}."
                )
            )
        ]

        for module_name in module_names:

            sys.modules.pop(
                module_name,
                None
            )

    def _import_remote_package(
        self
    ):

        if self.package_path is None:

            raise RuntimeError(
                "Package path has not been resolved."
            )

        init_path = (
            self.package_path /
            "__init__.py"
        )

        if not init_path.exists():

            raise FileNotFoundError(
                "Remote package is missing "
                f"__init__.py: {init_path}"
            )

        self._clear_remote_modules()

        specification = (
            importlib.util.spec_from_file_location(
                self.module_namespace,
                init_path,
                submodule_search_locations=[
                    str(self.package_path)
                ]
            )
        )

        if (
            specification is None
            or specification.loader is None
        ):

            raise ImportError(
                "Unable to create the remote "
                "Maize package import specification."
            )

        package_module = (
            importlib.util.module_from_spec(
                specification
            )
        )

        sys.modules[
            self.module_namespace
        ] = package_module

        try:

            specification.loader.exec_module(
                package_module
            )

        except Exception:

            self._clear_remote_modules()
            raise

        return package_module

    def load(self) -> None:

        if self.is_loaded:
            return

        self.package_path = (
            model_package_manager
            .ensure_available(
                self.metadata
            )
        )

        package_module = (
            self._import_remote_package()
        )

        predictor_class = getattr(
            package_module,
            "MaizeDiseasePredictor",
            None
        )

        if predictor_class is None:

            self._clear_remote_modules()

            raise ImportError(
                "MaizeDiseasePredictor was not "
                "exported by the remote package."
            )

        try:

            self.predictor = (
                predictor_class(
                    model_dir=self.package_path,
                    device=self.device
                )
            )

        except Exception:

            self.predictor = None
            self._clear_remote_modules()
            raise

    def predict(
        self,
        image: (
            Image.Image |
            str |
            Path
        )
    ) -> dict[str, Any]:

        if not self.is_loaded:
            self.load()

        result = self.predictor.predict(
            image
        )

        if not isinstance(
            result,
            dict
        ):

            raise TypeError(
                "Maize predictor must return "
                "a dictionary."
            )

        required_fields = {
            "crop",
            "model_version",
            "decision",
            "predicted_class_code",
            "predicted_class",
            "confidence",
            "reliability_score",
            "reason_codes"
        }

        missing_fields = (
            required_fields
            -
            result.keys()
        )

        if missing_fields:

            raise ValueError(
                "Maize predictor response is "
                "missing fields: "
                f"{sorted(missing_fields)}"
            )

        return result

    def unload(self) -> None:

        if self.predictor is not None:

            try:

                if hasattr(
                    self.predictor,
                    "model"
                ):

                    self.predictor.model.to(
                        "cpu"
                    )

            finally:

                self.predictor = None

        self.package_path = None

        self._clear_remote_modules()

        gc.collect()

        if torch.cuda.is_available():

            torch.cuda.empty_cache()