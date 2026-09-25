from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx


class WeatherProviderError(RuntimeError):
    """Raised when live weather data cannot be retrieved."""


WEATHER_CODE_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def describe_weather_code(
    weather_code: int | None,
) -> str:
    if weather_code is None:
        return "Unknown"

    return WEATHER_CODE_DESCRIPTIONS.get(
        weather_code,
        "Unknown weather condition",
    )


class OpenMeteoService:
    BASE_URL = (
        "https://api.open-meteo.com/v1/forecast"
    )

    def __init__(
        self,
        timeout_seconds: float = 10.0,
    ):
        self.timeout_seconds = timeout_seconds

    def fetch_weather(
        self,
        *,
        latitude: float,
        longitude: float,
    ) -> dict[str, Any]:
        parameters = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m",
                ]
            ),
            "hourly": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation_probability",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m",
                ]
            ),
            "daily": ",".join(
                [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_probability_max",
                    "wind_speed_10m_max",
                ]
            ),
            "forecast_days": 5,
            "timezone": "auto",
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
        }

        try:
            with httpx.Client(
                timeout=self.timeout_seconds
            ) as client:
                response = client.get(
                    self.BASE_URL,
                    params=parameters,
                )

                response.raise_for_status()
                provider_data = response.json()

        except (
            httpx.HTTPError,
            ValueError,
        ) as error:
            raise WeatherProviderError(
                "Unable to retrieve weather data "
                "from Open-Meteo."
            ) from error

        try:
            return self._normalize_response(
                provider_data
            )
        except (
            KeyError,
            TypeError,
            ValueError,
            IndexError,
        ) as error:
            raise WeatherProviderError(
                "Open-Meteo returned an unexpected "
                "response structure."
            ) from error

    def _normalize_response(
        self,
        provider_data: dict[str, Any],
    ) -> dict[str, Any]:
        current = provider_data["current"]
        hourly = provider_data["hourly"]
        daily = provider_data["daily"]

        current_time = datetime.fromisoformat(
            current["time"]
        )

        hourly_times = [
            datetime.fromisoformat(value)
            for value in hourly["time"]
        ]

        starting_index = next(
            (
                index
                for index, value
                in enumerate(hourly_times)
                if value >= current_time
            ),
            0,
        )

        ending_index = min(
            starting_index + 6,
            len(hourly_times),
        )

        next_six_hours = []

        for index in range(
            starting_index,
            ending_index,
        ):
            weather_code = hourly[
                "weather_code"
            ][index]

            next_six_hours.append(
                {
                    "time": hourly["time"][index],
                    "temperature_c": hourly[
                        "temperature_2m"
                    ][index],
                    "humidity_percent": hourly[
                        "relative_humidity_2m"
                    ][index],
                    "rain_probability_percent": hourly[
                        "precipitation_probability"
                    ][index],
                    "precipitation_mm": hourly[
                        "precipitation"
                    ][index],
                    "wind_speed_kmh": hourly[
                        "wind_speed_10m"
                    ][index],
                    "weather_code": weather_code,
                    "condition": (
                        describe_weather_code(
                            weather_code
                        )
                    ),
                }
            )

        rain_probabilities = [
            item["rain_probability_percent"]
            for item in next_six_hours
            if item[
                "rain_probability_percent"
            ] is not None
        ]

        wind_speeds = [
            item["wind_speed_kmh"]
            for item in next_six_hours
            if item["wind_speed_kmh"] is not None
        ]

        daily_forecast = []

        for index, date in enumerate(
            daily["time"]
        ):
            weather_code = daily[
                "weather_code"
            ][index]

            daily_forecast.append(
                {
                    "date": date,
                    "weather_code": weather_code,
                    "condition": (
                        describe_weather_code(
                            weather_code
                        )
                    ),
                    "temperature_max_c": daily[
                        "temperature_2m_max"
                    ][index],
                    "temperature_min_c": daily[
                        "temperature_2m_min"
                    ][index],
                    "rain_probability_max_percent": daily[
                        "precipitation_probability_max"
                    ][index],
                    "wind_speed_max_kmh": daily[
                        "wind_speed_10m_max"
                    ][index],
                }
            )

        current_weather_code = current[
            "weather_code"
        ]

        return {
            "provider": "open-meteo",
            "latitude": provider_data[
                "latitude"
            ],
            "longitude": provider_data[
                "longitude"
            ],
            "timezone": provider_data.get(
                "timezone"
            ),
            "timezone_abbreviation": (
                provider_data.get(
                    "timezone_abbreviation"
                )
            ),
            "current": {
                "time": current["time"],
                "temperature_c": current[
                    "temperature_2m"
                ],
                "humidity_percent": current[
                    "relative_humidity_2m"
                ],
                "precipitation_mm": current[
                    "precipitation"
                ],
                "wind_speed_kmh": current[
                    "wind_speed_10m"
                ],
                "weather_code": (
                    current_weather_code
                ),
                "condition": (
                    describe_weather_code(
                        current_weather_code
                    )
                ),
            },
            "next_6_hours": next_six_hours,
            "next_6_hours_summary": {
                "maximum_rain_probability_percent": (
                    max(rain_probabilities)
                    if rain_probabilities
                    else None
                ),
                "maximum_wind_speed_kmh": (
                    max(wind_speeds)
                    if wind_speeds
                    else None
                ),
            },
            "daily_forecast": daily_forecast,
        }


open_meteo_service = OpenMeteoService()