from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.vision import router as vision_router
from app.routes.chat import router as chat_router
from app.routes.status import router as status_router
from fastapi.middleware.cors import CORSMiddleware


from app.core.config import settings


app = FastAPI(
    title=settings.project_name,
    description="Mock AI backend for BarberApp vision analysis and chatbot recommendations.",
    version=settings.api_version,
    debug=settings.debug,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(vision_router)
app.include_router(chat_router)
app.include_router(status_router)