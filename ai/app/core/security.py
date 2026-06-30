from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from firebase_admin import auth as firebase_auth

from app.core.config import settings
from app.core.firebase import initialize_firebase


@dataclass
class AuthenticatedUser:
    uid: str
    email: str | None = None
    auth_mode: str = "mock"


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )

    parts = authorization.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be in the format: Bearer <token>.",
        )

    return parts[1]


def _get_mock_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        uid="mock-client-123",
        email="mock-client@example.com",
        auth_mode="mock",
    )


def _verify_firebase_token(token: str) -> AuthenticatedUser:
    try:
        initialize_firebase()
        decoded_token = firebase_auth.verify_id_token(token)

        uid = decoded_token.get("uid")
        email = decoded_token.get("email")

        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase token is missing uid.",
            )

        return AuthenticatedUser(
            uid=uid,
            email=email,
            auth_mode="firebase",
        )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token.",
        )


def get_current_user(
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser:
    """
    FastAPI dependency used by protected routes.

    In mock mode:
    - returns a fixed local development user

    In firebase mode:
    - requires Authorization: Bearer <Firebase ID token>
    - verifies the token with Firebase Admin
    """

    if settings.use_mock_auth:
        return _get_mock_user()

    if settings.use_firebase_auth:
        token = _extract_bearer_token(authorization)
        return _verify_firebase_token(token)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unsupported AUTH_MODE: {settings.AUTH_MODE}",
    )


def require_matching_client_id(
    client_id: str,
    current_user: AuthenticatedUser,
) -> None:
    """
    Ensures users can only write AI profiles under their own client document.
    """

    if current_user.uid != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user does not match requested clientId.",
        )