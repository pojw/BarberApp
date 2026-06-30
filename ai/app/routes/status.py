from fastapi import APIRouter

from app.core.config import settings
from app.core.firebase import is_firebase_ready, is_firestore_ready

router = APIRouter(
    tags=["Status"],
)


@router.get("/status")
def get_status():
    """
    Reports backend readiness for AI Milestone 2.
    """

    firebase_ready = is_firebase_ready()
    firestore_ready = is_firestore_ready()

    return {
        "mode": settings.ENVIRONMENT,
        "authMode": settings.AUTH_MODE,
        "firebaseConfigured": settings.firebase_configured,
        "firebaseReady": firebase_ready,
        "firestoreReady": firestore_ready,
        "qdrantConnected": False,
        "visionModelConnected": False,
        "llmConnected": False,
        "aiProfileStorageEnabled": settings.AI_PROFILE_STORAGE_ENABLED,
        "aiProfileStorageReady": (
            settings.AI_PROFILE_STORAGE_ENABLED
            and firebase_ready
            and firestore_ready
        ),
    }