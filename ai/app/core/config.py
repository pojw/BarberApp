import os

from dotenv import load_dotenv


load_dotenv()


def parse_cors_origins(value: str):
    if not value:
        return []

    return [origin.strip() for origin in value.split(",") if origin.strip()]


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    project_name: str = os.getenv("PROJECT_NAME", "BarberApp AI Backend")
    api_version: str = os.getenv("API_VERSION", "0.1.0")
    cors_origins: list[str] = parse_cors_origins(os.getenv("CORS_ORIGINS", ""))


settings = Settings()