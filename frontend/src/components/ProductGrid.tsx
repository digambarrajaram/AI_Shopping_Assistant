import type { ShopProduct } from "../hooks/useProducts";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: ShopProduct[];
  loading: boolean;
  onAskAbout?: (productName: string) => void;
}

export default function ProductGrid({
  products,
  loading,
  onAskAbout,
}: ProductGridProps) {
  if (loading) {
    return (
      /*
        FIX: Use inline style grid so it cannot be affected by Tailwind
        purging. grid-template-columns scales from 1 → 2 → 3 → 4 cols.
      */
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
        className="product-grid-skeleton"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                aspectRatio: "4/3",
                background:
                  "linear-gradient(90deg, var(--surface) 0%, var(--surface-raised) 50%, var(--surface) 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ height: 10, backgroundColor: "var(--surface-raised)", borderRadius: 99, width: "33%" }} />
              <div style={{ height: 16, backgroundColor: "var(--surface-raised)", borderRadius: 8, width: "75%" }} />
              <div style={{ height: 12, backgroundColor: "var(--surface-raised)", borderRadius: 8, width: "100%" }} />
              <div style={{ height: 12, backgroundColor: "var(--surface-raised)", borderRadius: 8, width: "66%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                <div style={{ height: 20, backgroundColor: "var(--surface-raised)", borderRadius: 8, width: 64 }} />
                <div style={{ height: 28, backgroundColor: "var(--surface-raised)", borderRadius: 8, width: 64 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px",
            borderRadius: 16,
            backgroundColor: "var(--accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="var(--accent)"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--text-primary)",
            fontFamily: "'Inter', sans-serif",
            margin: "0 0 4px",
          }}
        >
          No products found
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Try selecting a different category or check back soon.
        </p>
      </div>
    );
  }

  return (
    /*
      FIX: Use a CSS class defined in index.css for the grid columns
      so the breakpoints are guaranteed to apply.
      Fallback inline style handles the base (mobile-first 1 column).
    */
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAskAbout={onAskAbout}
        />
      ))}
    </div>
  );
}
