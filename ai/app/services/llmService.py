from openai import OpenAI

from app.core.config import settings


class LLMServiceError(Exception):
    """Raised when the configured LLM provider cannot generate a response."""


def generate_llm_response(
    messages: list[dict[str, str]],
) -> str:
    if not settings.HF_TOKEN:
        raise LLMServiceError(
            "HF_TOKEN is not configured."
        )

    client = OpenAI(
        base_url=settings.HF_BASE_URL,
        api_key=settings.HF_TOKEN,
    )

    try:
        completion = client.chat.completions.create(
            model=settings.HF_MODEL,
            messages=messages,
            temperature=0.7,
            top_p=0.8,
            max_tokens=500,
            extra_body={
                "top_k": 20,
                "chat_template_kwargs": {
                    "enable_thinking": False,
                },
            },
        )
    except Exception as exc:
        raise LLMServiceError(
            "LLM generation request failed."
        ) from exc

    generated_text = completion.choices[0].message.content

    if not generated_text:
        raise LLMServiceError(
            "LLM returned an empty response."
        )

    return generated_text.strip()