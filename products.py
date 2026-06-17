import db
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

@tool
def get_products() -> str:
    """Fetches the complete list of all products in the store inventory including prices and IDs."""
    try:
        products = db.supabase.table("products").select("*").execute().data
        return str(products)
    except Exception as e:
        return f"Error fetching products from database: {str(e)}"