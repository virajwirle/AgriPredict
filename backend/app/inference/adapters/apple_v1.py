import gc
import importlib.util
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


APPLE_CLASS_CODES = {
    "Apple Alternaria Leaf Spot":
        "ALTERNARIA_LEAF_SPOT",

    "Apple Brown Spot":
        "BROWN_SPOT",

    "Apple Frogeye Leaf Spot":
        "FROGEYE_LEAF_SPOT",

    "Apple Mosaic":
        "APPLE_MOSAIC",

    "Apple Powdery Mildew":
        "POWDERY_MILDEW",

    "Apple Rust":
        "APPLE_RUST",

    "Apple Scab":
        "APPLE_SCAB",

    "Healthy Apple Leaf":
        "HEALTHY"
}


class AppleV1Adapter(
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

        self.model_module_name = (
            f"_remote_{safe_model_id}_model"
        )

        self.inference_module_name = (
            f"_remote_{safe_model_id}_inference"
        )

        self.package_path: Path | None = None

        self.predictor = None

    @property
    def is_loaded(
        self
    ) -> bool:

        return self.predictor is not None

    def _clear_remote_modules(
        self
    ) -> None:

        sys.modules.pop(
            self.model_module_name,
            None
        )

        sys.modules.pop(
            self.inference_module_name,
            None
        )

    @staticmethod
    def _load_module_from_file(
        module_name: str,
        file_path: Path
    ):

        specification = (
            importlib.util
            .spec_from_file_location(
                module_name,
                file_path
            )
        )

        if (
            specification is None
            or specification.loader is None
        ):

            raise ImportError(
                "Unable to create an import "
                f"specification for {file_path}."
            )

        module = (
            importlib.util.module_from_spec(
                specification
            )
        )

        sys.modules[
            module_name
        ] = module

        specification.loader.exec_module(
            module
        )

        return module

    def _import_remote_predictor(
        self
    ):

        if self.package_path is None:

            raise RuntimeError(
                "Apple package path has not "
                "been resolved."
            )

        model_path = (
            self.package_path /
            "model.py"
        )

        inference_path = (
            self.package_path /
            "inference.py"
        )

        if not model_path.exists():

            raise FileNotFoundError(
                f"Apple model.py not found: "
                f"{model_path}"
            )

        if not inference_path.exists():

            raise FileNotFoundError(
                f"Apple inference.py not found: "
                f"{inference_path}"
            )

        self._clear_remote_modules()

        model_module = (
            self._load_module_from_file(
                self.model_module_name,
                model_path
            )
        )

        # Apple inference.py imports:
        #
        # from model import ResNet50SelfAttention
        #
        # Temporarily expose the uniquely loaded model module
        # under the name expected by the remote package.
        previous_model_module = (
            sys.modules.get(
                "model"
            )
        )

        sys.modules[
            "model"
        ] = model_module

        try:

            inference_module = (
                self._load_module_from_file(
                    self.inference_module_name,
                    inference_path
                )
            )

        finally:

            if previous_model_module is None:

                sys.modules.pop(
                    "model",
                    None
                )

            else:

                sys.modules[
                    "model"
                ] = previous_model_module

        predictor_class = getattr(
            inference_module,
            "AppleDiseasePredictor",
            None
        )

        if predictor_class is None:

            self._clear_remote_modules()

            raise ImportError(
                "AppleDiseasePredictor was not "
                "found in Apple inference.py."
            )

        return predictor_class

    def load(
        self
    ) -> None:

        if self.is_loaded:
            return

        self.package_path = (
            model_package_manager
            .ensure_available(
                self.metadata
            )
        )

        predictor_class = (
            self._import_remote_predictor()
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

    @staticmethod
    def _class_code(
        class_name: str
    ) -> str:

        known_code = (
            APPLE_CLASS_CODES.get(
                class_name
            )
        )

        if known_code is not None:
            return known_code

        generated_code = re.sub(
            r"[^A-Za-z0-9]+",
            "_",
            class_name
        )

        return (
            generated_code
            .strip("_")
            .upper()
        )

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

        raw_result = (
            self.predictor.predict(
                image
            )
        )

        if not isinstance(
            raw_result,
            dict
        ):

            raise TypeError(
                "Apple predictor must return "
                "a dictionary."
            )

        required_fields = {
            "crop",
            "decision",
            "knn_score",
            "accept_threshold",
            "predicted_class",
            "confidence",
            "top3"
        }

        missing_fields = (
            required_fields
            -
            raw_result.keys()
        )

        if missing_fields:

            raise ValueError(
                "Apple predictor response is "
                "missing fields: "
                f"{sorted(missing_fields)}"
            )

        decision = str(
            raw_result[
                "decision"
            ]
        ).upper()

        if decision not in {
            "ACCEPT",
            "UNCERTAIN"
        }:

            raise ValueError(
                "Unexpected Apple decision: "
                f"{decision}"
            )

        accepted = (
            decision == "ACCEPT"
        )

        raw_predicted_class = str(
            raw_result[
                "predicted_class"
            ]
        )

        confidence = float(
            raw_result[
                "confidence"
            ]
        )

        top3 = raw_result.get(
            "top3",
            []
        )

        probability_margin = None

        if len(top3) >= 2:

            probability_margin = (
                float(
                    top3[0][
                        "confidence"
                    ]
                )
                -
                float(
                    top3[1][
                        "confidence"
                    ]
                )
            )

        result = {
            "crop":
                "apple",

            "model_version":
                self.metadata.version,

            "decision":
                decision,

            "predicted_class_code":
                (
                    self._class_code(
                        raw_predicted_class
                    )
                    if accepted
                    else None
                ),

            "predicted_class":
                (
                    raw_predicted_class
                    if accepted
                    else None
                ),

            "confidence":
                round(
                    confidence,
                    6
                ),

            "probability_margin":
                (
                    round(
                        probability_margin,
                        6
                    )
                    if probability_margin
                    is not None
                    else None
                ),

            "reliability_score":
                round(
                    float(
                        raw_result[
                            "knn_score"
                        ]
                    ),
                    6
                ),

            "reliability_threshold":
                float(
                    raw_result[
                        "accept_threshold"
                    ]
                ),

            "reason_codes":
                (
                    []
                    if accepted
                    else [
                        "UNSUPPORTED_OR_UNCERTAIN_CONDITION"
                    ]
                )
        }

        if accepted:

            result[
                "top_predictions"
            ] = [
                {
                    "class_code":
                        self._class_code(
                            str(
                                item[
                                    "class"
                                ]
                            )
                        ),

                    "class_name":
                        str(
                            item[
                                "class"
                            ]
                        ),

                    "probability":
                        round(
                            float(
                                item[
                                    "confidence"
                                ]
                            ),
                            6
                        )
                }

                for item in top3
            ]

            result[
                "message"
            ] = (
                "Prediction accepted: "
                f"{raw_predicted_class}"
            )

        else:

            result[
                "message"
            ] = (
                "The image does not reliably "
                "match a supported Apple "
                "condition."
            )

        return result

    def unload(
        self
    ) -> None:

        if self.predictor is not None:

            try:

                if hasattr(
                    self.predictor,
                    "model"
                ):

                    self.predictor.model.to(
                        "cpu"
                    )

                if hasattr(
                    self.predictor,
                    "reference_embeddings"
                ):

                    self.predictor.reference_embeddings = (
                        self.predictor
                        .reference_embeddings
                        .cpu()
                    )

            finally:

                self.predictor = None

        self.package_path = None

        self._clear_remote_modules()

        gc.collect()

        if torch.cuda.is_available():

            torch.cuda.empty_cache()