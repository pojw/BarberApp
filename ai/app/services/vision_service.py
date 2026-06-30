from typing import Any


def generate_mock_hair_profile(photo_angles: list[str]) -> dict[str, Any]:
    """
    Generates a mock AI hair profile prediction.

    This is still mock data. Later, this function can call a real
    vision model while keeping the same output shape.
    """

    source_coverage = {
        "front": "front" in photo_angles,
        "left": "left" in photo_angles,
        "right": "right" in photo_angles,
        "back": "back" in photo_angles,
    }

    return {
        "hair": {
            "overallLengthCategory": "medium",
            "frontLengthInches": "4-6",
            "sideLengthInches": "1-2",
            "backLengthInches": "3-5",
            "texture": "wavy",
            "density": "thick",
            "currentStyle": "medium textured top with shorter sides",
        },
        "face": {
            "shape": "oval",
            "facialHair": "light stubble",
        },
        "cutDetails": {
            "hasFadeOrTaper": True,
            "fadeType": "low taper",
            "neckline": "natural",
            "earCoverage": "above ear",
        },
        "confidence": {
            "overallLength": 0.84,
            "texture": 0.75,
            "faceShape": 0.68,
            "fadeType": 0.71,
        },
        "sourceCoverage": source_coverage,
    }