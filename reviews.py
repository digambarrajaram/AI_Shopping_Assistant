import logging
from langchain_core.tools import tool
import db

logger = logging.getLogger("shopassist")


@tool
def get_reviews(product_id: int) -> str:
    """
    Fetches customer reviews and ratings for a specific product item by its numerical ID.
    Args:
        product_id: The exact integer ID of the product.
    """
    try:
        result = (
            db.supabase.table("reviews")
            .select("id, product_id, rating, review_text, reviewer_name")
            .eq("product_id", product_id)
            .execute()
            .data
        )
        if not result:
            return "No reviews found for this product."

        # Compute average rating server-side
        ratings = []
        for r in result:
            rat = r.get("rating")
            if rat is not None:
                try:
                    ratings.append(float(rat))
                except (ValueError, TypeError):
                    pass

        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
        review_count = len(result)

        lines = []
        # Summary header with average rating
        if avg_rating is not None:
            stars = "⭐" * int(round(avg_rating))
            lines.append(
                f"Average Rating: {avg_rating}/5.0 {stars} "
                f"({review_count} review{'s' if review_count != 1 else ''})"
            )
            lines.append("")

        # Individual reviews
        for r in result:
            stars = "⭐" * int(r.get("rating") or 0)
            name = r.get("reviewer_name", "Customer")
            comment = r.get("review_text", "") or ""
            lines.append(f"{stars} {name}: \"{comment}\"")

        return "\n".join(lines) if lines else "No reviews found for this product."

    except Exception:
        logger.error("get_reviews failed", exc_info=True)
        return "Sorry, I couldn't load reviews right now. Please try again shortly."
