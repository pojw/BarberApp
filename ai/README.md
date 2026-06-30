# BarberApp AI Backend

This folder contains the Python FastAPI backend for BarberApp AI features.
## AI Milestone 2 — AI Profile Storage

Milestone 2 connects the mock AI vision profile output to BarberApp’s future AI profile data model.

The backend can now:

- initialize Firebase Admin safely
- use mock auth for local development
- prepare for Firebase ID token verification
- enforce that the authenticated user uid matches `clientId`
- generate a mock AI hair profile
- save the generated profile to Firestore
- return the saved `profileId`
- report Firebase/profile-storage readiness from `/status`

This milestone does not add real AI models, Qdrant, RAG, image upload, or frontend integration yet.

## Firestore Data Model

AI hair profiles are saved under:

```txt
clients/{clientId}/hairProfiles/{profileId}
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