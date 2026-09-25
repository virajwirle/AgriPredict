from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    preferred_language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="en",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    predictions: Mapped[list[PredictionRecord]] = relationship(
        back_populates="user",
    )


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=False,
        index=True,
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    selected_crop: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    model_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    model_version: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    decision: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    predicted_class_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    predicted_class_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    probability_margin: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    reliability_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    reliability_threshold: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    image_quality_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    validation_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    prediction_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    image_object_key: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    image_content_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    image_saved: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    training_consent: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    processing_time_ms: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    user: Mapped[User | None] = relationship(
        back_populates="predictions",
    )

    weather_snapshot: Mapped[WeatherSnapshot | None] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        uselist=False,
    )

    recommendation: Mapped[RecommendationRecord | None] = relationship(
        back_populates="prediction",
        cascade="all, delete-orphan",
        uselist=False,
    )


class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    prediction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "prediction_records.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=True,
        index=True,
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    location_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    timezone: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    temperature_c: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    humidity_percent: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    precipitation_mm: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    rain_probability_percent: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    wind_speed_kmh: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    weather_code: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    spraying_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    disease_risk_level: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    summary_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    provider_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    observed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    prediction: Mapped[PredictionRecord | None] = relationship(
        back_populates="weather_snapshot",
    )


class RecommendationRecord(Base):
    __tablename__ = "recommendation_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "prediction_records.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="en",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    weather_impact: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    urgency: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    response_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    prediction: Mapped[PredictionRecord] = relationship(
        back_populates="recommendation",
    )


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "prediction_records.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    helpful: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    corrected_class_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )