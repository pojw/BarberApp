from fastapi import APIRouter, Depends

from app.models.requests import ChatRecommendRequest
from app.models.response import ChatRecommendResponse
from app.services.chat_service import generate_mock_chat_recommendation
from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    require_matching_client_id,
)

router = APIRouter()


@router.post("/chat/recommend", response_model=ChatRecommendResponse)
def chat_recommend(
    request: ChatRecommendRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    require_matching_client_id(
        client_id=request.clientId,
        current_user=current_user,
    )

    return generate_mock_chat_recommendation(request)