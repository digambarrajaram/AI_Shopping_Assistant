import os
import json
import time
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

# ==========================================
# SESSION PERSISTENCE (for Vercel serverless)
# ==========================================

SESSION_TABLE = "chat_sessions"
SESSION_TTL_SECONDS = 1800  # 30 minutes


def _ensure_sessions_table() -> None:
    """Create the sessions table if it doesn't exist.
    Called lazily on first session read/write."""
    try:
        # Check if table exists by attempting a count query
        supabase.table(SESSION_TABLE).select("id", count="exact").limit(0).execute()
    except Exception:
        # Table doesn't exist — create it via raw SQL
        sql = f"""
        CREATE TABLE IF NOT EXISTS {SESSION_TABLE} (
            id TEXT PRIMARY KEY,
            messages JSONB NOT NULL DEFAULT '[]'::jsonb,
            last_active DOUBLE PRECISION NOT NULL DEFAULT 0,
            products_were_listed BOOLEAN NOT NULL DEFAULT FALSE,
            orders_were_listed BOOLEAN NOT NULL DEFAULT FALSE,
            last_search_type TEXT,
            last_search_params JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
        try:
            supabase.rpc("exec_sql", {"query": sql}).execute()
        except Exception:
            # If rpc exec_sql isn't available, try direct SQL
            # Fallback: table must be created manually in Supabase dashboard
            pass


def save_session(
    session_id: str,
    messages_json: list[dict],
    last_active: float,
    products_were_listed: bool = False,
    orders_were_listed: bool = False,
    last_search_type: str | None = None,
    last_search_params: dict | None = None,
) -> None:
    """Upsert a session into Supabase."""
    _ensure_sessions_table()
    try:
        supabase.table(SESSION_TABLE).upsert({
            "id": session_id,
            "messages": messages_json,
            "last_active": last_active,
            "products_were_listed": products_were_listed,
            "orders_were_listed": orders_were_listed,
            "last_search_type": last_search_type,
            "last_search_params": last_search_params,
            "created_at": "now()",
        }).execute()
    except Exception:
        pass  # Session persistence is best-effort; don't crash the agent


def load_session(session_id: str) -> dict | None:
    """Load a session from Supabase. Returns None if not found or expired."""
    _ensure_sessions_table()
    try:
        result = (
            supabase.table(SESSION_TABLE)
            .select("*")
            .eq("id", session_id)
            .execute()
            .data
        )
        if not result:
            return None
        row = result[0]
        # Check TTL
        if (time.time() - float(row.get("last_active", 0))) > SESSION_TTL_SECONDS:
            # Expired — delete it
            try:
                supabase.table(SESSION_TABLE).delete().eq("id", session_id).execute()
            except Exception:
                pass
            return None
        return row
    except Exception:
        return None


def delete_expired_sessions() -> int:
    """Delete all expired sessions. Returns count deleted."""
    cutoff = time.time() - SESSION_TTL_SECONDS
    try:
        result = (
            supabase.table(SESSION_TABLE)
            .delete()
            .lt("last_active", cutoff)
            .execute()
        )
        return len(result.data) if result.data else 0
    except Exception:
        return 0


# Vercel environment detection
IS_VERCEL = bool(os.getenv("VERCEL"))