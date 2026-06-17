import os
from dotenv import load_dotenv
from langchain_core.tools import tool
from supabase import Client, create_client
import supabase
import db

load_dotenv()
@tool
def get_reviews(product_id: int) -> str:
    """
    Fetches customer reviews and ratings for a specific product item by its numerical ID.
    Args:
        product_id: The exact integer ID of the product.
    """
    try:
        reviews = db.supabase.table("reviews").select("*").eq("product_id", product_id).execute().data
        if not reviews:
            return f"No reviews found for product ID {product_id}."
        return str(reviews)
    except Exception as e:
        return f"Error fetching reviews: {str(e)}"

