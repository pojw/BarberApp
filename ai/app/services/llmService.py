from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    OpenAI,
    RateLimitError,
)

from app.core.config import settings


class LLMServiceError(Exception):
    """Base error for LLM generation failures."""


class LLMConfigurationError(LLMServiceError):
    """Raised when required LLM configuration is missing."""


class LLMTimeoutError(LLMServiceError):
    """Raised when the LLM provider times out."""


class LLMUnavailableError(LLMServiceError):
    """Raised when the LLM provider cannot be reached."""


class LLMRateLimitError(LLMServiceError):
    """Raised when the provider rejects requests due to rate limits."""


class LLMInvalidResponseError(LLMServiceError):
    """Raised when the provider returns an unusable response."""


def generate_llm_response(
    messages: list[dict[str, str]],
) -> str:
    if not settings.HF_TOKEN:
        raise LLMConfigurationError(
            "HF_TOKEN is not configured."
        )

    client = OpenAI(
        base_url=settings.HF_BASE_URL,
        api_key=settings.HF_TOKEN,
        timeout=60.0,
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

    except APITimeoutError as exc:
        raise LLMTimeoutError(
            "The LLM provider timed out."
        ) from exc

    except RateLimitError as exc:
        raise LLMRateLimitError(
            "The LLM provider rate limit was reached."
        ) from exc

    except APIConnectionError as exc:
        raise LLMUnavailableError(
            "Could not connect to the LLM provider."
        ) from exc

    except APIStatusError as exc:
        raise LLMUnavailableError(
            f"LLM provider returned status {exc.status_code}."
        ) from exc

    except Exception as exc:
        raise LLMServiceError(
            "Unexpected LLM generation failure."
        ) from exc

    if not completion.choices:
        raise LLMInvalidResponseError(
            "LLM returned no completion choices."
        )

    generated_text = completion.choices[0].message.content

    if not generated_text:
        raise LLMInvalidResponseError(
            "LLM returned an empty response."
        )

    cleaned_text = generated_text.strip()

    if not cleaned_text:
        raise LLMInvalidResponseError(
            "LLM returned only whitespace."
        )

    return cleaned_text