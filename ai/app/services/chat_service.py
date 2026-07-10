from app.models.requests import ChatRecommendRequest

from fastapi import HTTPException
from app.services.profile_storage_service import (
    get_active_confirmed_hair_profile,
)
def generate_mock_chat_recommendation(
    request: ChatRecommendRequest,
):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    active_profile = get_active_confirmed_hair_profile(
        request.clientId
    )

    if active_profile:
        confirmed_profile = active_profile["confirmedProfile"]

        length = confirmed_profile.get(
            "overallLengthCategory",
            "unknown length",
        )

        texture = confirmed_profile.get(
            "texture",
            "unknown texture",
        )

        density = confirmed_profile.get(
            "density",
            "unknown density",
        )

        face_shape = confirmed_profile.get(
            "faceShape",
            "unknown face shape",
        )

        current_style = confirmed_profile.get(
            "currentStyle",
            "unknown current style",
        )

        fade_type = confirmed_profile.get(
            "fadeType",
            "unknown fade type",
        )
        return {
            "status": "success",
            "mode": "mock-profile-aware",
            "clientId": request.clientId,
            "hairProfileId": active_profile["profileId"],
            "userMessage": request.message,
            "answer": (
                f"Based on your confirmed Hair Profile, you have "
                f"{length}, {texture}, {density} hair and an "
                f"{face_shape} face shape. "
                f"A low taper with a textured top could be a strong option."
            ),
            "recommendations": [
                {
                    "name": "Low taper with textured top",
                    "reason": (
                        f"Your {texture} texture and {density} density "
                        "can work well with movement on top while keeping "
                        "the sides cleaner."
                    ),
                },
                {
                    "name": "Textured flow",
                    "reason": (
                        f"This can take advantage of your {length} length "
                        f"and natural {texture} texture."
                    ),
            },
            ],
    }

    return {
        "status": "success",
        "mode": "mock-general",
        "clientId": request.clientId,
        "hairProfileId": None,
        "userMessage": request.message,
        "answer": (
            "I can still help with general haircut, styling, "
            "and product questions. Complete your Hair Profile "
            "for more personalized recommendations."
        ),
        "recommendations": [
            {
                "name": "General consultation",
                "reason": (
                    "Without a confirmed Hair Profile, recommendations "
                    "stay general rather than making assumptions about your hair."
                ),
            },
        ],
    }
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    return {
        "status": "success",
        "mode": "mock",
        "clientId": request.clientId,
        "hairProfileId": None,
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