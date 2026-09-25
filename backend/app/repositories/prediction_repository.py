from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models import PredictionRecord


class PredictionRepositoryError(RuntimeError):
    """Raised when a prediction database operation fails."""


def _to_uuid(value: str | uuid.UUID) -> uuid.UUID:
    if isinstance(value, uuid.UUID):
        return value

    try:
        return uuid.UUID(value)
    except (TypeError, ValueError, AttributeError) as error:
        raise ValueError(
            f"Invalid request ID: {value}"
        ) from error


def create_prediction_record(
    session: Session,
    *,
    request_id: str | uuid.UUID,
    selected_crop: str,
    model_id: str,
    model_version: str,
    decision: str,
    image_quality_status: str,
    validation_data: dict[str, Any],
    prediction_data: dict[str, Any],
    processing_time_ms: float | None,
    user_id: str | uuid.UUID | None = None,
    image_object_key: str | None = None,
    image_content_type: str | None = None,
    image_saved: bool = False,
    training_consent: bool = False,
) -> PredictionRecord:
    normalized_user_id = (
        _to_uuid(user_id)
        if user_id is not None
        else None
    )

    record = PredictionRecord(
        request_id=_to_uuid(request_id),
        user_id=normalized_user_id,
        selected_crop=selected_crop.lower().strip(),
        model_id=model_id,
        model_version=model_version,
        decision=decision,
        predicted_class_code=prediction_data.get(
            "predicted_class_code"
        ),
        predicted_class_name=prediction_data.get(
            "predicted_class"
        ),
        confidence=prediction_data.get("confidence"),
        probability_margin=prediction_data.get(
            "probability_margin"
        ),
        reliability_score=prediction_data.get(
            "reliability_score"
        ),
        reliability_threshold=prediction_data.get(
            "reliability_threshold"
        ),
        image_quality_status=image_quality_status,
        validation_data=validation_data,
        prediction_data=prediction_data,
        image_object_key=image_object_key,
        image_content_type=image_content_type,
        image_saved=image_saved,
        training_consent=training_consent,
        processing_time_ms=processing_time_ms,
    )

    try:
        session.add(record)
        session.commit()
        session.refresh(record)
        return record

    except SQLAlchemyError as error:
        session.rollback()

        raise PredictionRepositoryError(
            "Failed to save the prediction record."
        ) from error


def get_prediction_by_request_id(
    session: Session,
    request_id: str | uuid.UUID,
) -> PredictionRecord | None:
    statement = select(PredictionRecord).where(
        PredictionRecord.request_id == _to_uuid(request_id)
    )

    try:
        return session.scalar(statement)

    except SQLAlchemyError as error:
        raise PredictionRepositoryError(
            "Failed to retrieve the prediction record."
        ) from error


def list_recent_predictions(
    session: Session,
    *,
    limit: int = 20,
    user_id: str | uuid.UUID | None = None,
) -> list[PredictionRecord]:
    safe_limit = min(max(limit, 1), 100)

    statement = (
        select(PredictionRecord)
        .order_by(PredictionRecord.created_at.desc())
        .limit(safe_limit)
    )

    if user_id is not None:
        statement = statement.where(
            PredictionRecord.user_id == _to_uuid(user_id)
        )

    try:
        return list(
            session.scalars(statement).all()
        )

    except SQLAlchemyError as error:
        raise PredictionRepositoryError(
            "Failed to list prediction records."
        ) from error


def delete_prediction_record(
    session: Session,
    request_id: str | uuid.UUID,
) -> PredictionRecord | None:
    """
    Delete a prediction record from PostgreSQL.

    Returns the deleted record so the caller can
    use its image_object_key before the record
    disappears.
    """

    record = get_prediction_by_request_id(
        session,
        request_id,
    )

    if record is None:
        return None

    try:
        session.delete(record)
        session.commit()

        return record

    except SQLAlchemyError as error:
        session.rollback()

        raise PredictionRepositoryError(
            "Failed to delete the prediction record."
        ) from error