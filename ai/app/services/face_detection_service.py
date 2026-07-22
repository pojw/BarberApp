
import mediapipe as mp
from pathlib import Path
import numpy as np



FACE_DETECTOR_MODEL_PATH = (
    Path(__file__).resolve().parents[2]
    / "model_assets"
    / "face_detector.tflite"
)

def create_front_head_crop(decoded_images):
    front_image = decoded_images["front"]["image"]

    mediapipe_image = convert_pillow_to_mediapipe_image(
        front_image
    )

    with create_face_detector() as detector:
        result = detector.detect(mediapipe_image)

    if not result.detections:
        raise ValueError(
            "No face was detected in the front photo."
        )

    detection = result.detections[0]
    bounding_box = detection.bounding_box

    image_width = decoded_images["front"]["width"]
    image_height = decoded_images["front"]["height"]

    x1 = max(0, bounding_box.origin_x)
    y1 = max(0, bounding_box.origin_y)

    x2 = min(
        image_width,
        bounding_box.origin_x + bounding_box.width,
    )

    y2 = min(
        image_height,
        bounding_box.origin_y + bounding_box.height,
    )

    padding_x = int(bounding_box.width * 0.35)
    padding_top = int(bounding_box.height * 0.75)
    padding_bottom = int(bounding_box.height * 0.25)

    head_x1 = max(0, x1 - padding_x)
    head_y1 = max(0, y1 - padding_top)

    head_x2 = min(
        image_width,
        x2 + padding_x,
    )

    head_y2 = min(
        image_height,
        y2 + padding_bottom,
    )

    return {
    "headCrop": front_image.crop(
        (head_x1, head_y1, head_x2, head_y2)
    ),
    "faceBox": {
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2,
        "width": bounding_box.width,
        "height": bounding_box.height,
    },
}
def convert_pillow_to_mediapipe_image(pillow_image):
    image_array = np.array(
        pillow_image.convert("RGB")
    )

    return mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=image_array,
    )
def create_face_detector():
    base_options = mp.tasks.BaseOptions(
        model_asset_path=str(FACE_DETECTOR_MODEL_PATH)
    )

    options = mp.tasks.vision.FaceDetectorOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        min_detection_confidence=0.5,
    )

    return mp.tasks.vision.FaceDetector.create_from_options(
        options
    )
def create_face_detector():
    base_options = mp.tasks.BaseOptions(
        model_asset_path=str(FACE_DETECTOR_MODEL_PATH)
    )

    options = mp.tasks.vision.FaceDetectorOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        min_detection_confidence=0.5,
    )

    return mp.tasks.vision.FaceDetector.create_from_options(
        options
    )
