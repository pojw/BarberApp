from app.models.requests import VisionAnalyzeRequest


def generate_mock_hair_profile(request: VisionAnalyzeRequest):
    has_front = "front" in request.photoAngles
    has_left = "left" in request.photoAngles
    has_right = "right" in request.photoAngles
    has_back = "back" in request.photoAngles

    return {
        "status": "success",
        "mode": "mock",
        "clientId": request.clientId,
        "receivedPhotoAngles": request.photoAngles,
        "notesReceived": request.notes,
        "profile": {
            "hair": {
                "overallLengthCategory": "medium",
                "frontLengthCategory": "medium" if has_front else "unknown",
                "sideLengthCategory": "short" if has_left or has_right else "unknown",
                "backLengthCategory": "short-medium" if has_back else "unknown",
                "texture": "wavy",
                "density": "medium",
                "currentStyle": "textured top with shorter sides",
            },
            "face": {
                "shape": "oval" if has_front else "unknown",
                "facialHair": "light" if has_front else "unknown",
            },
            "cutDetails": {
                "hasFadeOrTaper": True if has_left or has_right or has_back else None,
                "fadeType": "low taper" if has_left or has_right else "unknown",
                "neckline": "natural" if has_back else "unknown",
                "earCoverage": "ears visible" if has_left or has_right else "unknown",
            },
            "confidence": {
                "overall":high,
                "hairTexture": 0.78,
                "faceShape": 0.55 if has_front else 0.0,
                "fadeType": 0.61 if has_left or has_right else 0.0,
            },
            "sourceCoverage": {
                "frontPhoto": has_front,
                "leftSidePhoto": has_left,
                "rightSidePhoto": has_right,
                "backPhoto": has_back,
            },
        },
    }