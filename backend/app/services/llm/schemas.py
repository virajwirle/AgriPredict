from __future__ import annotations

from pydantic import BaseModel, Field


class LLMDiagnosis(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=150,
    )

    summary: str = Field(
        min_length=1,
        max_length=1000,
    )


class LLMDiseaseInfo(BaseModel):
    overview: str = Field(
        min_length=1,
        max_length=2000,
    )

    symptoms: list[str] = Field(
        default_factory=list,
    )

    possible_causes: list[str] = Field(
        default_factory=list,
    )

    spread: list[str] = Field(
        default_factory=list,
    )


class LLMTreatment(BaseModel):
    prevention: list[str] = Field(
        default_factory=list,
    )

    management: list[str] = Field(
        default_factory=list,
    )

    professional_help_message: str = Field(
        min_length=1,
        max_length=1000,
    )


class LLMContent(BaseModel):
    diagnosis: LLMDiagnosis

    disease_info: LLMDiseaseInfo

    treatment: LLMTreatment