from typing import Optional

from fastapi import Header


def get_current_user(authorization: Optional[str] = Header(default=None)):
    if authorization is None:
        return {
            "authenticated": False,
            "uid": None,
            "role": None,
            "authMode": "mock",
            "message": "No Authorization header provided.",
        }

    if not authorization.startswith("Bearer "):
        return {
            "authenticated": False,
            "uid": None,
            "role": None,
            "authMode": "mock",
            "message": "Authorization header must start with Bearer.",
        }

    token = authorization.replace("Bearer ", "").strip()

    return {
        "authenticated": True,
        "uid": "mock-user-123",
        "role": "client",
        "authMode": "mock",
        "tokenPreview": token[:8] + "..." if token else None,
    }