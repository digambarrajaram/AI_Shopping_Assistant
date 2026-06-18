import logging
from langchain_core.tools import tool
import db

logger = logging.getLogger("shopassist")


@tool
def get_products() -> str:
    """Fetches the complete list of all products in the store inventory including prices and IDs."""
    try:
        result = (
            db.supabase.table("products")
            .select("id, name, category, price, description, is_organic")
            .order("id")
            .limit(50)   # hard cap — output truncation in main.py handles overflow
            .execute()
            .data
        )
        if not result:
            return "No products found."
        lines = []
        for p in result:
            tag = " [Organic]" if p.get("is_organic") else ""
            lines.append(
                f"{p['id']}. {p['name']} - ${p['price']:.2f}{tag} - "
                f"{p.get('category', '')} - {p.get('description', '')}"
            )
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_products failed: {e}")
        return "Sorry, I couldn't load the product list right now. Please try again shortly."


@tool
def search_products(
    category: str | None = None,
    max_price: float | None = None,
    query: str | None = None,
) -> str:
    """
    Searches the product catalog with optional filters. Use this instead
    of get_products whenever the user asks for a subset of the catalog —
    by category (e.g. "honey", "oils", "nuts"), by a maximum price, or by
    a keyword in the product name.
    Args:
        category: Optional category name to filter by.
        max_price: Optional maximum price in USD.
        query: Optional keyword to match against the product name.
    """
    try:
        q = db.supabase.table("products").select(
            "id, name, category, price, description, is_organic"
        )
        if category:
            q = q.ilike("category", f"%{category}%")
        if max_price is not None:
            q = q.lte("price", max_price)
        if query:
            q = q.ilike("name", f"%{query}%")
        result = q.order("id").limit(50).execute().data
        if not result:
            return "No products matched that search."
        lines = []
        for p in result:
            tag = " [Organic]" if p.get("is_organic") else ""
            lines.append(
                f"{p['id']}. {p['name']} - ${p['price']:.2f}{tag} - "
                f"{p.get('description', '')}"
            )
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"search_products failed: {e}")
        return "Sorry, I couldn't search the catalog right now. Please try again shortly."








