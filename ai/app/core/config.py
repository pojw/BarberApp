import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Central app settings loaded from environment variables.

    AUTH_MODE options:
    - "mock": local/dev mode, no real Firebase token required
    - "firebase": verify real Firebase ID tokens with Firebase Admin
    """

    APP_NAME: str = os.getenv("PROJECT_NAME","notloadingENV")
    APP_VERSION: str = "0.2.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    AUTH_MODE: str = os.getenv("AUTH_MODE", "mock").lower()
    DEBUG :str = os.getenv("DEBUG","true")
    AI_PROFILE_STORAGE_ENABLED: bool = (
        os.getenv("AI_PROFILE_STORAGE_ENABLED", "false").lower() == "true"
    )

    FIREBASE_PROJECT_ID: str | None = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_CLIENT_EMAIL: str | None = os.getenv("FIREBASE_CLIENT_EMAIL")
    FIREBASE_PRIVATE_KEY: str | None = os.getenv("FIREBASE_PRIVATE_KEY")
    FIREBASE_CREDENTIALS_PATH: str | None = os.getenv("FIREBASE_CREDENTIALS_PATH")

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    @property
    def firebase_configured(self) -> bool:
        """
        Firebase can be configured either with:
        1. FIREBASE_CREDENTIALS_PATH pointing to a service account JSON file
        2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
        """

        has_credentials_file = bool(self.FIREBASE_CREDENTIALS_PATH)

        has_env_credentials = all(
            [
                self.FIREBASE_PROJECT_ID,
                self.FIREBASE_CLIENT_EMAIL,
                self.FIREBASE_PRIVATE_KEY,
            ]
        )

        return has_credentials_file or has_env_credentials

    @property
    def use_firebase_auth(self) -> bool:
        return self.AUTH_MODE == "firebase"

    @property
    def use_mock_auth(self) -> bool:
        return self.AUTH_MODE == "mock"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()