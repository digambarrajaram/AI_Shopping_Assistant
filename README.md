# ShopAssist — AI Shopping Assistant

An AI-powered shopping assistant with a production-quality chat interface.

**Backend:** FastAPI · LangChain · AWS Bedrock (Nova Lite) · Supabase
**Frontend:** React · TypeScript · Vite · TailwindCSS

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Local Development](#local-development)
5. [Environment Variables](#environment-variables)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)
8. [AI / LLM Architecture](#ai--llm-architecture)
9. [Cloud Deployment (Vercel)](#cloud-deployment-vercel)
10. [Security](#security)

---

## Architecture

### Development

```
┌──────────────────────────────────────────┐
│              Browser :5173                │
│                                        │
│  React dev server (Vite)                │
│  - Hot reload                           │
│  - TailwindCSS JIT                      │
│  - Proxy /chat, /products → :8000       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         FastAPI Backend :8000             │
│                                        │
│  uvicorn main:app --reload              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  5 Guardrail Layers              │  │
│  │  Input → System Prompt → Tools   │  │
│  │  → Output → Observability        │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  5 LangChain Tools               │  │
│  │  get_products, search_products,  │  │
│  │  place_order, get_orders,        │  │
│  │  get_reviews                     │  │
│  └──────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌───────────┐    ┌────────────┐
│ Supabase   │    │ AWS Bedrock │
│ - Products │    │ Nova Lite   │
│ - Reviews  │    │ ap-south-1  │
│ - Orders   │    └────────────┘
│ - Sessions │
│ - Storage  │
└───────────┘
```

### Production (Vercel)

```
┌──────────────────────────────────────────────────┐
│            your-app.vercel.app                     │
│                                                    │
│  Incoming request                                  │
│       │                                            │
│       ▼                                            │
│  ┌────────────────────┐                            │
│  │   vercel.json       │  Route decision            │
│  │   rewrites          │                            │
│  └──┬──────────────┬──┘                            │
│     │              │                                │
│     ▼              ▼                                │
│  /chat          /* (everything else)                │
│  /products      │                                  │
│  /health        ▼                                  │
│     │     ┌──────────────────┐                     │
│     │     │  frontend/dist/   │  Static SPA         │
│     │     │  React + Vite     │  (CDN cached)       │
│     │     └──────────────────┘                     │
│     ▼                                              │
│  ┌──────────────────────────────────────────┐     │
│  │  api/index.py                             │     │
│  │  Python Serverless Function               │     │
│  │  (512 MB, 30s timeout)                    │     │
│  │                                          │     │
│  │  from main import app                    │     │
│  │  FastAPI + LangChain + Bedrock            │     │
│  └──────────────┬───────────────────────────┘     │
│                 │                                  │
└─────────────────┼──────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
┌────────────┐        ┌────────────┐
│  Supabase   │        │ AWS Bedrock │
│  (session   │        │ (LLM calls) │
│   storage)  │        └────────────┘
└────────────┘
```

---

## Prerequisites

| Tool | Version | Purpose | Required? |
|---|---|---|---|
| Python | 3.12+ | Backend runtime | Yes |
| Node.js | 18+ | Frontend dev server & build | Yes |
| npm | 9+ | Package management | Yes |
| Supabase account | Free tier | PostgreSQL database + file storage | Yes |
| AWS Bedrock access | — | LLM provider (Nova Lite, `ap-south-1`) | Yes |
| LangSmith account | Free tier | LLM tracing & observability | No (optional) |
| Git | 2.x | Version control | Yes |

---

## Database Schema

All tables live in **Supabase** (PostgreSQL). Create them in **Supabase Dashboard → SQL Editor** before running the app.

### Entity Relationship

```
products ──< reviews     (one product has many reviews)
products ──< orders      (one product appears in many orders)
sessions                  (independent — chat session persistence)
```

### 1. `products`

Stores the product catalog. Each product belongs to one category.

| Column | Type | Constraint | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PRIMARY KEY | Auto-incrementing |
| `name` | `TEXT` | NOT NULL | Display name |
| `category` | `TEXT` | NOT NULL DEFAULT `'general'` | e.g. `coffee`, `tea`, `nuts` |
| `price` | `NUMERIC(6,2)` | NOT NULL DEFAULT `0` | Unit price in USD |
| `description` | `TEXT` | DEFAULT `''` | Product description |
| `is_organic` | `BOOLEAN` | NOT NULL DEFAULT `FALSE` | Organic certification flag |
| `image_url` | `TEXT` | DEFAULT `''` | Image filename in Supabase Storage |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` | Row creation timestamp |

```sql
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'general',
    price       NUMERIC(6,2) NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    is_organic  BOOLEAN NOT NULL DEFAULT FALSE,
    image_url   TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX idx_products_category ON products (category);

-- Index for name search (ilike queries in search_products)
CREATE INDEX idx_products_name ON products USING gin (name gin_trgm_ops);
```

### 2. `reviews`

User-submitted product reviews with 1–5 star ratings.

| Column | Type | Constraint | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PRIMARY KEY | Auto-incrementing |
| `product_id` | `INT4` | NOT NULL REFERENCES `products(id)` | Which product this review is for |
| `rating` | `INT2` | NOT NULL CHECK (1–5) | Star rating |
| `comment` | `TEXT` | DEFAULT `''` | Review text |
| `user_name` | `TEXT` | DEFAULT `'Anonymous'` | Reviewer display name |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` | Review timestamp |

```sql
CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INT4 NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating      INT2 NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT DEFAULT '',
    user_name   TEXT DEFAULT 'Anonymous',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews (product_id);
```

### 3. `orders`

Tracks orders placed through the chat interface. Each order is tied to a chat session.

| Column | Type | Constraint | Notes |
|---|---|---|---|
| `id` | `SERIAL` | PRIMARY KEY | Auto-incrementing order ID |
| `session_id` | `TEXT` | NOT NULL | UUID of the chat session |
| `product_id` | `INT4` | NOT NULL | References `products(id)` |
| `product_name` | `TEXT` | NOT NULL DEFAULT `''` | Denormalized for fast display |
| `quantity` | `INT2` | NOT NULL DEFAULT `1` | Units ordered |
| `total_price` | `NUMERIC(8,2)` | NOT NULL DEFAULT `0` | `quantity × product price` |
| `ordered_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` | Order timestamp |

```sql
CREATE TABLE orders (
    id           SERIAL PRIMARY KEY,
    session_id   TEXT NOT NULL,
    product_id   INT4 NOT NULL,
    product_name TEXT NOT NULL DEFAULT '',
    quantity     INT2 NOT NULL DEFAULT 1,
    total_price  NUMERIC(8,2) NOT NULL DEFAULT 0,
    ordered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_session ON orders (session_id);
```

### 4. `chat_sessions`

Persists chat history across Vercel serverless cold starts. Each session stores the full LangChain message list as JSON.

| Column | Type | Constraint | Notes |
|---|---|---|---|
| `id` | `TEXT` | PRIMARY KEY | UUID v4 session ID |
| `messages` | `JSONB` | NOT NULL DEFAULT `'[]'` | Serialized `[HumanMessage, AIMessage, ToolMessage, ...]` |
| `last_active` | `DOUBLE PRECISION` | NOT NULL DEFAULT `0` | Unix timestamp of last message |
| `products_were_listed` | `BOOLEAN` | NOT NULL DEFAULT `FALSE` | Were products shown this turn? |
| `orders_were_listed` | `BOOLEAN` | NOT NULL DEFAULT `FALSE` | Were orders shown this turn? |
| `last_search_type` | `TEXT` | — | `get_products` or `search_products` |
| `last_search_params` | `JSONB` | — | Filter args for structured frontend payload |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` | Session creation timestamp |

```sql
CREATE TABLE chat_sessions (
    id                    TEXT PRIMARY KEY,
    messages              JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_active           DOUBLE PRECISION NOT NULL DEFAULT 0,
    products_were_listed  BOOLEAN NOT NULL DEFAULT FALSE,
    orders_were_listed    BOOLEAN NOT NULL DEFAULT FALSE,
    last_search_type      TEXT,
    last_search_params    JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_last_active ON chat_sessions (last_active);
```

### Message JSON format

Each entry in the `messages` JSONB array follows this structure:

```json
[
  {"type": "human",   "content": "I want to buy coffee"},
  {"type": "ai",      "content": "Here are two coffee products...", "tool_calls": [...]},
  {"type": "tool",    "content": "23. Organic Ethiopian Coffee...", "tool_call_id": "call_abc"},
  {"type": "ai",      "content": "Which one would you like to order?"}
]
```

### Supabase Storage

Create a **public bucket** named `product-images` in **Supabase Dashboard → Storage**:

1. Go to Storage → New Bucket
2. Name: `product-images`
3. Check **Public bucket**
4. Upload product images with filenames that match `products.image_url`

The image URL is automatically constructed as:
```
https://<SUPABASE_URL>/storage/v1/object/public/product-images/<image_url>
```

---

## Local Development

### Step 1: Clone and install

```bash
git clone https://github.com/digambarrajaram/AI_Shopping_Assistant.git
cd AI_Shopping_Assistant

# Backend
python -m venv venv
source venv/bin/activate          # Linux / macOS
# .\venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

**What gets installed:**
```
fastapi             — web framework
uvicorn             — ASGI server
langchain-aws       — Bedrock chat model
langchain-core      — messages, tools, runnables
langchain-google-genai — fallback provider (imported but not active)
supabase            — database client
python-dotenv       — .env file loader
pydantic            — request validation
langsmith           — LLM tracing
```

### Step 2: Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your real credentials:

```bash
# Required — app won't start without these
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
AWS_BEARER_TOKEN_BEDROCK=absk...
GOOGLE_API_KEY=AIza...

# Optional — for LangSmith tracing
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT="AI_Shopping_Assistant"
```

### Step 3: Initialize the database

Open **Supabase Dashboard → SQL Editor**, paste and run all four `CREATE TABLE` statements from [Database Schema](#database-schema) above. Then seed some data:

```sql
-- Example: insert sample products
INSERT INTO products (name, category, price, description, is_organic) VALUES
  ('Organic Ethiopian Coffee', 'coffee', 16.99, 'Single-origin organic Arabica, medium roast whole bean', true),
  ('Dark Roast Espresso Blend', 'coffee', 14.49, 'Bold dark roast espresso blend, ground', false),
  ('Organic Green Tea', 'tea', 12.99, 'Premium loose-leaf green tea from Japan', true),
  ('Organic Almonds', 'nuts', 11.99, 'Raw organic almonds, unsalted, non-GMO', true),
  ('Trail Mix', 'snacks', 8.49, 'Classic mix with raisins, M&Ms, peanuts, and sunflower seeds', false);

-- Example: insert sample reviews
INSERT INTO reviews (product_id, rating, comment, user_name) VALUES
  (1, 5, 'Best coffee I have ever tried!', 'CoffeeLover'),
  (1, 4, 'Great flavor, slightly pricey', 'JaneDoe'),
  (1, 5, 'Smooth and rich taste', 'JohnSmith'),
  (1, 5, 'Perfect morning brew', 'Tea2Coffee'),
  (2, 4, 'Strong and bold, just how I like it', 'EspressoFan'),
  (2, 3, 'A bit too dark for my taste', 'MildBrew'),
  (2, 5, 'Excellent espresso base', 'HomeBarista');
```

### Step 4: Start the backend

```bash
uvicorn main:app --reload --port 8000
```

**What happens at startup:**
1. `db.py` validates all required env vars — fails fast if any are missing
2. Supabase client is initialized
3. FastAPI app is created with CORS middleware
4. LangChain ChatBedrockConverse is initialized with Nova Lite
5. Five tools are bound via `llm.bind_tools()`
6. Server listens on `http://localhost:8000`

Verify:
- API docs: http://localhost:8000/docs
- Health check: `curl http://localhost:8000/health` → `{"status":"ok"}`
- Products: `curl http://localhost:8000/products` → JSON array

### Step 5: Start the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

**What happens:**
1. Vite dev server starts on `http://localhost:5173`
2. The `vite.config.ts` proxy forwards `/chat` and `/products` to `localhost:8000`
3. TailwindCSS compiles on-demand (JIT mode)
4. Fast Refresh enabled for instant UI updates

### Step 6: Verify end-to-end

1. Open http://localhost:5173 in your browser
2. You should see the product grid on the left (fetched from `/products`)
3. Click the chat button (bottom-right) to open the chat panel
4. Try these queries:

| Query | Expected behavior |
|---|---|
| *"Show me all products"* | Agent calls `get_products`, displays catalog |
| *"I want to buy coffee"* | Agent calls `search_products(query="coffee")`, shows matching products |
| *"Show reviews for Organic Ethiopian Coffee"* | Agent calls `get_reviews(product_id=...)` |
| *"Place an order for Trail Mix"* | Agent calls `search_products` then `place_order` |
| *"What are my orders?"* | Agent calls `get_orders`, shows order history |
| *"What's your return policy?"* | Agent answers from system prompt — no tool call |

---

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `SUPABASE_URL` | **Yes** | Supabase project URL (e.g. `https://xxx.supabase.co`) | — |
| `SUPABASE_SERVICE_KEY` | **Yes** | Supabase service role key (full DB access) | — |
| `AWS_BEARER_TOKEN_BEDROCK` | **Yes** | AWS Bedrock bearer token for Nova Lite | — |
| `GOOGLE_API_KEY` | **Yes** | Google AI key (validated at startup; kept as fallback) | — |
| `GROQ_API_KEY` | No | Groq API key (unused, future fallback only) | — |
| `LANGCHAIN_TRACING_V2` | No | Set to `"true"` to send traces to LangSmith | — |
| `LANGCHAIN_API_KEY` | No | LangSmith API key (starts with `lsv2_pt_`) | — |
| `LANGCHAIN_PROJECT` | No | Project name in LangSmith dashboard | — |
| `LANGSMITH_ENDPOINT` | No | LangSmith API URL | `https://api.smith.langchain.com` |
| `SUPPORT_EMAIL` | No | Email shown when escalation is needed | `support@store.com` |
| `SUPPORT_PHONE` | No | Phone shown when escalation is needed | `+1-800-123-4567` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `VITE_API_URL` | No | Backend URL for frontend build (empty = same-origin) | `""` |

---

## Project Structure

```
├── main.py              # FastAPI app, agent loop, guardrails, session store
├── db.py                # Supabase client, env validation, session CRUD
├── products.py          # LangChain tools: get_products, search_products
├── orders.py            # LangChain tools: place_order, get_orders
├── reviews.py           # LangChain tool:  get_reviews
├── requirements.txt     # Python dependencies
├── .env.example         # Env var template with descriptions
├── .gitignore           # Excludes .env, venv, logs, node_modules
├── vercel.json          # Vercel deployment config (frontend + backend routing)
├── api/
│   └── index.py         # Vercel serverless entry point → imports FastAPI app
├── logs/                # JSON log output (local dev; stdout on Vercel)
│
└── frontend/
    ├── package.json
    ├── vite.config.ts       # Vite dev proxy → localhost:8000
    ├── tsconfig.json        # TypeScript strict mode
    ├── tailwind.config.ts   # TailwindCSS v3 with design tokens
    ├── index.html           # Vite entry HTML
    ├── .env.local           # VITE_API_URL="" (same-origin in dev)
    ├── .env.production      # VITE_API_URL placeholder
    └── src/
        ├── main.tsx              # React entry point + Vercel Analytics
        ├── App.tsx               # Root layout (shop view + chat toggle)
        ├── index.css             # Tailwind directives + custom properties
        ├── api/
        │   └── chatApi.ts        # POST /chat wrapper with error handling
        ├── hooks/
        │   ├── useChatSession.ts # Chat state machine (messages, send, retry)
        │   └── useProducts.ts    # Product catalog fetch + image matching
        ├── types/
        │   └── chat.ts           # Message, ChatProduct, ChatOrder interfaces
        └── components/
            ├── ChatWidget.tsx     # Full chat panel container
            ├── MessageBubble.tsx  # Markdown + product/order card rendering
            ├── InputBar.tsx       # Message input + send button
            ├── ProductCard.tsx    # Shop page card (fractional star rating)
            ├── ProductGrid.tsx    # Category-grouped product grid
            ├── ProductList.tsx    # In-chat compact product listing
            ├── OrderCard.tsx      # In-chat order history card
            ├── QuickReplies.tsx   # Suggestion chip buttons
            ├── TypingIndicator.tsx # Animated typing dots
            ├── ChatToggle.tsx     # FAB to open/close chat
            ├── Header.tsx         # App header bar
            └── ErrorBanner.tsx    # Error state display
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/chat` | None | AI chat — returns reply + structured products/orders payload |
| `GET` | `/products` | None | Full product catalog with aggregated ratings |
| `GET` | `/health` | None | Health check |

### POST /chat

The primary endpoint. Accepts a user message and session ID, runs the full guardrail pipeline, executes any needed tool calls, and returns the AI response.

**Request**
```json
{
  "message": "I want to buy coffee",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `message` | `string` | Yes | User's message (max 500 chars) |
| `session_id` | `string` | Yes | UUID v4 — reuse for conversation continuity |

**Response**
```json
{
  "reply": "Here are two coffee products we have:",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "products": [
    {
      "id": 23,
      "name": "Organic Ethiopian Coffee",
      "price": 16.99,
      "description": "Single-origin organic Arabica, medium roast whole bean",
      "category": "coffee",
      "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/product-images/coffee1.jpg",
      "rating": 4.8,
      "reviewCount": 4
    },
    {
      "id": 24,
      "name": "Dark Roast Espresso Blend",
      "price": 14.49,
      "description": "Bold dark roast espresso blend, ground",
      "category": "coffee",
      "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/product-images/coffee2.jpg",
      "rating": 4.0,
      "reviewCount": 3
    }
  ],
  "orders": null
}
```

| Field | Type | Notes |
|---|---|---|
| `reply` | `string` | AI's natural language response |
| `session_id` | `string` | Echoed back — use for subsequent requests |
| `products` | `array \| null` | Structured product list (present when a product tool was called) |
| `orders` | `array \| null` | Structured order history (present when `get_orders` was called) |

**Error responses**

| Status | When |
|---|---|
| 200 | Success (even if guardrail blocks — check `reply` text) |
| 422 | Validation error — message too long or session_id missing |
| 413 | Request body too large (>10 KB) |

### GET /products

Returns the full product catalog with average ratings and review counts.

```
GET /products?offset=0&limit=50
```

**Response:** Array of product objects (same shape as the `products` array in POST /chat).

### GET /health

```
GET /health → {"status": "ok"}
```

---

## AI / LLM Architecture

### Agent Loop

```
User message
    │
    ▼
┌─────────────────────────┐
│ Layer 1: Input Guardrail │
│ - Length check (500)     │
│ - Rate limit (15/min)    │
│ - PII redaction          │
│ - Injection detection    │
│ - Session block check    │
└─────────┬───────────────┘
          │ allowed
          ▼
┌─────────────────────────┐
│ Layer 2: System Prompt   │
│ - Scope enforcement      │
│ - Tool usage mapping     │
│ - Security rules         │
└─────────┬───────────────┘
          │
          ▼
    ┌──────────┐
    │ LLM Call  │────▶ AWS Bedrock Nova Lite
    └─────┬─────┘
          │
    ┌─────▼──────┐
    │ Tool calls? │
    └─────┬──────┘
      yes │          no
          │           │
          ▼           ▼
┌─────────────────┐  ┌──────────────────────────┐
│ Layer 3: Tool    │  │ Layer 4: Output Guardrail │
│ Execution        │  │ - Signal leak detection    │
│ - Allowlist      │  │ - ID leak regex            │
│ - Arg validation │  │ - PII strip                │
│ - Truncation     │  │ - Length cap (1500)        │
└────────┬────────┘  │ - Thinking block strip     │
         │           └──────────┬─────────────────┘
         │                      │
         └──────► loop ◄────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ Layer 5: Logging │
          │ - JSON structured │
          │ - LangSmith trace │
          │ - Session persist │
          └─────────────────┘
                    │
                    ▼
               Response to user
```

### Tools

The LLM decides which tool to call based on the system prompt's intent-mapping rules. All tools use the `@tool` decorator from LangChain.

| Tool | Trigger phrases | Key arguments | Returns |
|---|---|---|---|
| `get_products` | "show products", "catalog", "what do you have", "browse" | `sort_by_rating` (`"asc"`, `"desc"`, `"none"`) | Full product list with ratings |
| `search_products` | "coffee", "under $10", "organic", product name | `category`, `max_price`, `query` | Filtered product list |
| `place_order` | "buy X", "order X", "I'll take X" | `product_id` (int), `quantity` (int) | Order confirmation |
| `get_orders` | "my orders", "order history", "track" | none | Session order list |
| `get_reviews` | "reviews for X", "what do people think of X" | `product_id` (int) | Review list with ratings |

`cancel_order` exists in `orders.py` but is **excluded** from the tool allowlist — cancellations are escalated to support.

### System Prompt Design

The system prompt (~2,500 chars) enforces:
- **Scope**: Only store-related topics. Everything else gets a deflection response.
- **Honesty**: Never fabricate product details. Say "I'm not sure" when data is absent.
- **Security**: Never reveal tool names, API parameters, database IDs, or system architecture.
- **Tool mapping**: Maps user intent phrases to the correct tool (see table above).
- **Extraction protection**: If asked to repeat/reveal the system prompt, responds with a fixed refusal.

### Session Management

- **Local dev**: Sessions stored in-memory (`_memory_store` dict). Lost on restart.
- **Vercel production**: Sessions persisted in Supabase `chat_sessions` table. Survives cold starts and redeploys.
- **TTL**: 30 minutes — expired sessions are deleted on next access.
- **Trim**: Safe-trim algorithm preserves tool-call/tool-result pairs and ensures conversation always starts with a `HumanMessage` (required by Bedrock Converse API).

### Context Window Management

- Max history messages: **10** (target; safe-trim may keep slightly more)
- Tool response truncation: **1,200 chars** per tool output
- Output length cap: **1,500 chars** on AI responses
- Rate limiting: **15 requests per 60-second window** per session

---

## Cloud Deployment (Vercel)

The entire app — **frontend + backend** — deploys as a single Vercel project.

### One-time setup

Before first deploy, do these **once**:

1. **Supabase SQL Editor** — run all `CREATE TABLE` statements from [Database Schema](#database-schema)
2. **Supabase Storage** — create a public bucket named `product-images` and upload product images
3. **Supabase SQL Editor** — insert seed data (products, reviews) using the examples in [Local Development](#local-development)

### Deploy

1. Push the repo to GitHub:
   ```bash
   git add -A
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Import Project** → select this repository
3. Vercel reads `vercel.json` and auto-configures:
   - Framework: Vite (frontend)
   - Python serverless function: `api/index.py` (backend)
   - Route rewrites: `/chat`,`/products`,`/health` → backend, `/*` → frontend
4. Go to **Settings → Environment Variables** and add **every variable** from `.env.example` with your production values:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGci...
   AWS_BEARER_TOKEN_BEDROCK=absk...
   GOOGLE_API_KEY=AIza...
   LANGCHAIN_TRACING_V2="true"
   LANGCHAIN_API_KEY=lsv2_pt_...
   LANGCHAIN_PROJECT="AI_Shopping_Assistant"
   ```
5. Click **Deploy**

After deployment, you get a URL like `https://shopassist.vercel.app`. The frontend and backend are on the same domain — no CORS issues, no `VITE_API_URL` needed.

### How routing works

```
Request to /chat       →  vercel.json rewrite  →  api/index.py  (FastAPI handles it)
Request to /products   →  vercel.json rewrite  →  api/index.py
Request to /health     →  vercel.json rewrite  →  api/index.py
Request to /anything   →  vercel.json rewrite  →  frontend/dist/index.html  (React SPA)
```

### Cold starts

- **First request after deploy/idle**: Python function cold-starts (~3–8 seconds for LangChain + Bedrock imports)
- **Subsequent requests**: Warm instance handles in ~1–3 seconds
- **Session data**: Persisted in Supabase — chat history survives cold starts

### Redeploying

Push to `main` branch → Vercel auto-deploys. No manual steps needed.

### Environment variable changes

After changing env vars in Vercel dashboard, **redeploy** to apply them (Python functions read env vars at invocation time; frontend env vars are baked at build time).

---

## Security

### Secrets management
- **NEVER commit `.env`** — it is listed in `.gitignore`
- All real credentials live in Vercel Environment Variables (production) or local `.env` (development)
- Rotate credentials immediately if the `.env` file is ever exposed

### Guardrail protections

| Layer | Protection |
|---|---|
| Input | PII redacted before reaching LLM; injection phrases detected and counted |
| Input | Sessions blocked after 3 jailbreak/injection attempts |
| Input | Rate limited to 15 requests per 60 seconds per session |
| System Prompt | LLM instructed to refuse off-topic, prompt extraction, and role-play attacks |
| System Prompt | LLM instructed never to reveal tool names, DB IDs, or internal structure |
| Tool | Only 5 allowlisted tools executable; args validated and type-coerced |
| Output | Response scanned for accidental tool names, parameter names, and DB IDs |
| Output | Thinking blocks stripped before user sees response |
| Output | Response capped at 1,500 characters |

### Data flow

```
User message
  → PII redaction (email, phone, credit card, SSN)
  → Injection scan (jailbreak patterns)
  → LLM + tool calls
  → Output leak scan (tool names, IDs)
  → PII strip
  → Length cap
  → User sees response
```

---

## License

MIT

---

Built with [FastAPI](https://fastapi.tiangolo.com/) · [LangChain](https://www.langchain.com/) · [AWS Bedrock](https://aws.amazon.com/bedrock/) · [Supabase](https://supabase.com/) · [React](https://react.dev/) · [Vite](https://vitejs.dev/) · [TailwindCSS](https://tailwindcss.com/)
