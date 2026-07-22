from app.core.firebase import initialize_firebase
from app.models.requests import VisionSourcePhoto
from app.services.vision_service import generate_hair_profile

initialize_firebase()

source_photos = {
    "front": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/43H6zBb7yaXaW1nGKbXC/front.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
    "left": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/HF5y82xMSQhPkTU7uKN3/left.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
    "right": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/HF5y82xMSQhPkTU7uKN3/right.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
    "back": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/HF5y82xMSQhPkTU7uKN3/back.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
}
result = generate_hair_profile(source_photos)

print(result)
print(result.model_dump())
