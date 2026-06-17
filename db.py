import os
from dotenv import load_dotenv
from langchain_core.tools import tool
from supabase import Client, create_client
import orders
import products
import reviews

load_dotenv()

# ==========================================
# 1. CONFIGURATION & CONFIG VALIDATION
# ==========================================

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")
TABLE_NAME: str = "products"

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is missing.")

if not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY environment variable is missing.")

# ==========================================
# 2. CLIENT INITIALIZATION
# ==========================================
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
