

from fastapi import APIRouter, Depends
from app.models.requests import VisionAnalyzeRequest
from app.services.vision_service import generate_mock_hair_profile
from app.core.security import get_current_user

from app.models.response import VisionAnalyzeResponse
router = APIRouter()



@router.post("/vision/analyze-profile", response_model=VisionAnalyzeResponse)
def analyze_profile(request: VisionAnalyzeRequest,
                        current_user=Depends(get_current_user),
):
  return generate_mock_hair_profile(request)