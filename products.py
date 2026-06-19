import logging
from collections import defaultdict
from langchain_core.tools import tool
import db

logger = logging.getLogger("shopassist")


def _safe_price(row: dict) -> float:
    """Return *row['price']* as a float, or 0.0 if missing/unparseable."""
    try:
        return float(row.get("price") or 0)
    except (ValueError, TypeError):
        return 0.0


def _fetch_ratings_map() -> dict[int, tuple[float, int]]:
    """Return {product_id: (avg_rating, review_count)} for all products."""
    try:
        all_rev = (
            db.supabase.table("reviews")
            .select("product_id, rating")
            .execute()
            .data
        )
    except Exception:
        logger.warning("Failed to fetch reviews for tool output", exc_info=True)
        return {}

    groups: dict[int, list[float]] = defaultdict(list)
    for r in all_rev:
        pid = r.get("product_id")
        rat = r.get("rating")
        if pid is not None and rat is not None:
            try:
                groups[int(pid)].append(float(rat))
            except (ValueError, TypeError):
                pass

    out: dict[int, tuple[float, int]] = {}
    for pid, rats in groups.items():
        avg = round(sum(rats) / len(rats), 1)
        out[pid] = (avg, len(rats))
    return out


def _format_product_line(p: dict, ratings_map: dict[int, tuple[float, int]]) -> str:
    """Format one product line with optional rating info.
    Avoids markdown-sensitive characters (no [], no |) so the text
    stays readable even if the LLM echoes it back verbatim."""
    pid = p.get("id", "?")
    name = p.get("name", "Unknown")
    price = _safe_price(p)
    tag = " · Organic" if p.get("is_organic") else ""
    desc = p.get("description", "") or ""
    cat = p.get("category", "") or ""

    # Attach rating if available
    rating_info = ""
    if pid != "?" and int(pid) in ratings_map:
        avg, count = ratings_map[int(pid)]
        stars = "⭐" * int(avg)  # floor — 4.7 → 4 stars, not 5
        rating_info = f" — {avg}/5 {stars} ({count} review{'s' if count != 1 else ''})"

    return f"{pid}. {name} - ${price:.2f}{tag} · {cat} · {desc}{rating_info}"


@tool
def get_products(sort_by_rating: str = "none") -> str:
    """Fetches the complete list of all products with prices, IDs, and ratings.

    Args:
        sort_by_rating: "desc" to sort highest-rated first, "asc" to sort
            lowest-rated first, "none" (default) to keep ID order.
    """
    try:
        result = (
            db.supabase.table("products")
            .select("id, name, category, price, description, is_organic")
            .order("id")
            .limit(50)
            .execute()
            .data
        )
        if not result:
            return "No products found."

        ratings_map = _fetch_ratings_map()
        lines = [_format_product_line(p, ratings_map) for p in result]

        if sort_by_rating in ("desc", "asc"):
            import re
            _RATING_RE = re.compile(r"(\d+\.?\d*)/5\b")

            def _rating_key(line: str) -> float:
                m = _RATING_RE.search(line)
                if m:
                    try:
                        val = float(m.group(1))
                        return -val if sort_by_rating == "desc" else val
                    except (ValueError, IndexError):
                        pass
                return 0.0 if sort_by_rating == "desc" else 999.0
            lines.sort(key=_rating_key)

        return "\n".join(lines)
    except Exception:
        logger.error("get_products failed", exc_info=True)
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
        query: Optional keyword to match against product name OR category.
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
            q = q.or_(
                f"name.ilike.%{query}%,category.ilike.%{query}%"
            )
        result = q.order("id").limit(50).execute().data
        if not result:
            return "No products matched that search."

        ratings_map = _fetch_ratings_map()
        lines = [_format_product_line(p, ratings_map) for p in result]
        return "\n".join(lines)
    except Exception:
        logger.error("search_products failed", exc_info=True)
        return "Sorry, I couldn't search the catalog right now. Please try again shortly."
