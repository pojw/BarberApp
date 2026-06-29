from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.requests import ChatRecommendRequest
from app.models.response import ChatRecommendResponse
from app.services.chat_service import generate_mock_chat_recommendation


router = APIRouter()


@router.post("/chat/recommend", response_model=ChatRecommendResponse)
def chat_recommend(
    request: ChatRecommendRequest,
    current_user=Depends(get_current_user),
):
    return generate_mock_chat_recommendation(request)