from fastapi import APIRouter
from app.core.config import settings
router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "barberapp-ai",
        "projectName": settings.project_name,
        "environment": settings.app_env,
        "version": settings.api_version,
        "debug": settings.debug,
        "corsOriginsCount": len(settings.cors_origins),

    }