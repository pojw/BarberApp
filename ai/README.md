# BarberApp AI Backend

This folder contains the Python FastAPI backend for BarberApp AI features.

Current stage: **Milestone 1 — AI Skeleton**

This backend currently uses mock responses only. No real AI models, Qdrant, Firebase, or GPU hosting are connected yet.

## Current Features

- FastAPI app setup
- Health check endpoint
- Mock vision analysis endpoint
- Mock chatbot/recommendation endpoint
- Request body validation with Pydantic
- Response models with Pydantic
- Separated backend structure:
  - `routes/`
  - `models/`
  - `services/`

## Folder Structure

```txt
ai/
  app/
    main.py
    routes/
      health.py
      vision.py
      chat.py
    models/
      requests.py
      responses.py
    services/
      vision_service.py
      chat_service.py
  requirements.txt
  README.md