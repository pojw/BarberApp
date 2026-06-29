

from fastapi import APIRouter
from app.models.requests import VisionAnalyzeRequest
from app.services.vision_service import generate_mock_hair_profile

from app.models.response import VisionAnalyzeResponse
router = APIRouter()



@router.post("/vision/analyze-profile", response_model=VisionAnalyzeResponse)
def analyze_profile(request: VisionAnalyzeRequest):
  return generate_mock_hair_profile(request)