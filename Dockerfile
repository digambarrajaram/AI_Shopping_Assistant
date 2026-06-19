# =============================================================================
# ShopAssist Backend — Dockerfile
# =============================================================================
# Build:    docker build -t shopassist-backend .
# Run:      docker run -p 8000:8000 --env-file .env shopassist-backend
#
# IMPORTANT: The backend uses in-process state dictionaries for sessions,
# rate limiting, and abuse tracking.  It MUST run as a single worker.
# Do NOT scale horizontally without migrating state to a shared store.
# =============================================================================

FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies for any native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Runtime stage ───────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code (Python files only — no frontend, no venv)
COPY main.py db.py orders.py products.py reviews.py ./
COPY requirements.txt .

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 8000

# Single worker enforced — see FIX 25 in main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
