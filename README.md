# ShopAssist — AI Shopping Assistant

An AI-powered shopping assistant with a production-quality chat interface. Built with **FastAPI**, **LangChain**, **AWS Bedrock (Nova Lite)**, and **Supabase** on the backend, and **React + TypeScript + Vite + TailwindCSS** on the frontend.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Browser                       │
│  http://localhost:5173  (dev) / Vercel  (prod)      │
└────────────┬────────────────────────────────────────┘
             │
    ┌────────▼────────┐     ┌──────────────────────┐
    │  React + Vite    │     │   FastAPI Backend     │
    │  Frontend        │────▶│   (single worker)     │
    │  Port 5173       │     │   Port 8000           │
    └─────────────────┘     └──────┬───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
             ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
             │  Supabase    │ │  AWS    │ │  LangSmith   │
             │  (DB/Storage)│ │ Bedrock │ │  (Tracing)   │
             └──────────────┘ └─────────┘ └──────────────┘
```

## Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **Supabase** account (free tier) — for products, reviews, orders
- **AWS Bedrock** access — Nova Lite model in `ap-south-1`
- **LangSmith** account (free tier, optional) — for LLM observability

## Quick Start

### 1. Clone & setup backend

```bash
git clone https://github.com/digambarrajaram/AI_Shopping_Assistant.git
cd AI_Shopping_Assistant

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
# .\venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your credentials (see table below)
```

### 3. Run the backend

```bash
uvicorn main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `SUPABASE_URL` | **Yes** | Supabase project URL | — |
| `SUPABASE_SERVICE_KEY` | **Yes** | Supabase service role key | — |
| `AWS_BEARER_TOKEN_BEDROCK` | **Yes** | AWS Bedrock bearer token | — |
| `GOOGLE_API_KEY` | **Yes** | Google AI key (startup validation) | — |
| `GROQ_API_KEY` | No | Groq API key (unused fallback) | — |
| `LANGCHAIN_TRACING_V2` | No | Enable LangSmith tracing | — |
| `LANGCHAIN_API_KEY` | No | LangSmith API key | — |
| `LANGCHAIN_PROJECT` | No | LangSmith project name | — |
| `LANGSMITH_ENDPOINT` | No | LangSmith API endpoint | `https://api.smith.langchain.com` |
| `SUPPORT_EMAIL` | No | Email shown in guardrail messages | `support@store.com` |
| `SUPPORT_PHONE` | No | Phone shown in guardrail messages | `+1-800-123-4567` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `VITE_API_URL` | No | Backend URL (frontend build-time) | `""` (same-origin) |

## Project Structure

```
├── main.py              # FastAPI app, agent loop, guardrails, session management
├── db.py                # Supabase client, env var validation, config
├── products.py          # get_products & search_products tools
├── orders.py            # place_order & get_orders tools
├── reviews.py           # get_reviews tool
├── requirements.txt     # Python dependencies
├── Dockerfile           # Backend container build
├── .env.example         # Environment variable template
├── vercel.json          # Vercel frontend deployment config
├── logs/                # JSON-structured log output
│
└── frontend/
    ├── src/
    │   ├── App.tsx               # Root component
    │   ├── main.tsx              # React entry point
    │   ├── api/chatApi.ts        # POST /chat wrapper
    │   ├── hooks/
    │   │   ├── useChatSession.ts # Chat state management
    │   │   └── useProducts.ts    # Product catalog fetch
    │   ├── components/
    │   │   ├── ChatWidget.tsx     # Chat panel
    │   │   ├── MessageBubble.tsx  # Message rendering (markdown + cards)
    │   │   ├── ProductCard.tsx    # Shop page product card
    │   │   ├── ProductGrid.tsx    # Shop page product grid
    │   │   ├── ProductList.tsx    # In-chat product listing
    │   │   ├── OrderCard.tsx      # In-chat order card
    │   │   └── ...
    │   └── index.css             # Tailwind + design tokens
    ├── vite.config.ts
    └── package.json
```

## Deployment

### Frontend → Vercel

The repo includes a `vercel.json` preset. The frontend builds as a static Vite site:

1. Push this repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Vercel auto-detects the config from `vercel.json`
4. **Set environment variable** in Vercel dashboard:
   - `VITE_API_URL` = your deployed backend URL (e.g., `https://shopassist-api.railway.app`)
5. Deploy

### Backend → Docker / Railway / Render

> **IMPORTANT:** The backend uses in-process state for sessions, rate limiting, and abuse tracking. It **MUST run as a single worker**. Do not scale horizontally without migrating state to Redis or a shared database.

#### Option A: Docker (any platform)

```bash
docker build -t shopassist-backend .
docker run -p 8000:8000 --env-file .env shopassist-backend
```

#### Option B: Railway

1. Create new project, connect GitHub repo
2. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
3. Add all env vars from `.env.example` in Railway dashboard
4. Deploy

#### Option C: Render Web Service

1. Create Web Service, connect GitHub repo
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
4. Add env vars in Render dashboard

#### CORS configuration

When deploying frontend and backend on different domains, update `ALLOWED_ORIGINS` to include the frontend URL:

```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

## LLM Architecture — 5 Guardrail Layers

### Layer 1: Input Guardrail
- Input length limit (500 chars)
- Rate limiting (15 requests per 60s window per session)
- PII detection & redaction (credit cards, SSN, email, phone)
- Injection attack detection (jailbreak phrases)
- Session blocking after 3 injection attempts

### Layer 2: System Prompt
- Scope enforcement (store-only topics)
- Security rules (no tool names, no internal IDs in responses)
- Tool usage mapping (user intent → correct tool)
- Honesty & accuracy directives
- System prompt protection (refusal to repeat instructions)

### Layer 3: Tool Execution
- **Tool allowlist**: 5 active tools (see below)
- Argument validation and type coercion
- Tool response truncation (1200 chars)
- Error handling with safe fallback messages
- Autoresponse for missing args (e.g., `product_id` filled from context)

### Layer 4: Output Guardrail
- Internal signal leak detection (tool names, parameter names)
- Numeric ID leak detection (word-boundary regex)
- PII stripping on output
- Output length cap (1500 chars)
- Nova `<thinking>` block stripping

### Layer 5: Observability
- Structured JSON logging to `logs/shopassist.log`
- Rotating file handler (5 MB, 7 backups)
- LangSmith tracing integration (`@traceable` + auto-callbacks)
- Session TTL (30 minutes) with auto-cleanup
- Abuse tracking (injection counts, session blocks)

## Tools

| Tool | Description | Key Args |
|---|---|---|
| `get_products` | Full product catalog with ratings | `sort_by_rating` (optional) |
| `search_products` | Filtered product search (name + category) | `category`, `max_price`, `query` |
| `place_order` | Place an order | `product_id` (int), `quantity` (int) |
| `get_orders` | Session order history | none |
| `get_reviews` | Product reviews | `product_id` (int) |

`cancel_order` is defined but intentionally excluded — cancellations escalate to support.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Send message, get AI response + structured product/order payloads |
| `GET` | `/products` | Product catalog with ratings (paginated via `?offset=&limit=`) |
| `GET` | `/health` | Health check |

### POST /chat

```json
// Request
{ "message": "I want to buy coffee", "session_id": "550e8400-e29b-..." }

// Response
{
  "reply": "Here are two coffee products...",
  "session_id": "550e8400-e29b-...",
  "products": [
    {
      "id": 23,
      "name": "Organic Ethiopian Coffee",
      "price": 16.99,
      "description": "Single-origin organic Arabica...",
      "category": "coffee",
      "imageUrl": "https://...",
      "rating": 4.8,
      "reviewCount": 4
    }
  ],
  "orders": null
}
```

## Security

- **NEVER commit `.env`** — it contains live API keys. It's listed in `.gitignore`.
- The Supabase service key, AWS Bedrock token, and LangSmith API key grant database/LLM access. Rotate immediately if exposed.
- All PII is detected and redacted **before** reaching the LLM or being stored.
- Injection attempts are tracked per session; sessions are blocked after 3 attempts.
- Rate limiting prevents abuse (15 requests/minute/session).
- Output is scanned for internal signals (tool names, IDs) before being returned.

## License

MIT — see [LICENSE](LICENSE) file.

---

Built with [FastAPI](https://fastapi.tiangolo.com/), [LangChain](https://www.langchain.com/), [AWS Bedrock](https://aws.amazon.com/bedrock/), [Supabase](https://supabase.com/), [React](https://react.dev/), and [Vite](https://vitejs.dev/).
