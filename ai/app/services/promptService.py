def build_chat_messages(
    user_message: str,
    confirmed_profile: dict | None,
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

    user_prompt = f"""
CONFIRMED HAIR PROFILE CONTEXT:
{profile_context}

USER QUESTION:
{user_message}
""".strip()

    return [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]


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