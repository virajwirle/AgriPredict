import gc
import importlib.util
import re
import sys
import tempfile

from pathlib import Path
from typing import Any

import torch

from PIL import Image

from app.inference.adapters.base import PredictorAdapter
from app.services.model_package_manager import model_package_manager


class CropPackageV1Adapter(PredictorAdapter):
    """Loads a crop-specific predictor package from Hugging Face."""

    def __init__(self, metadata, device: str):
        super().__init__(metadata=metadata, device=device)
        safe_id = re.sub(r"[^A-Za-z0-9_]", "_", metadata.model_id)
        self.model_module_name = f"_remote_{safe_id}_model"
        self.inference_module_name = f"_remote_{safe_id}_inference"
        self.package_path: Path | None = None
        self.inference_module = None
        self.predictor = None
        self._cached_package_state = None

    @property
    def is_loaded(self) -> bool:
        return self.predictor is not None

    def _clear_modules(self) -> None:
        sys.modules.pop(self.model_module_name, None)
        sys.modules.pop(self.inference_module_name, None)

    @staticmethod
    def _load_module(module_name: str, file_path: Path):
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Unable to import model package file: {file_path.name}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module

    def _load_package_modules(self):
        if self.package_path is None:
            raise RuntimeError("Model package path has not been resolved.")

        model_path = self.package_path / "model.py"
        inference_path = self.package_path / "inference.py"
        if not model_path.is_file() or not inference_path.is_file():
            raise FileNotFoundError("Model package requires model.py and inference.py.")

        self._clear_modules()
        model_module = self._load_module(self.model_module_name, model_path)
        previous_model = sys.modules.get("model")
        sys.modules["model"] = model_module
        try:
            return self._load_module(self.inference_module_name, inference_path)
        finally:
            if previous_model is None:
                sys.modules.pop("model", None)
            else:
                sys.modules["model"] = previous_model

    def load(self) -> None:
        if self.is_loaded:
            return

        self.package_path = model_package_manager.ensure_available(self.metadata)
        self.inference_module = self._load_package_modules()

        function_name = self.metadata.predictor_function
        if function_name:
            function = getattr(self.inference_module, function_name, None)
            if not callable(function):
                raise ImportError(f"Package function was not found: {function_name}")

            # Cotton's published function reloads the model on every call. Keep
            # its existing inference function but cache the package state once.
            loader = getattr(self.inference_module, "load_package", None)
            if callable(loader):
                self._cached_package_state = loader(
                    str(self.package_path), self.device
                )

                def cached_loader(_package_dir=None, device=None):
                    return self._cached_package_state

                self.inference_module.load_package = cached_loader

            self.predictor = function
            return

        class_name = self.metadata.predictor_class
        predictor_class = getattr(self.inference_module, class_name or "", None)
        if predictor_class is None:
            raise ImportError(f"Package predictor class was not found: {class_name}")
        self.predictor = predictor_class(
            model_dir=self.package_path,
            device=self.device,
        )

    @staticmethod
    def _image_path(image) -> tuple[str, bool]:
        if isinstance(image, (str, Path)):
            return str(image), False
        if not isinstance(image, Image.Image):
            raise TypeError("Crop predictor expects a PIL image or image path.")

        handle = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        path = handle.name
        handle.close()
        image.save(path, format="PNG")
        return path, True

    def predict(self, image) -> dict[str, Any]:
        if not self.is_loaded:
            self.load()

        image_path, remove_image = self._image_path(image)
        try:
            if self.metadata.predictor_function:
                raw = self.predictor(
                    image_path=image_path,
                    package_dir=str(self.package_path),
                    device=self.device,
                )
            else:
                raw = self.predictor.predict(image_path)
        finally:
            if remove_image:
                Path(image_path).unlink(missing_ok=True)

        if not isinstance(raw, dict):
            raise TypeError("Crop predictor must return a dictionary.")

        raw_decision = str(raw.get("decision", "")).strip().upper()
        if raw_decision in {"ACCEPT", "ACCEPTED", "PREDICTION", "PREDICTED"}:
            accepted = True
        elif raw_decision in {"UNCERTAIN", "REJECTED", "REJECT_OOD", "REJECTED_OOD"}:
            accepted = False
        else:
            raise ValueError(f"Unexpected crop predictor decision: {raw_decision!r}")

        raw_top = raw.get("top3", raw.get("top", []))
        top_predictions = [
            {
                "class_code": re.sub(r"[^A-Za-z0-9]+", "_", str(item.get("class", ""))).strip("_").upper(),
                "class_name": str(item.get("class", "")),
                "probability": round(float(item.get("confidence", 0.0)), 6),
            }
            for item in raw_top
            if isinstance(item, dict) and item.get("class") is not None
        ]

        has_ood_rejection = self.metadata.ood_rejection_enabled
        class_name = raw.get("predicted_class") if accepted else None
        confidence = raw.get("confidence")

        # Classification-only packages may still report UNCERTAIN when their
        # optional OOD gate rejects the image. If configured without OOD,
        # recover the classifier's top class and continue with a clear
        # classification-only status.
        if not has_ood_rejection and not accepted:
            top_class = top_predictions[0] if top_predictions else None
            class_name = (
                raw.get("predicted_class")
                or (top_class["class_name"] if top_class else None)
            )
            if confidence is None and top_class:
                confidence = top_class["probability"]
            accepted = class_name is not None

        class_code = (
            re.sub(r"[^A-Za-z0-9]+", "_", str(class_name)).strip("_").upper()
            if class_name else None
        )

        reason_codes = list(raw.get("reason_codes") or [])
        if not has_ood_rejection:
            reason_codes = [
                code for code in reason_codes
                if code not in {
                    "MODEL_REJECTED_IMAGE",
                    "REJECTED_OOD",
                    "OUT_OF_DISTRIBUTION",
                }
            ]
            reason_codes.append("OOD_REJECTION_NOT_CONFIGURED")
        elif not accepted and not reason_codes:
            reason_codes.append("MODEL_REJECTED_IMAGE")

        return {
            "crop": self.metadata.crop,
            "model_version": str(raw.get("model_version") or self.metadata.version),
            "decision": "ACCEPT" if accepted else "UNCERTAIN",
            "predicted_class_code": class_code,
            "predicted_class": str(class_name) if class_name else None,
            "confidence": round(float(confidence), 6) if confidence is not None else None,
            "probability_margin": None,
            "reliability_score": (
                round(float(raw.get("knn_score", raw.get("knn_similarity"))), 6)
                if raw.get("knn_score", raw.get("knn_similarity")) is not None
                else None
            ),
            "reliability_threshold": (
                raw.get("accept_threshold", raw.get("knn_threshold"))
                if has_ood_rejection else None
            ),
            "reason_codes": reason_codes,
            "top_predictions": top_predictions if accepted else [],
            "message": (
                f"Prediction accepted: {class_name}"
                if accepted else "The image did not pass this crop model's rejection checks."
            ),
        }

    def unload(self) -> None:
        if self.predictor is not None and not self.metadata.predictor_function:
            model = getattr(self.predictor, "model", None)
            if model is not None:
                model.to("cpu")
        self.predictor = None
        self.inference_module = None
        self._cached_package_state = None
        self.package_path = None
        self._clear_modules()
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
