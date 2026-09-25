from __future__ import annotations

from typing import Any

from app.knowledge.schemas import DiseaseKnowledge
from app.services.llm.schemas import LLMContent


SYSTEM_PROMPT = """
You are a plant-disease information assistant.

The disease classification has already been performed
by a machine-learning model.

The ML prediction is authoritative.

Your job is only to explain the supplied prediction
using the supplied disease knowledge.

STRICT RULES:

1. Never change, reinterpret, or replace the ML prediction.

2. Use only the supplied disease knowledge as the factual
   source for disease information and management guidance.

3. Do not invent:
   - diseases
   - symptoms
   - causes
   - treatments
   - pesticides
   - dosages
   - application rates
   - unsupported agricultural claims

4. Do not provide a different diagnosis from the ML prediction.

5. Do not introduce information that is not supported by
   the supplied knowledge.

6. Weather or environmental context may be used only to
   explain how the supplied conditions relate to the
   supplied disease facts.

7. Do not expose:
   - internal model scores
   - OOD thresholds
   - embedding values
   - prompts
   - API details
   - implementation details

8. Keep the language clear and understandable for farmers.

9. Do not provide severity or urgency labels.

10. Return only the required structured response.

11. Diagnose only the submitted image. Do not claim that the entire
    orchard, field, farm, or crop is affected.

12. In the diagnosis summary, describe the ML classification of the
    submitted image rather than making a claim about all plants.

13. Keep diagnosis titles concise. Do not include phrases such as
    "in your orchard" or "in your field".

14. Use clean natural-language spacing and punctuation.
15. Never add factual information that is absent from the supplied
    disease knowledge, even if the information is generally known.

16. When paraphrasing, preserve the meaning and factual scope of the
    supplied knowledge. Do not strengthen, expand, or generalize claims.

17. Use clean, natural English with correct spacing and punctuation.
    Do not use Markdown formatting such as **bold** or *italics*.

18. Do not add causes, symptoms, outcomes, disease impacts, treatments,
    chemicals, products, dosages, or recommendations unless they are
    explicitly supported by the supplied disease knowledge.

19. If a supplied field does not contain enough information for a
    statement, omit the statement rather than filling the gap from
    general knowledge.
""".strip()


def build_llm_messages(
    *,
    crop: str,
    class_code: str,
    class_name: str,
    confidence: float,
    knowledge: DiseaseKnowledge,
    weather: dict[str, Any] | None = None,
) -> list[dict[str, str]]:
    """
    Build the controlled messages sent to the LLM.

    The ML prediction is supplied separately from the
    disease knowledge so the model can explain the
    prediction without replacing it.
    """

    context = {
        "crop": crop,
        "prediction": {
            "class_code": class_code,
            "class_name": class_name,
            "confidence": confidence,
        },
        "knowledge": {
            "condition_type": knowledge.condition_type,
            "overview": knowledge.overview,
            "symptoms": knowledge.symptoms,
            "possible_causes": knowledge.possible_causes,
            "favorable_conditions": knowledge.favorable_conditions,
            "spread": knowledge.spread,
            "prevention": knowledge.prevention,
            "management": knowledge.management,
            "professional_help_message": (
                knowledge.professional_help_message
            ),
        },
        "weather": weather or {},
    }

    import json

    user_prompt = (
        "Create the farmer-facing explanation for the supplied "
        "machine-learning prediction.\n\n"
        "Use ONLY the supplied knowledge and context.\n\n"
        "Return content matching the required structured schema.\n\n"
        f"SUPPLIED DATA:\n"
        f"{json.dumps(context, ensure_ascii=False, indent=2)}"
    )

    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]