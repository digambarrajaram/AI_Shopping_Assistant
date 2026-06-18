import { useState } from "react";
import type { ShopProduct } from "../hooks/useProducts";

interface ProductCardProps {
  product: ShopProduct;
  onAskAbout?: (productName: string) => void;
}

// ── Star rating ──────────────────────────────────────────────────

function StarRating({
  rating,
  reviewCount,
}: {
  rating?: number | null;
  reviewCount?: number | null;
}) {
  if (!rating || rating === 0) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        No reviews yet
      </span>
    );
  }

  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = rating - i;
    if (fill >= 1) return "full" as const;
    if (fill >= 0.5) return "half" as const;
    return "empty" as const;
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: 1 }}>
        {stars.map((type, i) => (
          <Star key={i} type={type} />
        ))}
      </div>
      <span
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        {rating.toFixed(1)}
      </span>
      {reviewCount && reviewCount > 0 && (
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          ({reviewCount.toLocaleString()} review{reviewCount !== 1 ? "s" : ""})
        </span>
      )}
    </div>
  );
}

function Star({ type }: { type: "full" | "half" | "empty" }) {
  const starPath =
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

  if (type === "full") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
        <path d={starPath} />
      </svg>
    );
  }

  if (type === "half") {
    return (
      <span style={{ display: "inline-block", position: "relative", width: 14, height: 14 }}>
        {/* empty behind */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="#E5E7EB"
          style={{ position: "absolute", inset: 0 }}
        >
          <path d={starPath} />
        </svg>
        {/* filled half clipped */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            width: "50%",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
            <path d={starPath} />
          </svg>
        </span>
      </span>
    );
  }

  // empty
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5E7EB">
      <path d={starPath} />
    </svg>
  );
}

// ── Leaf placeholder SVG ─────────────────────────────────────────

function LeafPlaceholder() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" opacity={0.3}>
      <path
        d="M16 4C9.37 4 6 8.92 6 13.6c0 4.68 3.37 8 6.8 9.8.47.26.8.45 1.2.6v2h4v-2c.4-.15.73-.34 1.2-.6C22.63 21.6 26 18.28 26 13.6 26 8.92 22.63 4 16 4z"
        fill="#10B981"
      />
      <path d="M16 7c-2 0-3 1.5-3 4h6c0-2.5-1-4-3-4z" fill="#6EE7B7" />
    </svg>
  );
}

// ── Card ─────────────────────────────────────────────────────────

export default function ProductCard({ product, onAskAbout }: ProductCardProps) {
  const isOrganic = /organic/i.test(product.name);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="product-card group relative rounded-2xl overflow-hidden
                 transition-all duration-300
                 hover:-translate-y-1.5"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-elevated), var(--shadow-glow-green)";
        e.currentTarget.style.borderColor = "var(--border-visible)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* ── Image area ─────────────────────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ aspectRatio: "4/3" }}>
        {imgError || !product.imageUrl ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--surface-raised)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LeafPlaceholder />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {product.name}
            </span>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setImgError(true)}
          />
        )}

        {/* Organic badge — top-right of image */}
        {isOrganic && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "#6EE7B7",
              color: "#0D0D0F",
              fontSize: 11,
              fontWeight: 500,
              padding: "3px 8px",
              borderRadius: 99,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Organic
          </span>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div
        className="p-4"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* Category */}
        {product.category && (
          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-wider
                       px-2 py-0.5 rounded-md mb-2"
            style={{
              backgroundColor: "var(--accent-secondary-soft)",
              color: "var(--accent-secondary)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {product.category}
          </span>
        )}

        {/* Name */}
        <h3
          className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug mb-1.5"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {product.name}
        </h3>

        {/* Description — clamped to 2 lines with reserved height */}
        <p
          className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.6em",
          }}
        >
          {product.description || "No description available."}
        </p>

        {/* Star rating — fixed min-height so row never collapses */}
        <div style={{ minHeight: 22 }}>
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        {/* Price + action — pinned to bottom */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 8,
          }}
        >
          <span
            className="text-[16px] font-bold text-[var(--accent)] tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ${product.price.toFixed(2)}
          </span>

          {onAskAbout && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAbout(product.name);
              }}
              className="text-[12px] font-semibold px-4 py-2 rounded-lg
                         transition-all duration-250 active:scale-95
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{
                background: "var(--gradient-accent)",
                color: "#fff",
                border: "none",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.boxShadow = "0 4px 16px var(--accent-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Ask AI ✦
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
