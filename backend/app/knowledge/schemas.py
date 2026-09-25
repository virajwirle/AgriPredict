from __future__ import annotations

from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    HttpUrl,
)


class KnowledgeSource(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=250,
    )

    organization: str = Field(
        min_length=1,
        max_length=150,
    )

    url: HttpUrl


class DiseaseKnowledge(BaseModel):
    crop: str = Field(
        min_length=1,
        max_length=50,
    )

    class_code: str = Field(
        min_length=1,
        max_length=100,
    )

    class_name: str = Field(
        min_length=1,
        max_length=150,
    )

    condition_type: Literal[
        "healthy",
        "fungal",
        "viral",
        "bacterial",
        "pest",
        "physiological",
        "unknown",
    ]

    overview: str = Field(
        min_length=1,
    )

    symptoms: list[str] = Field(
        default_factory=list,
    )

    possible_causes: list[str] = Field(
        default_factory=list,
    )

    favorable_conditions: list[str] = Field(
        default_factory=list,
    )

    spread: list[str] = Field(
        default_factory=list,
    )

    prevention: list[str] = Field(
        default_factory=list,
    )

    management: list[str] = Field(
        default_factory=list,
    )

    professional_help_message: str = Field(
        min_length=1,
    )

    sources: list[KnowledgeSource] = Field(
        min_length=1,
    )