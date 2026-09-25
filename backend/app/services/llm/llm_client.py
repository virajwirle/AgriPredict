from __future__ import annotations

from mistralai.client import Mistral

from app.core.config import settings
from app.services.llm.schemas import LLMContent


class MistralLLMClient:
    """
    Thin wrapper around the Mistral API.

    This class is responsible only for communicating
    with Mistral and validating the structured response.
    """

    def __init__(self) -> None:
        if not settings.mistral_api_key:
            raise RuntimeError(
                "MISTRAL_API_KEY is not configured."
            )

        if not settings.mistral_enabled:
            raise RuntimeError(
                "Mistral LLM is disabled."
            )

        self.client = Mistral(
            api_key=settings.mistral_api_key,
        )

        self.model = settings.mistral_model

    def generate(
        self,
        *,
        messages: list[dict[str, str]],
    ) -> LLMContent:
        response = self.client.chat.parse(
            model=self.model,
            messages=messages,
            response_format=LLMContent,
            temperature=0,
        )

        parsed = response.choices[0].message.parsed

        if parsed is None:
            raise RuntimeError(
                "Mistral returned an empty structured response."
            )

        return parsed