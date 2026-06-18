import contextvars
import json
import logging
from datetime import datetime, timedelta
from langchain_core.tools import tool
import db

logger = logging.getLogger("shopassist")

# Bound by main.py's execute_tool() right before invoking this tool, using the
# server-trusted session_id — never exposed to the LLM as a fillable argument,
# so a user can never spoof or guess their way into another session's orders.
current_session_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "session_id", default="unknown"
)


def _add_business_days(start: datetime, count: int) -> datetime:
    """Advance *start* by *count* business days (Mon–Fri), returning a date."""
    current = start
    added = 0
    while added < count:
        current = current + timedelta(days=1)
        if current.weekday() < 5:  # Mon=0 … Fri=4
            added += 1
    return current


def _format_date(dt: datetime) -> str:
    return dt.strftime("%B %d, %Y")


@tool
def place_order(product_id: int, quantity: int) -> str:
    """
    Places an order for a specific product.
    Args:
        product_id: The exact integer ID of the product to order.
        quantity: Number of units to order (must be 1 or more).
    """
    try:
        if quantity < 1:
            return "Quantity must be at least 1."

        # Always look up the authoritative product record server-side —
        # never trust product_name or price if the model tries to supply them.
        product_lookup = (
            db.supabase.table("products").select("*").eq("id", product_id).execute().data
        )
        if not product_lookup:
            return "That product could not be found. Please check the product ID."
        product = product_lookup[0]

        # Stock / inventory check — column may not exist in current schema,
        # so we inspect the record keys before rejecting.
        stock_col = None
        for key in ("stock_quantity", "inventory", "stock", "quantity_available"):
            if key in product:
                stock_col = key
                break

        available = None  # parsed stock value, reused for decrement below
        if stock_col is not None:
            try:
                available = int(product[stock_col])
                if available <= 0:
                    return (
                        f"Sorry, {product['name']} is currently out of stock. "
                        "Please check back later or contact support for availability."
                    )
                if available < quantity:
                    return (
                        f"Sorry, only {available} unit{'s' if available != 1 else ''} "
                        f"of {product['name']} available right now. "
                        f"Please reduce your quantity or check back later."
                    )
            except (ValueError, TypeError):
                logger.warning(
                    "Unparseable stock value for product %s (column %r): %r — "
                    "proceeding without inventory check",
                    product_id, stock_col, product.get(stock_col),
                )

        unit_price = float(product["price"])
        total_price = round(unit_price * quantity, 2)

        payload = {
            "product_id": int(product_id),
            "product_name": str(product["name"]),
            "quantity": int(quantity),
            "unit_price": unit_price,
            "total_price": total_price,
            "ordered_at": datetime.now().isoformat(),
            "session_id": current_session_id.get(),
        }

        response = db.supabase.table("orders").insert(payload).execute()
        order_id = response.data[0]["id"] if response.data else "unknown"

        # Atomically decrement stock now that the order succeeded.
        # Uses an optimistic-concurrency check (eq on the original stock
        # value) so two concurrent orders for the same product cannot
        # silently double-consume inventory.
        if stock_col is not None and available is not None:
            try:
                new_stock = available - quantity
                update_result = (
                    db.supabase.table("products")
                    .update({stock_col: new_stock})
                    .eq("id", product_id)
                    .eq(stock_col, available)
                    .execute()
                )
                if not update_result.data:
                    logger.warning(
                        "Stock decrement conflict for product %s: "
                        "expected %s, order #%s placed anyway",
                        product_id, available, order_id,
                    )
            except Exception as stock_err:
                logger.error(
                    "Failed to decrement stock for product %s after order #%s: %s",
                    product_id, order_id, stock_err,
                )

        return (
            f"Order placed: {quantity} x {product['name']} — "
            f"${total_price:.2f} total (Order #{order_id})."
        )

    except Exception as e:
        logger.error("place_order failed", exc_info=True)
        return "Sorry, I couldn't complete that order right now. Please try again or contact support."


@tool
def get_orders() -> str:
    """
    Fetches order history for the current customer session.
    Use this whenever the user asks about past purchases, order status, or history.
    Each returned order includes a server-computed estimated delivery window
    (3–5 business days from the order date) — the model MUST use these pre-computed
    dates rather than calculating its own.
    """
    try:
        records = (
            db.supabase.table("orders")
            .select("id, product_name, quantity, total_price, ordered_at")
            .eq("session_id", current_session_id.get())
            .order("ordered_at", desc=True)
            .execute()
            .data
        )
        if not records:
            return "You don't have any orders yet."

        # Compute estimated delivery windows server-side so the model never
        # attempts date arithmetic it can get wrong.
        enriched: list[dict] = []
        for r in records:
            try:
                ordered = datetime.fromisoformat(r["ordered_at"])
            except (ValueError, KeyError):
                enriched.append(r)
                continue

            est_start = _add_business_days(ordered, 3)
            est_end   = _add_business_days(ordered, 5)

            enriched.append({
                **r,
                "ordered_at": r["ordered_at"],
                "estimated_delivery_start": _format_date(est_start),
                "estimated_delivery_end":   _format_date(est_end),
            })

        return json.dumps(enriched, default=str)

    except Exception as e:
        logger.error("get_orders failed", exc_info=True)
        return "Sorry, I couldn't retrieve your orders right now. Please try again or contact support."


@tool
def cancel_order(order_id: int) -> str:
    """
    Cancels a specific order by its ID. Only orders belonging to the current
    session can be cancelled — the server enforces this, so the model must
    never attempt to cancel orders from other sessions.
    Args:
        order_id: The integer ID of the order to cancel.
    """
    try:
        # Look up the order and verify it belongs to this session
        record = (
            db.supabase.table("orders")
            .select("id, product_name, session_id")
            .eq("id", order_id)
            .eq("session_id", current_session_id.get())
            .limit(1)
            .execute()
            .data
        )
        if not record:
            return (
                f"Order #{order_id} could not be found in your orders, "
                "so I wasn't able to cancel it. Please double-check the order number."
            )

        db.supabase.table("orders").delete().eq("id", order_id).execute()
        return (
            f"Order #{order_id} ({record[0]['product_name']}) has been cancelled. "
            "If you were charged, a refund will be processed within 5–7 business days."
        )

    except Exception as e:
        logger.error("cancel_order failed", exc_info=True)
        return "Sorry, I couldn't cancel that order right now. Please try again or contact support."