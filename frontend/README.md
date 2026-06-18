# ShopAssist Frontend

A production-quality React + TypeScript chat interface for the ShopAssist AI
shopping assistant. Built with Vite, Tailwind CSS, and Framer Motion.

## Quick Start

```bash
npm install
npm run dev
```

The dev server starts on [http://localhost:5173](http://localhost:5173).

## Backend

The Vite dev server proxies `/chat` requests to the Python FastAPI backend
running on `http://localhost:8000`. Start the backend with:

```bash
# From the project root
uvicorn main:app --reload --port 8000
```

### Environment Variable

| Variable       | Default            | Description                    |
| -------------- | ------------------ | ------------------------------ |
| `VITE_API_URL` | `""` (uses proxy)  | Override backend base URL      |

For production builds that don't use the Vite proxy, set `VITE_API_URL` to the
backend's full origin (e.g. `https://api.example.com`).

## Build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview the production build locally
```

## Project Structure

```
src/
├── api/
│   └── chatApi.ts          # POST /chat fetch wrapper
├── components/
│   ├── Header.tsx           # Fixed top bar with logo + status
│   ├── MessageBubble.tsx    # User / assistant chat bubbles
│   ├── TypingIndicator.tsx  # Animated three-dot indicator
│   ├── DateSeparator.tsx    # "Today" / "Yesterday" date pills
│   ├── InputBar.tsx         # Auto-grow textarea + send button
│   ├── QuickReplies.tsx     # Suggested starter prompts
│   ├── ErrorBanner.tsx      # API error notification banner
│   └── EmptyState.tsx       # Welcome screen before first message
├── hooks/
│   └── useChatSession.ts    # Chat state + session management
├── types/
│   └── chat.ts              # TypeScript interfaces
├── App.tsx                  # Root component
├── main.tsx                 # React entry point
└── index.css                # Tailwind + design tokens + prose styles
```

## Design

- **Palette**: Forest green accent (#2D6A4F) on warm off-white (#FAFAF8)
- **Typography**: Playfair Display (logo), Inter (UI), JetBrains Mono (timestamps)
- **Animations**: Framer Motion with `prefers-reduced-motion` support
- **Mobile**: Responsive layout with iOS safe-area padding
- **Accessibility**: ARIA live regions, keyboard navigation, focus indicators

## Screenshot

> Screenshot placeholder — capture the ShopAssist chat interface showing:
> - The header with the leaf logo and "Connected" status dot
> - An assistant welcome message
> - A user message with the green left-edge accent bar
> - Quick-reply suggestion pills
> - The input bar with the send button
