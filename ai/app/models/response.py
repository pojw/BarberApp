from typing import List, Optional
from typing import Any
from typing import Literal

from pydantic import BaseModel,Field


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
    profileId:str


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



class ModelInfo(BaseModel):
    mode: str
    modelName: str
    modelVersion: str


class SavedHairProfileResponse(BaseModel):
    profileId: str | None
    clientId: str
    status: str
    originalAiPrediction: dict[str, Any]
    confirmedProfile: dict[str, Any] | None = None
    photoCoverage: dict[str, bool]
    modelInfo: ModelInfo
    createdAt: str | None = None
    updatedAt: str | None = None
    storageEnabled: bool = True


class FrontHairAnalysis(BaseModel):
    hairline_shape: Optional[
        Literal[
            "straight",
            "rounded",
            "widows_peak",
            "receding",
            "unclear",
        ]
    ] = None

    front_length_category: Optional[
        Literal[
            "very_short",
            "short",
            "medium",
            "long",
            "very_long",
            "unclear",
        ]
    ] = None

    forehead_coverage: Optional[
        Literal[
            "none",
            "slight",
            "partial",
            "mostly_covered",
            "fully_covered",
            "unclear",
        ]
    ] = None

    fringe_end_level: Optional[
        Literal[
            "no_fringe",
            "upper_forehead",
            "mid_forehead",
            "lower_forehead",
            "eyebrow_level",
            "below_eyebrows",
            "unclear",
        ]
    ] = None

    texture: Optional[
        Literal[
            "straight",
            "wavy",
            "curly",
            "coily",
            "unclear",
        ]
    ] = None

    density: Optional[
        Literal[
            "thin",
            "medium",
            "thick",
            "unclear",
        ]
    ] = None

    face_shape: Optional[
        Literal[
            "oval",
            "round",
            "square",
            "oblong",
            "heart",
            "diamond",
            "triangle",
            "unclear",
        ]
    ] = None

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )