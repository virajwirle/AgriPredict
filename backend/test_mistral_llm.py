from app.services.disease_knowledge_service import (
    disease_knowledge_service,
)
from app.services.llm.llm_client import MistralLLMClient
from app.services.llm.prompt_builder import build_llm_messages


def main() -> None:
    # Load the verified disease knowledge.
    disease_knowledge_service.load()

    # Get Apple Scab knowledge.
    knowledge = disease_knowledge_service.require(
        "apple",
        "APPLE_SCAB",
    )

    # Build the controlled prompt.
    messages = build_llm_messages(
        crop="apple",
        class_code="APPLE_SCAB",
        class_name="Apple Scab",
        confidence=0.964,
        knowledge=knowledge,
        weather={},
    )

    # Create the Mistral client.
    client = MistralLLMClient()

    # Request structured output.
    result = client.generate(
        messages=messages,
    )

    print("\nMISTRAL STRUCTURED OUTPUT SUCCESS\n")

    print(
        result.model_dump_json(
            indent=2,
        )
    )


if __name__ == "__main__":
    main()