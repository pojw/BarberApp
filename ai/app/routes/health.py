from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user

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

@router.get("/auth-test")
def auth_test(current_user=Depends(get_current_user)):
    return {
        "status": "success",
        "currentUser": current_user,
    }