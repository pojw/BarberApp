from fastapi import APIRouter

from app.core.config import settings


router = APIRouter()


@router.get("/status")
def get_status():
    return {
        "service": "barberapp-ai",
        "projectName": settings.project_name,
        "environment": settings.app_env,
        "version": settings.api_version,
        "stage": "milestone-1-ai-skeleton",
        "mode": "mock",
        "features": {
            "fastapiBackend": True,
            "mockVisionEndpoint": True,
            "mockChatEndpoint": True,
            "requestModels": True,
            "responseModels": True,
            "corsEnabled": True,
            "mockAuthHeaderSupport": True,
            "basicValidation": True,
        },
        "connections": {
            "firebaseAdminConnected": False,
            "firestoreConnected": False,
            "firebaseStorageConnected": False,
            "qdrantConnected": False,
            "visionModelConnected": False,
            "llmConnected": False,
        },
        "notes": [
            "This backend currently returns mock AI responses.",
            "No real AI model inference is connected yet.",
            "No Firebase Admin, Firestore, Storage, or Qdrant connection is active yet.",
        ],
    }