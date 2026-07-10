from typing import List, Optional

from pydantic import BaseModel


class VisionAnalyzeRequest(BaseModel):
    clientId: str
    photoAngles: List[str]
    notes: Optional[str] = None


class ChatRecommendRequest(BaseModel):
    clientId: str
    message: str
