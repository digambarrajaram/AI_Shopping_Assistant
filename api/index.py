"""
Vercel serverless entry point for the FastAPI backend.
All /chat, /products, /health requests are routed here via vercel.json rewrites.
"""
import sys
import os

# Ensure the project root is on sys.path so db, products, orders, reviews imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Vercel's Python runtime auto-detects the ASGI `app` object.
# No handler function needed — the app is served as-is.
