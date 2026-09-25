
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.models import PredictionRecord, User
from app.db.session import get_db_session
from app.repositories.prediction_repository import (
    PredictionRepositoryError,
    delete_prediction_record,
    get_prediction_by_request_id,
    list_recent_predictions,
)
from app.services.image_storage import (
    ImageStorageError,
    image_storage_service,
)
from app.services.supabase_storage import (
    SupabaseStorageError,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/predictions",
    tags=["Prediction History"],
)


# ---------------------------------------------------------------------------
# User-facing response schemas
# ---------------------------------------------------------------------------


class HistoryDiagnosis(BaseModel):
    title: str
    summary: str


class HistoryDiseaseInfo(BaseModel):
    overview: str
    symptoms: list[str]
    possible_causes: list[str]
    spread: list[str]


class HistoryTreatment(BaseModel):
    prevention: list[str]
    management: list[str]
    professional_help_message: str


class HistoryLLMContent(BaseModel):
    diagnosis: HistoryDiagnosis
    disease_info: HistoryDiseaseInfo
    treatment: HistoryTreatment


class PredictionHistoryItem(BaseModel):
    request_id: UUID
    selected_crop: str

    decision: str
    predicted_class_code: str | None
    predicted_class_name: str | None
    message: str | None

    llm_content: HistoryLLMContent | None = None

    image_saved: bool
    image_content_type: str | None

    image_url: str | None = None
    image_url_expires_in_seconds: int | None = None

    created_at: datetime


class PredictionHistoryDetail(
    PredictionHistoryItem
):
    pass


class PredictionHistoryListResponse(BaseModel):
    count: int
    images_included: bool
    items: list[PredictionHistoryItem]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def create_temporary_image_url(
    record: PredictionRecord,
    *,
    include_image: bool,
) -> tuple[str | None, int | None]:
    """
    Generate a fresh temporary signed URL for a
    stored prediction image.

    The signed URL is never stored permanently
    in the database.
    """

    if not include_image:
        return None, None

    if (
        not record.image_saved
        or not record.image_object_key
    ):
        return None, None

    if not settings.object_storage_enabled:
        return None, None

    try:
        signed_url = (
            image_storage_service
            .create_signed_url(
                record.image_object_key
            )
        )

        return (
            signed_url,
            settings.signed_url_expiry_seconds,
        )

    except (
        ImageStorageError,
        SupabaseStorageError,
    ):
        logger.exception(
            "Could not create signed image URL "
            "for request_id=%s",
            record.request_id,
        )

        return None, None


def extract_llm_content(
    record: PredictionRecord,
) -> dict[str, Any] | None:
    """
    Extract the previously generated LLM content
    from the existing prediction_data JSONB.

    No new database column is required.
    """

    prediction_data = record.prediction_data

    if not isinstance(
        prediction_data,
        dict,
    ):
        return None

    llm_content = prediction_data.get(
        "llm_content"
    )

    if not isinstance(
        llm_content,
        dict,
    ):
        return None

    if not prediction_data.get(
        "llm_generated",
        False,
    ):
        return None

    return llm_content


def extract_user_message(
    record: PredictionRecord,
) -> str | None:
    """
    Extract the user-safe prediction message
    from stored prediction_data.
    """

    prediction_data = record.prediction_data

    if not isinstance(
        prediction_data,
        dict,
    ):
        return None

    message = prediction_data.get(
        "message"
    )

    if isinstance(message, str):
        return message

    return None


def build_history_item(
    record: PredictionRecord,
    *,
    include_image: bool,
) -> PredictionHistoryItem:

    (
        image_url,
        expiry_seconds,
    ) = create_temporary_image_url(
        record,
        include_image=include_image,
    )

    llm_content = extract_llm_content(
        record
    )

    return PredictionHistoryItem(
        request_id=record.request_id,
        selected_crop=record.selected_crop,

        decision=record.decision,
        predicted_class_code=(
            record.predicted_class_code
        ),
        predicted_class_name=(
            record.predicted_class_name
        ),
        message=extract_user_message(
            record
        ),

        llm_content=llm_content,

        image_saved=record.image_saved,
        image_content_type=(
            record.image_content_type
        ),

        image_url=image_url,
        image_url_expires_in_seconds=(
            expiry_seconds
        ),

        created_at=record.created_at,
    )


# ---------------------------------------------------------------------------
# History endpoints
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=PredictionHistoryListResponse,
)
def get_prediction_history(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    include_images: bool = Query(
        default=False,
        description=(
            "Generate temporary private image "
            "URLs for stored prediction images."
        ),
    ),
    current_user: User = Depends(
        get_current_user
    ),
    session: Session = Depends(
        get_db_session
    ),
) -> PredictionHistoryListResponse:

    try:
        records = list_recent_predictions(
            session,
            limit=limit,
            user_id=current_user.id,
        )

    except TypeError:
        # Compatibility fallback in case the current
        # repository does not yet accept user_id.
        try:
            all_records = list_recent_predictions(
                session,
                limit=limit,
            )

            records = [
                record
                for record in all_records
                if record.user_id == current_user.id
            ]

        except PredictionRepositoryError as error:
            raise HTTPException(
                status_code=(
                    status.HTTP_503_SERVICE_UNAVAILABLE
                ),
                detail={
                    "reason_code": (
                        "PREDICTION_HISTORY_UNAVAILABLE"
                    ),
                    "message": (
                        "Prediction history could "
                        "not be retrieved."
                    ),
                },
            ) from error

    except PredictionRepositoryError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": (
                    "PREDICTION_HISTORY_UNAVAILABLE"
                ),
                "message": (
                    "Prediction history could "
                    "not be retrieved."
                ),
            },
        ) from error

    return PredictionHistoryListResponse(
        count=len(records),
        images_included=include_images,
        items=[
            build_history_item(
                record,
                include_image=include_images,
            )
            for record in records
        ],
    )


@router.get(
    "/{request_id}",
    response_model=PredictionHistoryDetail,
)
def get_prediction_history_item(
    request_id: UUID,
    include_image: bool = Query(
        default=True,
        description=(
            "Generate a temporary private image "
            "URL when the prediction has a "
            "stored image."
        ),
    ),
    current_user: User = Depends(
        get_current_user
    ),
    session: Session = Depends(
        get_db_session
    ),
) -> PredictionHistoryDetail:

    try:
        record = get_prediction_by_request_id(
            session,
            request_id,
        )

    except PredictionRepositoryError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": (
                    "PREDICTION_HISTORY_UNAVAILABLE"
                ),
                "message": (
                    "The prediction could not "
                    "be retrieved."
                ),
            },
        ) from error

    if (
        record is None
        or record.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail={
                "reason_code": (
                    "PREDICTION_NOT_FOUND"
                ),
                "message": (
                    "No prediction exists for "
                    "the supplied request ID."
                ),
            },
        )

    return build_history_item(
        record,
        include_image=include_image,
    )


@router.delete(
    "/{request_id}",
)
def delete_prediction_history_item(
    request_id: UUID,
    current_user: User = Depends(
        get_current_user
    ),
    session: Session = Depends(
        get_db_session
    ),
) -> dict[str, Any]:

    try:
        record = get_prediction_by_request_id(
            session,
            request_id,
        )

    except PredictionRepositoryError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": (
                    "PREDICTION_HISTORY_UNAVAILABLE"
                ),
                "message": (
                    "The prediction could not "
                    "be retrieved."
                ),
            },
        ) from error

    if (
        record is None
        or record.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "reason_code": (
                    "PREDICTION_NOT_FOUND"
                ),
                "message": (
                    "No prediction exists for "
                    "the supplied request ID."
                ),
            },
        )

    image_object_key = record.image_object_key
    image_was_saved = record.image_saved

    # Delete the stored image first.
    #
    # If image deletion fails, we keep the database
    # record so that the user does not lose the
    # history record while the image still exists.
    if (
        image_was_saved
        and image_object_key
        and settings.object_storage_enabled
    ):
        try:
            image_storage_service.delete_image(
                image_object_key
            )

        except (
            ImageStorageError,
            SupabaseStorageError,
        ) as error:
            logger.exception(
                "Could not delete stored image "
                "for request_id=%s",
                request_id,
            )

            raise HTTPException(
                status_code=(
                    status.HTTP_503_SERVICE_UNAVAILABLE
                ),
                detail={
                    "reason_code": (
                        "IMAGE_DELETE_FAILED"
                    ),
                    "message": (
                        "The scan could not be "
                        "deleted because its stored "
                        "image could not be removed."
                    ),
                },
            ) from error

    # Delete the database record.
    #
    # This also removes the stored LLM content
    # because llm_content lives inside prediction_data.
    try:
        deleted_record = delete_prediction_record(
            session,
            request_id,
        )

    except PredictionRepositoryError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": (
                    "PREDICTION_DELETE_FAILED"
                ),
                "message": (
                    "The scan image was removed, "
                    "but the prediction history "
                    "could not be deleted."
                ),
            },
        ) from error

    if (
        deleted_record is None
        or deleted_record.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "reason_code": (
                    "PREDICTION_NOT_FOUND"
                ),
                "message": (
                    "No prediction exists for "
                    "the supplied request ID."
                ),
            },
        )

    return {
        "request_id": request_id,
        "deleted": True,
        "image_deleted": (
            image_was_saved
            and image_object_key is not None
            and settings.object_storage_enabled
        ),
        "message": (
            "The scan, stored image, and "
            "generated content were deleted."
        ),
    }
