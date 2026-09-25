from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal


SprayingStatus = Literal[
    "GOOD",
    "CAUTION",
    "NOT_RECOMMENDED",
    "UNKNOWN",
]

DiseaseRiskLevel = Literal[
    "LOW",
    "MODERATE",
    "HIGH",
    "UNKNOWN",
]


@dataclass(frozen=True)
class SprayingAssessment:
    status: SprayingStatus
    headline: str
    reasons: list[str]
    recommendation: str
    disclaimer: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class DiseaseRiskAssessment:
    level: DiseaseRiskLevel
    headline: str
    risk_factors: list[str]
    protective_factors: list[str]
    summary: str

    def to_dict(self) -> dict:
        return asdict(self)


class WeatherDecisionService:
    """
    Provides generic weather screening for a project demonstration.

    This service does not replace pesticide-label instructions,
    local agricultural guidance or professional advice.
    """

    RAIN_PROBABILITY_LIMIT = 60.0
    WIND_SPEED_LIMIT_KMH = 15.0
    HIGH_TEMPERATURE_C = 32.0
    LOW_TEMPERATURE_C = 10.0
    HIGH_HUMIDITY_PERCENT = 85.0

    DISEASE_HIGH_HUMIDITY = 80.0
    DISEASE_MODERATE_HUMIDITY = 70.0
    DISEASE_WARM_MIN_C = 18.0
    DISEASE_WARM_MAX_C = 30.0

    DISCLAIMER = (
        "This is a general weather-based indication. "
        "Always follow the product label and local "
        "agricultural guidance before spraying."
    )

    def assess_spraying_condition(
        self,
        *,
        temperature_c: float | None,
        humidity_percent: float | None,
        precipitation_mm: float | None,
        maximum_rain_probability_next_6h: float | None,
        maximum_wind_speed_next_6h_kmh: float | None,
    ) -> SprayingAssessment:
        values = (
            temperature_c,
            humidity_percent,
            precipitation_mm,
            maximum_rain_probability_next_6h,
            maximum_wind_speed_next_6h_kmh,
        )

        if all(value is None for value in values):
            return SprayingAssessment(
                status="UNKNOWN",
                headline="Weather data unavailable",
                reasons=[
                    "The required weather measurements "
                    "could not be retrieved."
                ],
                recommendation=(
                    "Check local conditions before spraying."
                ),
                disclaimer=self.DISCLAIMER,
            )

        blocking_reasons: list[str] = []

        if (
            precipitation_mm is not None
            and precipitation_mm > 0.0
        ):
            blocking_reasons.append(
                "Rain or precipitation is currently occurring."
            )

        if (
            maximum_rain_probability_next_6h is not None
            and maximum_rain_probability_next_6h
            >= self.RAIN_PROBABILITY_LIMIT
        ):
            blocking_reasons.append(
                "Rain probability is high during "
                "the next 6 hours."
            )

        if (
            maximum_wind_speed_next_6h_kmh is not None
            and maximum_wind_speed_next_6h_kmh
            >= self.WIND_SPEED_LIMIT_KMH
        ):
            blocking_reasons.append(
                "Wind may cause spray drift."
            )

        if blocking_reasons:
            return SprayingAssessment(
                status="NOT_RECOMMENDED",
                headline=(
                    "Current conditions are not suitable "
                    "for general spraying"
                ),
                reasons=blocking_reasons,
                recommendation=(
                    "Wait for a drier, lower-wind period "
                    "and recheck the forecast."
                ),
                disclaimer=self.DISCLAIMER,
            )

        caution_reasons: list[str] = []

        if (
            temperature_c is not None
            and temperature_c
            >= self.HIGH_TEMPERATURE_C
        ):
            caution_reasons.append(
                "Temperature is high."
            )

        if (
            temperature_c is not None
            and temperature_c
            <= self.LOW_TEMPERATURE_C
        ):
            caution_reasons.append(
                "Temperature is low."
            )

        if (
            humidity_percent is not None
            and humidity_percent
            >= self.HIGH_HUMIDITY_PERCENT
        ):
            caution_reasons.append(
                "Humidity is very high."
            )

        if caution_reasons:
            return SprayingAssessment(
                status="CAUTION",
                headline=(
                    "Review conditions before spraying"
                ),
                reasons=caution_reasons,
                recommendation=(
                    "Check the product label and consider "
                    "waiting for milder conditions."
                ),
                disclaimer=self.DISCLAIMER,
            )

        return SprayingAssessment(
            status="GOOD",
            headline=(
                "Weather conditions appear generally suitable"
            ),
            reasons=[
                "No rain, strong wind or extreme temperature "
                "threshold was detected."
            ],
            recommendation=(
                "Confirm field conditions and follow the "
                "product label before spraying."
            ),
            disclaimer=self.DISCLAIMER,
        )

    def assess_general_disease_risk(
        self,
        *,
        temperature_c: float | None,
        humidity_percent: float | None,
        precipitation_mm: float | None,
        maximum_rain_probability_next_6h: float | None,
    ) -> DiseaseRiskAssessment:
        if (
            temperature_c is None
            and humidity_percent is None
            and precipitation_mm is None
        ):
            return DiseaseRiskAssessment(
                level="UNKNOWN",
                headline="Disease-weather risk unavailable",
                risk_factors=[],
                protective_factors=[],
                summary=(
                    "There is not enough weather data "
                    "to estimate general disease-favourable "
                    "conditions."
                ),
            )

        risk_score = 0
        risk_factors: list[str] = []
        protective_factors: list[str] = []

        if (
            humidity_percent is not None
            and humidity_percent
            >= self.DISEASE_HIGH_HUMIDITY
        ):
            risk_score += 2
            risk_factors.append(
                "Humidity is above 80%."
            )

        elif (
            humidity_percent is not None
            and humidity_percent
            >= self.DISEASE_MODERATE_HUMIDITY
        ):
            risk_score += 1
            risk_factors.append(
                "Humidity is moderately high."
            )

        elif humidity_percent is not None:
            protective_factors.append(
                "Humidity is currently below 70%."
            )

        if (
            precipitation_mm is not None
            and precipitation_mm > 0.0
        ):
            risk_score += 2
            risk_factors.append(
                "Current precipitation may increase "
                "leaf wetness."
            )

        if (
            maximum_rain_probability_next_6h is not None
            and maximum_rain_probability_next_6h
            >= self.RAIN_PROBABILITY_LIMIT
        ):
            risk_score += 1
            risk_factors.append(
                "Rain is likely during the next 6 hours."
            )

        if (
            temperature_c is not None
            and self.DISEASE_WARM_MIN_C
            <= temperature_c
            <= self.DISEASE_WARM_MAX_C
        ):
            risk_score += 1
            risk_factors.append(
                "Temperature is within a range that may "
                "support development of some plant diseases."
            )

        elif temperature_c is not None:
            protective_factors.append(
                "Temperature is outside the configured "
                "general warm-risk range."
            )

        if risk_score >= 4:
            level: DiseaseRiskLevel = "HIGH"
            headline = (
                "Weather may strongly favor some "
                "plant diseases"
            )

        elif risk_score >= 2:
            level = "MODERATE"
            headline = (
                "Some disease-favourable weather "
                "conditions are present"
            )

        else:
            level = "LOW"
            headline = (
                "Few general disease-favourable "
                "conditions are present"
            )

        return DiseaseRiskAssessment(
            level=level,
            headline=headline,
            risk_factors=risk_factors,
            protective_factors=protective_factors,
            summary=(
                "This is a general weather-risk estimate, "
                "not a disease diagnosis. Crop- and "
                "disease-specific analysis is performed "
                "after an accepted model prediction."
            ),
        )


weather_decision_service = WeatherDecisionService()