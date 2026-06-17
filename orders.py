from datetime import datetime
from langchain_core.tools import tool
import db

@tool
def place_order(product_id: int, product_name: str, price: float) -> str:
    """
    Places an order for a specific product item.
    Args:
        product_id: The exact integer ID of the product database item.
        product_name: The name of the product.
        price: The price of the product.
    """
    try:
        # Generate a fresh ISO-8601 string timestamp right when called
        current_time_str = datetime.now().isoformat()
        
        # Explicit type casting before database insertion
        payload = {
            "product_id": int(product_id),
            "product_name": str(product_name),
            "price": float(price),
            "ordered_at": current_time_str  # Pass a clean text string to Supabase
        }
        
        response = db.supabase.table("orders").insert(payload).execute()
        return f"Order placed successfully! Generated Details: {response.data}"
        
    except Exception as e:
        return f"Failed to place order: {str(e)}"

@tool
def get_orders() -> str:
    """
    Fetches the complete historical log of all successfully placed store orders.
    Use this whenever the user asks about past purchases, order status, or history.
    """
    try:
        # Fetch order history records using the secure service key role connection
        historical_records = db.supabase.table("orders").select("*").execute().data
        if not historical_records:
            return "No orders have been recorded in the system yet."
        return str(historical_records)
    except Exception as e:
        return f"Database query lookup failed with error: {str(e)}"