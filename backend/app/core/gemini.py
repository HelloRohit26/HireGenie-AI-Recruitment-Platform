import os
from google import genai
from app.core.config import settings

api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY") or "mock_dev_key"

try:
    client = genai.Client(api_key=api_key)
except Exception:
    client = None