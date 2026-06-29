from typing import List, Optional

from pydantic import BaseModel


class HairDetails(BaseModel):
    overallLengthCategory: str
    frontLengthCategory: str
    sideLengthCategory: str
    backLengthCategory: str
    texture: str
    density: str
    currentStyle: str


class FaceDetails(BaseModel):
    shape: str
    facialHair: str


class CutDetails(BaseModel):
    hasFadeOrTaper: Optional[bool] = None
    fadeType: str
    neckline: str
    earCoverage: str


class ConfidenceScores(BaseModel):
    overall: float
    hairTexture: float
    faceShape: float
    fadeType: float


class SourceCoverage(BaseModel):
    frontPhoto: bool
    leftSidePhoto: bool
    rightSidePhoto: bool
    backPhoto: bool


class HairProfile(BaseModel):
    hair: HairDetails
    face: FaceDetails
    cutDetails: CutDetails
    confidence: ConfidenceScores
    sourceCoverage: SourceCoverage


class VisionAnalyzeResponse(BaseModel):
    status: str
    mode: str
    clientId: str
    receivedPhotoAngles: List[str]
    notesReceived: Optional[str] = None
    profile: HairProfile


class RecommendationItem(BaseModel):
    name: str
    reason: str


class ChatRecommendResponse(BaseModel):
    status: str
    mode: str
    clientId: str
    hairProfileId: Optional[str] = None
    userMessage: str
    answer: str
    recommendations: List[RecommendationItem]