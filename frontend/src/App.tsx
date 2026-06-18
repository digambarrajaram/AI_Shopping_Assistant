import { useState, useCallback, useMemo } from "react";
import Header from "./components/Header";
import ProductGrid from "./components/ProductGrid";
import ChatToggle from "./components/ChatToggle";
import ChatWidget from "./components/ChatWidget";
import { useChatSession } from "./hooks/useChatSession";
import { useProducts } from "./hooks/useProducts";

const CATEGORY_ICONS: Record<string, string> = {
  honey: "🍯",
  oil: "🫒",
  nuts: "🥜",
  seeds: "🥜",
  grains: "🌾",
  tea: "🫖",
  coffee: "🫖",
  snacks: "🥨",
  dairy: "🥛",
};

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    connectionStatus,
    sendMessage,
    retryLastMessage,
  } = useChatSession();

  const { products, loading: productsLoading } = useProducts();

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const p of products) {
      const cat = p.category || "Other";
      if (!seen.has(cat)) {
        seen.add(cat);
        cats.push(cat);
      }
    }
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter(
      (p) => (p.category || "Other") === activeCategory,
    );
  }, [products, activeCategory]);

  const handleAskAbout = useCallback((productName: string) => {
    setChatDraft(`Tell me more about ${productName}`);
    setChatOpen(true);
  }, []);

  const handlePrefillApplied = useCallback(() => {
    setChatDraft(null);
  }, []);

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "linear-gradient(180deg, #0B0F19 0%, #0F172A 100%)" }}
    >
      <Header productCount={products.length} />

      {/* ── Hero banner ─────────────────────────────────────────── */}
      {/*
        FIX: Removed overflow:hidden from the section — it was clipping
        the illustration. Background clipping is handled by the inner bg div.
        Hero uses a proper CSS grid that collapses to 1 col on narrow screens.
      */}
      <section className={`hero-section transition-[margin] duration-300 ${chatOpen ? "lg:mr-[420px]" : ""}`}>
        {/* Background layer — clipped separately so it doesn't clip content */}
        <div className="hero-bg" />

        {/* Content grid */}
        <div className="hero-grid">
          {/* Text column */}
          <div className="hero-text">
            <span className="hero-eyebrow">Fresh & Organic</span>
            <h1 className="hero-heading">
              Your daily essentials,{" "}
              <span style={{ color: "var(--accent)" }}>delivered</span>
            </h1>
            <p className="hero-subtext">
              Handpicked organic groceries, pantry staples, and more — ask our AI
              assistant about any product or place an order right from chat.
            </p>

            {/* Stats */}
            <div className="hero-stats">
              {[
                { value: products.length, label: "Products" },
                { value: categories.length, label: "Categories" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat-item">
                  <div className="hero-stat-value">{stat.value}</div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration column — hidden on mobile via CSS */}
          <div className="hero-illustration">
            <svg
              width="220"
              height="220"
              viewBox="-10 -10 280 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ maxWidth: "100%", height: "auto" }}
            >
              <circle cx="130" cy="130" r="120" fill="#6EE7B7" opacity="0.6" />
              <path
                d="M130 60 C160 80 190 110 180 150
                   C170 185 140 200 130 200
                   C120 200 90 185 80 150
                   C70 110 100 80 130 60Z"
                fill="#10B981"
                opacity="0.85"
              />
              <path d="M130 65 Q135 120 128 198" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M130 100 Q150 115 165 108" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M130 125 Q148 138 160 133" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M130 100 Q112 113 97 107" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M130 125 Q114 136 102 132" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Category filter ──────────────────────────────────────── */}
      {/*
        FIX: The outer wrapper had padding:"1rem 0" but the inner pills-row
        also had padding, causing double padding. Removed inner padding,
        kept outer padding on the wrapper instead. Also removed flex-col
        which was causing the pills to stack vertically on mobile.
      */}
      {categories.length > 1 && (
        <div className={`filter-bar transition-[margin] duration-300 ${chatOpen ? "lg:mr-[420px]" : ""}`}>
          <div className="filter-inner">
            <span className="filter-label">Filter</span>

            {/* Pills — horizontally scrollable, never wraps */}
            <div className="pills-row">
              <button
                onClick={() => setActiveCategory(null)}
                className="pill"
                style={
                  !activeCategory
                    ? {
                        background: "var(--gradient-pill)",
                        color: "#fff",
                        border: "2px solid transparent",
                        boxShadow: "0 2px 20px var(--accent-glow)",
                      }
                    : undefined
                }
              >
                <span className="pill-icon">🏪</span>
                All
              </button>

              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const iconKey = Object.keys(CATEGORY_ICONS).find((k) =>
                  cat.toLowerCase().includes(k),
                );
                const icon = iconKey ? CATEGORY_ICONS[iconKey] : "📦";
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className="pill"
                    style={
                      isActive
                        ? {
                            backgroundColor: "var(--accent)",
                            color: "#fff",
                            border: "2px solid var(--accent)",
                            boxShadow: "0 2px 16px var(--accent-glow)",
                          }
                        : undefined
                    }
                  >
                    <span className="pill-icon">{icon}</span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Product grid ─────────────────────────────────────────── */}
      <main
        className={`flex-1 px-4 sm:px-6 py-6 transition-[margin] duration-300 ${
          chatOpen ? "lg:mr-[420px]" : ""
        }`}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-[16px] font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {activeCategory ? activeCategory : "All Products"}
              </h2>
              <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <ProductGrid
            products={filteredProducts}
            loading={productsLoading}
            onAskAbout={handleAskAbout}
          />
        </div>
      </main>

      {/* ── Chat ─────────────────────────────────────────────────── */}
      <ChatToggle
        isOpen={chatOpen}
        onClick={() => setChatOpen(true)}
        hasUnread={messages.length > 0 && !chatOpen}
      />

      <ChatWidget
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        isLoading={isLoading}
        connectionStatus={connectionStatus}
        onSend={sendMessage}
        onRetry={retryLastMessage}
        products={products}
        prefill={chatDraft}
        onPrefillApplied={handlePrefillApplied}
      />
    </div>
  );
}
