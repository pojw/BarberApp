
from fastapi import APIRouter
from app.services.chat_service import generate_mock_chat_recommendation
from app.models.requests import ChatRecommendRequest
router = APIRouter()
from app.models.response import ChatRecommendResponse


@router.post("/chat/recommend",response_model = ChatRecommendResponse)
def chat_recommend(request: ChatRecommendRequest):
    return generate_mock_chat_recommendation(request)