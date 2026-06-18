import os
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

# ==========================================
# CONFIGURATION & VALIDATION
# ==========================================

SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str | None = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@store.com")
SUPPORT_PHONE: str = os.getenv("SUPPORT_PHONE", "+1-800-123-4567")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is missing.")

if not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY environment variable is missing.")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is missing.")

# ==========================================
# CLIENT INITIALIZATION
# ==========================================

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)