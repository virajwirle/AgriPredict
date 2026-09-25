import os

from pathlib import Path
from threading import Lock


# ============================================================
# WINDOWS HUGGING FACE CACHE CONFIGURATION
#
# Must be set before importing huggingface_hub.
# This avoids Windows symlink privilege errors.
# ============================================================

os.environ.setdefault(
    "HF_HUB_DISABLE_SYMLINKS",
    "1"
)

os.environ.setdefault(
    "HF_HUB_DISABLE_SYMLINKS_WARNING",
    "1"
)


from huggingface_hub import (
    snapshot_download
)

from app.core.config import settings

from app.inference.model_metadata import (
    ModelMetadata
)


class ModelPackageError(
    RuntimeError
):
    """Raised when a model package cannot be obtained."""


class ModelPackageManager:

    def __init__(self):

        self.cache_directory = (
            settings.model_cache_path
        )

        self.cache_directory.mkdir(
            parents=True,
            exist_ok=True
        )

        self._package_paths: dict[
            str,
            Path
        ] = {}

        self._download_locks: dict[
            str,
            Lock
        ] = {}

        self._locks_guard = Lock()

    def _get_download_lock(
        self,
        model_id: str
    ) -> Lock:

        with self._locks_guard:

            if (
                model_id
                not in self._download_locks
            ):

                self._download_locks[
                    model_id
                ] = Lock()

            return self._download_locks[
                model_id
            ]

    @staticmethod
    def _normalize_remote_path(
        path_in_repo: str
    ) -> str:

        normalized_path = (
            path_in_repo
            .strip()
            .strip("/")
            .replace("\\", "/")
        )

        path_parts = Path(
            normalized_path
        ).parts

        if (
            not normalized_path
            or
            Path(normalized_path).is_absolute()
            or
            ".." in path_parts
        ):

            raise ModelPackageError(
                "Invalid Hugging Face package path."
            )

        return normalized_path

    @staticmethod
    def _resolve_package_path(
        snapshot_root: str | Path,
        path_in_repo: str
    ) -> Path:

        package_path = (
            Path(snapshot_root)
            /
            Path(path_in_repo)
        ).resolve()

        if not package_path.exists():

            raise ModelPackageError(
                "Downloaded package was not found at: "
                f"{package_path}"
            )

        if not package_path.is_dir():

            raise ModelPackageError(
                "Model package path is not a directory: "
                f"{package_path}"
            )

        return package_path

    def _obtain_snapshot(
        self,
        metadata: ModelMetadata,
        path_in_repo: str,
        local_files_only: bool
    ) -> Path:

        source = metadata.source

        snapshot_root = snapshot_download(
            repo_id=source.repo_id,

            repo_type="model",

            revision=source.revision,

            allow_patterns=[
                f"{path_in_repo}/*"
            ],

            cache_dir=str(
                self.cache_directory
            ),

            token=(
                settings.hf_token
                if source.private
                else None
            ),

            local_files_only=(
                local_files_only
            ),

            force_download=False
        )

        return self._resolve_package_path(
            snapshot_root=snapshot_root,
            path_in_repo=path_in_repo
        )

    def ensure_available(
        self,
        metadata: ModelMetadata
    ) -> Path:

        if not metadata.enabled:

            raise ModelPackageError(
                "Model is disabled: "
                f"{metadata.model_id}"
            )

        if (
            metadata.source.private
            and
            not settings.hf_token
        ):

            raise ModelPackageError(
                "HF_TOKEN is required for this "
                "private Hugging Face repository."
            )

        existing_path = self._package_paths.get(
            metadata.model_id
        )

        if (
            existing_path is not None
            and existing_path.exists()
        ):

            return existing_path

        download_lock = self._get_download_lock(
            metadata.model_id
        )

        with download_lock:

            existing_path = (
                self._package_paths.get(
                    metadata.model_id
                )
            )

            if (
                existing_path is not None
                and existing_path.exists()
            ):

                return existing_path

            path_in_repo = (
                self._normalize_remote_path(
                    metadata.source.path_in_repo
                )
            )

            online_error = None

            try:

                package_path = (
                    self._obtain_snapshot(
                        metadata=metadata,
                        path_in_repo=path_in_repo,
                        local_files_only=False
                    )
                )

            except Exception as error:

                online_error = error

                # Fall back to files previously cached on disk.
                try:

                    package_path = (
                        self._obtain_snapshot(
                            metadata=metadata,
                            path_in_repo=path_in_repo,
                            local_files_only=True
                        )
                    )

                except Exception as cache_error:

                    raise ModelPackageError(
                        "Unable to download or locate "
                        "a cached package for "
                        f"{metadata.model_id}. "
                        "Online error type: "
                        f"{type(online_error).__name__}. "
                        "Cache error type: "
                        f"{type(cache_error).__name__}."
                    ) from online_error

            self._package_paths[
                metadata.model_id
            ] = package_path

            return package_path

    def get_cached_path(
        self,
        model_id: str
    ) -> Path | None:

        package_path = (
            self._package_paths.get(
                model_id
            )
        )

        if (
            package_path is None
            or not package_path.exists()
        ):

            return None

        return package_path

    def get_status(
        self
    ) -> dict[str, dict]:

        return {
            model_id: {
                "available": (
                    package_path.exists()
                ),
                "package_path": str(
                    package_path
                )
            }

            for model_id, package_path
            in self._package_paths.items()
        }


model_package_manager = ModelPackageManager()