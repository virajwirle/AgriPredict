from __future__ import annotations


import logging
from hashlib import sha256
from time import perf_counter
from typing import Any
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from starlette.concurrency import run_in_threadpool

from app.api.dependencies import get_current_user
from app.db.models import User
from app.core.config import settings
from app.db.session import SessionLocal
from app.inference.model_registry import model_registry
from app.inference.predictor_manager import (
    PredictorManagerError,
    predictor_manager,
)
from app.repositories.prediction_repository import (
    PredictionRepositoryError,
    create_prediction_record,
)
from app.services.disease_knowledge_service import (
    disease_knowledge_service,
)
from app.services.image_storage import (
    ImageStorageError,
    StoredImage,
    image_storage_service,
)
from app.services.llm.llm_service import llm_service
from app.services.supabase_storage import (
    SupabaseStorageError,
)
from app.validators.image_quality import (
    image_quality_validator,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/predict",
    tags=["Prediction"],
)


# =========================================================
# DATABASE PERSISTENCE
# =========================================================

def save_prediction_to_database(
    *,
    user_id,
    request_id: str,
    selected_crop: str,
    model_id: str,
    model_version: str,
    decision: str,
    image_quality_status: str,
    validation_data: dict[str, Any],
    prediction_data: dict[str, Any],
    processing_time_ms: float,
    image_object_key: str | None = None,
    image_content_type: str | None = None,
    image_saved: bool = False,
) -> None:
    """
    Save the prediction using a database session
    created inside the worker thread.
    """

    with SessionLocal() as session:
        create_prediction_record(
            session=session,
            user_id=user_id,
            request_id=request_id,
            selected_crop=selected_crop,
            model_id=model_id,
            model_version=model_version,
            decision=decision,
            image_quality_status=image_quality_status,
            validation_data=validation_data,
            prediction_data=prediction_data,
            processing_time_ms=processing_time_ms,
            image_object_key=image_object_key,
            image_content_type=image_content_type,
            image_saved=image_saved,
            training_consent=False,
        )


async def persist_prediction_safely(
    *,
    user_id,
    request_id: str,
    selected_crop: str,
    model_id: str,
    model_version: str,
    decision: str,
    image_quality_status: str,
    validation_data: dict[str, Any],
    prediction_data: dict[str, Any],
    processing_time_ms: float,
    image_object_key: str | None = None,
    image_content_type: str | None = None,
    image_saved: bool = False,
) -> bool:
    """
    Database failure must not discard a valid prediction.
    """

    try:
        await run_in_threadpool(
            save_prediction_to_database,
            user_id=user_id,
            request_id=request_id,
            selected_crop=selected_crop,
            model_id=model_id,
            model_version=model_version,
            decision=decision,
            image_quality_status=image_quality_status,
            validation_data=validation_data,
            prediction_data=prediction_data,
            processing_time_ms=processing_time_ms,
            image_object_key=image_object_key,
            image_content_type=image_content_type,
            image_saved=image_saved,
        )

        return True

    except (
        PredictionRepositoryError,
        ValueError,
    ):
        logger.exception(
            "Prediction persistence failed "
            "for request_id=%s",
            request_id,
        )

        return False


# =========================================================
# IMAGE CLEANUP
# =========================================================

async def delete_stored_image_safely(
    object_key: str,
    request_id: str,
) -> bool:
    """
    Remove an uploaded image if its database record
    could not be saved.
    """

    try:
        await run_in_threadpool(
            image_storage_service.delete_image,
            object_key,
        )

        return True

    except (
        ImageStorageError,
        SupabaseStorageError,
    ):
        logger.exception(
            "Stored image cleanup failed "
            "for request_id=%s object_key=%s",
            request_id,
            object_key,
        )

        return False


# =========================================================
# USER-FACING PREDICTION
# =========================================================

def build_user_prediction(
    *,
    crop: str,
    prediction: dict[str, Any],
) -> dict[str, Any]:
    """
    Build the user-facing prediction response.

    Only user-relevant information is exposed.

    Technical/internal ML information such as:
    - decision
    - class code
    - confidence
    - probability margin
    - reliability score
    - reliability threshold
    - top predictions
    - model internals

    is intentionally excluded from this response.
    """

    return {
        "crop": crop,
        "class_name": prediction.get(
            "predicted_class"
        ),
        "message": prediction.get(
            "message"
        ),
    }


# =========================================================
# PREDICTION ENDPOINT
# =========================================================

@router.post("")
async def predict_disease(
    crop: str = Form(...),
    current_user: User = Depends(get_current_user),
    language: str = Form("en"),
    save_to_history: bool = Form(True),
    image: UploadFile = File(...),
):
    request_started = perf_counter()
    request_id = str(uuid4())

    normalized_crop = crop.strip().lower()

    normalized_language = (
        language.strip().lower()
        or "en"
    )

    # =====================================================
    # 1. VALIDATE CROP
    # =====================================================

    if not normalized_crop:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail={
                "request_id": request_id,
                "reason_code": "CROP_REQUIRED",
                "message": (
                    "A crop must be selected."
                ),
            },
        )

    metadata = model_registry.get_model(
        normalized_crop
    )

    if (
        metadata is None
        or not metadata.enabled
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "request_id": request_id,
                "reason_code": "UNSUPPORTED_CROP",
                "message": (
                    f"The crop '{normalized_crop}' "
                    "is not currently supported."
                ),
                "supported_crops": sorted(
                    model_registry
                    .get_enabled_models()
                    .keys()
                ),
            },
        )

    # =====================================================
    # 2. VALIDATE IMAGE TYPE
    # =====================================================

    if (
        image.content_type
        not in settings.allowed_content_types
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            ),
            detail={
                "request_id": request_id,
                "reason_code": (
                    "UNSUPPORTED_IMAGE_TYPE"
                ),
                "message": (
                    "Upload a JPEG, PNG or "
                    "WebP image."
                ),
            },
        )

    maximum_bytes = (
        settings.max_upload_size_mb
        * 1024
        * 1024
    )

    # =====================================================
    # 3. READ IMAGE
    # =====================================================

    try:
        image_bytes = await image.read(
            maximum_bytes + 1
        )
    finally:
        await image.close()

    image_fingerprint = sha256(
        image_bytes
    ).hexdigest()[:16]

    logger.info(
        "Image received request_id=%s crop=%s "
        "filename=%s bytes=%s sha256=%s",
        request_id,
        normalized_crop,
        image.filename,
        len(image_bytes),
        image_fingerprint,
    )

    if len(image_bytes) > maximum_bytes:
        raise HTTPException(
            status_code=(
                status.HTTP_413_CONTENT_TOO_LARGE
            ),
            detail={
                "request_id": request_id,
                "reason_code": "IMAGE_TOO_LARGE",
                "message": (
                    "The uploaded image exceeds "
                    f"{settings.max_upload_size_mb} MB."
                ),
            },
        )

    # =====================================================
    # 4. IMAGE QUALITY VALIDATION
    # =====================================================

    quality_started = perf_counter()

    (
        decoded_image,
        quality_result,
    ) = await run_in_threadpool(
        image_quality_validator.validate,
        image_bytes,
    )

    quality_ms = round(
        (
            perf_counter()
            - quality_started
        )
        * 1000,
        2,
    )

    validation = {
        "image_quality": {
            "status": (
                "PASSED"
                if quality_result.passed
                else "FAILED"
            ),
            **quality_result.to_dict(),
        },
        "plant_validation": {
            "status": "NOT_RUN",
            "reason": (
                "VALIDATOR_NOT_ENABLED"
            ),
        },
        "crop_validation": {
            "status": "NOT_RUN",
            "reason": (
                "VALIDATOR_NOT_ENABLED"
            ),
        },
    }

    # =====================================================
    # 5. QUALITY FAILURE
    # =====================================================

    if not quality_result.passed:
        total_ms = round(
            (
                perf_counter()
                - request_started
            )
            * 1000,
            2,
        )

        failed_prediction_data = {
            "decision": "RETAKE_IMAGE",
            "predicted_class_code": None,
            "predicted_class": None,
            "confidence": None,
            "probability_margin": None,
            "reliability_score": None,
            "reliability_threshold": None,
            "reason_code": (
                quality_result.reason_code
            ),
            "message": (
                quality_result.message
            ),
            "requested_language": (
                normalized_language
            ),
            "llm_generated": False,
            "llm_content": None,
        }

        if save_to_history:
            history_saved = (
                await persist_prediction_safely(
                    user_id=current_user.id,
                    request_id=request_id,
                    selected_crop=normalized_crop,
                    model_id=metadata.model_id,
                    model_version=metadata.version,
                    decision="RETAKE_IMAGE",
                    image_quality_status="FAILED",
                    validation_data=validation,
                    prediction_data=(
                        failed_prediction_data
                    ),
                    processing_time_ms=total_ms,
                    image_saved=False,
                )
            )
        else:
            history_saved = False

        return {
            "request_id": request_id,
            "selected_crop": normalized_crop,
            "language": normalized_language,
            "decision": "RETAKE_IMAGE",
            "reason_code": (
                quality_result.reason_code
            ),
            "message": (
                quality_result.message
            ),
            "validation": validation,
            "prediction": {
                "crop": normalized_crop,
                "decision": "RETAKE_IMAGE",
                "class_code": None,
                "class_name": None,
                "message": (
                    quality_result.message
                ),
            },
            "llm_content": None,
            "image_storage": {
                "status": "SKIPPED",
                "saved": False,
                "object_key": None,
                "signed_url": None,
                "message": (
                    "Images that fail quality "
                    "checks are not stored."
                ),
            },
            "history_saved": history_saved,
            "timing_ms": {
                "image_quality": quality_ms,
                "model_prediction": 0.0,
                "image_storage": 0.0,
                "llm_generation": 0.0,
                "total": total_ms,
            },
        }

    # =====================================================
    # 6. IMAGE DECODE VALIDATION
    # =====================================================

    if decoded_image is None:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail={
                "request_id": request_id,
                "reason_code": (
                    "IMAGE_DECODE_FAILED"
                ),
                "message": (
                    "The uploaded image could "
                    "not be decoded."
                ),
            },
        )

    # =====================================================
    # 7. ML PREDICTION
    # =====================================================

    model_started = perf_counter()

    try:
        prediction = await run_in_threadpool(
            predictor_manager.predict,
            normalized_crop,
            decoded_image,
        )

    except (
        KeyError,
        ValueError,
        PredictorManagerError,
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail={
                "request_id": request_id,
                "reason_code": (
                    "PREDICTION_CONFIGURATION_ERROR"
                ),
                "message": str(error),
            },
        ) from error

    except Exception as error:
        logger.exception(
            "Model inference failed "
            "for request_id=%s crop=%s",
            request_id,
            normalized_crop,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "request_id": request_id,
                "reason_code": (
                    "MODEL_INFERENCE_FAILED"
                ),
                "message": (
                    "The selected model could "
                    "not complete inference."
                ),
            },
        ) from error

    model_ms = round(
        (
            perf_counter()
            - model_started
        )
        * 1000,
        2,
    )

    prediction_decision = prediction.get(
        "decision"
    )

    # =====================================================
    # 8. IMAGE STORAGE
    # =====================================================

    stored_image: StoredImage | None = None

    storage_ms = 0.0

    image_storage_result: dict[
        str,
        Any,
    ] = {
        "status": "NOT_REQUESTED",
        "saved": False,
        "object_key": None,
        "signed_url": None,
        "message": (
            "Image saving was not requested."
        ),
    }

    if save_to_history:
        storage_started = perf_counter()

        if not settings.object_storage_enabled:
            image_storage_result = {
                "status": "UNAVAILABLE",
                "saved": False,
                "object_key": None,
                "signed_url": None,
                "message": (
                    "Image storage is not enabled."
                ),
            }

        else:
            try:
                stored_image = (
                    await run_in_threadpool(
                        image_storage_service
                        .upload_prediction_image,
                        image=decoded_image,
                        request_id=request_id,
                        crop=normalized_crop,
                        include_signed_url=True,
                    )
                )

                image_storage_result = {
                    "status": "SAVED",
                    "saved": True,
                    "object_key": (
                        stored_image.object_key
                    ),
                    "signed_url": (
                        stored_image.signed_url
                    ),
                    "content_type": (
                        stored_image.content_type
                    ),
                    "width": (
                        stored_image.width
                    ),
                    "height": (
                        stored_image.height
                    ),
                    "size_bytes": (
                        stored_image.size_bytes
                    ),
                    "message": (
                        "Image saved successfully."
                    ),
                }

            except (
                ImageStorageError,
                SupabaseStorageError,
            ):
                logger.exception(
                    "Image storage failed "
                    "for request_id=%s",
                    request_id,
                )

                image_storage_result = {
                    "status": "FAILED",
                    "saved": False,
                    "object_key": None,
                    "signed_url": None,
                    "message": (
                        "Prediction completed, but "
                        "the image could not be saved."
                    ),
                }

        storage_ms = round(
            (
                perf_counter()
                - storage_started
            )
            * 1000,
            2,
        )

    # =====================================================
    # 9. LLM GENERATION
    #
    # Only ACCEPT predictions reach this section.
    # UNCERTAIN/OOD predictions do not call the LLM.
    # =====================================================

    llm_content = None
    llm_error = None
    llm_ms = 0.0

    if prediction_decision == "ACCEPT":

        predicted_class_code = prediction.get(
            "predicted_class_code"
        )

        predicted_class_name = prediction.get(
            "predicted_class"
        )

        confidence = prediction.get(
            "confidence"
        )

        if (
            predicted_class_code
            and predicted_class_name
            and confidence is not None
        ):
            llm_started = perf_counter()

            try:
                knowledge = (
                    disease_knowledge_service.require(
                        normalized_crop,
                        predicted_class_code,
                    )
                )

                llm_content = await run_in_threadpool(
                    llm_service.generate_content,
                    crop=normalized_crop,
                    class_code=predicted_class_code,
                    class_name=predicted_class_name,
                    confidence=float(confidence),
                    knowledge=knowledge,
                    weather=None,
                )

            except Exception as error:
                logger.exception(
                    "LLM generation failed "
                    "for request_id=%s crop=%s "
                    "class_code=%s",
                    request_id,
                    normalized_crop,
                    predicted_class_code,
                )

                llm_error = str(error)

            finally:
                llm_ms = round(
                    (
                        perf_counter()
                        - llm_started
                    )
                    * 1000,
                    2,
                )

    # =====================================================
    # 10. TOTAL PROCESSING TIME
    # =====================================================

    total_ms = round(
        (
            perf_counter()
            - request_started
        )
        * 1000,
        2,
    )

    # =====================================================
    # 11. COMPLETE INTERNAL PREDICTION DATA
    #
    # Technical information remains available internally
    # for database/history purposes.
    # =====================================================

    stored_prediction_data = {
        **prediction,
        "requested_language": (
            normalized_language
        ),
        "llm_generated": (
            llm_content is not None
        ),
        "llm_content": (
            llm_content.model_dump()
            if llm_content is not None
            else None
        ),
        "llm_error": llm_error,
    }

    # =====================================================
    # 12. SAVE PREDICTION HISTORY
    # =====================================================

    if save_to_history:
        history_saved = (
            await persist_prediction_safely(
                user_id=current_user.id,
                request_id=request_id,
                selected_crop=normalized_crop,
                model_id=metadata.model_id,
                model_version=metadata.version,
                decision=prediction.get(
                    "decision",
                    "UNKNOWN",
                ),
                image_quality_status="PASSED",
                validation_data=validation,
                prediction_data=(
                    stored_prediction_data
                ),
                processing_time_ms=total_ms,
                image_object_key=(
                    stored_image.object_key
                    if stored_image is not None
                    else None
                ),
                image_content_type=(
                    stored_image.content_type
                    if stored_image is not None
                    else None
                ),
                image_saved=(
                    stored_image is not None
                ),
            )
        )

    else:
        history_saved = False

    # =====================================================
    # 13. ROLLBACK STORED IMAGE IF HISTORY FAILED
    # =====================================================

    if (
        stored_image is not None
        and not history_saved
    ):
        cleanup_succeeded = (
            await delete_stored_image_safely(
                stored_image.object_key,
                request_id,
            )
        )

        if cleanup_succeeded:
            image_storage_result = {
                "status": "ROLLED_BACK",
                "saved": False,
                "object_key": None,
                "signed_url": None,
                "message": (
                    "The image was removed because "
                    "prediction history could not "
                    "be saved."
                ),
            }

            stored_image = None

        else:
            image_storage_result = {
                **image_storage_result,
                "status": (
                    "ORPHAN_CLEANUP_FAILED"
                ),
                "message": (
                    "The history record failed and "
                    "the uploaded image could not "
                    "be removed automatically."
                ),
            }

    # =====================================================
    # 14. BUILD USER-FACING PREDICTION
    #
    # IMPORTANT:
    # Internal prediction information is NOT exposed.
    # =====================================================

    user_prediction = build_user_prediction(
        crop=normalized_crop,
        prediction=prediction,
    )

    # =====================================================
    # 15. FINAL API RESPONSE
    # =====================================================

    return {
        "request_id": request_id,
        "selected_crop": normalized_crop,
        "prediction": user_prediction,
        "llm_content": (
            llm_content.model_dump()
            if llm_content is not None
            else None
        ),
        "history_saved": history_saved,
    }