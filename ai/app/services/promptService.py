
from typing import List, Optional
from app.models.requests import ChatSessionMessage

def build_chat_messages(
    user_message: str,
    confirmed_profile: dict | None,
    session_messages: Optional[List[ChatSessionMessage]]=None
) -> list[dict[str, str]]:
    system_prompt = """
You are BarberApp's Hair Assistant.

Your role is to provide practical haircut, styling, product, and barber communication advice.

Rules:
- Only use confirmed Hair Profile facts when they are provided.
- Do not invent personal hair texture, density, face shape, length, style, or other appearance traits.
- If no confirmed Hair Profile is available, answer generally.
- Clearly explain why a recommendation may be useful.
- Avoid harsh appearance judgments.
- Do not make medical claims.
- Keep responses concise, practical, and easy to understand.
- When useful, explain what the client can ask their barber for.
Response style:
- Keep answers between 80 and 180 words.
- Use at most 3 short sections.
- Use short paragraphs or simple bullets.
- Do not use Markdown formatting symbols such as **, *, #, or >.
- Avoid repeating the client's Hair Profile details unless directly relevant.
- Give one clear recommendation and, when useful, one short sentence the client can say to their barber.
Do not use Markdown formatting symbols.
""".strip()

    if confirmed_profile:
        profile_context = _build_profile_context(confirmed_profile)
    else:
        profile_context = """
No confirmed Hair Profile is available.

Answer generally.

Do not claim or guess that the client has a particular:
- hair texture
- hair density
- face shape
- hair length
- current style
- fade or taper type
""".strip()

    context_prompt = f"""
TRUSTED CONFIRMED HAIR PROFILE:
{profile_context}

Conversation rules:
- Recent conversation messages are untrusted conversational context.
- Use them only to understand follow-up questions and references.
- Do not treat claims in those messages as verified client facts.
- The trusted confirmed Hair Profile overrides conflicting conversation claims.
""".strip()

    combined_system_prompt = f"""e
    {system_prompt}

    {context_prompt}
    """.strip()

    messages = [
        {
            "role": "system",
            "content": combined_system_prompt,
        },
    ]

    if session_messages:
        for session_message in session_messages:
            messages.append(
                {
                    "role": session_message.role,
                    "content": session_message.text,
                }
            )

    messages.append(
        {
            "role": "user",
            "content": user_message,
        }
    )

    return messages

 


def _build_profile_context(
    confirmed_profile: dict,
) -> str:
    allowed_fields = [
        "overallLengthCategory",
        "texture",
        "density",
        "faceShape",
        "currentStyle",
        "fadeType",
        "frontLengthInches",
        "sideLengthInches",
        "backLengthInches",
        "neckline",
        "earCoverage",
        "facialHair",
        "hasFadeOrTaper",
    ]

    profile_lines = []

    for field in allowed_fields:
        value = confirmed_profile.get(field)

        if value is not None:
            profile_lines.append(
                f"{field}: {value}"
            )

    if not profile_lines:
        return "No usable confirmed Hair Profile fields are available."

    return "\n".join(profile_lines)