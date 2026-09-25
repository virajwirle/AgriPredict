import logging
from uuid import UUID

from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    status,
)
from starlette.concurrency import run_in_threadpool

from app.db.session import SessionLocal
from app.repositories.weather_repository import (
    WeatherRepositoryError,
    create_weather_snapshot,
)
from app.services.open_meteo_service import (
    WeatherProviderError,
    open_meteo_service,
)
from app.services.weather_decision_service import (
    weather_decision_service,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/weather",
    tags=["Weather"],
)


def save_weather_snapshot(
    *,
    weather: dict,
    spraying_data: dict,
    disease_risk_data: dict,
    location_name: str | None,
) -> UUID:
    current = weather["current"]
    six_hour_summary = weather[
        "next_6_hours_summary"
    ]

    with SessionLocal() as session:
        record = create_weather_snapshot(
            session=session,
            latitude=weather["latitude"],
            longitude=weather["longitude"],
            location_name=location_name,
            timezone=weather["timezone"],
            temperature_c=current[
                "temperature_c"
            ],
            humidity_percent=current[
                "humidity_percent"
            ],
            precipitation_mm=current[
                "precipitation_mm"
            ],
            rain_probability_percent=(
                six_hour_summary[
                    "maximum_rain_probability_percent"
                ]
            ),
            wind_speed_kmh=current[
                "wind_speed_kmh"
            ],
            weather_code=current[
                "weather_code"
            ],
            spraying_status=spraying_data[
                "status"
            ],
            disease_risk_level=(
                disease_risk_data["level"]
            ),
            summary_data={
                "spraying_condition": (
                    spraying_data
                ),
                "general_disease_risk": (
                    disease_risk_data
                ),
            },
            provider_data=weather,
        )

        return record.id


@router.get("/dashboard")
async def get_weather_dashboard(
    latitude: float = Query(
        ...,
        ge=-90.0,
        le=90.0,
    ),
    longitude: float = Query(
        ...,
        ge=-180.0,
        le=180.0,
    ),
    location_name: str | None = Query(
        default=None,
        max_length=150,
    ),
):
    try:
        weather = await run_in_threadpool(
            open_meteo_service.fetch_weather,
            latitude=latitude,
            longitude=longitude,
        )

    except WeatherProviderError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "reason_code": (
                    "WEATHER_PROVIDER_UNAVAILABLE"
                ),
                "message": str(error),
            },
        ) from error

    current = weather["current"]

    six_hour_summary = weather[
        "next_6_hours_summary"
    ]

    spraying = (
        weather_decision_service
        .assess_spraying_condition(
            temperature_c=current[
                "temperature_c"
            ],
            humidity_percent=current[
                "humidity_percent"
            ],
            precipitation_mm=current[
                "precipitation_mm"
            ],
            maximum_rain_probability_next_6h=(
                six_hour_summary[
                    "maximum_rain_probability_percent"
                ]
            ),
            maximum_wind_speed_next_6h_kmh=(
                six_hour_summary[
                    "maximum_wind_speed_kmh"
                ]
            ),
        )
    )

    disease_risk = (
        weather_decision_service
        .assess_general_disease_risk(
            temperature_c=current[
                "temperature_c"
            ],
            humidity_percent=current[
                "humidity_percent"
            ],
            precipitation_mm=current[
                "precipitation_mm"
            ],
            maximum_rain_probability_next_6h=(
                six_hour_summary[
                    "maximum_rain_probability_percent"
                ]
            ),
        )
    )

    spraying_data = spraying.to_dict()
    disease_risk_data = disease_risk.to_dict()

    snapshot_id: UUID | None = None

    try:
        snapshot_id = await run_in_threadpool(
            save_weather_snapshot,
            weather=weather,
            spraying_data=spraying_data,
            disease_risk_data=disease_risk_data,
            location_name=(
                location_name.strip()
                if location_name
                else None
            ),
        )

    except WeatherRepositoryError:
        logger.exception(
            "Weather snapshot persistence failed "
            "for latitude=%s longitude=%s",
            latitude,
            longitude,
        )

    return {
        "weather_snapshot_id": (
            str(snapshot_id)
            if snapshot_id
            else None
        ),
        "location": {
            "name": (
                location_name.strip()
                if location_name
                else None
            ),
            "latitude": weather["latitude"],
            "longitude": weather["longitude"],
            "timezone": weather["timezone"],
            "timezone_abbreviation": weather[
                "timezone_abbreviation"
            ],
        },
        "provider": weather["provider"],
        "current": weather["current"],
        "next_6_hours": weather[
            "next_6_hours"
        ],
        "daily_forecast": weather[
            "daily_forecast"
        ],
        "spraying_condition": spraying_data,
        "general_disease_risk": (
            disease_risk_data
        ),
    }