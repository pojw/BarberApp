from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    require_matching_client_id,
)
from app.models.requests import VisionAnalyzeRequest
from app.models.response import SavedHairProfileResponse
from app.services.profile_storage_service import save_hair_profile
from app.services.vision_service import generate_mock_hair_profile


router = APIRouter(
    prefix="/vision",
    tags=["Vision"],
)


@router.post("/analyze-profile", response_model=SavedHairProfileResponse)
def analyze_profile(
    request: VisionAnalyzeRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Generates a mock AI hair profile and optionally saves it to Firestore.

    In mock auth mode:
    - current_user.uid is mock-client-123

    In firebase auth mode:
    - current_user.uid comes from the verified Firebase ID token

    Security rule:
    - current_user.uid must match request.clientId
    """

    require_matching_client_id(
        client_id=request.clientId,
        current_user=current_user,
    )

    original_ai_prediction = generate_mock_hair_profile(
        photo_angles=request.photoAngles,
    )

    if not settings.AI_PROFILE_STORAGE_ENABLED:
        return {
            "profileId": None,
            "clientId": request.clientId,
            "status": "not_saved",
            "originalAiPrediction": original_ai_prediction,
            "confirmedProfile": None,
            "photoCoverage": original_ai_prediction["sourceCoverage"],
            "modelInfo": {
                "mode": "mock",
                "modelName": "mock-vision-profile",
                "modelVersion": "0.1.0",
            },
            "createdAt": None,
            "updatedAt": None,
            "storageEnabled": False,
        }

    try:
        saved_profile = save_hair_profile(
            client_id=request.clientId,
            original_ai_prediction=original_ai_prediction,
            photo_angles=request.photoAngles,
        )

        return {
            **saved_profile,
            "storageEnabled": True,
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save AI hair profile.",
        )