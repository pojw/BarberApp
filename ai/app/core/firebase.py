import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import settings


_firebase_app = None
_firestore_client = None


def initialize_firebase():
    """
    Initializes Firebase Admin SDK once.

    Supports two setup styles:
    1. FIREBASE_CREDENTIALS_PATH for local service account JSON
    2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY for env-based setup
    """

    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    if settings.FIREBASE_CREDENTIALS_PATH:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app

    if (
        settings.FIREBASE_PROJECT_ID
        and settings.FIREBASE_CLIENT_EMAIL
        and settings.FIREBASE_PRIVATE_KEY
    ):
        private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")

        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )

        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app

    raise RuntimeError(
        "Firebase is not configured. Set FIREBASE_CREDENTIALS_PATH or Firebase Admin environment variables."
    )


def get_firestore_client():
    """
    Returns a Firestore client.

    This should only be called when Firebase/profile storage is enabled.
    """

    global _firestore_client

    if _firestore_client is not None:
        return _firestore_client

    initialize_firebase()
    _firestore_client = firestore.client()

    return _firestore_client


def is_firebase_ready() -> bool:
    """
    Returns True if Firebase can be initialized.
    Used by /status so we can safely report readiness.
    """

    if not settings.firebase_configured:
        return False

    try:
        initialize_firebase()
        return True
    except Exception:
        return False


def is_firestore_ready() -> bool:
    """
    Returns True if Firestore client can be created.
    Used by /status.
    """

    if not settings.firebase_configured:
        return False

    try:
        get_firestore_client()
        return True
    except Exception:
        return False