from app.models.requests import ChatRecommendRequest


def generate_mock_chat_recommendation(request: ChatRecommendRequest):
    return {
        "status": "success",
        "mode": "mock",
        "clientId": request.clientId,
        "hairProfileId": request.hairProfileId,
        "userMessage": request.message,
        "answer": (
            "Based on your saved hair profile, a low taper with a textured top "
            "could be a good option. This is a mock response for now."
        ),
        "recommendations": [
            {
                "name": "Low taper with textured top",
                "reason": "Keeps the sides clean while preserving movement on top.",
            },
            {
                "name": "Textured crop",
                "reason": "Works well with medium-length wavy hair and is easy to maintain.",
            },
            {
                "name": "Messy fringe",
                "reason": "Uses your natural wave and gives a more casual look.",
            },
        ],
    }