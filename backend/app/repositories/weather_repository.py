from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models import WeatherSnapshot


class WeatherRepositoryError(RuntimeError):
    """Raised when a weather database operation fails."""


def create_weather_snapshot(
    session: Session,
    *,
    latitude: float,
    longitude: float,
    timezone: str | None,
    temperature_c: float | None,
    humidity_percent: float | None,
    precipitation_mm: float | None,
    rain_probability_percent: float | None,
    wind_speed_kmh: float | None,
    weather_code: int | None,
    spraying_status: str,
    disease_risk_level: str,
    summary_data: dict[str, Any],
    provider_data: dict[str, Any],
    location_name: str | None = None,
    prediction_id: uuid.UUID | None = None,
) -> WeatherSnapshot:
    record = WeatherSnapshot(
        prediction_id=prediction_id,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        timezone=timezone,
        temperature_c=temperature_c,
        humidity_percent=humidity_percent,
        precipitation_mm=precipitation_mm,
        rain_probability_percent=(
            rain_probability_percent
        ),
        wind_speed_kmh=wind_speed_kmh,
        weather_code=weather_code,
        spraying_status=spraying_status,
        disease_risk_level=disease_risk_level,
        summary_data=summary_data,
        provider_data=provider_data,
    )

    try:
        session.add(record)
        session.commit()
        session.refresh(record)
        return record

    except SQLAlchemyError as error:
        session.rollback()

        raise WeatherRepositoryError(
            "Failed to save the weather snapshot."
        ) from error