from app.services.llmService import generate_llm_response
from app.services.promptService import build_chat_messages


def test_general_mode():
    print("\n--- GENERAL MODE ---\n")

    messages = build_chat_messages(
        user_message="What is a low-maintenance haircut?",
        confirmed_profile=None,
    )

    response = generate_llm_response(messages)

    print(response)


def test_profile_aware_mode():
    print("\n--- PROFILE-AWARE MODE ---\n")

    confirmed_profile = {
        "overallLengthCategory": "medium",
        "texture": "wavy",
        "density": "thick",
        "faceShape": "oval",
        "currentStyle": "textured top",
        "fadeType": "low taper",
    }

    messages = build_chat_messages(
        user_message="What haircut should I try?",
        confirmed_profile=confirmed_profile,
    )

    response = generate_llm_response(messages)

    print(response)


if __name__ == "__main__":
    test_general_mode()
    test_profile_aware_mode()