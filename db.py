import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import Client, create_client

_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH)

# ==========================================
# CONFIGURATION & VALIDATION
# ==========================================

SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str | None = os.getenv("SUPABASE_SERVICE_KEY")
AWS_BEARER_TOKEN_BEDROCK: str | None = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")   # kept for possible future fallback; not currently required
GOOGLE_API_KEY: str | None = os.getenv("GOOGLE_API_KEY")
SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@store.com")
SUPPORT_PHONE: str = os.getenv("SUPPORT_PHONE", "+1-800-123-4567")
ALLOWED_ORIGINS: str = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is missing.")

if not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY environment variable is missing.")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is missing.")

if not AWS_BEARER_TOKEN_BEDROCK:
    raise ValueError("AWS_BEARER_TOKEN_BEDROCK environment variable is missing.")

# ==========================================
# CLIENT INITIALIZATION
# ==========================================

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)