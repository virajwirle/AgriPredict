from __future__ import annotations

from typing import Any

from app.knowledge.schemas import DiseaseKnowledge
from app.services.llm.llm_client import MistralLLMClient
from app.services.llm.prompt_builder import build_llm_messages
from app.services.llm.schemas import LLMContent


class LLMService:
    """
    Orchestrates disease knowledge, weather context,
    prompt construction, and Mistral structured output.
    """

    def __init__(self) -> None:
        self.client = MistralLLMClient()

    def generate_content(
        self,
        *,
        crop: str,
        class_code: str,
        class_name: str,
        confidence: float,
        knowledge: DiseaseKnowledge,
        weather: dict[str, Any] | None = None,
    ) -> LLMContent:
        messages = build_llm_messages(
            crop=crop,
            class_code=class_code,
            class_name=class_name,
            confidence=confidence,
            knowledge=knowledge,
            weather=weather,
        )

        return self.client.generate(
            messages=messages,
        )


llm_service = LLMService()