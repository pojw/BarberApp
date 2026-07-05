from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "barberapp-ai",
        "projectName": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
        "corsOriginsCount": len(settings.CORS_ORIGINS),
    }

@router.get("/auth-test")
def auth_test(current_user=Depends(get_current_user)):
    return {
        "status": "success",
        "currentUser": current_user,
    }